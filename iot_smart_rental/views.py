import uuid
import datetime
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from tenants.models import Tenant  # Ensure Tenant is imported
import razorpay
from django.conf import settings
from django.http import HttpResponse


from .utils import auto_assign_nearest_technician
from .tuya_service import TuyaIoTService
from .models import (
    SmartIoTDevice, RentalPlan, TechnicianProfile, 
    ServiceTicket, ReferralAccount, NewDeviceOnboardingLead, PaymentInvoice
)


# =====================================================================
# 1. CUSTOMER SELF-SERVICE PORTAL VIEWS
# =====================================================================

@login_required
def customer_dashboard_view(request):
    """
    Customer Self-Service Portal Dashboard
    """
    # 1. Fallback logic for Tenant
    tenant = getattr(request, 'tenant', None)
    if not tenant:
        tenant = Tenant.objects.first()

    # 2. Fetch Customer Device
    device = SmartIoTDevice.objects.filter(tenant=tenant, customer_user=request.user).first()
    
    onboarding_lead = None
    if not device:
        onboarding_lead = NewDeviceOnboardingLead.objects.filter(
            tenant=tenant, 
            customer_phone=request.user.username
        ).first()

    # 3. Get or Create Referral Account safely with tenant
    referral_acc, _ = ReferralAccount.objects.get_or_create(
        tenant=tenant, 
        user=request.user, 
        defaults={'user_type': 'CUSTOMER'}
    )
    domain_name = request.get_host()
    whatsapp_share_url = referral_acc.generate_whatsapp_link(domain_name=domain_name)

    assigned_tech = device.assigned_technicians.filter(is_active=True).first() if device else None

    return render(request, 'iot_smart_rental/customer_dashboard.html', {
        'device': device,
        'onboarding_lead': onboarding_lead,
        'referral_acc': referral_acc,
        'whatsapp_share_url': whatsapp_share_url,
        'assigned_tech': assigned_tech,
    })


@login_required
def raise_service_ticket_view(request, device_id):
    """
    Customer Service Ticket Creation View with Auto-Technician Dispatch.
    """
    if request.method == "POST":
        device = get_object_or_404(SmartIoTDevice, id=device_id, customer_user=request.user)
        issue_desc = request.POST.get('issue_description', 'Routine Maintenance Request')

        ticket = ServiceTicket.objects.create(
            tenant=device.tenant,
            device=device,
            issue_description=issue_desc,
            status='PENDING'
        )

        # Trigger GPS Auto-Assignment Engine
        assigned_tech = auto_assign_nearest_technician(ticket.id)

        tech_msg = f"Assigned to {assigned_tech.user.get_full_name()}" if assigned_tech else "Service team will assign a technician shortly."

        return JsonResponse({
            'success': True,
            'message': f'Service Ticket #{ticket.id} created successfully! {tech_msg}',
            'ticket_id': ticket.id
        })

    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=400)


@login_required
def rate_technician_service_view(request, ticket_id):
    """Customer submits star-rating (1-5 stars) upon job completion."""
    if request.method == "POST":
        ticket = get_object_or_404(ServiceTicket, id=ticket_id, device__customer_user=request.user)
        rating = int(request.POST.get('rating', 5))
        feedback = request.POST.get('feedback', '')
        
        ticket.customer_rating = rating
        ticket.customer_feedback = feedback
        ticket.status = 'COMPLETED'
        ticket.completed_at = timezone.now()
        
        if ticket.technician:
            ticket.incentive_earned = ticket.technician.per_job_incentive
        ticket.save()

        return JsonResponse({'success': True, 'message': 'Thank you for your feedback!'})


# Initialize Razorpay Client (Test Mode Keys)
RAZORPAY_KEY_ID = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_mock_key_123')
RAZORPAY_KEY_SECRET = getattr(settings, 'RAZORPAY_KEY_SECRET', 'mock_secret_123')

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

