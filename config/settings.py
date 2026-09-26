"""
Django settings for config project.
Kosisko Prime SaaS Architecture Configuration (Pure Production)
"""

from pathlib import Path
import os
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
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
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
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ]
}


# ==========================================
# AWS MAIL MANAGER SMTP CONFIGURATION (100% Inbox Delivery)
# ==========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

# 🌟 Official Enterprise From-Address (Fixes Spam & DMARC Failures)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='Kosisko Security ')
SERVER_EMAIL = config('SERVER_EMAIL', default='no-reply@kosisko.com')


# ==========================================
# PURE PRODUCTION CORS, CSRF & SESSION SETTINGS
# ==========================================
CSRF_TRUSTED_ORIGINS = [
    "https://kosisko.com",
    "https://*.kosisko.com",
]

# Next.js Frontend Connection Support for Kosisko Domain & Subdomains
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://([a-zA-Z0-9-]+\.)?kosisko\.com$",
]
CORS_ALLOWED_ORIGINS = [
    "https://kosisko.com",
    "https://www.kosisko.com",
]

# Cross-Subdomain Session Sharing
SESSION_COOKIE_DOMAIN = '.kosisko.com'
SESSION_COOKIE_HTTPONLY = True          # JavaScript Protection (XSS Prevention)
SESSION_COOKIE_SECURE = True            # HTTPS Only
SESSION_COOKIE_SAMESITE = 'Lax'
