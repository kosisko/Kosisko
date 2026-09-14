from django.db import models
from django.contrib.auth.models import User

class Tenant(models.Model):
    name = models.CharField(max_length=150, help_text="कंपनी / बिजनेस का नाम")
    subdomain = models.CharField(max_length=50, unique=True, db_index=True, help_text="यूनिक सबडोमेन slug (उदा. tata)")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_tenants", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.subdomain})"


class TenantBranding(models.Model):
    SIDEBAR_POSITIONS = [
        ('left', 'Left Sidebar'),
        ('right', 'Right Sidebar'),
        ('top', 'Top Navbar'),
    ]

    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name="branding")
    
    # Dynamic Live CSS Colors
    sidebar_position = models.CharField(max_length=10, choices=SIDEBAR_POSITIONS, default='left')
    primary_color = models.CharField(max_length=7, default='#4F46E5')      # Indigo Accent
    sidebar_bg_color = models.CharField(max_length=7, default='#1E293B')   # Slate Dark
    accent_hover_color = models.CharField(max_length=7, default='#6366F1') # Active Hover
    text_color = models.CharField(max_length=7, default='#F8FAFC')         # Light Text

    # White-Label Engine (PRO Features)
    is_pro_plan = models.BooleanField(default=False)
    custom_company_name = models.CharField(max_length=100, null=True, blank=True)
    custom_logo = models.ImageField(upload_to='branding/logos/', null=True, blank=True)
    custom_favicon = models.ImageField(upload_to='branding/favicons/', null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def display_name(self):
        if self.is_pro_plan and self.custom_company_name:
            return self.custom_company_name
        return self.tenant.name if self.tenant else "Kosisko Prime"

    @property
    def display_logo_url(self):
        if self.is_pro_plan and self.custom_logo:
            return self.custom_logo.url
        return "/static/images/default_logo.png"

    def __str__(self):
        return f"Branding for {self.display_name}"


class TenantEmailSecurity(models.Model):
    tenant_name = models.CharField(max_length=100, unique=True, help_text="जैसे: ratan-enterprises")
    domain = models.CharField(max_length=100, default="kosisko.com")
    private_key_pem = models.TextField(help_text="PEM format में एन्क्रिप्टेड प्राइवेट की")
    public_key_pem = models.TextField(help_text="PEM format में पब्लिक की")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant_name} ({self.domain})"
