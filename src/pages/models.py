from django.db import models
from django.urls import reverse


class Page(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=100)
    sections = models.JSONField(default=list, help_text="""
📋 SECTIONS CONFIGURATION GUIDE

🔹 BASIC SECTION (Required):
[
  {
    "id": "hero-section-1",
    "component_type": "Hero1"
  }
]

🔹 SECTION WITH STATIC BACKGROUND:
[
  {
    "id": "hero-section-1", 
    "component_type": "Hero1",
    "background": {
      "type": "static",
      "static_color": "accent",
      "opacity": 0.3
    }
  }
]

🔹 SECTION WITH ANIMATED BACKGROUND:
[
  {
    "id": "features-section-1",
    "component_type": "Features1",
    "background": {
      "type": "animated",
      "animated_type": "particles",
      "opacity": 0.6
    }
  }
]

📖 FIELD REFERENCE:
• id: Unique identifier (required)
• component_type: Hero1, Features1, TestSection, etc. (required)
• background: Optional styling configuration

🎨 STATIC COLORS: background, muted, accent, secondary, primary, card
🌟 ANIMATED TYPES: ripples, particles, waves, gradient
💫 OPACITY: 0.0 (transparent) to 1.0 (solid)

⚡ Background is completely optional - sections work with just id + component_type
    """)
    
    meta_title = models.CharField(
        max_length=60, 
        blank=True,
        help_text="🏷️ SEO title tag (max 60 chars). If empty, uses page title."
    )
    meta_description = models.TextField(
        max_length=160, 
        blank=True,
        help_text="📝 SEO meta description (max 160 chars). Appears in search results."
    )
    
    is_published = models.BooleanField(
        default=False, 
        help_text="✅ Check to make this page publicly accessible. Unchecked pages return 404."
    )
    show_in_header = models.BooleanField(
        default=False,
        help_text="📍 Check to display this page as a link in the site navigation header."
    )
    header_order = models.IntegerField(
        default=0,
        help_text="🔢 Order position in header navigation (lower numbers appear first)."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return self.title
        
    def get_absolute_url(self):
        return f"/{self.slug}/"
