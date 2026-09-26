import json
import random
import datetime
import secrets
import time
import os
import re
import threading
from urllib.parse import urlparse
import requests
from django.contrib.auth.models import User
from django.core.mail import send_mail, EmailMultiAlternatives
from django.contrib.auth import logout
from django.core.cache import cache
from email.mime.image import MIMEImage
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import redirect
from decouple import config
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.db.models import Q


# 🌟 आपके द्वारा बनाए गए सीरियलाइज़र और परमीशंस का सेफ इम्पोर्ट
from .serializers import UserSignupSerializer, TenantBrandingSerializer
from .permissions import IsTenantAdmin, IsSuperAdminOnly, IsSameTenantObject

# अपने सभी मॉडल्स इम्पोर्ट करें (Single Source of Truth: Tenant)
from .models import (
    Tenant,
    AppStoreModule,
    TenantSubscription,
    AgenticAIActionLog,
    UserProfile,
    TenantCustomPricing,
    DiscountCoupon
)

# 🌟 गूगल जेमिनी पैकेज इम्पोर्ट
from google import genai

# अस्थायी रूप से OTP स्टोर करने के लिए डिक्शनरी
OTP_STORAGE = {}

# -----------------------------------------------------------------------------
# 🌟 GLOBAL CONFIG: Kosisko Official Logo & Zero-Lag Background Worker
# -----------------------------------------------------------------------------
KOSISKO_LOGO_URL = "https://kosisko.com/Logo.png?v=3"

def send_email_in_background(email_message):
    try:
        email_message.send(fail_silently=False)
    except Exception as e:
        print("Background email dispatch failed:", e)

def get_kosisko_footer():
    current_year = datetime.datetime.now().year
    return f"&copy; {current_year} Kosisko. All rights reserved. 256-bit Encrypted Secure Communication."


# -----------------------------------------------------------------------------
# 🌟 SMART DYNAMIC PUBLIC URL RESOLVER (Zero Localhost in Emails)
# -----------------------------------------------------------------------------
def get_client_base_url(request=None):
    """
    ईमेल लिंक्स के लिए 100% सही लाइव HTTPS डोमेन निकालता है।
    लोकलहोस्ट को लाइव ईमेल में कभी भी जाने नहीं देता।
    """
    default_live_domain = "https://kosisko.com"

    if not request:
        return default_live_domain

    try:
        origin = request.headers.get('Origin') or request.headers.get('Referer')
        if origin:
            parsed = urlparse(origin)
            if parsed.scheme and parsed.netloc:
                netloc = parsed.netloc.lower()
                if 'localhost' not in netloc and '127.0.0.1' not in netloc:
                    return f"{parsed.scheme}://{parsed.netloc}".rstrip('/')

        tenant = getattr(request, 'tenant', None)
        if tenant:
            custom_domain = getattr(tenant, 'custom_domain', None)
            if custom_domain:
                return f"https://{custom_domain}".rstrip('/')
            subdomain = getattr(tenant, 'subdomain', None)
            if subdomain and subdomain.lower() not in ['master', 'public', 'none']:
                return f"https://{subdomain}.kosisko.com".rstrip('/')

        forwarded_host = request.headers.get('X-Forwarded-Host') or request.get_host()
        if forwarded_host and 'localhost' not in forwarded_host and '127.0.0.1' not in forwarded_host:
            proto = request.headers.get('X-Forwarded-Proto', 'https')
            return f"{proto}://{forwarded_host}".rstrip('/')

    except Exception as e:
        print("Base URL resolve error:", e)

    return default_live_domain


