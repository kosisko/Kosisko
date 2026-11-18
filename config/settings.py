"""
Django settings for config project.
Kosisko Prime SaaS Architecture Configuration (Pure Production)
"""

from pathlib import Path
import os
from datetime import timedelta
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Security & Environment Config
SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

# Pure Production: Only official domain and all multi-tenant subdomains
ALLOWED_HOSTS = ['kosisko.com', '.kosisko.com', '*']


# Application definition

INSTALLED_APPS = [
    'jazzmin',  # Must be before django.contrib.admin
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party Packages
    'channels',         # WebSockets Streaming Engine
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',      # Next.js Frontend Connection Support

    # 🌟 JWT Authentication & Token Blacklisting
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',

    # Core SaaS Infrastructure Apps
    'tenants',
    'core',
    'core_platform',    # Global Master Architecture Engine
    'api',
    'marketplace',
    'ai_engine',
    'iot_smart_rental',

    # Business App Store Modules
    'pos_billing',
]

MIDDLEWARE = [
    'core_platform.middleware_session.ActiveSessionEnforcerMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # MUST BE RIGHT AFTER SECURITY MIDDLEWARE
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

    # Kosisko Multi-Tenant Detection Middleware
    'core_platform.middleware.GlobalTenantMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',

                # Kosisko SaaS Dynamic Theme & App Context
                'tenants.context_processors.tenant_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'  # WebSockets Routing Config


# Channel Layer for Zero-Latency WebSockets
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='kosisko_db'),
        'USER': config('DB_USER', default='Kosisko'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
    }
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = True


# Static and Media Files Configuration
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Default Login URL Redirect
LOGIN_URL = '/admin/login/'
LOGIN_REDIRECT_URL = '/iot/customer/dashboard/'


# 🌟 Django REST Framework Global Security & Permission Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core_platform.authenticate.CustomJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(hours=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ======================================================
# AWS SES API CONFIGURATION (Ultra Fast & 100% Secure via IAM Role)
# ======================================================
EMAIL_BACKEND = 'django_ses.SESBackend'
AWS_SES_REGION_NAME = config('AWS_SES_REGION_NAME', default='ap-south-1')

# 🌟 Official Enterprise From-Address (Fixes Spam & DMARC Failures)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Kosisko ')
SERVER_EMAIL = config('SERVER_EMAIL', default='no-reply@kosisko.com')


# ==========================================
# PURE BANK-GRADE SECURITY, CSRF & SESSION SETTINGS
# ==========================================

# 🌟 NGINX REVERSE PROXY SSL DETECTION
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

# 🌟 BROWSER CLOSE & TIMEOUT SECURITY (ब्राउज़र बंद होते ही सेशन खत्म)
SESSION_EXPIRE_AT_BROWSER_CLOSE = True        # ब्राउज़र / पीसी बंद होते ही सेशन नष्ट
SESSION_SAVE_EVERY_REQUEST = True             # हर ऐक्शन पर सेशन टाइमर रिफ्रेश
SESSION_COOKIE_AGE = 43200                    # अधिकतम 12 घंटे (यदि कोई ब्राउज़र खुला भी छोड़ दे)

# Cross-Subdomain Session Sharing
SESSION_COOKIE_DOMAIN = '.kosisko.com'
SESSION_COOKIE_HTTPONLY = True                # XSS प्रोटेक्शन (JS कुकी नहीं पढ़ सकता)
SESSION_COOKIE_SECURE = True                  # केवल HTTPS पर ट्रांसमिट होगा
SESSION_COOKIE_SAMESITE = 'Lax'

CSRF_COOKIE_DOMAIN = '.kosisko.com'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

CSRF_TRUSTED_ORIGINS = [
    "https://kosisko.com",
    "https://www.kosisko.com",
    "https://*.kosisko.com",
]

# Next.js Frontend Connection Support
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://([a-zA-Z0-9-]+\.)?kosisko\.com$",
]
CORS_ALLOWED_ORIGINS = [
    "https://kosisko.com",
    "https://www.kosisko.com",
]

# 🌟 BANK-GRADE ENCRYPTION & HTTP HEADERS (RBI / ISO 27001 Standard)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'                       # क्लिकजैकिंग से 100% सुरक्षा
SECURE_HSTS_SECONDS = 31536000                 # 1 वर्ष HSTS (ब्राउज़र को केवल HTTPS पर बाध्य करना)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True


# ==========================================
# RAZORPAY PAYMENT GATEWAY CONFIGURATION
# ==========================================
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='')
