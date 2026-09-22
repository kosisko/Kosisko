from core_platform.models import Tenant

def tenant_context(request):
    """
    Context processor to attach tenant and its branding details to the template context.
    """
    tenant = getattr(request, 'tenant', None)
    if tenant:
        # यदि टेनेंट मौजूद है, तो उसकी डिटेल्स और ब्रांडिंग भेजें
        branding_data = {
            "company_name": tenant.name,
            "brand_name": tenant.subdomain.upper(),
            "tagline": "",
            "logo_url": tenant.custom_logo.url if tenant.custom_logo else "/Logo.png",
            "is_whitelabel": getattr(tenant, 'has_whitelabel_subscription', False),
            "primary_color": getattr(tenant, 'primary_color', '#4F46E5'),
            "sidebar_bg_color": getattr(tenant, 'sidebar_bg_color', '#1E293B'),
        }
        return {
            'current_tenant': tenant,
            'tenant_branding': branding_data
        }
    
    # यदि टेनेंट नहीं है (या मास्टर डोमेन है) तो डिफ़ॉल्ट Kosisko ब्रांडिंग भेजें
    return {
        'current_tenant': None,
        'tenant_branding': {
            "company_name": "Kosisko Ventures Private Limited",
            "brand_name": "KOSISKO",
            "tagline": "कोशिश से कामयाबी की ओर",
            "logo_url": "/Logo.png",
            "is_whitelabel": False,
            "primary_color": '#4F46E5',
            "sidebar_bg_color": '#1E293B',
        }
    }