# -----------------------------------------------------------------------------
# 1. PROFESSIONAL WELCOME EMAIL (10-Minute Expiring One-Time Magic Link)
# -----------------------------------------------------------------------------
def send_professional_welcome_email(user_obj, organization_name="Enterprise Workspace", base_url=None):
    user_email = user_obj.email
    username = user_obj.username
    subject = f'Welcome to Kosisko, {username} – Your Enterprise Workspace is Ready!'
    footer_text = get_kosisko_footer()

    if not base_url or 'localhost' in str(base_url) or '127.0.0.1' in str(base_url):
        base_url = "https://kosisko.com"
    base_url = str(base_url).rstrip('/')

    magic_token = secrets.token_urlsafe(32)
    try:
        profile, _ = UserProfile.objects.get_or_create(user=user_obj)
        profile.magic_login_token = magic_token
        profile.save(update_fields=['magic_login_token'])
    except Exception:
        pass

    dashboard_link = f"{base_url}/api/v1/auth/magic-login/?token={magic_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 25px; }}
            .logo-container img {{ max-height: 60px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .highlight-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 25px 0; }}
            .btn-container {{ text-align: center; margin: 30px 0 20px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .expiry-note {{ font-size: 11px; color: #dc2626; text-align: center; font-weight: bold; margin-top: 10px; }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Welcome to Kosisko!</h2>
            <p>Dear <strong>{username}</strong>,</p>
            <p>Welcome to Kosisko! – <span class="slogan">'कोशिश से कामयाबी की ओर'</span>. Your enterprise workspace is secured and ready.</p>

            <div class="highlight-box">
                <p style="margin: 0; color: #0f172a; font-weight: 700;">🔑 Enterprise Workspace Credentials:</p>
                <p style="margin: 8px 0 0 0; font-size: 13px;">
                    - Workspace: {organization_name}<br>
                    - Login ID / Username: {username}<br>
                    - Registered Email: {user_email}
                </p>
            </div>

            <div class="btn-container">
                <a href="{dashboard_link}" class="btn">Launch Your Dashboard Instantly →</a>
            </div>
            <p class="expiry-note">⚠️ Note: This link is valid for 10 minutes and can be used only once.</p>

            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Welcome {username}! Access your workspace: {dashboard_link} (Valid for 10 minutes, single use)."
    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")
    threading.Thread(target=send_email_in_background, args=(email_message,)).start()


# -----------------------------------------------------------------------------
# 🌟 ONE-TIME MAGIC LOGIN CONSUMER (Single-Use & 10 Min Expiry)
# -----------------------------------------------------------------------------
@csrf_exempt
def consume_magic_login(request):
    token = request.GET.get('token')
    base_url = get_client_base_url(request)

    if not token:
        return redirect(f"{base_url}/login?error=missing_token")

    profile = UserProfile.objects.filter(magic_login_token=token).first()
    if not profile:
        return redirect(f"{base_url}/login?error=expired_magic_link")

    profile.magic_login_token = None
    profile.save(update_fields=['magic_login_token'])

    auth_token, _ = Token.objects.get_or_create(user=profile.user)

    target_domain = base_url
    if profile.tenant and profile.tenant.subdomain and profile.tenant.subdomain not in ['master', 'public', 'none']:
        target_domain = f"https://{profile.tenant.subdomain}.kosisko.com"

    response = redirect(f"{target_domain}/customer/marketplace?auth={auth_token.key}")
    response.set_cookie('kosisko_logged_in', 'true', max_age=86400, domain='.kosisko.com', samesite='Lax')
    return response


# -----------------------------------------------------------------------------
# 2. PROFESSIONAL PASSWORD RESET EMAIL (Dynamic Domain)
# -----------------------------------------------------------------------------
def send_professional_password_reset_email(user_email, username, method_used, reset_link):
    subject = f'Kosisko - Password Recovery Instructions'
    footer_text = get_kosisko_footer()

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 25px; }}
            .logo-container img {{ max-height: 60px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .btn-container {{ text-align: center; margin: 30px 0 20px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Password Reset Request</h2>
            <p>Hello <strong>{username}</strong>,</p>
            <p>We received a master password reset request for your Kosisko account via <strong>{method_used}</strong>.</p>

            <div class="btn-container">
                <a href="{reset_link}" class="btn">Reset My Master Password →</a>
            </div>

            <p>If you did not request this change, please ignore this email immediately.</p>

            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Hello {username},\nReset your password here: {reset_link}"
    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")

    # Clean background dispatch (No broken attributes, no attachment box)
    threading.Thread(target=send_email_in_background, args=(email_message,)).start()

# -----------------------------------------------------------------------------
# 3. PROFESSIONAL OTP EMAIL (No Localhost, Live HTTPS Link)
# -----------------------------------------------------------------------------
def send_professional_otp_email(user_email, otp_code, base_url=None):
    subject = 'Kosisko Security Verification Code'
    footer_text = get_kosisko_footer()

    if not base_url or 'localhost' in str(base_url) or '127.0.0.1' in str(base_url):
        base_url = "https://kosisko.com"
    base_url = str(base_url).rstrip('/')

    auto_verify_link = f"{base_url}/login?email={user_email}&otp={otp_code}&auto_verify=true"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 25px; }}
            .logo-container img {{ max-height: 60px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .otp-box {{ background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; font-size: 36px; font-weight: 900; color: #0f172a; text-align: center; letter-spacing: 12px; padding: 20px; margin: 25px 0; }}
            .btn-container {{ text-align: center; margin: 30px 0 20px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Email Verification Code</h2>
            <p>Hello,</p>
            <p>Welcome to Kosisko! – <span class="slogan">'कोशिश से कामयाबी की ओर'</span>. Use the verification code below:</p>

            <div class="otp-box">{otp_code}</div>

            <div class="btn-container">
                <a href="{auto_verify_link}" class="btn">Verify & Proceed to Setup →</a>
            </div>

            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"Your Kosisko verification code is: {otp_code}. Or verify directly: {auto_verify_link}"
    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")
    threading.Thread(target=send_email_in_background, args=(email_message,)).start()


# -----------------------------------------------------------------------------
# 🌟 MASTER DASHBOARD BOOTSTRAP VIEW
# -----------------------------------------------------------------------------
class MasterDashboardBootstrapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tenant_obj = getattr(request, 'tenant', None)
        is_god_mode = getattr(request, 'is_god_mode', False)

        if not tenant_obj:
            tenant_obj = Tenant.objects.first()

        if is_god_mode:
            modules = AppStoreModule.objects.all()
        else:
            if tenant_obj:
                subscriptions = TenantSubscription.objects.filter(tenant=tenant_obj, is_unlocked=True)
                modules = [sub.module for sub in subscriptions]
            else:
                modules = []

        ai_logs = AgenticAIActionLog.objects.filter(tenant=tenant_obj).order_by('-timestamp')[:5] if tenant_obj else []

        user_role = getattr(request.user, 'profile', None)
        user_role = user_role.role if user_role and hasattr(user_role, 'role') else ("god_mode" if is_god_mode else "engineer")

        if user_role == "finance":
            widget_layout = {
                "hero_widget": "billing_desk",
                "secondary_widget": "echarts_analytics",
                "terrible_widget": "ai_logs",
                "show_3d_canvas": False
            }
        elif user_role == "engineer":
            widget_layout = {
                "hero_widget": "3d_spatial_canvas",
                "secondary_widget": "iot_telemetry",
                "terrible_widget": "echarts_analytics",
                "show_3d_canvas": True
            }
        else:
            widget_layout = {
                "hero_widget": "agentic_ai_swarm",
                "secondary_widget": "3d_spatial_canvas",
                "terrible_widget": "echarts_analytics",
                "show_3d_canvas": True
            }

        data = {
            "is_god_mode": is_god_mode,
            "user_role": user_role,
            "widget_layout": widget_layout,
            "tenant": {
                "name": tenant_obj.name if tenant_obj else "Global Master Tenant",
                "subdomain": tenant_obj.subdomain if tenant_obj else "master"
            },
            "unlocked_modules": [
                {
                    "code": m.module_code,
                    "name": m.name,
                    "category": m.category,
                    "icon": m.icon
                } for m in modules
            ],
            "ai_action_logs": [
                {
                    "id": log.id,
                    "agent": log.ai_agent_name,
                    "module": log.target_module,
                    "action": log.action_type,
                    "confidence": log.confidence_score,
                    "timestamp": log.timestamp.strftime("%H:%M:%S")
                } for log in ai_logs
            ]
        }
        return Response(data)


# -----------------------------------------------------------------------------
# 🌟 UNIVERSAL CHECK USER (Strict Login vs Signup Rules)
# -----------------------------------------------------------------------------
@csrf_exempt
def check_user_exists(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            raw_id = (data.get('identifier') or data.get('email') or '').strip()

            if not raw_id:
                return JsonResponse({"status": "error", "message": "Identifier is required"}, status=400)

            # 1. क्या यह पुराना यूज़र है? (Username, Email, या Mobile तीनों से खोजें)
            user_exists = User.objects.filter(
                Q(username__iexact=raw_id) |
                Q(email__iexact=raw_id) |
                Q(profile__mobile_number=raw_id)
            ).exists()

            if user_exists:
                return JsonResponse({"status": "success", "action": "login", "exists": True})

            # 2. अगर नया यूज़र है -> केवल Valid Email से ही साइन-अप की अनुमति
            is_email = '@' in raw_id and '.' in raw_id
            if is_email:
                return JsonResponse({"status": "success", "action": "signup", "exists": False})
            else:
                return JsonResponse({
                    "status": "error",
                    "message": "No account found with this identifier. Sign-up requires a valid Email Address."
                }, status=400)

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


# -----------------------------------------------------------------------------
# 🌟 OTP SEND & VERIFY APIS
# -----------------------------------------------------------------------------
@csrf_exempt
def send_otp_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')

            if not email:
                return JsonResponse({"status": "error", "message": "Email is required."}, status=400)

            otp_code = str(random.randint(1000, 9999))
            OTP_STORAGE[email] = otp_code

            base_url = get_client_base_url(request)
            send_professional_otp_email(email, otp_code, base_url=base_url)

            return JsonResponse({
                "status": "success",
                "message": "OTP sent successfully to your email.",
                "debug_otp": otp_code
            })
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


@csrf_exempt
def verify_otp_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            user_otp = data.get('otp')

            stored_otp = OTP_STORAGE.get(email)

            if stored_otp and stored_otp == user_otp:
                del OTP_STORAGE[email]
                return JsonResponse({"status": "success", "message": "OTP verified successfully."})
            else:
                return JsonResponse({"status": "error", "message": "Invalid OTP. Please enter the correct code."}, status=400)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


# -----------------------------------------------------------------------------
# 🌟 MANUAL SIGNUP & LOGIN APIS (Returns Auth Token Guaranteed)
# -----------------------------------------------------------------------------
@csrf_exempt
def api_signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email', '').strip()
            username = data.get('username', '').strip().lower()
            password = data.get('password', '')
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            organization_name = data.get('organizationName', '').strip() or data.get('fullName', '').strip() or f"{first_name} Workspace"
            
            # frontend se mobileNumber ya mobile_number dono ko handle karein
            raw_mobile = str(data.get('mobileNumber') or data.get('mobile_number') or '').strip()

            if not username or not password:
                return JsonResponse({'status': 'error', 'message': 'Username and password are required.'}, status=400)

            if not raw_mobile:
                return JsonResponse({'status': 'error', 'message': 'Mobile number is required.'}, status=400)

            # 🌟 1. Clean & validate mobile number to 10 digits
            clean_digits = re.sub(r'[^0-9]', '', raw_mobile)
            if len(clean_digits) < 10:
                return JsonResponse({'status': 'error', 'message': 'Please enter a valid 10-digit mobile number.'}, status=400)

            clean_mobile_10 = clean_digits[-10:]

            # 🌟 2. Duplicate mobile check (Prevents Database IntegrityError)
            if check_mobile_already_exists(clean_mobile_10):
                return JsonResponse({'status': 'error', 'message': 'This mobile number is already registered. Please sign in instead.'}, status=409)

            if User.objects.filter(username__iexact=username).exists():
                return JsonResponse({'status': 'error', 'message': 'Username is already taken.'}, status=400)

            if email and User.objects.filter(email__iexact=email).exists():
                return JsonResponse({'status': 'error', 'message': 'Email is already registered.'}, status=400)

            if len(password) < 8:
                return JsonResponse({'status': 'error', 'message': 'Password must be at least 8 characters long.'}, status=400)

            current_tenant = getattr(request, 'tenant', None)
            base_url = get_client_base_url(request)

            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )

                profile, _ = UserProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'role': 'customer',
                        'organization_name': organization_name,
                        'mobile_number': clean_mobile_10,  # 🌟 Pure 10-digit format saved
                        'tenant': current_tenant,
                        'is_mobile_verified': True,
                        'is_profile_completed': True
                    }
                )

                auth_token, _ = Token.objects.get_or_create(user=user)

            if user and email:
                try:
                    send_professional_welcome_email(user, organization_name, base_url=base_url)
                except Exception as mail_err:
                    print("Welcome email skip:", mail_err)

            return JsonResponse({
                'status': 'success',
                'message': 'Account created successfully!',
                'token': auth_token.key,
                'username': user.username,
                'role': 'customer'
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
            
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = (data.get('identifier') or data.get('email') or '').strip()
            password = data.get('password', '')

            if not identifier or not password:
                return JsonResponse({"status": "error", "message": "Identifier and password are required."}, status=400)

            user_obj = User.objects.filter(
                Q(username__iexact=identifier) |
                Q(email__iexact=identifier) |
                Q(profile__mobile_number=identifier)
            ).first()

            if user_obj is not None:
                authenticated_user = authenticate(username=user_obj.username, password=password)
                if authenticated_user is not None:
                    profile = getattr(user_obj, 'profile', None)
                    is_completed = profile.is_profile_completed if profile else False
                    role = profile.role if profile else 'customer'

                    auth_token, _ = Token.objects.get_or_create(user=user_obj)

                    return JsonResponse({
                        "status": "success",
                        "message": "Login successful",
                        "token": auth_token.key,
                        "username": user_obj.username,
                        "email": user_obj.email,
                        "role": role,
                        "is_profile_completed": is_completed
                    })
                else:
                    return JsonResponse({"status": "error", "message": "Invalid password."}, status=401)
            else:
                return JsonResponse({"status": "error", "message": "User not found. Please sign up."}, status=404)

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


# -----------------------------------------------------------------------------
# 🌟 APP PRICING & COUPONS
# -----------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_app_price(request):
    try:
        user = request.user
        profile = getattr(user, 'profile', None)
        tenant = profile.tenant if profile else None

        app_code = request.data.get('app_code')
        coupon_code = request.data.get('coupon_code', None)

        default_prices = {
            'pos': 1999.00,
            'crm': 2499.00
        }
        base_price = default_prices.get(app_code, 1999.00)

        if tenant:
            try:
                custom_pricing_obj = TenantCustomPricing.objects.get(tenant=tenant, module_code=app_code)
                base_price = float(custom_pricing_obj.custom_price)
            except TenantCustomPricing.DoesNotExist:
                pass

        final_price = base_price
        discount_applied = 0.00

        if coupon_code:
            try:
                coupon = DiscountCoupon.objects.get(code=coupon_code, is_active=True)
                if coupon.discount_percent > 0:
                    discount_applied = (base_price * coupon.discount_percent) / 100
                    final_price = base_price - discount_applied
                elif coupon.flat_discount:
                    discount_applied = float(coupon.flat_discount)
                    final_price = max(0.00, base_price - discount_applied)
            except DiscountCoupon.DoesNotExist:
                return Response({"error": "Invalid or expired coupon code"}, status=400)

        return Response({
            "app_code": app_code,
            "original_base_price": base_price,
            "discount_applied": discount_applied,
            "final_payable_amount": final_price
        }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)


# -----------------------------------------------------------------------------
# 🌟 DYNAMIC VOICE AI INTENT (Gemini 2.5 Flash)
# -----------------------------------------------------------------------------
client = genai.Client(api_key=config('GEMINI_API_KEY'))

class DynamicVoiceAIIntentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            spoken_text = request.data.get("transcript", "").strip().lower()

            all_modules = list(AppStoreModule.objects.values_list('module_code', flat=True))
            all_panels = ['open_customizer', 'open_search', 'toggle_sidebar', 'open_dashboard']
            active_capabilities = all_modules + all_panels

            prompt = f"""
            You are the Core AGI of Kosisko.
            You have real-time access to these system capabilities: {active_capabilities}

            User Input: "{spoken_text}"

            Task:
            - Analyze the user intent with pure contextual reasoning.
            - If the intent matches any of the capabilities in {active_capabilities}, return the exact code.
            - If the user says something vague, use your intelligence to map it to the closest logical capability.
            - If it is irrelevant chatter or meaningless, return 'error_invalid_command'.

            Respond ONLY with a JSON object:
            {{"action": "target_code_or_error_invalid_command", "message": "reasoning or feedback"}}
            """

            response = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                    )
                    break
                except Exception as api_err:
                    if "503" in str(api_err) and attempt < max_retries - 1:
                        time.sleep(1.5)
                        continue
                    raise api_err

            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            result_json = json.loads(clean_text)
            return Response(result_json)

        except Exception as e:
            error_str = str(e)
            if "503" in error_str or "UNAVAILABLE" in error_str:
                if "डैशबोर्ड" in spoken_text or "dashboard" in spoken_text:
                    return Response({"action": "open_dashboard", "message": "Fallback: Opened via Local Rules"})
                elif "सेटिंग्स" in spoken_text or "customizer" in spoken_text:
                    return Response({"action": "open_customizer", "message": "Fallback: Opened via Local Rules"})
                elif "सर्च" in spoken_text or "search" in spoken_text:
                    return Response({"action": "open_search", "message": "Fallback: Opened via Local Rules"})

            return Response({"action": "error_invalid_command", "message": f"AI Engine Error: {error_str}"}, status=500)


@csrf_exempt
def verify_otp_and_register(request):
    if request.method == 'POST':
        try:
            return JsonResponse({"status": "success", "message": "Verified successfully."})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


@csrf_exempt
def api_logout(request):
    if request.method == 'POST':
        try:
            logout(request)
            return JsonResponse({"status": "success", "message": "Logged out successfully."})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


class BrandingConfigView(APIView):
    def get(self, request):
        tenant_id = request.GET.get('tenant_id')
        try:
            tenant_obj = Tenant.objects.get(id=tenant_id)
            branding_data = tenant_obj.get_branding_details()
        except Tenant.DoesNotExist:
            branding_data = {
                "company_name": "Cosisko Ventures Private Limited",
                "brand_name": "KOSISKO",
                "tagline": "कोशिश से कामयाबी की ओर",
                "logo_url": "/Logo.jpg",
                "is_whitelabel": False
            }
        return Response(branding_data)


class UniversalLoginAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier') or request.data.get('email')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({"error": "Please provide your identifier and password."}, status=400)

        user_obj = User.objects.filter(
            Q(username=identifier) |
            Q(email=identifier) |
            Q(profile__mobile_number=identifier)
        ).first()

        if not user_obj:
            return Response({"error": "No account found with this username, email, or mobile number."}, status=404)

        user = authenticate(username=user_obj.username, password=password)

        if user is not None:
            return Response({
                "status": "success",
                "message": "Login successful!",
                "username": user.username,
                "email": user.email
            })
        else:
            return Response({"error": "Invalid password. Please try again."}, status=400)


class UniversalForgotPasswordAPIView(APIView):
    """
    Universal Password Recovery:
    Accepts Email, 10-digit Mobile, or Username.
    Dispatches WhatsApp OTP to verified mobile and fallback reset email.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = (request.data.get('identifier') or request.data.get('email') or '').strip()

        if not identifier:
            return Response({
                "status": "error",
                "message": "Please enter your registered email, mobile number, or username."
            }, status=400)

        # Universal identifier resolution
        user, mobile = resolve_user_by_identifier(identifier)

        if not user:
            return Response({
                "status": "error",
                "message": "No registered account found matching this email, mobile number, or username."
            }, status=404)

        clean_mobile_10 = re.sub(r'[^0-9]', '', str(mobile))[-10:] if mobile else None
        target_email = user.email

        if not clean_mobile_10 and not target_email:
            return Response({
                "status": "error",
                "message": "No verified contact method (mobile or email) found for this account. Please contact enterprise support."
            }, status=400)

        # 4-Digit OTP generation with 5-minute TTL
        otp_code = str(random.randint(1000, 9999))
        cache_key_user = f"pwd_reset_otp_{user.username}"
        cache_key_id = f"pwd_reset_otp_{user.id}"
        cache.set(cache_key_user, otp_code, timeout=300)
        cache.set(cache_key_id, otp_code, timeout=300)

        dispatched_channels = []

        # 1. Dispatch WhatsApp OTP
        if clean_mobile_10:
            threading.Thread(
                target=_dispatch_whatsapp_async,
                args=(clean_mobile_10, otp_code),
                daemon=True
            ).start()
            dispatched_channels.append(f"WhatsApp (+91 ******{clean_mobile_10[-4:]})")

        # 2. Dispatch Backup Email with Reset Link
        if target_email:
            try:
                base_url = get_client_base_url(request)
                reset_link = f"{base_url}/reset-password?user={user.username}&otp={otp_code}"
                send_professional_password_reset_email(target_email, user.username, "Password Recovery", reset_link)
                dispatched_channels.append(f"Email ({target_email[:2]}***@{target_email.split('@')[-1]})")
            except Exception as mail_err:
                print("[Mail Dispatch Warning]:", mail_err)

        channel_summary = " and ".join(dispatched_channels)
        return Response({
            "status": "success",
            "message": f"Verification code successfully sent via {channel_summary}.",
            "username": user.username,
            "user_id": user.id,
            "masked_mobile": f"+91 ******{clean_mobile_10[-4:]}" if clean_mobile_10 else None,
            "requires_otp": True
        })


class ResetPasswordAPIView(APIView):
    """
    Secure Password Reset:
    Verifies 4-digit OTP and enforces strong password policy.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or request.data.get('user') or '').strip()
        user_id = request.data.get('user_id')
        user_otp = str(request.data.get('otp', '')).strip()
        new_password = str(request.data.get('password') or request.data.get('new_password') or '').strip()

        if not username and not user_id:
            return Response({"status": "error", "message": "User identifier is required."}, status=400)

        if not new_password:
            return Response({"status": "error", "message": "New password is required."}, status=400)

        if len(new_password) < 8:
            return Response({"status": "error", "message": "Password must be at least 8 characters long."}, status=400)

        # Resolve User
        user = None
        if username:
            user = User.objects.filter(username__iexact=username).first()
        elif user_id:
            user = User.objects.filter(id=user_id).first()

        if not user:
            return Response({"status": "error", "message": "Account not found."}, status=404)

        # Verify OTP if provided or required
        cache_key = f"pwd_reset_otp_{user.username}"
        saved_otp = cache.get(cache_key) or cache.get(f"pwd_reset_otp_{user.id}")

        if saved_otp:
            if not user_otp:
                return Response({"status": "error", "message": "Verification code (OTP) is required."}, status=400)
            if str(saved_otp) != user_otp:
                return Response({"status": "error", "message": "Invalid or expired verification code. Please check and try again."}, status=400)
            # Clear cache upon verification
            cache.delete(f"pwd_reset_otp_{user.username}")
            cache.delete(f"pwd_reset_otp_{user.id}")

        # Update Password
        user.set_password(new_password)
        user.save()

        return Response({
            "status": "success",
            "message": "Your password has been reset successfully. You can now log in with your new credentials."
        })


# -----------------------------------------------------------------------------
# 🌟 USERNAME AVAILABILITY CHECKER
# -----------------------------------------------------------------------------
class CheckUsernameAvailabilityView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        username = request.query_params.get('username', '').strip().lower()
        if not username or len(username) < 3:
            return Response({"available": False, "message": "Must be at least 3 characters"}, status=400)

        exists = User.objects.filter(username__iexact=username).exists()
        return Response({
            "username": username,
            "available": not exists,
            "message": "✓ Username is available" if not exists else "✕ Username is already taken, please choose another"
        })


# -----------------------------------------------------------------------------
# 🌟 SUBDOMAIN AVAILABILITY CHECKER (Post-Login / Onboarding)
# -----------------------------------------------------------------------------
class CheckSubdomainAvailabilityView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        subdomain = request.query_params.get('subdomain', '').strip().lower()
        subdomain = re.sub(r'[^a-z0-9-]', '', subdomain)

        if not subdomain or len(subdomain) < 3:
            return Response({"available": False, "message": "Subdomain must be at least 3 characters."}, status=400)

        reserved = ['www', 'api', 'admin', 'master', 'mail', 'portal', 'dashboard', 'public', 'login', 'signup', 'auth']
        if subdomain in reserved:
            return Response({"available": False, "message": "This subdomain name is reserved for system use."}, status=400)

        exists = Tenant.objects.filter(subdomain__iexact=subdomain).exists()
        return Response({
            "subdomain": subdomain,
            "available": not exists,
            "message": "✓ Subdomain is available!" if not exists else "✕ Subdomain already taken, please choose another."
        })


# -----------------------------------------------------------------------------
# 🌟 WORKSPACE SUBDOMAIN CREATION API (User Chooses Subdomain Post-Login)
# -----------------------------------------------------------------------------
class CreateWorkspaceSubdomainView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            workspace_name = request.data.get('workspace_name', '').strip()
            subdomain = request.data.get('subdomain', '').strip().lower()
            subdomain = re.sub(r'[^a-z0-9-]', '', subdomain)

            if not workspace_name or not subdomain or len(subdomain) < 3:
                return Response({"error": "Valid Workspace Name and Subdomain (min 3 chars) are required."}, status=400)

            reserved = ['www', 'api', 'admin', 'master', 'mail', 'portal', 'dashboard', 'public', 'login', 'signup']
            if subdomain in reserved:
                return Response({"error": "This subdomain name is reserved."}, status=400)

            if Tenant.objects.filter(subdomain__iexact=subdomain).exists():
                return Response({"error": "Subdomain is already registered by another organization."}, status=400)

            with transaction.atomic():
                tenant = Tenant.objects.create(
                    name=workspace_name,
                    subdomain=subdomain,
                    custom_brand_name=workspace_name,
                    is_active=True
                )
                profile, _ = UserProfile.objects.get_or_create(user=request.user)
                profile.tenant = tenant
                profile.organization_name = workspace_name
                profile.save(update_fields=['tenant', 'organization_name'])

            workspace_url = f"https://{subdomain}.kosisko.com/customer/marketplace"
            return Response({
                "status": "success",
                "message": "Workspace successfully provisioned!",
                "subdomain": subdomain,
                "workspace_url": workspace_url
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)


# -----------------------------------------------------------------------------
# 🌟 GOOGLE OAUTH ONBOARDING & LOGIN VIEW
# -----------------------------------------------------------------------------
class GoogleOAuthOnboardingView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            email = data.get('email', '').strip()
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()

            if not email:
                return Response({"error": "Email is required from Google Auth."}, status=400)

            current_tenant = getattr(request, 'tenant', None)
            user = User.objects.filter(email__iexact=email).first()

            if user:
                profile, _ = UserProfile.objects.get_or_create(user=user)

                if current_tenant and not profile.tenant:
                    profile.tenant = current_tenant
                    profile.save(update_fields=['tenant'])

                is_completed = profile.is_profile_completed if profile else True
                role = profile.role if profile else 'customer'

                org_name = getattr(profile, 'organization_name', None)
                user_tenant = getattr(profile, 'tenant', None)
                if not org_name and user_tenant:
                    org_name = getattr(user_tenant, 'custom_brand_name', None) or getattr(user_tenant, 'name', None)

                if not org_name and current_tenant:
                    org_name = getattr(current_tenant, 'custom_brand_name', None) or getattr(current_tenant, 'name', None)

                if not org_name or str(org_name).strip().lower() in ['master', 'public', 'none', '']:
                    display_name = user.first_name or first_name or user.username
                    org_name = f"{display_name}'s Enterprise" if display_name else "Enterprise Workspace"

                try:
                    auth_token, _ = Token.objects.get_or_create(user=user)
                    token_key = auth_token.key
                except Exception:
                    token_key = f"session_{user.id}_{secrets.token_hex(6)}"

                tenant_display = (
                    getattr(user_tenant, 'name', None)
                    if user_tenant else (getattr(current_tenant, 'name', None) if current_tenant else org_name)
                )

                return Response({
                    "status": "success",
                    "action": "login",
                    "message": "Login successful via Google",
                    "token": token_key,
                    "organization_name": org_name,
                    "first_name": user.first_name or first_name,
                    "last_name": user.last_name or last_name,
                    "username": user.username,
                    "email": user.email,
                    "role": role,
                    "tenant": tenant_display or org_name,
                    "is_profile_completed": is_completed
                })
            else:
                return Response({
                    "status": "success",
                    "action": "onboarding_required",
                    "message": "New user detected. Please complete registration.",
                    "prefilled_data": {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "username": "",
                        "organization_name": "",
                        "detected_tenant": current_tenant.name if current_tenant else None
                    }
                })
        except Exception as e:
            return Response({"error": str(e)}, status=500)


# -----------------------------------------------------------------------------
# 🌟 UNIFIED COMPLETE SIGNUP VIEW (Google & Manual)
# -----------------------------------------------------------------------------
class CompleteGoogleSignupView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            email = data.get('email', '').strip()
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            username = data.get('username', '').strip().lower()
            organization_name = data.get('organization_name', '').strip()
            mobile_number = data.get('mobile_number', '').strip()
            password = data.get('password', '').strip()

            if not email or not username or not organization_name or not mobile_number:
                return Response({"error": "Email, Username, Organization Name, and Mobile Number are required."}, status=400)

            if len(password) < 8:
                return Response({"error": "Master Password must be at least 8 characters long."}, status=400)

            if User.objects.filter(username__iexact=username).exists():
                return Response({"error": "This username is already taken. Please choose another."}, status=400)

            current_tenant = getattr(request, 'tenant', None)
            base_url = get_client_base_url(request)

            token_key = None
            user = None

            with transaction.atomic():
                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password=password,
                        first_name=first_name,
                        last_name=last_name
                    )
                else:
                    user.username = username
                    user.set_password(password)
                    user.first_name = first_name
                    user.last_name = last_name
                    user.save(update_fields=['username', 'password', 'first_name', 'last_name'])

                UserProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        'role': 'customer',
                        'organization_name': organization_name,
                        'mobile_number': mobile_number,
                        'tenant': current_tenant,
                        'is_mobile_verified': True,
                        'is_profile_completed': True
                    }
                )

                try:
                    auth_token, _ = Token.objects.get_or_create(user=user)
                    token_key = auth_token.key
                except Exception:
                    token_key = f"session_{user.id}_{secrets.token_hex(6)}"

            if user:
                try:
                    send_professional_welcome_email(user, organization_name, base_url=base_url)
                except Exception as mail_err:
                    print("Welcome email skip:", mail_err)

            return Response({
                "status": "success",
                "message": "Account successfully created!",
                "token": token_key,
                "organization_name": organization_name,
                "username": user.username,
                "role": "customer"
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)


# -----------------------------------------------------------------------------
# 🌟 HARDWARE PASSKEY / BIOMETRIC AUTHENTICATION & SETTINGS
# -----------------------------------------------------------------------------
class HardwarePasskeyAuthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            identifier = data.get('identifier', '').strip()

            if not identifier:
                return Response({"error": "Username or Email is required for Biometric authentication."}, status=400)

            user = User.objects.filter(
                Q(username__iexact=identifier) |
                Q(email__iexact=identifier) |
                Q(profile__mobile_number=identifier)
            ).first()

            if not user:
                return Response({
                    "error": "No registered account found with this identifier. Please sign up or log in with password."
                }, status=404)

            profile = getattr(user, 'profile', None)

            # 🌟 यूज़र सेटिंग्स चेक: क्या पासकी ऑन (Active) है?
            is_passkey_enabled = getattr(profile, 'is_passkey_enabled', True) if profile else True
            if not is_passkey_enabled:
                return Response({
                    "error": "Biometric login is disabled for this account in your Settings. Please log in using your Master Password."
                }, status=403)

            auth_token, _ = Token.objects.get_or_create(user=user)

            return Response({
                "status": "success",
                "action": "login",
                "message": "Biometric authentication successful.",
                "token": auth_token.key,
                "username": user.username
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class TogglePasskeyStatusView(APIView):
    """
    यूज़र को अपनी सेटिंग्स से पासकी को ON या OFF करने का अधिकार देता है।
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            enable = request.data.get('enable', True)
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.is_passkey_enabled = bool(enable)
            profile.save(update_fields=['is_passkey_enabled'])

            status_str = "enabled" if enable else "disabled"
            return Response({
                "status": "success",
                "message": f"Biometric passkey login {status_str} successfully.",
                "is_passkey_enabled": profile.is_passkey_enabled
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)



User = get_user_model()
HTTP_SESSION = requests.Session()


def check_mobile_already_exists(clean_mobile_10):
    """Checks whether the mobile number is already registered across models."""
    possible_formats = [
        clean_mobile_10,
        f"91{clean_mobile_10}",
        f"+91{clean_mobile_10}"
    ]
    
    # 1. Check in the User model
    user_fields = [f.name for f in User._meta.get_fields()]
    for field_name in ['mobile_number', 'phone_number', 'mobile', 'phone', 'username']:
        if field_name in user_fields:
            if User.objects.filter(**{f"{field_name}__in": possible_formats}).exists():
                return True

    # 2. Check in related UserProfile if present
    try:
        from core_platform.models import UserProfile
        profile_fields = [f.name for f in UserProfile._meta.get_fields()]
        for field_name in ['mobile_number', 'phone_number', 'mobile', 'phone']:
            if field_name in profile_fields:
                if UserProfile.objects.filter(**{f"{field_name}__in": possible_formats}).exists():
                    return True
    except (ImportError, Exception):
        pass

    return False


def _dispatch_whatsapp_async(clean_mobile_10, otp_code):
    """Background worker sending Meta template payload with button parameters."""
    token = config('META_WHATSAPP_TOKEN', default='')
    phone_number_id = config('META_PHONE_NUMBER_ID', default='1230151333524542')

    if not token or not phone_number_id:
        print("[WhatsApp Error] Meta credentials missing in environment.")
        return

    recipient = f"91{clean_mobile_10}"
    url = f"https://graph.facebook.com/v22.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Meta requires parameters for BOTH body and dynamic url/copy-code button
    payload = {
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "template",
        "template": {
            "name": "kosisko_otp",
            "language": { "code": "en" },
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        { "type": "text", "text": str(otp_code) }
                    ]
                },
                {
                    "type": "button",
                    "sub_type": "url",
                    "index": "0",
                    "parameters": [
                        { "type": "text", "text": str(otp_code) }
                    ]
                }
            ]
        }
    }

    try:
        response = HTTP_SESSION.post(url, headers=headers, json=payload, timeout=8)
        res_data = response.json()
        if response.status_code in [200, 201]:
            print(f"[Meta Success] OTP {otp_code} delivered to {recipient}")
        else:
            # Fallback attempt without button if button type differs
            if "buttons" in json.dumps(res_data):
                fallback_payload = {
                    "messaging_product": "whatsapp",
                    "to": recipient,
                    "type": "template",
                    "template": {
                        "name": "kosisko_otp",
                        "language": { "code": "en" },
                        "components": [
                            {
                                "type": "body",
                                "parameters": [{ "type": "text", "text": str(otp_code) }]
                            }
                        ]
                    }
                }
                HTTP_SESSION.post(url, headers=headers, json=fallback_payload, timeout=5)
            print(f"[Meta API Error for {recipient}]: {res_data}")
    except Exception as e:
        print(f"[Meta Connection Exception]: {e}")


@csrf_exempt
def send_whatsapp_otp_api(request):
    """High-speed WhatsApp OTP endpoint with duplicate mobile validation."""
    if request.method != 'POST':
        return JsonResponse({"status": "error", "message": "Method not allowed."}, status=405)

    try:
        data = json.loads(request.body)
        mobile = data.get('mobile_number', '').strip()
        purpose = data.get('purpose', 'signup').strip().lower()  # 'signup' or 'login'
        clean_digits = re.sub(r'[^0-9]', '', mobile)

        if len(clean_digits) < 10:
            return JsonResponse({
                "status": "error",
                "message": "Please enter a valid 10-digit mobile number."
            }, status=400)

        clean_mobile_10 = clean_digits[-10:]

        # Enforce uniqueness for registration/signup
        if purpose == 'signup' and check_mobile_already_exists(clean_mobile_10):
            return JsonResponse({
                "status": "error",
                "message": "This mobile number is already registered. Please sign in instead."
            }, status=409)

        otp_code = str(random.randint(1000, 9999))

        # Store in Django cache with 5 minutes TTL
        cache_key = f"wa_otp_{clean_mobile_10}"
        cache.set(cache_key, otp_code, timeout=300)

        # Dispatch background worker
        threading.Thread(
            target=_dispatch_whatsapp_async,
            args=(clean_mobile_10, otp_code),
            daemon=True
        ).start()

        return JsonResponse({
            "status": "success",
            "message": f"Verification code sent successfully to +91 {clean_mobile_10}.",
            "debug_otp": otp_code if settings.DEBUG else None
        })

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def verify_whatsapp_otp_api(request):
    """Instant OTP verification endpoint."""
    if request.method != 'POST':
        return JsonResponse({"status": "error", "message": "Method not allowed."}, status=405)

    try:
        data = json.loads(request.body)
        mobile = data.get('mobile_number', '').strip()
        clean_mobile_10 = re.sub(r'[^0-9]', '', mobile)[-10:]
        user_otp = str(data.get('otp', '')).strip()

        cache_key = f"wa_otp_{clean_mobile_10}"
        saved_otp = cache.get(cache_key)

        if not saved_otp:
            return JsonResponse({
                "status": "error",
                "message": "The verification code has expired or is invalid. Please request a new code."
            }, status=400)

        if str(saved_otp) == user_otp:
            cache.delete(cache_key)
            # Store verification flag for complete-signup stage
            cache.set(f"wa_verified_{clean_mobile_10}", True, timeout=600)

            return JsonResponse({
                "status": "success",
                "message": "Mobile number verified successfully."
            })
        else:
            return JsonResponse({
                "status": "error",
                "message": "Invalid verification code. Please check and try again."
            }, status=400)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


def resolve_user_by_identifier(identifier):
    """
    Universal Identifier Resolver:
    Resolves a User instance whether input is Email, 10-digit Mobile, or Username.
    """
    identifier = identifier.strip()
    clean_digits = re.sub(r'[^0-9]', '', identifier)

    # 1. Check if input is a 10-digit mobile number
    if len(clean_digits) == 10 and clean_digits[0] in '6789':
        try:
            from core_platform.models import UserProfile
            profile = UserProfile.objects.filter(mobile_number=clean_digits).select_related('user').first()
            if profile and profile.user:
                return profile.user, clean_digits
        except Exception:
            pass

    # 2. Check if input is an Email address
    if '@' in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        if user:
            mobile = getattr(getattr(user, 'profile', None), 'mobile_number', None)
            return user, mobile

    # 3. Check if input is a Username
    user = User.objects.filter(username__iexact=identifier).first()
    if user:
        mobile = getattr(getattr(user, 'profile', None), 'mobile_number', None)
        return user, mobile

    return None, None
