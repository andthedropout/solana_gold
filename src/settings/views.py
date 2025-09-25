from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import json

from .models import SiteSettings
from .serializers import SiteSettingsSerializer

# Create your views here.

@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def site_settings_view(request):
    """Handle site settings GET and PATCH requests"""
    
    if request.method == 'GET':
        # Get current settings
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        # Update settings
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Legacy function-based view for backwards compatibility
def get_site_settings(request):
    """Legacy GET-only view"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    settings = SiteSettings.get_settings()
    serializer = SiteSettingsSerializer(settings)
    
    return JsonResponse(serializer.data)
