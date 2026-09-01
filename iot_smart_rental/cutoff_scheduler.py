import logging
from django.utils import timezone
from .models import SmartIoTDevice
from .tuya_service import TuyaIoTService

logger = logging.getLogger(__name__)

def run_daily_auto_cutoff_job():
    """
    Automated Daily Scheduler Job:
    Checks for expired subscriptions and triggers Tuya remote relay cutoff.
    """
    today = timezone.now().date()
    
    # Fetch devices where due date has passed and relay is still ON
    expired_devices = SmartIoTDevice.objects.filter(
        next_due_date__lt=today,
        relay_status=True,
        status='ACTIVE'
    )

    cutoff_count = 0
    for device in expired_devices:
        # Send Remote Off Command via Tuya Service
        response = TuyaIoTService.send_relay_command(device.tuya_device_id, power_state=False)
        
        if response.get('success'):
            device.relay_status = False
            device.status = 'CUTOFF'
            device.save()
            cutoff_count += 1
            logger.info(f"[AUTO-CUTOFF SUCCESS] Device {device.device_name} cut off successfully.")
        else:
            logger.error(f"[AUTO-CUTOFF FAILED] Device {device.device_name}: {response.get('error')}")

    return f"Auto-Cutoff Process Completed. Total Devices Cut Off: {cutoff_count}"