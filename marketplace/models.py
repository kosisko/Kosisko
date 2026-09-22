from django.db import models
from tenants.models import Tenant
from django.utils import timezone
import datetime

class AppCategory(models.Model):
    """ऐप स्टोर की कैटेगरी (e.g., Sales & POS, IoT & Hardware, AI & Automation)"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon_class = models.CharField(max_length=50, default="fa-cubes")

    def __str__(self):
        return self.name


class BusinessModule(models.Model):
    """पुराना बिजनेस मॉड्यूल रजिस्टर (Backward Compatibility के लिए)"""
    CATEGORY_CHOICES = [
        ('core', 'Core / Default'),
        ('sales', 'Sales & POS'),
        ('inventory', 'Inventory & Warehouse'),
        ('crm', 'CRM & Marketing'),
        ('finance', 'Finance & Accounting'),
        ('hr', 'HR & Payroll'),
        ('ai', 'AI & Automation'),
    ]

    slug = models.SlugField(unique=True, help_text="मॉड्यूल कोड (उदा. pos_billing, crm_sales)")
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='sales')
    short_description = models.CharField(max_length=255)
    icon_class = models.CharField(max_length=50, default='fa-boxes-stacked')
    
    is_free = models.BooleanField(default=False)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    is_active_in_store = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({'FREE' if self.is_free else f'₹{self.monthly_price}/mo'})"


class KosiskoApp(models.Model):
    """मास्टर ऐप स्टोर कैटलॉग (सभी 66+ ऐप्स)"""
    app_id = models.CharField(max_length=100, unique=True)  # e.g., 'praan_jal_iot', 'rcm_ai_poster'
    title = models.CharField(max_length=150)
    tagline = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.ImageField(upload_to="app_icons/", blank=True, null=True)
    category = models.ForeignKey(AppCategory, on_delete=models.CASCADE, related_name="apps")
    
    # Demo Sandbox Settings
    has_demo = models.BooleanField(default=True)
    demo_sandbox_url = models.URLField(blank=True, null=True, help_text="सुरक्षित डमी डेमो रूम का लिंक")

    # Base Pricing Settings (₹1, ₹9, ₹49, ₹99 आदि)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    is_system_app = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.app_id})"


class TenantAppSubscription(models.Model):
    """टैनेंट का ऐप इंस्टॉलेशन, लाइसेंसिंग, और Prorated Validity Tracker"""
    STATUS_CHOICES = (
        ('ACTIVE', 'Active & Installed'),
        ('PAUSED_UNINSTALLED', 'Uninstalled (Prorated Balance Saved)'),
        ('EXPIRED_ARCHIVE', 'Expired (Read-Only Data Archive)'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="app_subscriptions")
    app = models.ForeignKey(KosiskoApp, on_delete=models.CASCADE, null=True, blank=True)
    module = models.ForeignKey(BusinessModule, on_delete=models.CASCADE, null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Prorated Days & Payment Tracking
    purchased_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    remaining_active_days = models.IntegerField(default=30)  # बचे हुए दिन
    last_uninstalled_at = models.DateTimeField(null=True, blank=True)

    # Data Persistence Mode (डेटा कभी नष्ट नहीं होगा)
    data_archive_mode = models.BooleanField(default=False, help_text="True होने पर डेटा Read-Only रहेगा, मिटेगा नहीं")

    class Meta:
        unique_together = ('tenant', 'app')

    def uninstall_app(self):
        """ऐप अनइंस्टॉल लॉजिक: बचे हुए दिनों को सेव करेगा और स्टेट PAUSED रखेगा"""
        if self.status == 'ACTIVE':
            now = timezone.now()
            if self.expiry_date and self.expiry_date > now:
                remaining_seconds = (self.expiry_date - now).total_seconds()
                self.remaining_active_days = max(0, int(remaining_seconds // 86400))
            else:
                self.remaining_active_days = 0
                
            self.status = 'PAUSED_UNINSTALLED'
            self.last_uninstalled_at = now
            self.save()

    def reinstall_app(self):
        """दोबारा इंस्टॉल करने पर: अगर बचे हुए दिन हैं तो बिना पैसे लिए पुनः एक्टिवेट करेगा"""
        now = timezone.now()
        if self.remaining_active_days > 0:
            self.expiry_date = now + datetime.timedelta(days=self.remaining_active_days)
            self.status = 'ACTIVE'
            self.save()
            return True, "सफलतापूर्वक पुनः इंस्टॉल किया गया! कोई अतिरिक्त शुल्क नहीं लिया गया।"
        else:
            self.status = 'EXPIRED_ARCHIVE'
            self.data_archive_mode = True
            self.save()
            return False, "लाइसेंस की अवधि समाप्त हो चुकी है। कृपया प्लान रिन्यू करें।"

    def __str__(self):
        app_name = self.app.title if self.app else (self.module.name if self.module else "App")
        return f"{self.tenant.name} - {app_name} ({self.status})"
