from django.urls import path
from . import views

app_name = 'iot_smart_rental'

urlpatterns = [
    # Telemetry Ping & Public Signup
    path('api/telemetry-ping/<str:device_id>/', views.api_simulate_telemetry_ping, name='api_simulate_telemetry_ping'),
    path('signup/onboard/', views.public_onboarding_signup_view, name='public_onboard_signup'),

    # =====================================================================
    # 1. CUSTOMER PORTAL & PAYMENT GATEWAY ROUTING URLS
    # =====================================================================
    path('customer/dashboard/', views.customer_dashboard_view, name='customer_dashboard'),
    
    # Updated Recharge Payment Endpoints
    path('customer/recharge/initiate/<int:device_id>/', views.initiate_recharge_payment_view, name='initiate_recharge_payment'),
    path('customer/recharge/verify/<int:device_id>/', views.verify_payment_and_activate_device_view, name='verify_payment_and_activate'),
    
    path('customer/invoice/<int:invoice_id>/', views.download_invoice_view, name='download_invoice'),
    path('customer/raise-ticket/<int:device_id>/', views.raise_service_ticket_view, name='raise_service_ticket'),
    path('customer/rate-service/<int:ticket_id>/', views.rate_technician_service_view, name='rate_technician_service'),

    # =====================================================================
    # 2. TECHNICIAN MOBILE PORTAL URLS
    # =====================================================================
    path('technician/dashboard/', views.technician_dashboard_view, name='technician_dashboard'),
    path('technician/update-job/<int:ticket_id>/', views.update_job_status_view, name='update_job_status'),

    # =====================================================================
    # 3. ADMIN FIELD-FORCE, KYC DESK & CONTROL PANEL URLS
    # =====================================================================
    path('admin/control-panel/', views.admin_iot_control_panel_view, name='admin_control_panel'),
    path('admin/toggle-relay/<int:device_id>/', views.admin_toggle_device_relay, name='admin_toggle_relay'),
    path('admin/kyc-desk/', views.admin_kyc_verification_desk_view, name='admin_kyc_desk'),
    path('admin/kyc-update/<int:lead_id>/', views.admin_update_kyc_status_view, name='admin_kyc_update'),
]