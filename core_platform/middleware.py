import logging
from django.http import Http404, JsonResponse, HttpResponseBadRequest
from django.core.cache import cache

# 🌟 सिंगल सोर्स ऑफ ट्रुथ
from core_platform.models import Tenant

logger = logging.getLogger(__name__)

SYSTEM_RESERVED_SUBDOMAINS = {
    'www', 'admin', 'api', 'app', 'master', 'mail',
    'portal', 'dashboard', 'public', 'login', 'signup', 'auth'
}

# Official domains jahan tenant=None hona valid hai (Landing page, Global Admin, Login)
OFFICIAL_DOMAINS = {
    'kosisko.com', 'www.kosisko.com', 'localhost', '127.0.0.1'
}

class GlobalTenantMiddleware:
    """
    🌟 Bank-Grade Multi-Tenant & Host Security Middleware:
    1. Super Admin impersonation support.
    2. *.kosisko.com subdomains resolution & validation.
    3. Custom domains secure DB/Cache validation.
    4. Unknown/unauthorized hosts ko turant block karna.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0].lower()
        parts = host.split('.')

        request.tenant = None
        request.is_god_mode = False

        # 1. Super Admin Impersonation (Support ke liye kisi bhi dukan ko dekhna)
        user = getattr(request, 'user', None)
        if user and user.is_authenticated and user.is_superuser:
            impersonate_sub = request.GET.get('impersonate')
            if impersonate_sub:
                request.is_god_mode = True
                request.tenant = self._get_tenant_by_subdomain(impersonate_sub)

        # 2. Subdomain & Custom Domain Resolution
        if not request.tenant:
            # A. *.kosisko.com Subdomain (e.g. ratan.kosisko.com)
            if host.endswith('kosisko.com') and len(parts) >= 3 and not parts[0].isdigit():
                subdomain = parts[0]
                if subdomain not in SYSTEM_RESERVED_SUBDOMAINS:
                    request.tenant = self._get_tenant_by_subdomain(subdomain)
                    if not request.tenant:
                        return self._handle_tenant_not_found(request)

            # B. Custom Domain (e.g. ratanmart.com / portal.ratankirana.com)
            elif host not in OFFICIAL_DOMAINS:
                request.tenant = self._get_tenant_by_custom_domain(host)
                # 🔒 SECURITY FIX: Agar custom domain DB me active nahi mila to request turant block
                if not request.tenant:
                    return self._handle_tenant_not_found(request)

        return self.get_response(request)

    def _get_tenant_by_subdomain(self, subdomain):
        cache_key = f"tenant_sub_{subdomain.lower()}"
        tenant = cache.get(cache_key)
        if tenant is None:
            try:
                tenant = Tenant.objects.get(subdomain__iexact=subdomain, is_active=True)
                cache.set(cache_key, tenant, timeout=300)  # 5 minute high-speed cache
            except Tenant.DoesNotExist:
                return None
        return tenant

    def _get_tenant_by_custom_domain(self, domain):
        cache_key = f"tenant_custom_{domain.lower()}"
        tenant = cache.get(cache_key)
        if tenant is None:
            try:
                tenant = Tenant.objects.get(custom_domain__iexact=domain, is_active=True)
                cache.set(cache_key, tenant, timeout=300)
            except Tenant.DoesNotExist:
                return None
        return tenant

    def _handle_tenant_not_found(self, request):
        # API calls ke liye clean JSON 404
        if request.path.startswith('/api/'):
            return JsonResponse({
                "status": "error",
                "message": "Tenant workspace not found or has been suspended."
            }, status=404)
        raise Http404("Tenant domain not found or inactive.")
