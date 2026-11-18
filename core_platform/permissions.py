from rest_framework.permissions import BasePermission

class IsTenantAdmin(BasePermission):
    """
    केवल Tenant Owner / Admin या Kosisko Super Admin को अनुमति देता है।
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, 'profile', None)
        return profile and profile.role in ['super_admin', 'tenant_admin', 'tenant_owner']


class IsSuperAdminOnly(BasePermission):
    """
    सिर्फ Kosisko फाउंडर्स और सुपर-एडमिन के लिए।
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, 'profile', None)
        return profile and profile.role == 'super_admin'


class IsSameTenantObject(BasePermission):
    """
    डेटा लीक प्रिवेंशन (Zero Data Leak):
    यह ऑब्जेक्ट लेवल पर चेक करता है कि जो बिल, इनवॉइस या ग्राहक खोला जा रहा है, 
    वह उसी टेनेंट का है या नहीं।
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.tenant:
            return False

        # मॉडल में 'tenant' या 'organization' फ़ील्ड की पुष्टि करें
        if hasattr(obj, 'tenant'):
            return obj.tenant_id == profile.tenant_id
        elif hasattr(obj, 'organization'):
            return obj.organization_id == profile.tenant_id

        return False
