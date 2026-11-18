from core_platform import views_passkey
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/v1/auth/session/revoke', views_passkey.session_revoke),
    path('api/v1/auth/session/self-logout', views_passkey.session_self_logout),
    path('api/v1/auth/passkey/status', views_passkey.passkey_status),
    path('api/v1/auth/passkey/delete', views_passkey.passkey_delete),
    path('admin/', admin.site.urls),
    path('auth/', include('tenants.urls')),      # Onboarding / Registration
    path('apps/', include('marketplace.urls')),
    path('', include('core_platform.urls')),
    path('pos/', include('pos_billing.urls')),
    path('iot/', include('iot_smart_rental.urls', namespace='iot_smart_rental')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
