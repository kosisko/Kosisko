from django.http import Http404
from tenants.models import Tenant

class GlobalTenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # रिक्वेस्ट से होस्ट नाम प्राप्त करें (पोर्ट नंबर हटाकर, e.g. kosisko.com, tata.kosisko.com, या portal.clientdomain.com)
        host = request.get_host().split(':')[0]
        parts = host.split('.')

        request.tenant = None
        request.is_god_mode = False

        # 1. Super Admin God-Mode Impersonation (सुपर एडमिन द्वारा इम्परसोनेशन)
        if hasattr(request, 'user') and request.user.is_authenticated and request.user.is_superuser:
            request.is_god_mode = True
            impersonate_sub = request.GET.get('impersonate')
            if impersonate_sub:
                try:
                    request.tenant = Tenant.objects.get(subdomain=impersonate_sub, is_active=True)
                except Tenant.DoesNotExist:
                    pass

        # 2. Custom Domain Resolution (कस्टम डोमेन पहचानें - e.g. portal.clientdomain.com)
        if not request.tenant:
            # यदि होस्ट मुख्य डोमेन या लोकलहोस्ट नहीं है, तो चेक करें कि क्या यह किसी क्लाइंट का कस्टम डोमेन है
            if host not in ['kosisko.com', 'www.kosisko.com', 'localhost', '127.0.0.1']:
                try:
                    request.tenant = Tenant.objects.get(custom_domain=host, is_active=True)
                except Tenant.DoesNotExist:
                    pass

        # 3. Subdomain Resolution (सबडोमेन पहचानें - e.g. tata.kosisko.com)
        if not request.tenant and len(parts) >= 3 and not parts[0].isdigit():
            subdomain = parts[0]
            # 'www', 'admin', 'api', 'app' जैसे सिस्टम राउट्स को छोड़कर बाकी को टेनेंट मानें
            if subdomain not in ['www', 'admin', 'api', 'app']:
                try:
                    request.tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
                except Tenant.DoesNotExist:
                    raise Http404("Tenant domain not found or inactive.")

        # 4. Main Domain / Master Fallback (मुख्य डोमेन kosisko.com के लिए request.tenant 'None' या मास्टर रहेगा)
        
        response = self.get_response(request)
        return response
