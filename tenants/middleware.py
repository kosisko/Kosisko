from .models import Tenant

class TenantMiddleware:
    """
    यह Middleware HTTP Request के Host URL (उदा. tata.localhost) से सब-डोमेन 
    एक्सट्रैक्ट करके सही Tenant को request.tenant में अटैच करता है।
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # पोर्ट नंबर (उदा. :8000) हटाएं
        parts = host.split('.')
        request.tenant = None

        # अगर सब-डोमेन मौजूद है (जैसे tata.localhost या tata.kosisko.com)
        if len(parts) > 1 and parts[0] not in ['www', 'localhost', '127']:
            subdomain = parts[0]
            try:
                request.tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                request.tenant = None

        response = self.get_response(request)
        return response