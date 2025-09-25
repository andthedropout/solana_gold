from django.contrib import admin
from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'show_in_header', 'updated_at')
    list_filter = ('is_published', 'show_in_header', 'created_at', 'updated_at')
    search_fields = ('title', 'slug', 'meta_title')
    prepopulated_fields = {'slug': ('title',)}
    
    fieldsets = (
        ('Page Content', {
            'fields': ('title', 'slug', 'sections', 'is_published', 'show_in_header')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ('created_at', 'updated_at')
