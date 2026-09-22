from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
import secrets


class Tenant(models.Model):
    """
    Kosisko Enterprise SaaS - Master Unified Tenant Model
    Handles Subdomains, Custom Domains, Subscriptions, White-Labeling,
    Security, API Keys, and Resource Quotas in a Single Source of Truth.
    """

    # 1. 🌐 कोर पहचान और डोमेन प्रबंधन (Core Identity & Domains)
    name = models.CharField(max_length=255, help_text="कंपनी / बिजनेस का नाम")
    subdomain = models.CharField(max_length=100, unique=True, db_index=True, help_text="यूनिक सबडोमेन slug (उदा. tata)")
    custom_domain = models.CharField(
        max_length=255, unique=True, db_index=True, null=True, blank=True,
        help_text="कस्टम डोमेन (उदा. portal.clientdomain.com)"
    )
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="owned_tenants")

    # 2. 💳 सब्सक्रिप्शन, पेमेंट और लाइफसाइकिल (Billing, Trial & Lifecycle)
    is_active = models.BooleanField(default=True, db_index=True)
    is_paid = models.BooleanField(default=False, db_index=True, help_text="जब तक पेमेंट सफल नहीं होगी, यह False रहेगा")
    is_suspended = models.BooleanField(default=False, help_text="पेमेंट फेल होने पर ऑटो-सस्पेंशन")
    trial_ends_at = models.DateTimeField(null=True, blank=True, help_text="फ्री ट्रायल समाप्ति तिथि")
    subscription_expires_at = models.DateTimeField(null=True, blank=True, help_text="अगला रिन्यूअल या एक्सपायरी डेट")

    # 3. 📊 रिसोर्स कोटा और लिमिट्स (Resource Quotas & Limits)
    max_users = models.IntegerField(default=5, help_text="इस टेनेंट के लिए अधिकतम स्टाफ/यूजर लिमिट")
    storage_limit_gb = models.FloatField(default=10.0, help_text="डेटा और फाइल स्टोरेज लिमिट (GB में)")

    # 4. 🔒 डोमेन वेरिफिकेशन और SSL स्टेटस (Domain Verification & SSL)
    is_custom_domain_verified = models.BooleanField(default=False, help_text="DNS CNAME रिकॉर्ड वेरीफाई हुआ या नहीं")
    ssl_status = models.CharField(max_length=50, default='pending', help_text="SSL सर्टिफिकेट स्टेटस (pending/active)")

    # 5. 🎨 डायनेमिक व्हाइट-लेबलिंग और ब्रांडिंग सुइट (White-Labeling & Branding Engine)
    has_whitelabel_subscription = models.BooleanField(default=False, db_index=True)
    custom_company_name = models.CharField(max_length=255, null=True, blank=True)
    custom_brand_name = models.CharField(max_length=100, null=True, blank=True)
    custom_tagline = models.CharField(max_length=255, null=True, blank=True)
    custom_logo = models.ImageField(upload_to='whitelabel_logos/', null=True, blank=True)
    custom_favicon = models.ImageField(upload_to='whitelabel_favicons/', null=True, blank=True)

    # यूज़र इंटरफ़ेस डायनेमिक कलर्स (UI Theme Customization)
    primary_color = models.CharField(max_length=7, default='#4F46E5', help_text="प्राइमरी थीम कलर कोड")
    sidebar_bg_color = models.CharField(max_length=7, default='#1E293B', help_text="डैशबोर्ड साइडबार बैकग्राउंड कलर")
    sidebar_position = models.CharField(
        max_length=10,
        choices=[('left', 'Left Sidebar'), ('right', 'Right Sidebar'), ('top', 'Top Navbar')],
        default='left'
    )

    # 6. 🛡️ एंटरप्राइज़ सिक्योरिटी और एपीआई (Enterprise Security & API Gateway)
    allowed_ips = models.TextField(null=True, blank=True, help_text="सुरक्षा के लिए आईपी व्हाइटलिस्टिंग (कॉमा सेपरेटेड)")
    api_key = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="टेनेंट-वाइज यूनिक एपीआई की")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def save(self, *args, **kwargs):
        # ऑटोमैटिक यूनीक API Key जनरेट करना
        if not self.api_key:
            self.api_key = secrets.token_hex(32)
        super().save(*args, **kwargs)

    def __str__(self):
        domain_info = self.custom_domain or f"{self.subdomain}.kosisko.com"
        return f"{self.name} ({domain_info})"

    def get_branding_details(self):
        """
        यह मेथड फ्रंटएंड (Next.js) को डायनेमिक ब्रांडिंग डेटा प्रदान करेगा।
        अगर व्हाइट-लेबल एक्टिव और पेड है, तो क्लाइंट का ब्रांड दिखेगा,
        वरना KOSISKO की मास्टर ब्रांडिंग लोड होगी।
        """
        if self.has_whitelabel_subscription and self.is_paid:
            return {
                "company_name": self.custom_company_name or self.name,
                "brand_name": self.custom_brand_name or self.name,
                "tagline": self.custom_tagline or "Enterprise Cloud Workspace",
                "logo_url": self.custom_logo.url if self.custom_logo else "/Logo.jpg",
                "favicon_url": self.custom_favicon.url if self.custom_favicon else "/favicon.ico",
                "primary_color": self.primary_color,
                "sidebar_bg_color": self.sidebar_bg_color,
                "sidebar_position": self.sidebar_position,
                "is_whitelabel": True
            }

        # डिफ़ॉल्ट मास्टर ब्रांडिंग (KOSISKO)
        return {
            "company_name": "Cosisko Ventures Private Limited",
            "brand_name": "KOSISKO",
            "tagline": "कोशिश से कामयाबी की ओर",
            "logo_url": "/Logo.jpg",
            "favicon_url": "/favicon.ico",
            "primary_color": "#4F46E5",
            "sidebar_bg_color": "#1E293B",
            "sidebar_position": "left",
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
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='core_subscriptions')
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
