import os
import json
import base64
from datetime import datetime, timezone as dt_timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.contrib.auth import get_user_model, login
from django.db import connection
from rest_framework_simplejwt.tokens import RefreshToken
from core_platform.models import UserPasskey
from core_platform.middleware_session import (
    parse_client_details,
    get_valid_access_token,
    compute_session_key,
)

User = get_user_model()
RP_NAME = "Kosisko Enterprise OS"
RP_ID = "kosisko.com"


def get_request_user(request):
    validated = get_valid_access_token(request)
    user = None
    token_iat = 0

    if validated:
        user_id = validated.get('user_id')
        token_iat = float(validated.get('iat', 0))
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass

    if not user and hasattr(request, 'user') and request.user.is_authenticated:
        user = request.user

    if not user:
        return None

    dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
    sig = compute_session_key(request, user.id, full_dev, ip_prefix)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT status, revoked_at FROM core_user_active_session
            WHERE user_id = %s AND session_token = %s;
        """, [user.id, sig])
        row = cursor.fetchone()
        if row and row[0] == 'revoked':
            revoked_ts = row[1].timestamp() if row[1] else 0
            if token_iat == 0 or token_iat <= revoked_ts + 2:
                cursor.execute(
                    "DELETE FROM core_user_active_session WHERE user_id = %s AND session_token = %s;",
                    [user.id, sig]
                )
                request.session_is_revoked = True
                return None
            else:
                cursor.execute("""
                    UPDATE core_user_active_session
                    SET status = 'active', revoked_at = NULL, last_activity = NOW()
                    WHERE user_id = %s AND session_token = %s;
                """, [user.id, sig])

    return user


def resolve_user_subdomain(request, user):
    active_tenant = request.COOKIES.get('kosisko_active_tenant')
    if active_tenant and active_tenant not in ['main', 'primary', 'undefined', '']:
        return active_tenant

    host = request.get_host().split(':')[0]
    parts = host.split('.')
    if len(parts) > 2 and parts[0] not in ['www', 'api', 'admin', 'kosisko']:
        return parts[0]

    if hasattr(user, 'tenant') and user.tenant:
        return getattr(user.tenant, 'subdomain', 'ratan')

    return 'ratan'


def sync_active_session_record(request, user):
    dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
    sig = compute_session_key(request, user.id, full_dev, ip_prefix)

    exp_dt = None
    validated = get_valid_access_token(request)
    if validated:
        token_exp = float(validated.get('exp', 0))
        if token_exp:
            exp_dt = datetime.fromtimestamp(token_exp, tz=dt_timezone.utc)

    with connection.cursor() as cursor:
        if sig.startswith('fb_'):
            cursor.execute("""
                SELECT session_token FROM core_user_active_session
                WHERE user_id = %s AND session_token LIKE 'dev_%%' AND device_name = %s
                  AND (ip_address = %s OR ip_address LIKE %s) AND status = 'active'
                LIMIT 1;
            """, [user.id, full_dev, ip, f"{ip_prefix}%"])
            existing_dev = cursor.fetchone()
            if existing_dev:
                cursor.execute("""
                    UPDATE core_user_active_session
                    SET last_activity = NOW(), ip_address = %s, expires_at = COALESCE(%s, expires_at)
                    WHERE user_id = %s AND session_token = %s;
                """, [ip, exp_dt, user.id, existing_dev[0]])
                return existing_dev[0]

        cursor.execute("""
            DELETE FROM core_user_active_session
            WHERE user_id = %s
              AND device_name = %s
              AND (ip_address = %s OR ip_address LIKE %s)
              AND session_token != %s
              AND status = 'active';
        """, [user.id, full_dev, ip, f"{ip_prefix}%", sig])

        cursor.execute("""
            INSERT INTO core_user_active_session (user_id, session_token, device_type, device_name, ip_address, status, last_activity, expires_at)
            VALUES (%s, %s, %s, %s, %s, 'active', NOW(), %s)
            ON CONFLICT (session_token) DO UPDATE SET
                last_activity = NOW(),
                ip_address = EXCLUDED.ip_address,
                device_name = EXCLUDED.device_name,
                status = 'active',
                expires_at = COALESCE(EXCLUDED.expires_at, core_user_active_session.expires_at);
        """, [user.id, sig, dev_type, full_dev, ip, exp_dt])

    return sig


@csrf_exempt
def passkey_status(request):
    try:
        user = get_request_user(request)

        if getattr(request, 'session_is_revoked', False):
            resp = JsonResponse({
                'error': 'Session terminated remotely',
                'session_revoked': True
            }, status=401)
            cookie_domain = '.kosisko.com' if 'kosisko.com' in request.get_host() else None
            resp.delete_cookie('access_token', domain=cookie_domain, path='/')
            resp.delete_cookie('refresh_token', domain=cookie_domain, path='/')
            resp.delete_cookie('kosisko_logged_in', domain=cookie_domain, path='/')
            return resp

        if not user or not user.is_authenticated:
            return JsonResponse({
                'authenticated': False,
                'has_passkey': False,
                'passkeys': [],
                'active_sessions': []
            }, status=200)

        current_token = sync_active_session_record(request, user)

        passkeys = UserPasskey.objects.filter(user=user).order_by('-id')
        pk_data = []
        for pk in passkeys:
            c_time = timezone.localtime(pk.created_at).strftime('%d %b %Y, %I:%M %p') if getattr(pk, 'created_at', None) else ''
            u_time = timezone.localtime(pk.last_used_at).strftime('%d %b %Y, %I:%M %p') if getattr(pk, 'last_used_at', None) else c_time

            created_platform = 'desktop'
            last_platform = 'desktop'
            try:
                meta = json.loads(pk.public_key) if pk.public_key else {}
                created_platform = meta.get('created_platform', 'desktop')
                last_platform = meta.get('last_platform', created_platform)
            except Exception:
                pass

            pk_data.append({
                'id': pk.id,
                'subdomain': getattr(pk, 'tenant_subdomain', 'ratan'),
                'created_at': c_time,
                'created_icon': '💻' if created_platform == 'desktop' else '📱',
                'last_used': u_time,
                'last_icon': '💻' if last_platform == 'desktop' else '📱',
            })

        active_sessions = []
        seen_devices = set()
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, session_token, device_type, device_name, ip_address, last_activity
                FROM core_user_active_session
                WHERE user_id = %s
                  AND status = 'active'
                  AND last_activity >= NOW() - INTERVAL '20 seconds'
                  AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY (session_token = %s) DESC, last_activity DESC
            """, [user.id, current_token])
            rows = cursor.fetchall()

            for r in rows:
                ip_val = r[4] or ''
                ip_pref = ':'.join(ip_val.split(':')[:4]) if ':' in ip_val else ip_val
                dedup_key = (r[3], ip_pref)
                if dedup_key in seen_devices:
                    continue
                seen_devices.add(dedup_key)

                sid_time = timezone.localtime(r[5]).strftime('%d %b %Y, %I:%M %p') if r[5] else ''
                is_current = (r[1] == current_token)
                active_sessions.append({
                    'id': r[0],
                    'device_type': r[2],
                    'device_icon': '💻' if r[2] == 'desktop' else '📱',
                    'device_name': r[3],
                    'ip_address': ip_val,
                    'last_activity': sid_time,
                    'is_current': is_current
                })

        return JsonResponse({
            'authenticated': True,
            'has_passkey': passkeys.exists(),
            'passkeys': pk_data,
            'active_sessions': active_sessions
        })
    except Exception as e:
        return JsonResponse({'authenticated': False, 'has_passkey': False, 'passkeys': [], 'active_sessions': [], 'error': str(e)})


