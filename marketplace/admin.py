from django.contrib import admin
from .models import AppCategory, BusinessModule, KosiskoApp, TenantAppSubscription

@admin.register(AppCategory)
class AppCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon_class')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BusinessModule)
class BusinessModuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'monthly_price', 'is_free', 'is_active_in_store')
    list_filter = ('category', 'is_free', 'is_active_in_store')
    search_fields = ('name', 'slug')


@admin.register(KosiskoApp)
class KosiskoAppAdmin(admin.ModelAdmin):
    list_display = ('title', 'app_id', 'category', 'monthly_price', 'has_demo', 'is_active')
    list_filter = ('category', 'has_demo', 'is_active', 'is_system_app')
    search_fields = ('title', 'app_id', 'description')


@admin.register(TenantAppSubscription)
class TenantAppSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'get_app_name', 'status', 'remaining_active_days', 'purchased_at', 'expiry_date', 'data_archive_mode')
    list_filter = ('status', 'data_archive_mode', 'purchased_at')
    search_fields = ('tenant__name', 'app__title', 'module__name')

    def get_app_name(self, obj):
        if obj.app:
            return obj.app.title
        elif obj.module:
            return obj.module.name
        return "N/A"
    get_app_name.short_description = 'App / Module'