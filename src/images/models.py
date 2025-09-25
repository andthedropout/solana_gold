from django.db import models
import uuid

class UploadedImage(models.Model):
    """
    Model to store uploaded images in the database for persistence across deployments.
    Images are stored as binary data in PostgreSQL rather than on the filesystem.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filename = models.CharField(
        max_length=255, 
        unique=True,
        help_text="Unique filename for URL generation (e.g., 'abc123.jpg')"
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename uploaded by user"
    )
    content_type = models.CharField(
        max_length=100,
        help_text="MIME type of the image (e.g., 'image/jpeg')"
    )
    size = models.PositiveIntegerField(
        help_text="File size in bytes"
    )
    image_data = models.BinaryField(
        help_text="Actual image binary data stored in database"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Track which section uses this image
    used_in_sections = models.JSONField(
        default=list,
        blank=True,
        help_text="List of section_ids where this image is used"
    )
    
    class Meta:
        verbose_name = "Uploaded Image"
        verbose_name_plural = "Uploaded Images"
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['filename']),
            models.Index(fields=['-uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.filename})"
    
    @property
    def url(self):
        """Return the URL for accessing this image"""
        return f"/api/v1/images/{self.filename}"
