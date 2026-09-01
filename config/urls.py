from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import dashboard_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', dashboard_view, name='dashboard'),
    path('auth/', include('tenants.urls')),      # Onboarding / Registration
    path('apps/', include('marketplace.urls')),
    path('', include('core_platform.urls')),
    path('pos/', include('pos_billing.urls')),
    path('iot/', include('iot_smart_rental.urls', namespace='iot_smart_rental')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)