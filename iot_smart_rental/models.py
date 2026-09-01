from django.db import models
from tenants.models import Tenant
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

# ---------------------------------------------------------
# 1. DYNAMIC RENTAL PLAN BUILDER (Monthly, Yearly, Per-Day)
# ---------------------------------------------------------
class RentalPlan(models.Model):
    """टैनेंट/एडमिन द्वारा कस्टमाइज़ किए जाने वाले रेंटल प्लान्स"""
    PLAN_TYPE_CHOICES = (
        ('MONTHLY', 'Monthly Subscription'),
        ('YEARLY', 'Yearly Plan'),
        ('PER_DAY', 'Per-Day Micro Billing (e.g. ₹9.99/day)'),
        ('CUSTOM', 'Custom Duration Plan'),
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="rental_plans")
    plan_name = models.CharField(max_length=100)  # e.g., "30-Month Freedom Plan"
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES, default='MONTHLY')
    
    duration_days = models.IntegerField(default=30, help_text="प्लान की कुल अवधि (दिनों में)")
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=9.99)
    total_plan_price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.plan_name} (₹{self.total_plan_price})"


# ---------------------------------------------------------
# 2. UNIVERSAL IOT DEVICE & TELEMETRY MODEL
# ---------------------------------------------------------
class SmartIoTDevice(models.Model):
    """किसी भी स्मार्ट डिवाइस (RO, AC, Solar Relay) का मास्टर मॉडल"""
    STATUS_CHOICES = (
        ('ACTIVE', 'Active & Operational'),
        ('CUTOFF', 'Cutoff (Relay OFF - Recharge Due)'),
        ('MAINTENANCE', 'Maintenance Required'),
        ('OFFLINE', 'Device Offline / Wi-Fi Disconnected'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="smart_devices")
    customer_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="my_devices")
    
    # Device Identification
    device_name = models.CharField(max_length=100, help_text="e.g. Device-INDORE-001")
    model_number = models.CharField(max_length=100, default="Smart-IoT-V2")
    tuya_device_id = models.CharField(max_length=128, unique=True, help_text="Tuya IoT Smart Relay ID")
    installation_date = models.DateField(default=timezone.now)
    
    # Live GPS Coordinates of Device Location
    installation_latitude = models.FloatField(null=True, blank=True)
    installation_longitude = models.FloatField(null=True, blank=True)
    
    # Hardware Telemetry Data
    relay_status = models.BooleanField(default=True, help_text="True = Power ON, False = Cutoff")
    input_quality_tds = models.IntegerField(default=350, help_text="Raw Water TDS / Voltage")
    output_quality_tds = models.IntegerField(default=45, help_text="Filtered Output TDS / Output Status")
    
    # Filter/Part Health Percentages (0 to 100%)
    primary_filter_life = models.IntegerField(default=100)
    secondary_filter_life = models.IntegerField(default=100)
    core_membrane_life = models.IntegerField(default=100)
    total_output_units = models.FloatField(default=0.0, help_text="Total Liters/Units Consumed")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    # Current Active Plan & Balance Adjustment
    current_plan = models.ForeignKey(RentalPlan, on_delete=models.SET_NULL, null=True, blank=True)
    next_due_date = models.DateField()
    prorated_credit_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    last_ping_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.device_name} ({self.status})"


