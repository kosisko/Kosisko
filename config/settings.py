"""
Django settings for config project.
Kosisko Prime SaaS Architecture Configuration
"""

from pathlib import Path
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-4aq5%q_%ayxyesqop*#3%5t*y=)p*y1eti%(_!%*t4)p1q9u1-'

DEBUG = False

# सब-डोमेन परीक्षण (e.g. tata.localhost) और भविष्य के डोमेन के लिए
ALLOWED_HOSTS = ['kosisko.com', '.kosisko.com', 'localhost', '127.0.0.1', '*']


# Application definition

INSTALLED_APPS = [
    'jazzmin',  # इसे यहाँ सबसे ऊपर जोड़ें
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party Packages
    'channels',         # 👈 WebSockets Streaming Engine
    'rest_framework',
    'corsheaders',      # 👈 Next.js Frontend Connection Support

    # Core SaaS Infrastructure Apps
    'tenants',
    'core',
    'core_platform',    # 👈 Global Master Architecture Engine
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
    'corsheaders.middleware.CorsMiddleware',  # 👈 MUST BE RIGHT AFTER SECURITY MIDDLEWARE
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
        'BACKEND': 'django.template.backends.django.DjangoTemplates',  # 👈 'backends.django.DjangoTemplates'
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
ASGI_APPLICATION = 'config.asgi.application'  # 👈 WebSockets Routing Config


# CORS Setup for Next.js Frontend (Port 3000)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True


# Channel Layer for Zero-Latency WebSockets (In-Memory for Dev)
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
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Default Login URL Redirect
LOGIN_URL = '/admin/login/'
LOGIN_REDIRECT_URL = '/iot/customer/dashboard/'


#EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
#EMAIL_HOST = 'smtp.gmail.com'
#EMAIL_PORT = 587
#EMAIL_USE_TLS = True
#EMAIL_HOST_USER = 'kosisko.com@gmail.com'         # यहाँ अपनी असली जीमेल आईडी डालें
#EMAIL_HOST_PASSWORD = 'mfvysjcubabjkcnj'     # यहाँ वह 16 अंकों का ऐप पासवर्ड डालें (बिना स्पेस के)
#DEFAULT_FROM_EMAIL = 'Kosisko Secure <kosisko.com@gmail.com>'


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

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ==========================================
# AWS MAIL MANAGER SMTP CONFIGURATION
# ==========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'qqbhjcpqapnh.hkph.mail-manager-smtp.amazonaws.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'inp-abf4ke5jozwe5ynkrhctyiab'
EMAIL_HOST_PASSWORD = 'V@arpit132'
DEFAULT_FROM_EMAIL = 'kosiskoventures@gmail.com'



CSRF_TRUSTED_ORIGINS = [
    "https://kosisko.com",
    "https://*.kosisko.com",
]


CORS_ALLOWED_ORIGINS = [
    "https://kosisko.com",
    "https://www.kosisko.com",
]
