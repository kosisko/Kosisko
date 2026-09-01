from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.models import User
from django.db import transaction
from .models import Tenant, TenantBranding
from marketplace.models import BusinessModule, TenantAppSubscription


def register_tenant_view(request):
    """
    Self-Serve Tenant Registration & Subdomain Setup
    """
    if request.method == 'POST':
        company_name = request.POST.get('company_name')
        subdomain = request.POST.get('subdomain', '').lower().strip()
        owner_name = request.POST.get('owner_name')
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Validation: सब-डोमेन यूनिक है या नहीं
        if Tenant.objects.filter(subdomain=subdomain).exists():
            messages.error(request, f"सब-डोमेन '{subdomain}' पहले से किसी अन्य कंपनी द्वारा इस्तेमाल में है। कृपया दूसरा चुनें।")
            return render(request, 'tenants/register.html', request.POST)

        try:
            with transaction.atomic():
                # 1. User Account बनाएं
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=owner_name
                )

                # 2. Tenant बनाएं
                tenant = Tenant.objects.create(
                    name=company_name,
                    subdomain=subdomain,
                    owner=user
                )

                # 3. Default Theme & Branding बनाएं
                TenantBranding.objects.create(tenant=tenant)

                # 4. Default Free Apps ऑटोमैटिक इंस्टॉल करें (उदा. POS Billing)
                free_modules = BusinessModule.objects.filter(is_free=True)
                for module in free_modules:
                    TenantAppSubscription.objects.create(
                        tenant=tenant,
                        module=module,
                        is_active=True
                    )

            messages.success(request, f"🎉 बधाई हो! आपका SaaS पोर्टल सफलतापूर्वक बन गया है।")
            
            # Smart Dynamic Redirect Engine (Localhost & Production обоих के लिए)
            host = request.get_host()  # e.g., '127.0.0.1:8000' or 'kosisko.com'
            if 'localhost' in host or '127.0.0.1' in host:
                target_url = f"http://{subdomain}.localhost:8000/"
            else:
                # लाइव सर्वर (kosisko.com) पर ऑटोमैटिक स्विच होगा
                base_domain = host.split(':')[0].replace('www.', '')
                target_url = f"http://{subdomain}.{base_domain}/"

            return redirect(target_url)

        except Exception as e:
            messages.error(request, f"अकाउंट बनाने में त्रुटि हुई: {str(e)}")

    return render(request, 'tenants/register.html')


def theme_settings_view(request):
    """
    Live Theme & White-Label Customizer
    """
    tenant = getattr(request, 'tenant', None)
    if not tenant:
        messages.error(request, "सब-डोमेन पर ही थीम कस्टमाइज़ की जा सकती है।")
        return redirect('dashboard')

    branding, _ = TenantBranding.objects.get_or_create(tenant=tenant)

    if request.method == 'POST':
        branding.primary_color = request.POST.get('primary_color', '#4F46E5')
        branding.sidebar_bg_color = request.POST.get('sidebar_bg_color', '#1E293B')
        
        if 'custom_logo' in request.FILES:
            branding.custom_logo = request.FILES['custom_logo']
            branding.is_pro_plan = True  # Custom logo enables White-label mode

        branding.save()
        messages.success(request, "🎨 थीम सेटिंग्स सफलतापूर्वक अपडेट हो गई हैं!")
        return redirect('theme_settings')

    return render(request, 'tenants/theme_settings.html', {'branding': branding})