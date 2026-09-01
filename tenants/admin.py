from django.contrib import admin
from .models import Tenant, TenantBranding

class TenantBrandingInline(admin.StackedInline):
    model = TenantBranding
    extra = 1

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain')
    list_filter = ('is_active',)
    inlines = [TenantBrandingInline]

@admin.register(TenantBranding)
class TenantBrandingAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'sidebar_position', 'primary_color', 'is_pro_plan')