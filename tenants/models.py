from core_platform.models import Tenant
from django.db import models

class TenantEmailSecurity(models.Model):
    tenant_name = models.CharField(max_length=100, unique=True, help_text="जैसे: ratan-enterprises")
    domain = models.CharField(max_length=100, default="kosisko.com")
    private_key_pem = models.TextField(help_text="PEM format में एन्क्रिप्टेड प्राइवेट की")
    public_key_pem = models.TextField(help_text="PEM format में पब्लिक की")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant_name} ({self.domain})"
