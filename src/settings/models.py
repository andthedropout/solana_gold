from django.db import models
from django.core.exceptions import ValidationError


class SiteSettings(models.Model):
    """
    Site-wide settings including company information and contact details.
    This model should only have one instance (singleton pattern).
    """
    
    # Company Information
    company_name = models.CharField(
        max_length=100, 
        default='Your Company Name',
        help_text="🏢 Company or organization name displayed throughout the site"
    )
    company_logo = models.CharField(
        max_length=200,
        default='/static/images/logo.png',
        help_text="🖼️ Path to company logo image (e.g., /static/images/logo.png)"
    )
    company_logo_light = models.CharField(
        blank=True,
        max_length=500,
        help_text="🌞 Logo for light theme (upload via image upload below)"
    )
    company_logo_dark = models.CharField(
        blank=True,
        max_length=500,
        help_text="🌙 Logo for dark theme (upload via image upload below)"
    )
    favicon = models.CharField(
        blank=True,
        max_length=500,
        help_text="🔖 Favicon for browser tab (recommended: 32x32 or 16x16 PNG/ICO)"
    )
    
    # Contact Information
    contact_email = models.EmailField(
        max_length=100,
        blank=True,
        help_text="📧 Primary contact email address"
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="📞 Contact phone number (e.g., +1 (555) 123-4567)"
    )
    contact_address = models.TextField(
        blank=True,
        help_text="📍 Physical address or location"
    )
    
    # Social Media Links
    social_facebook = models.URLField(
        blank=True,
        help_text="🔗 Facebook page URL"
    )
    social_twitter = models.URLField(
        blank=True,
        help_text="🔗 Twitter/X profile URL"
    )
    social_instagram = models.URLField(
        blank=True,
        help_text="🔗 Instagram profile URL"
    )
    social_linkedin = models.URLField(
        blank=True,
        help_text="🔗 LinkedIn company page URL"
    )
    social_youtube = models.URLField(
        blank=True,
        help_text="🔗 YouTube channel URL"
    )
    
    # Header Configuration
    HEADER_TYPE_CHOICES = [
        ('floating', 'Floating Header'),
        ('clean', 'Clean Header'),
        ('professional', 'Professional Header'),
        ('sidebar', 'Sidebar Header'),
    ]
    
    header_type = models.CharField(
        max_length=20,
        choices=HEADER_TYPE_CHOICES,
        default='professional',
        help_text="🎨 Choose the header layout style"
    )
    
    # Header Display Settings
    header_show_logo = models.BooleanField(
        default=True,
        help_text="📷 Display company logo in header"
    )
    header_show_company_name = models.BooleanField(
        default=False,
        help_text="🏢 Display company name next to logo"
    )
    header_show_dark_mode_toggle = models.BooleanField(
        default=True,
        help_text="🌙 Show dark/light mode toggle button"
    )
    header_show_login = models.BooleanField(
        default=True,
        help_text="👤 Show login button for unauthenticated users"
    )
    header_show_signup = models.BooleanField(
        default=False,
        help_text="📝 Show signup button for unauthenticated users"
    )
    header_background_transparent = models.BooleanField(
        default=False,
        help_text="🔍 Use transparent background with blur effect"
    )
    header_is_sticky = models.BooleanField(
        default=True,
        help_text="📌 Keep header visible when scrolling"
    )
    header_logo_alt = models.CharField(
        max_length=100,
        default='Logo',
        help_text="♿ Alt text for logo image (accessibility)"
    )
    
    # Footer Configuration
    footer_show_footer = models.BooleanField(
        default=True,
        help_text="👇 Display footer section"
    )
    footer_show_top_section = models.BooleanField(
        default=False,
        help_text="📋 Show company info and navigation in footer"
    )
    footer_show_bottom_section = models.BooleanField(
        default=True,
        help_text="©️ Show copyright and legal links"
    )
    footer_show_logo = models.BooleanField(
        default=True,
        help_text="📷 Display company logo in footer"
    )
    footer_show_tagline = models.BooleanField(
        default=True,
        help_text="💬 Show company tagline in footer"
    )
    footer_show_navigation = models.BooleanField(
        default=True,
        help_text="🧭 Show navigation menu in footer"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"
    
    def __str__(self):
        return f"Site Settings for {self.company_name}"
    
    def save(self, *args, **kwargs):
        """Ensure only one instance of SiteSettings can exist (singleton pattern)"""
        if not self.pk and SiteSettings.objects.exists():
            raise ValidationError('Site Settings already exists. You can only have one set of site settings.')
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get the current site settings, creating default if none exist"""
        settings, created = cls.objects.get_or_create(
            id=1,
            defaults={
                'company_name': 'Your Company Name',
                'company_logo': '/static/images/logo.png',
                'header_type': 'professional',
                'header_show_logo': True,
                'header_show_company_name': False,
                'header_show_dark_mode_toggle': True,
                'header_show_login': True,
                'header_show_signup': False,
                'header_background_transparent': False,
                'header_is_sticky': True,
                'header_logo_alt': 'Logo',
                'footer_show_footer': True,
                'footer_show_top_section': False,
                'footer_show_bottom_section': True,
                'footer_show_logo': True,
                'footer_show_tagline': True,
                'footer_show_navigation': True,
            }
        )
        return settings
