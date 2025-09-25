from django.db import models

# Create your models here.

class Section(models.Model):
    """
    Stores content for individual section instances.
    Each section is identified by a unique section_id and contains JSON content.
    """
    section_id = models.CharField(
        max_length=100, 
        primary_key=True,
        help_text="Unique identifier for this section instance (e.g., 'hero-main', 'features-top')"
    )
    content = models.JSONField(
        default=dict,
        help_text="JSON content for this section instance (titles, text, settings, etc.)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Section"
        verbose_name_plural = "Sections"
        ordering = ['section_id']
    
    def __str__(self):
        return f"Section: {self.section_id}"
