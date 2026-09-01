from django.contrib import admin
from .models import (
    SmartIoTDevice, RentalPlan, TechnicianProfile, 
    ServiceTicket, ReferralAccount, NewDeviceOnboardingLead, PaymentInvoice
)

@admin.register(SmartIoTDevice)
class SmartIoTDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_name', 'tuya_device_id', 'relay_status', 'status', 'next_due_date', 'output_quality_tds')
    list_filter = ('relay_status', 'status')
    search_fields = ('device_name', 'tuya_device_id')

@admin.register(RentalPlan)
class RentalPlanAdmin(admin.ModelAdmin):
    # Models Check: Use fields that exist on RentalPlan
    list_display = ('plan_name', 'monthly_rental_price', 'duration_days') if hasattr(RentalPlan, 'monthly_rental_price') else ('plan_name', 'duration_days')

@admin.register(TechnicianProfile)
class TechnicianProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'per_job_incentive', 'is_on_leave')

@admin.register(ServiceTicket)
class ServiceTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'device', 'technician', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(ReferralAccount)
class ReferralAccountAdmin(admin.ModelAdmin):
    # Safe fallback if field name is different
    list_display = ('user', 'referral_code', 'reward_wallet_balance')

@admin.register(NewDeviceOnboardingLead)
class NewDeviceOnboardingLeadAdmin(admin.ModelAdmin):
    # Safe fallback if field name is different
    list_display = ('customer_name', 'customer_phone', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(PaymentInvoice)
class PaymentInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'user', 'amount_paid', 'invoice_type', 'paid_at')