@csrf_exempt
def passkey_register_options(request):
    try:
        user = get_request_user(request)
        if not user or not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required. Please sign in.'}, status=401)

        if UserPasskey.objects.filter(user=user).exists():
            return JsonResponse({
                'error': 'A hardware passkey is already active for this account. Revoke the existing key first to create a new one.'
            }, status=400)

        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8').rstrip('=')
        request.session['passkey_reg_challenge'] = challenge

        subdomain = resolve_user_subdomain(request, user)

        options = {
            'challenge': challenge,
            'rp': {'name': RP_NAME, 'id': RP_ID},
            'user': {
                'id': base64.urlsafe_b64encode(str(user.id).encode()).decode().rstrip('='),
                'name': user.username,
                'displayName': f"{user.get_full_name() or user.username} [{subdomain}]"
            },
            'pubKeyCredParams': [{'type': 'public-key', 'alg': -7}, {'type': 'public-key', 'alg': -257}],
            'authenticatorSelection': {
                'authenticatorAttachment': 'platform',
                'userVerification': 'preferred',
                'residentKey': 'preferred'
            },
            'timeout': 60000
        }
        return JsonResponse(options)
    except Exception as e:
        return JsonResponse({'error': f'Registration setup failed: {str(e)}'}, status=400)


@csrf_exempt
def passkey_register_verify(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        user = get_request_user(request)
        if not user or not user.is_authenticated:
            return JsonResponse({'error': 'Session expired. Please sign in.'}, status=401)

        data = json.loads(request.body.decode('utf-8'))
        cred_id = data.get('id')
        if not cred_id:
            return JsonResponse({'error': 'Missing credential ID'}, status=400)

        subdomain = resolve_user_subdomain(request, user)
        dev_type, full_dev, ip, ip_prefix = parse_client_details(request)

        meta = {
            'created_platform': dev_type,
            'last_platform': dev_type,
            'response': data.get('response', {})
        }

        UserPasskey.objects.update_or_create(
            user=user,
            defaults={
                'credential_id': cred_id,
                'tenant_subdomain': subdomain,
                'public_key': json.dumps(meta),
                'device_name': "Cloud-Synced Passkey",
                'last_used_at': timezone.now()
            }
        )

        sync_active_session_record(request, user)
        return JsonResponse({
            'status': 'success',
            'message': 'Passkey successfully created and verified for your workspace.',
            'subdomain': subdomain
        })
    except Exception as e:
        return JsonResponse({'error': f'Registration failed: {str(e)}'}, status=400)


@csrf_exempt
def passkey_login_options(request):
    try:
        challenge = base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8').rstrip('=')
        request.session['passkey_auth_challenge'] = challenge

        options = {
            'challenge': challenge,
            'rpId': RP_ID,
            'timeout': 60000,
            'userVerification': 'preferred'
        }

        user = get_request_user(request)
        if user and user.is_authenticated:
            existing_pks = UserPasskey.objects.filter(user=user)
            if not existing_pks.exists():
                return JsonResponse({
                    'error': 'Biometric passkey is disabled on this account. Please use your Master Password.'
                }, status=400)
            options['allowCredentials'] = [
                {'id': ep.credential_id, 'type': 'public-key'} for ep in existing_pks
            ]

        return JsonResponse(options)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def passkey_login_verify(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        cred_id = data.get('id')
        if not cred_id:
            return JsonResponse({'error': 'Credential ID missing'}, status=400)

        pk_record = UserPasskey.objects.filter(credential_id=cred_id).first()
        if not pk_record:
            return JsonResponse({'error': 'Unrecognized passkey. Please sign in using standard credentials.'}, status=404)

        user = pk_record.user
        login(request, user)

        dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
        try:
            meta = json.loads(pk_record.public_key) if pk_record.public_key else {}
            meta['last_platform'] = dev_type
            pk_record.public_key = json.dumps(meta)
        except Exception:
            pass

        pk_record.last_used_at = timezone.now()
        pk_record.save(update_fields=['last_used_at', 'public_key'])

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        subdomain = pk_record.tenant_subdomain or 'ratan'
        target_url = '/customer/marketplace'

        resp = JsonResponse({
            'status': 'success',
            'token': access_token,
            'access_token': access_token,
            'refresh_token': refresh_token,
            'redirect_url': target_url,
            'user': {
                'id': user.id,
                'username': user.username,
                'subdomain': subdomain
            }
        })

        cookie_domain = '.kosisko.com' if 'kosisko.com' in request.get_host() else None
        resp.set_cookie(key='access_token', value=access_token, max_age=86400, path='/', domain=cookie_domain, secure=True, httponly=True, samesite='Lax')
        resp.set_cookie(key='refresh_token', value=refresh_token, max_age=7*86400, path='/', domain=cookie_domain, secure=True, httponly=True, samesite='Lax')
        resp.set_cookie(key='kosisko_logged_in', value='true', max_age=86400, path='/', domain=cookie_domain, secure=True, httponly=False, samesite='Lax')
        resp.set_cookie(key='kosisko_active_tenant', value=subdomain, max_age=86400, path='/', domain=cookie_domain, secure=True, httponly=False, samesite='Lax')

        sync_active_session_record(request, user)
        return resp
    except Exception as e:
        return JsonResponse({'error': f'Authentication failed: {str(e)}'}, status=400)


@csrf_exempt
def passkey_delete(request):
    try:
        user = get_request_user(request)
        if not user or not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        UserPasskey.objects.filter(user=user).delete()
        return JsonResponse({'status': 'success', 'message': 'Hardware passkey successfully revoked.'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def session_revoke(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        user = get_request_user(request)
        if not user or not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)

        body = json.loads(request.body.decode('utf-8'))
        session_id = body.get('id')
        auth_type = body.get('auth_type', 'password')
        password = body.get('password', '')
        credential_id = body.get('credential_id', '')

        if not session_id:
            return JsonResponse({'error': 'Session identifier is required.'}, status=400)

        if auth_type == 'password':
            if not password or not user.check_password(password):
                return JsonResponse({'error': 'Invalid master password. Authorization denied.'}, status=403)
        elif auth_type == 'biometric':
            active_pk = UserPasskey.objects.filter(user=user).first()
            if not active_pk:
                return JsonResponse({
                    'error': 'Biometric passkey is disabled on this account. Please authorize using your Master Password.'
                }, status=403)
            if not credential_id or active_pk.credential_id != credential_id:
                return JsonResponse({
                    'error': 'Revoked or unrecognized passkey credential. Authorization denied.'
                }, status=403)
        else:
            return JsonResponse({'error': 'Unsupported authorization method.'}, status=400)

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE core_user_active_session
                SET status = 'revoked', revoked_at = NOW()
                WHERE id = %s AND user_id = %s;
            """, [session_id, user.id])

        return JsonResponse({'status': 'success', 'message': 'Device session successfully terminated.'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
def session_self_logout(request):
    try:
        user = get_request_user(request)
        if user and user.is_authenticated:
            dev_type, full_dev, ip, ip_prefix = parse_client_details(request)
            sig = compute_session_key(request, user.id, full_dev, ip_prefix)
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM core_user_active_session
                    WHERE user_id = %s AND (session_token = %s OR (device_name = %s AND ip_address LIKE %s));
                """, [user.id, sig, full_dev, f"{ip_prefix}%"])
    except Exception:
        pass
    return JsonResponse({'status': 'success'})
