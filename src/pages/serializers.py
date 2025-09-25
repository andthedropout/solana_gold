from rest_framework import serializers
from .models import Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'title', 'slug', 'sections', 'meta_title', 'meta_description', 
                 'is_published', 'show_in_header', 'header_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'title', 'slug', 'is_published', 'show_in_header', 'updated_at']


class PageHeaderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ['id', 'title', 'slug', 'header_order'] 