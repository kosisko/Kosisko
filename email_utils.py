from django.core.mail import send_mail
from django.conf import settings
from cryptography.hazmat.primitives import serialization
from tenants.models import TenantEmailSecurity
from crypto_utils import EmailSigner

def send_secure_tenant_email(tenant_name: str, subject: str, message: str, recipient_list: list):
    """
    किसी टेनेंट (जैसे ratan-enterprises) की 384-बिट प्राइवेट की से मैसेज को साइन करके 
    AWS SES (Django SMTP) के जरिए सुरक्षित ईमेल भेजता है।
    """
    try:
        # 1. डेटाबेस से टेनेंट की सिक्योरिटी और कीज प्राप्त करें
        tenant_sec = TenantEmailSecurity.objects.get(tenant_name=tenant_name)
    except TenantEmailSecurity.DoesNotExist:
        raise ValueError(f"Tenant '{tenant_name}' के लिए कोई ईमेल सिक्योरिटी कीज नहीं मिलीं!")

    # 2. PEM से प्राइवेट की लोड करें
    private_key = serialization.load_pem_private_key(
        tenant_sec.private_key_pem.encode('utf-8'),
        password=None
    )

    # 3. 384-बिट (secp384r1 & SHA-384) डिजिटल सिग्नेचर जनरेट करें
    digital_signature = EmailSigner.sign_message(private_key, message)

    # 4. ईमेल की बॉडी में या हेडर में डिजिटल सिग्नेचर जोड़ें ताकि रिसीवर वेरीफाई कर सके
    secure_message = (
        f"{message}\n\n"
        f"--------------------------------------------------\n"
        f"[BANK-GRADE 384-BIT SECURE DIGITAL SIGNATURE]\n"
        f"Tenant: {tenant_name}\n"
        f"Signature: {digital_signature}\n"
        f"--------------------------------------------------"
    )

    # 5. AWS SES (Django SMTP) के जरिए मेल भेजें
    send_mail(
        subject=f"[{tenant_name.upper()} SECURE] {subject}",
        message=secure_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )
    
    print(f"सफलता: {tenant_name} की तरफ से 384-बिट साइन किया हुआ ईमेल {recipient_list} पर भेज दिया गया है!")