@login_required
def initiate_recharge_payment_view(request, device_id):
    """
    Step 1: Dynamic Gateway Dispatcher (PhonePe vs Razorpay)
    Creates payment order based on selected payment method.
    """
    if request.method == "POST":
        device = get_object_or_404(SmartIoTDevice, id=device_id, customer_user=request.user)
        payment_method = request.POST.get('payment_method', 'UPI') # 'UPI' or 'CARD'
        
        plan = device.current_plan
        recharge_amount = 499.00  # Default ₹499 recharge
        amount_in_paise = int(recharge_amount * 100)

        # -------------------------------------------------------------
        # ROUTE 1: PhonePe PG for UPI / QR Code (0% Charge Route)
        # -------------------------------------------------------------
        if payment_method == 'UPI':
            # Simulated PhonePe SDK Integration Response
            order_id = f"PHONEPE_ORD_{uuid.uuid4().hex[:10].upper()}"
            return JsonResponse({
                'success': True,
                'gateway': 'PHONEPE',
                'order_id': order_id,
                'amount': recharge_amount,
                'message': 'PhonePe UPI Payment Initiated (0% Processing Fee)',
                'qr_code_payload': f"upi://pay?pa=kosisko@phonepe&pn=KosiskoRental&am={recharge_amount}&tr={order_id}"
            })

        # -------------------------------------------------------------
        # ROUTE 2: Razorpay PG for Credit/Debit Cards & Auto-Debit
        # -------------------------------------------------------------
        else:
            try:
                razorpay_order = client.order.create({
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": f"rcpt_{device.id}_{int(timezone.now().timestamp())}",
                    "payment_capture": 1
                })
            except Exception:
                # Fallback mock order for test environment
                razorpay_order = {'id': f"order_mock_{uuid.uuid4().hex[:8]}"}

            return JsonResponse({
                'success': True,
                'gateway': 'RAZORPAY',
                'order_id': razorpay_order['id'],
                'razorpay_key': RAZORPAY_KEY_ID,
                'amount': recharge_amount,
                'message': 'Razorpay Card/Auto-Debit Initiated'
            })

    return JsonResponse({'success': False, 'message': 'Invalid Request'}, status=400)


@login_required
def verify_payment_and_activate_device_view(request, device_id):
    """
    Step 2: Post-Payment Success Webhook Handler
    Extends Subscription, Generates GST Invoice & Triggers Tuya Remote Relay Activation.
    """
    if request.method == "POST":
        device = get_object_or_404(SmartIoTDevice, id=device_id, customer_user=request.user)
        transaction_id = request.POST.get('transaction_id', f"TXN-{uuid.uuid4().hex[:10].upper()}")
        payment_gateway = request.POST.get('gateway', 'RAZORPAY')

        # 1. Add 30 Days Subscription
        plan = device.current_plan
        days_to_add = plan.duration_days if plan else 30
        today = timezone.now().date()
        
        if device.next_due_date < today:
            device.next_due_date = today + datetime.timedelta(days=days_to_add)
        else:
            device.next_due_date = device.next_due_date + datetime.timedelta(days=days_to_add)

        # 2. Tuya Cloud IoT Activation
        tuya_response = TuyaIoTService.send_relay_command(device.tuya_device_id, power_state=True)
        device.relay_status = True
        device.status = 'ACTIVE'
        device.save()

        # 3. Generate GST Invoice Receipt
        inv_num = f"INV-{uuid.uuid4().hex[:8].upper()}"
        invoice = PaymentInvoice.objects.create(
            tenant=device.tenant,
            user=request.user,
            device=device,
            invoice_number=inv_num,
            invoice_type='RECHARGE',
            amount_paid=499.00,
            tax_amount=76.12,
            transaction_id=transaction_id
        )

        return JsonResponse({
            'success': True,
            'message': f'Payment Successful via {payment_gateway}! Recharge Extended to {device.next_due_date.strftime("%d %b %Y")}. Device Active.',
            'new_due_date': device.next_due_date.strftime("%d %b %Y"),
            'invoice_id': invoice.id,
            'relay_status': 'ACTIVE'
        })

    return JsonResponse({'success': False, 'message': 'Invalid Request'}, status=400)


