from django.contrib import admin
from .models import Section


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('section_id', 'updated_at', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('section_id',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Section Information', {
            'fields': ('section_id', 'content'),
            'description': 'Section instance content and settings'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
