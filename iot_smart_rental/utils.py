import math
import logging
from .models import TechnicianProfile, ServiceTicket

logger = logging.getLogger(__name__)

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculates straight-line distance in Kilometers between two GPS coordinates.
    """
    if None in (lat1, lon1, lat2, lon2):
        return 99999.0  # Return large distance if coordinates missing

    R = 6371.0  # Earth radius in KM
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def auto_assign_nearest_technician(ticket_id):
    """
    Finds the nearest available technician on duty and assigns the ticket.
    """
    ticket = ServiceTicket.objects.filter(id=ticket_id, status='PENDING').first()
    if not ticket:
        return None

    tenant = ticket.tenant
    device = ticket.device

    # Get all technicians on duty (not on leave) for this tenant
    available_techs = FieldTechnicianProfile.objects.filter(
        tenant=tenant,
        is_on_leave=False
    )

    if not available_techs.exists():
        logger.warning(f"No active technicians available for Ticket #{ticket_id}")
        return None

    # Default to device lat/lon or fallback coordinates
    cust_lat = getattr(device, 'latitude', 20.5937)
    cust_lon = getattr(device, 'longitude', 78.9629)

    nearest_tech = None
    min_distance = float('inf')

    for tech in available_techs:
        dist = calculate_haversine_distance(
            cust_lat, cust_lon,
            tech.current_latitude, tech.current_longitude
        )
        if dist < min_distance:
            min_distance = dist
            nearest_tech = tech

    if nearest_tech:
        ticket.technician = nearest_tech
        ticket.status = 'ASSIGNED'
        ticket.save()
        logger.info(f"Ticket #{ticket_id} auto-assigned to {nearest_tech.user.username} ({min_distance:.2f} km away)")
        return nearest_tech

    return None