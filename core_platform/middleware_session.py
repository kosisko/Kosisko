import hashlib
from datetime import datetime, timezone as dt_timezone
from django.http import JsonResponse
from django.db import connection
from rest_framework_simplejwt.tokens import AccessToken


def parse_client_details(request):
    ua = request.headers.get('User-Agent', '')
    dev_type = 'desktop'
    os_name = 'Desktop PC'

    if 'Windows' in ua:
        os_name = 'Windows PC'
    elif 'Android' in ua:
        os_name = 'Android Phone'
        dev_type = 'mobile'
    elif 'iPhone' in ua or 'iPad' in ua:
        os_name = 'Apple iOS Device'
        dev_type = 'mobile'
    elif 'Macintosh' in ua:
        os_name = 'MacBook / Mac'
    elif 'Linux' in ua:
        os_name = 'Linux PC'

    browser = 'Web Browser'
    if 'Edg/' in ua or 'Edge/' in ua:
        browser = 'Edge'
    elif 'OPR/' in ua or 'Opera/' in ua:
        browser = 'Opera'
    elif 'Chrome/' in ua and 'Chromium' not in ua:
        browser = 'Chrome'
    elif 'Firefox/' in ua:
        browser = 'Firefox'
    elif 'Safari/' in ua and 'Chrome' not in ua:
        browser = 'Safari'

    full_dev = f"{os_name} ({browser})"

    cf_ip = request.headers.get('CF-Connecting-IP')
    x_forwarded = request.headers.get('X-Forwarded-For')
    x_real = request.headers.get('X-Real-IP')
    ip = (
        cf_ip
        or (x_forwarded.split(',')[0].strip() if x_forwarded else (x_real or request.META.get('REMOTE_ADDR', '127.0.0.1')))
    ).strip()

    ip_prefix = ':'.join(ip.split(':')[:4]) if ':' in ip else ip
    return dev_type, full_dev, ip, ip_prefix


def get_valid_access_token(request):
    candidates = []
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        raw = auth_header.split(' ', 1)[1].strip()
        if raw and raw not in ('null', 'undefined'):
            candidates.append(raw)

    for cookie_name in ('access_token', 'auth_token', 'kosisko_token'):
        val = request.COOKIES.get(cookie_name)
        if val and val not in ('null', 'undefined') and val not in candidates:
            candidates.append(val)

    for tok in candidates:
        try:
            validated = AccessToken(tok)
            if validated.get('user_id'):
                return validated
        except Exception:
            continue
    return None


def compute_session_key(request, user_id, full_dev, ip_prefix):
    device_id = request.headers.get('X-Device-ID') or request.COOKIES.get('kosisko_device_id')
    if device_id and device_id.strip() not in ('', 'null', 'undefined'):
        return 'dev_' + hashlib.sha256(f"{user_id}_{device_id.strip()}".encode()).hexdigest()[:28]
    return 'fb_' + hashlib.sha256(f"{user_id}_{full_dev}_{ip_prefix}".encode()).hexdigest()[:28]


class ActiveSessionEnforcerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if not path.startswith('/api/'):
            return self.get_response(request)

        # 1. सामान्य लॉगआउट होने पर तुरंत डेटाबेस से सेशन हटाना
        if '/auth/logout' in path or '/auth/session/self-logout' in path:
            validated = get_valid_access_token(request)
            if validated:
                user_id = validated.get('user_id')
                dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
                sig = compute_session_key(request, user_id, full_dev, ip_prefix)
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            DELETE FROM core_user_active_session
                            WHERE user_id = %s AND (session_token = %s OR (device_name = %s AND ip_address LIKE %s));
                        """, [user_id, sig, full_dev, f"{ip_prefix}%"])
                except Exception:
                    pass
            return self.get_response(request)

        exempt_paths = (
            '/api/v1/auth/login',
            '/api/v1/auth/passkey/login-options',
            '/api/v1/auth/passkey/login-verify',
            '/api/v1/auth/google',
        )
        if any(path.startswith(ep) for ep in exempt_paths):
            return self.get_response(request)

        validated = get_valid_access_token(request)
        if not validated:
            return self.get_response(request)

        user_id = validated.get('user_id')
        token_iat = float(validated.get('iat', 0))
        token_exp = float(validated.get('exp', 0))
        exp_dt = datetime.fromtimestamp(token_exp, tz=dt_timezone.utc) if token_exp else None

        dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
        sig = compute_session_key(request, user_id, full_dev, ip_prefix)

        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT status, revoked_at FROM core_user_active_session
                    WHERE user_id = %s AND session_token = %s;
                """, [user_id, sig])
                row = cursor.fetchone()

                if row and row[0] == 'revoked':
                    revoked_ts = row[1].timestamp() if row[1] else 0
                    if token_iat <= revoked_ts + 2:
                        cursor.execute(
                            "DELETE FROM core_user_active_session WHERE user_id = %s AND session_token = %s;",
                            [user_id, sig]
                        )
                        resp = JsonResponse({
                            'error': 'Session terminated remotely',
                            'session_revoked': True
                        }, status=401)
                        cookie_domain = '.kosisko.com' if 'kosisko.com' in request.get_host() else None
                        resp.delete_cookie('access_token', domain=cookie_domain, path='/')
                        resp.delete_cookie('refresh_token', domain=cookie_domain, path='/')
                        resp.delete_cookie('kosisko_logged_in', domain=cookie_domain, path='/')
                        return resp
                    else:
                        cursor.execute("""
                            UPDATE core_user_active_session
                            SET status = 'active', revoked_at = NULL, last_activity = NOW(), ip_address = %s, expires_at = %s
                            WHERE user_id = %s AND session_token = %s;
                        """, [ip, exp_dt, user_id, sig])
                else:
                    # यदि बिना X-Device-ID वाली रिक्वेस्ट आए और इसी डिवाइस की dev_ पंक्ति पहले से सक्रिय हो, तो उसी को अपडेट करें
                    if sig.startswith('fb_'):
                        cursor.execute("""
                            UPDATE core_user_active_session
                            SET last_activity = NOW(), ip_address = %s, expires_at = COALESCE(%s, expires_at)
                            WHERE user_id = %s AND session_token LIKE 'dev_%%' AND device_name = %s
                              AND (ip_address = %s OR ip_address LIKE %s) AND status = 'active';
                        """, [ip, exp_dt, user_id, full_dev, ip, f"{ip_prefix}%"])
                        if cursor.rowcount > 0:
                            return self.get_response(request)

                    # सख्त 1-डिवाइस = 1-पंक्ति नियम
                    cursor.execute("""
                        DELETE FROM core_user_active_session
                        WHERE user_id = %s
                          AND device_name = %s
                          AND (ip_address = %s OR ip_address LIKE %s)
                          AND session_token != %s
                          AND status = 'active';
                    """, [user_id, full_dev, ip, f"{ip_prefix}%", sig])

                    cursor.execute("""
                        INSERT INTO core_user_active_session (user_id, session_token, device_type, device_name, ip_address, status, last_activity, expires_at)
                        VALUES (%s, %s, %s, %s, %s, 'active', NOW(), %s)
                        ON CONFLICT (session_token) DO UPDATE SET
                            last_activity = NOW(),
                            ip_address = EXCLUDED.ip_address,
                            device_name = EXCLUDED.device_name,
                            status = 'active',
                            expires_at = COALESCE(EXCLUDED.expires_at, core_user_active_session.expires_at);
                    """, [user_id, sig, dev_type, full_dev, ip, exp_dt])
        except Exception:
            pass

        return self.get_response(request)
