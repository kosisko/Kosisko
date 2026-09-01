from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db import transaction
from .models import Product, Invoice, InvoiceItem
import uuid

def pos_counter_view(request):
    """
    POS Counter UI Page - प्रोडक्ट लिस्टिंग और लाइव बिलिंग काउंटर
    """
    tenant = getattr(request, 'tenant', None)
    if not tenant:
        messages.error(request, "सब-डोमेन एक्सेस अनिवार्य है।")
        return redirect('dashboard')

    # केवल इस टैनेंट के प्रोडक्ट्स
    products = Product.objects.filter(tenant=tenant)
    recent_invoices = Invoice.objects.filter(tenant=tenant).order_by('-created_at')[:5]

    context = {
        'products': products,
        'recent_invoices': recent_invoices,
    }
    return render(request, 'pos_billing/counter.html', context)


def create_sample_product(request):
    """
    डेमो/टेस्टिंग के लिए त्वरित सैंपल प्रोडक्ट्स जोड़ने का फ़ंक्शन
    """
    tenant = getattr(request, 'tenant', None)
    if tenant:
        Product.objects.create(tenant=tenant, name="Standard Tea Packet 250g", price=120.00, stock_quantity=50)
        Product.objects.create(tenant=tenant, name="Wireless Mouse", price=450.00, stock_quantity=20)
        messages.success(request, "टेस्ट प्रोडक्ट्स जोड़ दिए गए हैं!")
    return redirect('pos_counter')