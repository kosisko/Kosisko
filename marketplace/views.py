from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import BusinessModule, TenantAppSubscription, KosiskoApp
from django.http import JsonResponse
from django.utils import timezone


def app_marketplace_view(request):
    """
    App Store UI - जहाँ सभी मॉड्यूल्स दिखेंगे और क्लाइंट उन्हें 'Install/Uninstall' कर सकेगा।
    """
    tenant = getattr(request, 'tenant', None)
    
    # स्टोर के सभी एक्टिव मॉड्यूल्स
    all_modules = BusinessModule.objects.filter(is_active_in_store=True)
    
    # इस टैनेंट के एक्टिव इंस्टॉल ऐप्स की ID लिस्ट (status='ACTIVE' का प्रयोग)
    installed_module_ids = []
    if tenant:
        installed_module_ids = TenantAppSubscription.objects.filter(
            tenant=tenant, status='ACTIVE'
        ).values_list('module_id', flat=True)

    context = {
        'modules': all_modules,
        'installed_module_ids': installed_module_ids,
        'tenant': tenant,
    }
    return render(request, 'marketplace/store.html', context)


def toggle_app_install(request, module_id):
    """
    1-Click Install / Uninstall Engine
    """
    tenant = getattr(request, 'tenant', None)
    if not tenant:
        messages.error(request, "सब-डोमेन या टैनेंट अकाउंट से लॉगिन करना अनिवार्य है।")
        return redirect('marketplace_store')

    module = get_object_or_404(BusinessModule, id=module_id)
    subscription, created = TenantAppSubscription.objects.get_or_create(
        tenant=tenant, module=module,
        defaults={'status': 'ACTIVE'}
    )

    if created:
        subscription.status = 'ACTIVE'
        subscription.save()
        messages.success(request, f"🎉 '{module.name}' ऐप सफलतापूर्वक इंस्टॉल हो गया है!")
    else:
        # अगर पहले से मौजूद है, तो स्टेटस टॉगल (ACTIVE <-> DISABLED) करें
        if subscription.status == 'ACTIVE':
            subscription.status = 'DISABLED'
            status_msg = "डिसेबल"
        else:
            subscription.status = 'ACTIVE'
            status_msg = "इनेबल"
        
        subscription.save()
        messages.info(request, f"'{module.name}' ऐप {status_msg} कर दिया गया है।")

    return redirect('marketplace_store')


def app_store_home(request):
    """एप स्टोर का मुख्य पेज जहाँ सभी 66+ ऐप्स, प्राइजिंग और डेमो बटन दिखेंगे"""
    apps = KosiskoApp.objects.filter(is_active=True).select_related('category')
    tenant = getattr(request, 'tenant', None)
    
    installed_app_ids = []
    if tenant:
        installed_app_ids = TenantAppSubscription.objects.filter(
            tenant=tenant, status='ACTIVE'
        ).values_list('app__app_id', flat=True)

    return render(request, 'marketplace/store.html', {
        'apps': apps,
        'installed_app_ids': installed_app_ids,
        'tenant': tenant,
    })


def try_app_demo(request, app_id):
    """फ्री इंटरएक्टिव डेमो रूम (Sandbox Demo Engine)"""
    app = get_object_or_404(KosiskoApp, app_id=app_id)
    if not hasattr(app, 'has_demo') or not app.has_demo:
        return JsonResponse({'error': 'इस ऐप का डेमो उपलब्ध नहीं है।'}, status=400)
    
    return render(request, 'marketplace/sandbox_demo.html', {
        'app': app,
        'is_demo_mode': True,
        'dummy_data_notice': 'यह एक फ्री डेमो रूम है। इसमें किया गया कोई भी बदलाव आपके असली बिजनेस डेटा को प्रभावित नहीं करेगा।'
    })


def install_app_action(request, app_id):
    """प्री-पेमेंट सत्यापन के बाद ऐप इंस्टॉल/री-इंस्टॉल करने की प्रक्रिया"""
    if request.method == "POST":
        app = get_object_or_404(KosiskoApp, app_id=app_id)
        tenant = getattr(request, 'tenant', None)
        
        if not tenant:
            return JsonResponse({'error': 'कोई टैनेंट अकाउंट नहीं मिला!'}, status=400)
            
        subscription, created = TenantAppSubscription.objects.get_or_create(
            tenant=tenant, app=app,
            defaults={
                'expiry_date': timezone.now() + timezone.timedelta(days=30),
                'status': 'ACTIVE'
            }
        )
        
        if not created:
            if hasattr(subscription, 'reinstall_app'):
                success, message = subscription.reinstall_app()
                return JsonResponse({'success': success, 'message': message})
            else:
                subscription.status = 'ACTIVE'
                subscription.save()
                return JsonResponse({'success': True, 'message': f'{app.title} री-इंस्टॉल/सक्रिय कर दिया गया है!'})
        
        return JsonResponse({'success': True, 'message': f'{app.title} सफलतापूर्वक इंस्टॉल हो गया!'})