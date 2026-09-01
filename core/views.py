from django.shortcuts import render
from tenants.models import Tenant
from marketplace.models import BusinessModule, TenantAppSubscription

def dashboard_view(request):
    """
    स्मार्ट डैशबोर्ड - मुख्य डोमेन पर Super Admin Portal दिखाएगा
    और Subdomain पर Tenant Specific Dashboard दिखाएगा।
    """
    tenant = getattr(request, 'tenant', None)

    # 1. Safeguard: अगर tenant स्ट्रिंग है, तो उसे `tenants.models.Tenant` के ऑब्जेक्ट में बदलें
    if isinstance(tenant, str):
        tenant = Tenant.objects.filter(name=tenant).first() or Tenant.objects.first()

    # 2. अगर कोई सब-डोमेन/टैनेंट नहीं है (Super Admin Master View)
    if not tenant:
        total_tenants = Tenant.objects.count()
        total_modules = BusinessModule.objects.count()
        active_subscriptions = TenantAppSubscription.objects.filter(status='ACTIVE').count()
        recent_tenants = Tenant.objects.all().order_by('-created_at')[:5]

        context = {
            'is_master_admin': True,
            'total_tenants': total_tenants,
            'total_modules': total_modules,
            'active_subscriptions': active_subscriptions,
            'recent_tenants': recent_tenants,
        }
        return render(request, 'core/master_dashboard.html', context)

    # 3. अगर सब-डोमेन मौजूद है (Tenant Dashboard View)
    installed_apps = TenantAppSubscription.objects.filter(
        tenant=tenant, 
        status='ACTIVE'
    )

    return render(request, 'core/dashboard.html', {
        'tenant': tenant,
        'installed_apps': installed_apps
    })