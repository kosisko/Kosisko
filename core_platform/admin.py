from django.contrib import admin
from .models import Tenant, AppStoreModule, TenantSubscription, AgenticAIActionLog

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'custom_domain', 'is_paid', 'is_active', 'created_at')
    search_fields = ('name', 'subdomain', 'custom_domain')
    list_filter = ('is_paid', 'is_active', 'is_suspended', 'has_whitelabel_subscription')

@admin.register(AppStoreModule)
class AppStoreModuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'module_code', 'category', 'is_core')
    search_fields = ('name', 'module_code')

@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'module', 'is_unlocked', 'expires_at')
    list_filter = ('is_unlocked',)

@admin.register(AgenticAIActionLog)
class AgenticAIActionLogAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'ai_agent_name', 'target_module', 'action_type', 'confidence_score', 'timestamp')
    list_filter = ('target_module', 'action_type')