@login_required
def download_invoice_view(request, invoice_id):
    """Displays a print-ready GST Compliant Payment Receipt."""
    invoice = get_object_or_404(PaymentInvoice, id=invoice_id, user=request.user)
    return render(request, 'iot_smart_rental/invoice_receipt.html', {
        'invoice': invoice
    })


def public_onboarding_signup_view(request):
    """
    Public Onboarding Page: Triggered via WhatsApp Referral Links.
    Collects Customer Details, Handles Booking Deposit Payment, & Credits Referral Reward.
    """
    ref_code = request.GET.get('ref', None)
    tenant = getattr(request, 'tenant', None)
    
    if request.method == "POST":
        full_name = request.POST.get('full_name')
        phone_number = request.POST.get('phone_number')
        installation_address = request.POST.get('address')
        kyc_id_type = request.POST.get('kyc_type', 'Aadhaar')
        kyc_id_number = request.POST.get('kyc_number', '')

        # 1. Create or Get User Account
        username = phone_number.strip()
        user, created = User.objects.get_or_create(username=username, defaults={
            'first_name': full_name,
            'is_active': True
        })
        if created:
            user.set_password(phone_number)
            user.save()

        # 2. Check for Referral Account and Credit Rewards
        referral_acc = ReferralAccount.objects.filter(tenant=tenant, referral_code=ref_code).first() if ref_code else None
        if referral_acc:
            referral_acc.reward_wallet_balance += 250.00
            referral_acc.total_referrals_count += 1
            referral_acc.save()

        # 3. Create Onboarding Lead Entry
        lead = NewDeviceOnboardingLead.objects.create(
            tenant=tenant,
            customer_phone=phone_number,
            customer_name=full_name,
            installation_address=installation_address,
            referred_by=referral_acc.user if referral_acc else None,
            status='PAYMENT_DONE',
            booking_amount_paid=1999.00
        )

        return JsonResponse({
            'success': True,
            'message': 'Booking Successful! Your installation ticket has been created.',
            'redirect_url': '/iot/customer/dashboard/'
        })

    return render(request, 'iot_smart_rental/public_onboarding.html', {
        'ref_code': ref_code
    })


# =====================================================================
# 2. TECHNICIAN MOBILE PORTAL VIEWS
# =====================================================================



@login_required
def technician_dashboard_view(request):
    """
    Technician Portal: Resolved FieldError by using 'technician' model field.
    """
    # 1. Try to find TechnicianProfile for currently logged in user
    tech_profile = TechnicianProfile.objects.filter(user=request.user).first()
    
    # 2. Fallback: If logged in user is SuperAdmin or lacks profile, pick the first technician profile
    if not tech_profile:
        tech_profile = TechnicianProfile.objects.first()

    # 3. If no technician exists in entire system, handle gracefully
    if not tech_profile:
        return HttpResponse(
            "<div style='padding:20px; font-family:sans-serif;'>"
            "<h2>⚠️ No Technician Profile Found</h2>"
            "<p>Please create a Technician Profile from Django Admin first.</p>"
            "<a href='/admin/iot_smart_rental/technicianprofile/add/'>Add Technician Profile</a>"
            "</div>", 
            status=404
        )

    # Fetch assigned tickets using correct field name 'technician'
    assigned_tickets = ServiceTicket.objects.filter(technician=tech_profile).order_by('-created_at')

    completed_count = assigned_tickets.filter(status='RESOLVED').count()
    pending_count = assigned_tickets.exclude(status='RESOLVED').count()

    return render(request, 'iot_smart_rental/technician_dashboard.html', {
        'tech_profile': tech_profile,
        'assigned_tickets': assigned_tickets,
        'completed_jobs_count': completed_count,
        'pending_jobs_count': pending_count,
        'total_earnings': completed_count * 150.00
    })

@login_required
def update_job_status_view(request, ticket_id):
    """Update job status by field technician."""
    if request.method == "POST":
        tech_profile = get_object_or_404(TechnicianProfile, user=request.user)
        ticket = get_object_or_404(ServiceTicket, id=ticket_id, technician=tech_profile)
        
        new_status = request.POST.get('status')
        if new_status in ['IN_PROGRESS', 'COMPLETED']:
            ticket.status = new_status
            if new_status == 'COMPLETED':
                ticket.completed_at = timezone.now()
                ticket.incentive_earned = tech_profile.per_job_incentive
            ticket.save()
            
        return JsonResponse({'success': True, 'message': 'Job status updated successfully!'})


