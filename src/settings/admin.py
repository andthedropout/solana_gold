from django.contrib import admin
from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_email', 'updated_at')
    
    fieldsets = (
        ('Company Information', {
            'fields': ('company_name', 'company_logo'),
            'description': 'Basic company information displayed throughout the site'
        }),
        ('Contact Details', {
            'fields': ('contact_email', 'contact_phone', 'contact_address'),
            'description': 'Contact information for visitors to reach your company'
        }),
        ('Header Configuration', {
            'fields': (
                'header_type',
                ('header_show_logo', 'header_show_company_name'),
                ('header_show_dark_mode_toggle', 'header_show_login', 'header_show_signup'),
                ('header_background_transparent', 'header_is_sticky'),
                'header_logo_alt',
            ),
            'description': 'Configure header appearance and behavior'
        }),
        ('Footer Configuration', {
            'fields': (
                ('footer_show_footer', 'footer_show_top_section', 'footer_show_bottom_section'),
                ('footer_show_logo', 'footer_show_tagline', 'footer_show_navigation'),
            ),
            'description': 'Configure footer sections and content'
        }),
        ('Social Media', {
            'fields': ('social_facebook', 'social_twitter', 'social_instagram', 'social_linkedin', 'social_youtube'),
            'description': 'Links to your social media profiles',
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        """Only allow adding if no SiteSettings instance exists"""
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        """Don't allow deletion of SiteSettings"""
        return False
