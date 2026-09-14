from django.http import Http404
from tenants.models import Tenant  # 👈 केवल 'tenants' ऐप के Tenant मॉडल का उपयोग करें

class GlobalTenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]
        parts = host.split('.')
        
        request.tenant = None
        request.is_god_mode = False

        # 1. Check Super Admin God-Mode
        if hasattr(request, 'user') and request.user.is_authenticated and request.user.is_superuser:
            request.is_god_mode = True
            impersonate_sub = request.GET.get('impersonate')
            if impersonate_sub:
                try:
                    request.tenant = Tenant.objects.get(subdomain=impersonate_sub)
                except Tenant.DoesNotExist:
                    pass

        # 2. Localhost / 127.0.0.1 Fallback for Development
        if not request.tenant and host in ['127.0.0.1', 'localhost']:
            request.tenant = Tenant.objects.first()

        # 3. Subdomain Resolution (e.g., tata.localhost or client.domain.com)
        if not request.tenant and len(parts) >= 3:
            subdomain = parts[0]
            if subdomain not in ['www', 'admin', 'api']:
                try:
                    request.tenant = Tenant.objects.get(subdomain=subdomain)
                except Tenant.DoesNotExist:
                    raise Http404("Tenant domain not found or inactive.")

        response = self.get_response(request)
        return response
