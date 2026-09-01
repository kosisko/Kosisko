from rest_framework.permissions import BasePermission

class IsTenantAdmin(BasePermission):
    """
    यह परमीशन चेक करती है कि क्या करंट यूजर अपने टेनेंट का एडमिन (Tenant Owner / Admin) है।
    अगर वह 'tenant_admin' या 'super_admin' है, तभी अंदर आने देगा।
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # सुपर एडमिन को हमेशा अनुमति है
        if request.user.is_superuser:
            return True
            
        profile = getattr(request.user, 'profile', None)
        if profile and profile.role in ['super_admin', 'tenant_admin']:
            return True
            
        return False


class IsSuperAdminOnly(BasePermission):
    """
    यह परमीशन सिर्फ 'Super Admin' के लिए है (जैसे Kosisko के मुख्य डेवलपर्स/फाउंडर्स)।
    यह ग्लोबल प्राइसिंग, कूपन या सिस्टम-वाइड मॉड्यूल्स को मैनेज करने के लिए इस्तेमाल होगी।
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
    डेटा लीक रोकने का सबसे बड़ा गार्ड! 
    यह सुनिश्चित करता है कि यूजर सिर्फ उसी डेटा को देख या एडिट सके 
    जो उसके अपने Tenant से जुड़ा हुआ है।
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.tenant:
            return False

        # चेक करें कि क्या ऑब्जेक्ट का टेनेंट और यूजर का टेनेंट एक ही है
        if hasattr(obj, 'tenant'):
            return obj.tenant == profile.tenant
        elif hasattr(obj, 'organization'):
            return obj.organization == profile.tenant
            
        return False