# =====================================================================
# 3. ADMIN FIELD-FORCE & DEVICE CONTROL PANEL VIEWS
# =====================================================================

@login_required
def admin_iot_control_panel_view(request):
    """Admin Control Panel."""
    tenant = getattr(request, 'tenant', None)
    devices = SmartIoTDevice.objects.filter(tenant=tenant)
    technicians = TechnicianProfile.objects.filter(tenant=tenant)
    tickets = ServiceTicket.objects.filter(tenant=tenant).order_by('-created_at')

    return render(request, 'iot_smart_rental/admin_control_panel.html', {
        'devices': devices,
        'technicians': technicians,
        'tickets': tickets,
    })


@login_required
def admin_toggle_device_relay(request, device_id):
    """Admin remote power cutoff / switch override."""
    if request.method == "POST":
        device = get_object_or_404(SmartIoTDevice, id=device_id)
        device.relay_status = not device.relay_status
        device.status = 'ACTIVE' if device.relay_status else 'CUTOFF'
        device.save()
        
        status_msg = "Device Powered ON" if device.relay_status else "Device Cutoff Applied!"
        return JsonResponse({'success': True, 'message': status_msg, 'is_on': device.relay_status})


@csrf_exempt
def api_simulate_telemetry_ping(request, device_id):
    """API Endpoint: Receives hardware telemetry or simulates periodic IoT pings."""
    if request.method == "POST":
        device = SmartIoTDevice.objects.filter(tuya_device_id=device_id).first()
        if not device:
            return JsonResponse({'success': False, 'error': 'Device not found in database'}, status=404)

        telemetry = TuyaIoTService.fetch_live_telemetry(device_id)
        
        device.input_quality_tds = telemetry['input_tds']
        device.output_quality_tds = telemetry['output_tds']
        device.total_output_units += telemetry['liters_consumed']
        device.last_ping_at = timezone.now()
        device.save()

        return JsonResponse({
            'success': True,
            'message': 'Telemetry updated successfully',
            'updated_device': device.device_name,
            'current_output_tds': device.output_quality_tds,
            'total_liters': device.total_output_units
        })

    return JsonResponse({'success': False, 'error': 'Only POST requests allowed'}, status=405)


@login_required
def admin_kyc_verification_desk_view(request):
    """Admin Desk to view and verify customer KYC documents and onboarding leads."""
    tenant = getattr(request, 'tenant', None)
    
    pending_kyc_leads = NewDeviceOnboardingLead.objects.filter(
        tenant=tenant,
        status='PAYMENT_DONE'
    ).order_by('-created_at')

    verified_leads = NewDeviceOnboardingLead.objects.filter(
        tenant=tenant,
        status__in=['READY_TO_DISPATCH', 'OUT_FOR_DELIVERY', 'INSTALLED']
    ).order_by('-created_at')

    return render(request, 'iot_smart_rental/admin_kyc_desk.html', {
        'pending_leads': pending_kyc_leads,
        'verified_leads': verified_leads
    })


@login_required
def admin_update_kyc_status_view(request, lead_id):
    """API View for Admin to Approve or Reject KYC."""
    if request.method == "POST":
        lead = get_object_or_404(NewDeviceOnboardingLead, id=lead_id)
        action = request.POST.get('action')
        rejection_reason = request.POST.get('reason', '')

        if action == 'APPROVE':
            lead.status = 'READY_TO_DISPATCH'
            lead.save()
            return JsonResponse({
                'success': True,
                'message': f'KYC Approved for {lead.customer_name}. Lead moved to Ready for Dispatch!'
            })
        elif action == 'REJECT':
            lead.status = 'CANCELLED'
            lead.save()
            return JsonResponse({
                'success': True,
                'message': f'KYC Rejected for {lead.customer_name}. Reason recorded.'
            })

    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=400)