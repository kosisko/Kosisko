from django.contrib import admin
from .models import TenantEmailSecurity

@admin.register(TenantEmailSecurity)
class TenantEmailSecurityAdmin(admin.ModelAdmin):
    list_display = ('tenant_name', 'domain', 'created_at')
    search_fields = ('tenant_name', 'domain')
