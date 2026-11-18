from . import views_passkey
from django.contrib import admin
from django.urls import path, re_path
from .views import (
    api_signup,
    api_login,
    api_logout,
    send_otp_api,
    verify_otp_api,
    send_whatsapp_otp_api,
    verify_whatsapp_otp_api,
    check_user_exists,
    calculate_app_price,
    MasterDashboardBootstrapView,
    DynamicVoiceAIIntentView,
    SSOConsumeTokenView,
    TenantBranchManagementView,
    SwitchActiveBranchView,
    UniversalForgotPasswordAPIView,
    ResetPasswordAPIView,
    CompleteOnboardingWizardView,
    CompleteGoogleSignupView,
    GoogleOAuthOnboardingView,
    CheckUsernameAvailabilityView,
    # 🌟 नए फ़ीचर्स के लिए जोड़े गए व्यूज़:
    consume_magic_login,
    CheckSubdomainAvailabilityView,
    CreateWorkspaceSubdomainView,
    HardwarePasskeyAuthView,
    TogglePasskeyStatusView,
    BrandingConfigView,
    create_payment_order_api,
    verify_payment_api
)

urlpatterns = [
    # Flexible passkey routes (supports with and without trailing slash)
    re_path(r'^api/v1/auth/passkey/register-options/?$', views_passkey.passkey_register_options, name='passkey_reg_options'),
    re_path(r'^api/v1/auth/passkey/register-verify/?$', views_passkey.passkey_register_verify, name='passkey_reg_verify'),
    re_path(r'^api/v1/auth/passkey/login-options/?$', views_passkey.passkey_login_options, name='passkey_login_options'),
    re_path(r'^api/v1/auth/passkey/login-verify/?$', views_passkey.passkey_login_verify, name='passkey_login_verify'),
    re_path(r'^api/v1/auth/passkey/status/?$', views_passkey.passkey_status, name='passkey_status'),
    re_path(r'^api/v1/auth/passkey/delete/?$', views_passkey.passkey_delete, name='passkey_delete'),

    # Hardware Passkey Flexible Routes (Supports both with and without trailing slash)






    # Flexible Passkey Routes (Trailing Slash Independent)
                        
    # Hardware Passkey & Biometric Routes
                        

    # 🔐 ऑथेंटिकेशन एपीआई (यूनिवर्सल लॉगिन, साइन-अप और अन्य)
    path('api/v1/auth/login/', api_login, name='api_login'),
    path('api/v1/auth/google/login/', GoogleOAuthOnboardingView.as_view(), name='google_oauth_login'),
    path('api/v1/auth/google/onboarding/', GoogleOAuthOnboardingView.as_view(), name='google_oauth_onboarding'),
    path('api/v1/auth/check-username/', CheckUsernameAvailabilityView.as_view(), name='check_username'),
    path('api/v1/auth/google/complete-signup/', CompleteGoogleSignupView.as_view(), name='google_complete_signup'),
    path('api/v1/auth/signup/', api_signup, name='api_signup'),
    path('api/v1/auth/check-user/', check_user_exists, name='check_user_exists'),
    path('api/v1/tenant/branches/', TenantBranchManagementView.as_view(), name='tenant-branches'),
    path('api/v1/tenant/branches/switch/', SwitchActiveBranchView.as_view(), name='switch-branch'),
    path('api/v1/auth/send-otp/', send_otp_api, name='send_otp_api'),
    path('api/v1/auth/sso/consume/', SSOConsumeTokenView.as_view(), name='sso_consume'),
    path('api/v1/tenant/onboarding/complete/', CompleteOnboardingWizardView.as_view(), name='complete-onboarding'),
    path('api/v1/auth/verify-otp/', verify_otp_api, name='verify_otp_api'),
    path('api/v1/auth/logout/', api_logout, name='api_logout'),
    path('api/v1/auth/forgot-password/', UniversalForgotPasswordAPIView.as_view(), name='universal_forgot_password'),
    path('api/v1/auth/reset-password/', ResetPasswordAPIView.as_view(), name='reset_password'),
    path('api/v1/auth/whatsapp/send-otp/', send_whatsapp_otp_api, name='send_whatsapp_otp'),
    path('api/v1/auth/whatsapp/verify-otp/', verify_whatsapp_otp_api, name='verify_whatsapp_otp'),

    # 🌟 10-मिनट का वन-टाइम सुरक्षित वेलकम लिंक
    path('api/v1/auth/magic-login/', consume_magic_login, name='consume_magic_login'),

    # 🧬 हार्डवेयर पासकी / बायोमेट्रिक ऑथेंटिकेशन और सेटिंग्स टॉगल
        path('api/v1/auth/toggle-passkey/', TogglePasskeyStatusView.as_view(), name='toggle_passkey'),

    # 🌐 सबडोमेन चेकर और वर्कस्पेस निर्माण (लॉगिन के बाद खुद सबडोमेन चुनने के लिए)
    path('api/v1/auth/check-subdomain/', CheckSubdomainAvailabilityView.as_view(), name='check_subdomain'),
    path('api/v1/auth/create-workspace/', CreateWorkspaceSubdomainView.as_view(), name='create_workspace'),

    # 🏢 व्हाइट-लेबल टेनेंट ब्रांडिंग एपीआई
    path('api/v1/branding/', BrandingConfigView.as_view(), name='branding_config'),

    # 💰 कूपन और कस्टम प्राइसिंग कैलकुलेशन एपीआई
    path('api/v1/calculate-price/', calculate_app_price, name='calculate_app_price'),

    # 📊 डैशबोर्ड बूटस्ट्रैप और ऐप्स लोड करने के लिए एपीआई
    path('api/v1/bootstrap/', MasterDashboardBootstrapView.as_view(), name='dashboard_bootstrap'),

    # 🤖 जेमिनी एआई वॉयस/इंटेंट एपीआई
    path('api/v1/ai-intent/', DynamicVoiceAIIntentView.as_view(), name='ai-intent'),

    # 💳 Razorpay Payments Live Endpoints
    path('api/v1/payments/create-order/', create_payment_order_api, name='create_payment_order'),
    path('api/v1/payments/verify/', verify_payment_api, name='verify_payment'),
]
