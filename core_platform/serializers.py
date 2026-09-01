from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Tenant

class UserSignupSerializer(serializers.ModelSerializer):
    """
    नया यूजर रजिस्टर करते वक्त डेटा को वैलिडेट और serialize करने के लिए।
    यह सुनिश्चित करता है कि पासवर्ड, ईमेल और मोबाइल नंबर सही फॉर्मेट में हों।
    """
    password = serializers.CharField(write_only=True, min_length=8)
    fullName = serializers.CharField(source='first_name', required=False, allow_blank=True)
    mobileNumber = serializers.CharField(write_only=True, required=False, allow_blank=True)
    organizationName = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'fullName', 'mobileNumber', 'organizationName']

    def validate_email(self, value):
        """ईमेल की यूनीकनेस चेक करने के लिए"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(validated_data):
        # यह डेटा views.py में सुरक्षित रूप से इस्तेमाल किया जा सकता है
        return validated_data


class TenantBrandingSerializer(serializers.ModelSerializer):
    """
    टेनेंट की व्हाइट-लेबलिंग और ब्रांडिंग डिटेल्स को फ्रंटएंड तक भेजने के लिए।
    """
    branding = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = ['id', 'name', 'subdomain', 'is_active', 'branding']

    def get_branding(self, obj):
        return obj.get_branding_details()