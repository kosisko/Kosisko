from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings

class CustomJWTAuthentication(JWTAuthentication):
    """
    Kosisko Enterprise Dual-Layer Authenticator:
    1. Web/PWA के लिए: HttpOnly Cookie ('access_token') से टोकन पढ़ता है।
    2. Mobile Apps के लिए: 'Authorization: Bearer ' हेडर से टोकन पढ़ता है।
    """
    def authenticate(self, request):
        # 1. पहले HttpOnly Cookie चेक करें (Web/Next.js)
        access_token = request.COOKIES.get('access_token')

        # 2. अगर कुकी नहीं मिली (जैसे Mobile App), तो Fallback Header चेक करें
        if not access_token:
            header = self.get_header(request)
            if header is None:
                return None
            access_token = self.get_raw_token(header)

        if not access_token:
            return None

        try:
            validated_token = self.get_validated_token(access_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            return None
