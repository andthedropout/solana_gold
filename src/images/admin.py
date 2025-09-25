from django.contrib import admin
from django.utils.html import format_html
from .models import UploadedImage

@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):
    list_display = ['thumbnail', 'original_filename', 'filename', 'content_type', 'size_display', 'uploaded_at']
    list_filter = ['content_type', 'uploaded_at']
    search_fields = ['original_filename', 'filename', 'used_in_sections']
    readonly_fields = ['id', 'filename', 'size', 'content_type', 'uploaded_at', 'image_preview', 'used_in_sections']
    
    def thumbnail(self, obj):
        return format_html(
            '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
            obj.url
        )
    thumbnail.short_description = 'Preview'
    
    def image_preview(self, obj):
        return format_html(
            '<img src="{}" style="max-width: 500px; max-height: 500px;" />',
            obj.url
        )
    image_preview.short_description = 'Full Preview'
    
    def size_display(self, obj):
        """Display size in human-readable format"""
        size = obj.size
        for unit in ['B', 'KB', 'MB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} GB"
    size_display.short_description = 'Size'
    
    fieldsets = (
        ('Image Information', {
            'fields': ('id', 'original_filename', 'filename', 'content_type', 'size', 'uploaded_at')
        }),
        ('Preview', {
            'fields': ('image_preview',)
        }),
        ('Usage Tracking', {
            'fields': ('used_in_sections',),
            'classes': ('collapse',)
        })
    )