# ---------------------------------------------------------
# 3. TECHNICIAN PROFILE & GEO-LOCATION ENGINE
# ---------------------------------------------------------
class TechnicianProfile(models.Model):
    """फील्ड टेक्नीशियन प्रोफाइल, लोकेशन, वेतन और इंसेंटिव लेजर"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="technicians")
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="technician_profile")
    
    phone_number = models.CharField(max_length=15)
    photo = models.ImageField(upload_to="technicians/photos/", blank=True, null=True)
    address = models.TextField()
    
    # Active Duty & GPS Tracking
    is_active = models.BooleanField(default=True)
    is_on_leave = models.BooleanField(default=False, help_text="छुट्टी पर होने पर नज़दीकी टेक्नीशियन को ऑटो-असाइन होगा")
    current_latitude = models.FloatField(null=True, blank=True)
    current_longitude = models.FloatField(null=True, blank=True)
    
    # Salary, Incentives & Performance
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=15000.00)
    per_job_incentive = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    referral_commission_rate = models.DecimalField(max_digits=10, decimal_places=2, default=200.00, help_text="प्रति सफल रेफरल बोनस")
    average_rating = models.FloatField(default=5.0)
    
    assigned_devices = models.ManyToManyField(SmartIoTDevice, blank=True, related_name="assigned_technicians")

    def __str__(self):
        return f"Technician: {self.user.get_full_name()} ({self.phone_number})"


# ---------------------------------------------------------
# 4. SERVICE TICKET & FIELD DISPATCH SYSTEM
# ---------------------------------------------------------
class ServiceTicket(models.Model):
    """सर्विस टिकट, रिपेयर असाइनमेंट और रेटिंग सिस्टम"""
    TICKET_STATUS = (
        ('OPEN', 'Service Request Raised'),
        ('ASSIGNED', 'Technician Assigned'),
        ('IN_PROGRESS', 'Technician En Route'),
        ('COMPLETED', 'Job Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="service_tickets")
    device = models.ForeignKey(SmartIoTDevice, on_delete=models.CASCADE, related_name="service_tickets")
    technician = models.ForeignKey(TechnicianProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs")
    
    issue_description = models.TextField()
    status = models.CharField(max_length=20, choices=TICKET_STATUS, default='OPEN')
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Customer Rating & Feedback
    customer_rating = models.IntegerField(null=True, blank=True, help_text="1 to 5 Star Rating")
    customer_feedback = models.TextField(null=True, blank=True)
    incentive_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Ticket #{self.id} - {self.device.device_name} ({self.status})"


# ---------------------------------------------------------
# 5. REFERRAL ENGINE (CUSTOMER & TECHNICIAN VIRAL GROWTH)
# ---------------------------------------------------------
class ReferralAccount(models.Model):
    """व्हाट्सएप रेफरल लिंक और रिवॉर्ड वॉलेट इंजन"""
    USER_TYPE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('TECHNICIAN', 'Technician'),
    )
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="referrals")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="my_referral_account")
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='CUSTOMER')
    
    referral_code = models.CharField(max_length=30, unique=True, default=uuid.uuid4)
    total_successful_refers = models.IntegerField(default=0)
    reward_wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def generate_whatsapp_link(self, domain_name="kosisko.com"):
        return f"https://{domain_name}/onboard/?ref={self.referral_code}"

    def __str__(self):
        return f"Referral: {self.user.username} (Code: {self.referral_code})"


# ---------------------------------------------------------
# 6. INSTANT ONBOARDING & DELIVERY LIFECYCLE
# ---------------------------------------------------------
class NewDeviceOnboardingLead(models.Model):
    """1-क्लिक रेफरल ऑनबोर्डिंग, पेमेंट और डिलीवरी ट्रैकर"""
    DELIVERY_STATUS = (
        ('PAYMENT_DONE', 'Payment Completed'),
        ('READY_TO_DISPATCH', 'Ready to Dispatch from Warehouse'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery (Technician En Route)'),
        ('INSTALLED', 'Successfully Installed & Active'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    referred_by = models.ForeignKey(ReferralAccount, on_delete=models.SET_NULL, null=True, blank=True)
    
    customer_name = models.CharField(max_length=150)
    customer_phone = models.CharField(max_length=15)
    installation_address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Payments
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=1999.00)
    payment_transaction_id = models.CharField(max_length=100, unique=True)
    
    # Dispatch & Support Supervisor Info
    status = models.CharField(max_length=30, choices=DELIVERY_STATUS, default='PAYMENT_DONE')
    assigned_technician = models.ForeignKey(TechnicianProfile, on_delete=models.SET_NULL, null=True, blank=True)
    supervisor_manager_name = models.CharField(max_length=100, default="Central Customer Support")
    supervisor_manager_phone = models.CharField(max_length=15, default="+91 9876543210")
    
    target_installation_deadline = models.DateTimeField(help_text="24 to 48 hours SLA Timer")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Lead: {self.customer_name} - {self.status}"


class PaymentInvoice(models.Model):
    INVOICE_TYPE_CHOICES = (
        ('ONBOARDING', 'New Machine Booking Deposit'),
        ('RECHARGE', 'Monthly Subscription Recharge'),
    )

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    device = models.ForeignKey(SmartIoTDevice, on_delete=models.SET_NULL, null=True, blank=True)
    
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPE_CHOICES, default='RECHARGE')
    amount_paid = models.DecimalField(max_length=10, decimal_places=2, max_digits=10)
    tax_amount = models.DecimalField(max_length=10, decimal_places=2, max_digits=10, default=0.00)
    
    payment_mode = models.CharField(max_length=30, default='UPI / Online')
    transaction_id = models.CharField(max_length=100, unique=True)
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.username} - ₹{self.amount_paid}"        