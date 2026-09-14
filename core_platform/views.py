import json
import random
import datetime
import secrets
import time
import os
import threading
from django.contrib.auth.models import User
from django.core.mail import send_mail, EmailMultiAlternatives
from django.contrib.auth import logout
from django.conf import settings
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from decouple import config

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
KOSISKO_LOGO_URL = "https://i.ibb.co/Zp6jVKc6/Logo.png"

def send_email_in_background(email_message):
    try:
        email_message.send(fail_silently=False)
    except Exception as e:
        print("Background email dispatch failed:", e)

def get_kosisko_footer():
    current_year = datetime.datetime.now().year
    return f"&copy; {current_year} Kosisko. All rights reserved. 256-bit Encrypted Secure Communication."


# -----------------------------------------------------------------------------
# 1. PROFESSIONAL WELCOME EMAIL (With Auto-Login Magic Token Link & Fixed Arguments)
# -----------------------------------------------------------------------------
def send_professional_welcome_email(user_obj, organization_name="Enterprise Workspace"):
    user_email = user_obj.email
    username = user_obj.username
    subject = f'Welcome to Kosisko, {username} – Your Enterprise Workspace is Ready!'
    footer_text = get_kosisko_footer()

    # 🌟 ऑटो-लॉगिन मैजिक टोकन जनरेट करना (ताकि यूजर बिना पासवर्ड डैशबोर्ड जा सके)
    magic_token = secrets.token_urlsafe(32)
    
    # इसे यूजर के प्रोफाइल या सेशन में सेव कर लें ताकि फ्रंटएंड इसे वेरीफाई कर सके
    profile, _ = UserProfile.objects.get_or_create(user=user_obj)
    profile.magic_login_token = magic_token
    profile.save()

    # मैजिक लॉगिन लिंक (फ्रंटएंड इस टोकन को पकड़कर ऑटो-लॉगिन कर देगा)
    dashboard_link = f"http://localhost:3000/customer/marketplace?token={magic_token}&username={username}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 30px; }}
            .logo-container img {{ max-height: 65px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .highlight-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 25px 0; }}
            .btn-container {{ text-align: center; margin: 35px 0 25px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Welcome to Kosisko!</h2>
            <p>Dear <strong>{username}</strong>,</p>
            <p>Welcome to Kosisko! – <span class="slogan">'कोशिश से कामयाबी की ओर'</span>. We are absolutely thrilled and honoured to have you onboard.</p>
            
            <div class="highlight-box">
                <p style="margin: 0; color: #0f172a; font-weight: 700;">🔑 Your Enterprise Workspace Details:</p>
                <p style="margin: 8px 0 0 0; font-size: 13px;">
                    - Workspace: {organization_name}<br>
                    - Login ID / Username: {username}
                </p>
            </div>

            <p>Your dedicated enterprise workspace for <strong>{organization_name}</strong> has been successfully provisioned and secured. You can now experience the next generation of seamless business management, AI-driven tools, and high-speed workflows. Click the secure button below to launch your master dashboard instantly without entering any password:</p>
            
            <div class="btn-container">
                <a href="{dashboard_link}" class="btn">Launch Your Dashboard →</a>
            </div>

            <p>If you have any questions or need assistance setting up your modules, our 24/7 engineering support team is always here for you.</p>
            
            <p>Thank you for choosing Kosisko. Let's build the future together!<br><br>

            <p style="margin-top: 30px;">Warm regards,<br><strong>The Kosisko Executive Team</strong></p>
            
            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = (
        f"Dear {username},\n\n"
        f"Welcome to Kosisko! – 'कोशिश से कामयाबी की ओर'.\n"
        f"Access your dashboard instantly here: {dashboard_link}"
    )

    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")

    email_thread = threading.Thread(target=send_email_in_background, args=(email_message,))
    email_thread.start()


# -----------------------------------------------------------------------------
# 2. PROFESSIONAL PASSWORD RESET EMAIL
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
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 30px; }}
            .logo-container img {{ max-height: 65px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .btn-container {{ text-align: center; margin: 35px 0 25px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Password Reset Request</h2>
            <p>Hello <strong>{username}</strong>,</p>
            <p>We received a master password reset request for your Kosisko account using your <strong>{method_used}</strong>.</p>
            <p>To securely reset your password, please click the encrypted button below:</p>
            
            <div class="btn-container">
                <a href="{reset_link}" class="btn">Reset My Master Password →</a>
            </div>

            <p>If you did not request this change, please ignore this email immediately.</p>
            
            <p style="margin-top: 30px;">Warm regards,<br><strong>The Kosisko Security Team</strong><br><span class="slogan">'कोशिश से कामयाबी की ओर'</span></p>
            
            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = (
        f"Hello {username},\n\n"
        f"We received a password reset request. Click the link below to reset your password:\n{reset_link}"
    )

    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")

    email_thread = threading.Thread(target=send_email_in_background, args=(email_message,))
    email_thread.start()


# -----------------------------------------------------------------------------
# 3. PROFESSIONAL OTP EMAIL (With Auto-Fill & Auto-Verify Magic Link)
# -----------------------------------------------------------------------------
def send_professional_otp_email(user_email, otp_code):
    subject = 'Kosisko Security Verification Code'
    footer_text = get_kosisko_footer()

    existing_verify_page = "http://localhost:3000/login"
    auto_verify_link = f"{existing_verify_page}?email={user_email}&otp={otp_code}&auto_verify=true"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; }}
            .email-card {{ max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }}
            .logo-container {{ text-align: center; margin-bottom: 30px; }}
            .logo-container img {{ max-height: 65px; width: auto; object-fit: contain; }}
            h2 {{ color: #0f172a; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 20px; }}
            p {{ color: #475569; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }}
            .slogan {{ color: #d97706; font-weight: 700; font-style: italic; }}
            .otp-box {{ background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; font-size: 36px; font-weight: 900; color: #0f172a; text-align: center; letter-spacing: 12px; padding: 20px; margin: 25px 0; }}
            .btn-container {{ text-align: center; margin: 30px 0 20px 0; }}
            .btn {{ display: inline-block; padding: 14px 32px; background-color: #f59e0b; color: #0f172a; font-weight: 900; font-size: 13px; text-decoration: none; border-radius: 14px; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }}
            .footer {{ margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }}
        </style>
    </head>
    <body>
        <div class="email-card">
            <div class="logo-container">
                <img src="{KOSISKO_LOGO_URL}" alt="Kosisko Logo" />
            </div>
            <h2>Email Verification Code</h2>
            <p>Hello,</p>
            <p>Welcome to Kosisko! – <span class="slogan">'कोशिश से कामयाबी की ओर'</span>. To complete your secure registration, use the verification code below:</p>
            
            <div class="otp-box">{otp_code}</div>

            <p style="text-align: center; font-size: 13px; color: #64748b;">Click the button below to auto-verify and proceed instantly:</p>

            <div class="btn-container">
                <a href="{auto_verify_link}" class="btn">Verify & Proceed to Setup →</a>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 15px;">This code is valid for a limited time. Please do not share. This security code is strictly confidential.</p>
            
            <p style="margin-top: 30px; color: #475569;">Warm regards,<br><strong>The Kosisko Security Team</strong></p>
            
            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

    text_content = (
        f"Welcome to Kosisko! – 'कोशिश से कामयाबी की ओर'.\n"
        f"Your verification code is: {otp_code}\n\n"
        f"Auto-verify here: {auto_verify_link}"
    )

    email_message = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user_email])
    email_message.attach_alternative(html_content, "text/html")

    email_thread = threading.Thread(target=send_email_in_background, args=(email_message,))
    email_thread.start()


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


@csrf_exempt
def check_user_exists(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = data.get('identifier') or data.get('email')
            
            if not identifier:
                return JsonResponse({"status": "error", "message": "Identifier is required"}, status=400)
            
            exists = User.objects.filter(
                Q(username__iexact=identifier) | 
                Q(email__iexact=identifier) | 
                Q(profile__mobile_number=identifier)
            ).exists()
            
            return JsonResponse({"status": "success", "exists": exists})
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
    return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)


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
            
            send_professional_otp_email(email, otp_code)

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


@csrf_exempt
def api_signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # 🌟 DRF Serializer का उपयोग करके डेटा वैलिडेट करना
            serializer = UserSignupSerializer(data=data)
            if not serializer.is_valid():
                return JsonResponse({'status': 'error', 'message': serializer.errors}, status=400)

            validated_data = serializer.validated_data
            email = validated_data.get('email', '')
            username = validated_data.get('username') or email 
            password = validated_data.get('password')
            full_name = validated_data.get('first_name', '')
            mobile_number = data.get('mobileNumber', '')
            organization_name = data.get('organizationName', full_name)

            if User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).exists():
                return JsonResponse({'status': 'error', 'message': 'Username or Email already exists.'}, status=400)

            if len(password) < 8:
                return JsonResponse({'status': 'error', 'message': 'Password must be at least 8 characters long.'}, status=400)

            user = User.objects.create_user(username=username, email=email, password=password, first_name=full_name)
            
            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'role': 'customer',
                    'organization_name': organization_name,
                    'mobile_number': mobile_number,
                    'is_mobile_verified': True,
                    'is_profile_completed': True 
                }
            )

            if user:
                send_professional_welcome_email(user, organization_name)

            return JsonResponse({'status': 'success', 'message': 'Account created successfully!', 'role': 'customer'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Invalid method'}, status=405)


@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = data.get('identifier') or data.get('email')
            password = data.get('password')

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
                    
                    return JsonResponse({
                        "status": "success",
                        "message": "Login successful",
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


# जेमिनी क्लाइंट इनिशियलाइजेशन
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
            data = json.loads(request.body)
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
    """
    यह व्यू सीधे Tenant मॉडल से व्हाइट-लेबलिंग ब्रांडिंग उठाएगा।
    """
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
    permission_classes = [AllowAny]
    def post(self, request):
        identifier = request.data.get('email') or request.data.get('identifier')

        if not identifier:
            return Response({"error": "Please provide your username, email, or mobile number."}, status=400)

        user = User.objects.filter(
            Q(username__iexact=identifier) | 
            Q(email__iexact=identifier) | 
            Q(profile__mobile_number=identifier)
        ).first()

        if user:
            target_email = user.email
            if target_email:
                try:
                    method_used = "Email Address"
                    if identifier == user.username:
                        method_used = f"Username ({user.username})"
                    elif hasattr(user, 'profile') and identifier == user.profile.mobile_number:
                        method_used = f"Mobile Number ({user.profile.mobile_number})"
                    else:
                        method_used = f"Email Address ({target_email})"

                    reset_link = f"http://localhost:3000/reset-password?user={user.username}"
                    
                    send_professional_password_reset_email(target_email, user.username, method_used, reset_link)
                except Exception as mail_err:
                    print("Mail sending failed:", mail_err)

        return Response({
            "status": "success",
            "message": "If an account matches your details, password reset instructions have been sent to your registered contact."
        })


class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        username = request.data.get('username')
        new_password = request.data.get('password')

        if not username or not new_password:
            return Response({"error": "Username and new password are required."}, status=400)

        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters long."}, status=400)

        user = User.objects.filter(username__iexact=username).first()
        if not user:
            return Response({"error": "User not found."}, status=404)

        user.set_password(new_password)
        user.save()

        return Response({"status": "success", "message": "Password reset successfully."})


# =============================================================================
# 🌟 UNIFIED GOOGLE & HARDWARE PASSKEY SMART ONBOARDING API VIEWS
# =============================================================================

class GoogleOAuthOnboardingView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Google लॉगिन/साइन-अप को हैंडल करता है।
        अगर यूजर नया है, तो Google डेटा के साथ ऑनबोर्डिंग (Organization Name, Unique Username, Mobile) मांगता है।
        अगर पुराना है, तो सीधे सक्सेसफुल लॉगिन टोकन/डेटा देता है।
        """
        try:
            data = request.data
            email = data.get('email')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            
            if not email:
                return Response({"error": "Email is required from Google Auth."}, status=400)
                
            user = User.objects.filter(email__iexact=email).first()
            
            if user:
                # 🟢 Existing User -> Direct Login
                profile = getattr(user, 'profile', None)
                is_completed = profile.is_profile_completed if profile else True
                role = profile.role if profile else 'customer'
                
                return Response({
                    "status": "success",
                    "action": "login",
                    "message": "Login successful via Google",
                    "username": user.username,
                    "email": user.email,
                    "role": role,
                    "is_profile_completed": is_completed
                })
            else:
                # 🟡 New User -> Require Onboarding (Organization Name, Unique Username, Mobile)
                return Response({
                    "status": "success",
                    "action": "onboarding_required",
                    "message": "New user detected. Please complete your registration details.",
                    "prefilled_data": {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name
                    }
                })
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class CompleteGoogleSignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Google से आए नए यूजर द्वारा Organization Name, Unique Username और Mobile भरने के बाद अकाउंट क्रिएट करता है।
        """
        try:
            data = request.data
            email = data.get('email')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            username = data.get('username') # Unique Username
            organization_name = data.get('organization_name') # Unified term (instead of firm name)
            mobile_number = data.get('mobile_number', '')
            
            if not email or not username or not organization_name:
                return Response({"error": "Email, Unique Username, and Organization Name are mandatory."}, status=400)
                
            # Check for unique username and email availability
            if User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).exists():
                return Response({"error": "Username or Email is already taken. Please choose a unique username."}, status=400)
                
            # Random secure password for OAuth users (they login via Google anyway)
            temp_password = secrets.token_urlsafe(16)
            
            user = User.objects.create_user(
                username=username, 
                email=email, 
                password=temp_password, 
                first_name=first_name,
                last_name=last_name
            )
            
            UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'role': 'customer',
                    'organization_name': organization_name,
                    'mobile_number': mobile_number,
                    'is_mobile_verified': True,
                    'is_profile_completed': True
                }
            )
            
            # Send professional welcome email
            send_professional_welcome_email(user, organization_name)
            
            return Response({
                "status": "success",
                "message": "Account successfully created via Google!",
                "username": user.username,
                "role": "customer"
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class HardwarePasskeyAuthView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Hardware Passkey / Biometric लॉगिन और साइन-अप को मैनेज करता है।
        अगर पासकी रजिस्टर नहीं है या यूजर नया है, तो उसे ऑनबोर्डिंग पर भेजता है।
        """
        try:
            data = request.data
            identifier = data.get('identifier') # Unique Username or Email
            passkey_credential_id = data.get('credential_id')
            
            if not identifier:
                return Response({"error": "Unique Username or Email is required for Passkey authentication."}, status=400)
                
            user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
            
            if user:
                # Existing User login via Passkey
                return Response({
                    "status": "success",
                    "action": "login",
                    "message": "Passkey verified successfully.",
                    "username": user.username
                })
            else:
                # New User wanting to register via Passkey
                return Response({
                    "status": "success",
                    "action": "onboarding_required",
                    "message": "New passkey user. Please provide your Organization Name and details to complete registration.",
                    "identifier": identifier
                })
        except Exception as e:
            return Response({"error": str(e)}, status=500)
