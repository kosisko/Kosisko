from django.contrib import admin
from django.urls import path
from core_platform.views import (
    api_signup, 
    api_logout,
    send_otp_api, 
    verify_otp_api, 
    check_user_exists, 
    calculate_app_price, 
    MasterDashboardBootstrapView, 
    DynamicVoiceAIIntentView
)
from .views import UniversalLoginAPIView, UniversalForgotPasswordAPIView
from .views import ResetPasswordAPIView

urlpatterns = [
    # 🔐 ऑथेंटिकेशन एपीआई (यूनिवर्सल लॉगिन, साइन-अप और अन्य)
    path('api/v1/auth/login/', UniversalLoginAPIView.as_view(), name='universal_login'),
    path('api/v1/auth/signup/', api_signup, name='api_signup'),
    path('api/v1/auth/check-user/', check_user_exists, name='check_user_exists'),
    path('api/v1/auth/send-otp/', send_otp_api, name='send_otp_api'),
    path('api/v1/auth/verify-otp/', verify_otp_api, name='verify_otp_api'),
    path('api/v1/auth/logout/', api_logout, name='api_logout'),
    path('api/v1/auth/forgot-password/', UniversalForgotPasswordAPIView.as_view(), name='universal_forgot_password'),
    path('api/v1/auth/reset-password/', ResetPasswordAPIView.as_view(), name='reset_password'),

   # 💰 कूपन और कस्टम प्राइसिंग कैलकुलेशन एपीआई
    path('api/v1/calculate-price/', calculate_app_price, name='calculate_app_price'),
    
    # 📊 डैशबोर्ड बूटस्ट्रैप और ऐप्स लोड करने के लिए एपीआई
    path('api/v1/bootstrap/', MasterDashboardBootstrapView.as_view(), name='dashboard_bootstrap'),
    
    # 🤖 जेमिनी एआई वॉयस/इंटेंट एपीआई
    path('api/v1/ai-intent/', DynamicVoiceAIIntentView.as_view(), name='ai-intent'),
]
