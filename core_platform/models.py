from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Tenant(models.Model):
    """
    Global Enterprise Tenant (Single Source of Truth).
    Handles company details, subdomains, module subscriptions, 
    and complete White-Labeling (Logo, Custom Name, Branding).
    """
    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # 🌟 डायनेमिक व्हाइट-लेबलिंग (White-Label Branding Suite)
    # जब यूजर व्हाइट-लेबल सब्सक्रिप्शन लेगा, तो वह इनमें अपनी वैल्यूज सेव कर सकता है
    has_whitelabel_subscription = models.BooleanField(default=False, db_index=True)
    custom_company_name = models.CharField(max_length=255, blank=True, null=True)
    custom_brand_name = models.CharField(max_length=100, blank=True, null=True)
    custom_tagline = models.CharField(max_length=255, blank=True, null=True)
    custom_logo = models.ImageField(upload_to='whitelabel_logos/', blank=True, null=True)
    custom_favicon = models.ImageField(upload_to='whitelabel_favicons/', blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    def get_branding_details(self):
        """
        यह मेथड फ्रंटएंड (Next.js) को डायनेमिक ब्रांडिंग डेटा देगा।
        अगर व्हाइट-लेबल एक्टिव है, तो यूजर का कस्टम ब्रांड दिखेगा, 
        वरना डिफ़ॉल्ट KOSISKO ब्रांडिंग दिखेगी।
        """
        if self.has_whitelabel_subscription:
            return {
                "company_name": self.custom_company_name or self.name,
                "brand_name": self.custom_brand_name or self.name,
                "tagline": self.custom_tagline or "Enterprise Cloud Workspace",
                "logo_url": self.custom_logo.url if self.custom_logo else "/Logo.jpg",
                "favicon_url": self.custom_favicon.url if self.custom_favicon else "/favicon.ico",
                "is_whitelabel": True
            }
        
        # डिफ़ॉल्ट मास्टर ब्रांडिंग (KOSISKO)
        return {
            "company_name": "Cosisko Ventures Private Limited",
            "brand_name": "KOSISKO",
            "tagline": "कोशिश से कामयाबी की ओर",
            "logo_url": "/Logo.jpg",
            "favicon_url": "/favicon.ico",
            "is_whitelabel": False
        }


class AppStoreModule(models.Model):
    """Global Registry for all SaaS Modules across the entire software"""
    module_code = models.CharField(max_length=50, unique=True, db_index=True) # e.g. 'pos', 'crm'
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='General', db_index=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=100, default='bi-box')
    is_core = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} [{self.category}] ({self.module_code})"


class TenantSubscription(models.Model):
    """Tracks module access and billing cycles for every tenant globally"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='subscriptions')
    module = models.ForeignKey(AppStoreModule, on_delete=models.CASCADE)
    is_unlocked = models.BooleanField(default=True, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        unique_together = ('tenant', 'module')
        indexes = [
            models.Index(fields=['tenant', 'is_unlocked']),
        ]

    def __str__(self):
        return f"{self.tenant.name} -> {self.module.name}"


class UserProfile(models.Model):
    """
    Unified Enterprise User Profile managing Strict RBAC, 
    Tenant Association, Magic Login, and Security Compliance.
    """
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('tenant_admin', 'Tenant Owner / Admin'),
        ('manager', 'Manager'),
        ('staff_operator', 'Staff / Operator'),
        ('team_member', 'Team Member'),
        ('customer', 'Customer'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer', db_index=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    
    # 🌟 मैजिक लॉगिन टोकन (बिना पासवर्ड ऑटो-लॉगिन के लिए)
    magic_login_token = models.CharField(max_length=255, blank=True, null=True, db_index=True)

    # Contact & Personal Details
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    mobile_number = models.CharField(max_length=15, blank=True, null=True, db_index=True)
    is_mobile_verified = models.BooleanField(default=False)
    is_profile_completed = models.BooleanField(default=False)
    
    # Billing & Compliance Details (GST)
    gst_number = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    business_address = models.TextField(blank=True, null=True)

    def __str__(self):
        tenant_name = self.tenant.name if self.tenant else "No Tenant"
        return f"{self.user.username} ({self.role}) - {tenant_name}"


class TenantCustomPricing(models.Model):
    """Customized pricing per tenant and module set by Super Admin"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='custom_prices')
    module_code = models.CharField(max_length=50, db_index=True)
    custom_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('tenant', 'module_code')

    def __str__(self):
        return f"{self.tenant.name} - {self.module_code}: ₹{self.custom_price}"


class DiscountCoupon(models.Model):
    """Discount Coupons and Promo Codes for App Store Subscriptions"""
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_percent = models.IntegerField(default=0)
    flat_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    valid_until = models.DateTimeField(null=True, blank=True, db_index=True)

    def __str__(self):
        return f"Coupon: {self.code} ({self.discount_percent}% / ₹{self.flat_discount})"


class AgenticAIActionLog(models.Model):
    """Global Autonomous AI Log for auditing decisions across enterprise modules"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='ai_logs')
    ai_agent_name = models.CharField(max_length=100, default="Global Core AI")
    target_module = models.CharField(max_length=100, db_index=True)
    action_type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField(default=dict)
    confidence_score = models.FloatField(default=0.98)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'timestamp']),
        ]

    def __str__(self):
        return f"[{self.ai_agent_name} -> {self.target_module}] {self.action_type}"