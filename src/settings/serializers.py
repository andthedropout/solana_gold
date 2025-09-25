from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for site settings including company info, header/footer config, and social media links"""
    
    # Explicitly define the fields to ensure proper handling
    company_logo_light = serializers.CharField(required=False, allow_blank=True, max_length=500)
    company_logo_dark = serializers.CharField(required=False, allow_blank=True, max_length=500)
    favicon = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    class Meta:
        model = SiteSettings
        fields = [
            # Company Information
            'company_name',
            'company_logo',
            'company_logo_light',
            'company_logo_dark',
            'favicon',
            
            # Contact Information
            'contact_email',
            'contact_phone', 
            'contact_address',
            
            # Header Configuration
            'header_type',
            'header_show_logo',
            'header_show_company_name',
            'header_show_dark_mode_toggle',
            'header_show_login',
            'header_show_signup',
            'header_background_transparent',
            'header_is_sticky',
            'header_logo_alt',
            
            # Footer Configuration
            'footer_show_footer',
            'footer_show_top_section',
            'footer_show_bottom_section',
            'footer_show_logo',
            'footer_show_tagline',
            'footer_show_navigation',
            
            # Social Media
            'social_facebook',
            'social_twitter',
            'social_instagram',
            'social_linkedin',
            'social_youtube',
        ] 