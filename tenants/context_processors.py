from .models import TenantBranding
from marketplace.models import TenantAppSubscription

def tenant_context(request):
    """
    पूरे HTML टेम्पलेट्स में टैनेंट, उसकी ब्रांडिंग और उसके एक्टिव ऐप्स 
    को ऑटोमैटिक उपलब्ध कराता है।
    """
    tenant = getattr(request, 'tenant', None)
    branding = None
    installed_app_slugs = []

    if tenant:
        branding, _ = TenantBranding.objects.get_or_create(tenant=tenant)
        
        # इस टैनेंट के एक्टिव ऐप्स की सूची (App Store Permissions)
        # ✅ is_active=ACTIVE की जगह status='ACTIVE' का उपयोग किया गया है
        active_subs = TenantAppSubscription.objects.filter(tenant=tenant, status='ACTIVE')
        
        # नए ऐप्स (app_id) और पुराने मॉड्यूल्स (slug) दोनों का सपोर्ट
        for sub in active_subs:
            if sub.app:
                installed_app_slugs.append(sub.app.app_id)
            elif sub.module:
                installed_app_slugs.append(sub.module.slug)

    return {
        'current_tenant': tenant,
        'branding': branding,
        'installed_apps': installed_app_slugs,
    }