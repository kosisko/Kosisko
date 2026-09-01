from django.urls import path
from .views import app_marketplace_view, toggle_app_install
from . import views

urlpatterns = [
    path('store/', app_marketplace_view, name='marketplace_store'),
    path('store/toggle/<int:module_id>/', toggle_app_install, name='toggle_app_install'),
    path('', views.app_store_home, name='app_store_home'),
    path('demo/<str:app_id>/', views.try_app_demo, name='try_app_demo'),
    path('install/<str:app_id>/', views.install_app_action, name='install_app_action'),
]