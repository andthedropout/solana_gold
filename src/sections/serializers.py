from rest_framework import serializers
from .models import Section


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for section content"""
    
    class Meta:
        model = Section
        fields = ['section_id', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 