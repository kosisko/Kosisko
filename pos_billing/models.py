from django.db import models
from core_platform.models import Tenant, StoreBranch

class Product(models.Model):
    """
    सेंट्रल मास्टर कैटलॉग (Master Products):
    कंपनी (HQ) लेवल पर प्रोडक्ट एक बार दर्ज होगा, और सभी 100 शाखाओं में दिखेगा।
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=255, help_text="प्रोडक्ट का नाम (e.g. Cotton Formal Shirt)")
    category = models.CharField(max_length=100, default="General", db_index=True)
    sku = models.CharField(max_length=100, blank=True, null=True, db_index=True, help_text="Barcode / SKU Code")
    hsn_code = models.CharField(max_length=20, blank=True, null=True, help_text="GST HSN Code (e.g. 6205 for Shirts)")
    
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="खरीद दर")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="विक्री मूल्य (Selling Price / MRP)")
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00, help_text="GST दर (%)")
    
    # ग्लोबल डिफॉल्ट स्टॉक (यदि सिंगल स्टोर हो)
    stock_quantity = models.IntegerField(default=0, help_text="कुल मास्टर स्टॉक")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant', 'sku')

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.tenant.name})"


class BranchInventory(models.Model):
    """
    🌟 100 दुकानों का शाखा-वार स्टॉक (Branch-Wise Stock):
    वही शर्ट 'ब्रांच 01' में 50 पीस हो सकती है और 'ब्रांच 02' में 10 पीस।
    """
    branch = models.ForeignKey(StoreBranch, on_delete=models.CASCADE, related_name="inventories")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="branch_stocks")
    stock = models.IntegerField(default=0, help_text="इस विशेष दुकान में उपलब्ध स्टॉक")
    low_stock_threshold = models.IntegerField(default=5, help_text="कम स्टॉक होने पर अलर्ट")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('branch', 'product')

    def __str__(self):
        return f"{self.branch.name} -> {self.product.name}: {self.stock} pcs"


class Invoice(models.Model):
    """
    GST बिल / इनवॉइस:
    हर बिल अनिवार्य रूप से एक विशिष्ट शाखा (StoreBranch) से जुड़ा होगा।
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="invoices")
    branch = models.ForeignKey(StoreBranch, on_delete=models.CASCADE, related_name="branch_invoices", null=True, blank=True)
    
    invoice_number = models.CharField(max_length=60, unique=True, db_index=True)
    customer_name = models.CharField(max_length=150, default="Walk-in Customer")
    customer_phone = models.CharField(max_length=15, blank=True, null=True, db_index=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    payment_mode = models.CharField(
        max_length=20,
        choices=[('cash', 'नकद (Cash)'), ('upi', 'UPI QR'), ('card', 'Card'), ('credit', 'उधारी (Khata)')],
        default='cash'
    )
    is_synced = models.BooleanField(default=True, help_text="ऑफलाइन POS से सिंक हुआ या नहीं")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        branch_str = self.branch.branch_code if self.branch else "HQ"
        return f"[{branch_str}] #{self.invoice_number} - ₹{self.grand_total}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255, blank=True) # हिस्ट्री के लिए सुरक्षित नाम
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"
