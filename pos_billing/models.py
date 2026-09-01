from django.db import models
from tenants.models import Tenant

class Product(models.Model):
    """टैनेंट-स्पेसिफिक प्रोडक्ट / सामान"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=200, help_text="प्रोडक्ट का नाम")
    sku = models.CharField(max_length=50, blank=True, null=True, help_text="Barcode / SKU Code")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="विक्री मूल्य (Selling Price)")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00, help_text="GST rate (%)")
    stock_quantity = models.IntegerField(default=0, help_text="मौजूदा स्टॉक")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.tenant.name})"


class Invoice(models.Model):
    """GST बिल / इनवॉइस"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invoices")
    invoice_number = models.CharField(max_length=50, unique=True)
    customer_name = models.CharField(max_length=150, default="Walk-in Customer")
    customer_phone = models.CharField(max_length=15, blank=True, null=True)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    payment_mode = models.CharField(
        max_length=20, 
        choices=[('cash', 'Cash'), ('upi', 'UPI QR'), ('card', 'Card')], 
        default='cash'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.tenant.name}"


class InvoiceItem(models.Model):
    """बिल में शामिल आइटम्स"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Item'}"