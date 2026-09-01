from django.urls import path
from .views import register_tenant_view, theme_settings_view

urlpatterns = [
    path('register/', register_tenant_view, name='register_tenant'),
    path('settings/theme/', theme_settings_view, name='theme_settings'),
]