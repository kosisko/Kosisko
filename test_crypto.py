import os
import sys
from pathlib import Path

# प्रोजेक्ट के रूट फोल्डर (/home/ubuntu/Kosisko) को पाथ में जोड़ें
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# सही सेटिंग्स मॉड्यूल सेट करें
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from tenants.models import TenantEmailSecurity  # यदि आपका ऐप दूसरा है तो उसका नाम दें
from crypto_utils import EmailSigner
from cryptography.hazmat.primitives import serialization

print("--- 384-bit Cryptography & Security Test Started ---")

# 1. की-पेयर जनरेट करें या डेटाबेस से प्राप्त करें
priv_key, pub_key = EmailSigner.generate_key_pair()

priv_pem = priv_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

pub_pem = pub_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode('utf-8')

tenant, created = TenantEmailSecurity.objects.get_or_create(
    tenant_name="ratan-enterprises",
    defaults={
        "domain": "kosisko.com",
        "private_key_pem": priv_pem,
        "public_key_pem": pub_pem
    }
)

# 2. डेटाबेस से की लोड करें
private_key = serialization.load_pem_private_key(
    tenant.private_key_pem.encode('utf-8'),
    password=None
)
public_key = serialization.load_pem_public_key(
    tenant.public_key_pem.encode('utf-8')
)

# 3. टेस्ट मैसेज और साइनिंग (384-bit secp384r1 & SHA-384)
test_message = "यह Ratan Enterprises का बैंक-ग्रेड सिक्योर ईमेल मैसेज है।"
signature = EmailSigner.sign_message(private_key, test_message)
print(f"Generated 384-bit Signature (Snippet): {signature[:50]}...")

# 4. ओरिजिनल मैसेज वेरिफिकेशन
is_valid = EmailSigner.verify_signature(public_key, test_message, signature)
print(f"Original Message Verification Status: {is_valid}")

# 5. छेड़छाड़ (Tampered) मैसेज की जाँच
tampered_message = "यह Ratan Enterprises का बैंक-ग्रेड सिक्योर ईमेल मैसेज है। (हैक्ड)"
is_valid_tampered = EmailSigner.verify_signature(public_key, tampered_message, signature)
print(f"Tampered Message Verification (Should be False): {is_valid_tampered}")

print("--- Test Completed Successfully! ---")
