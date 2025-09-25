from django.views.generic import TemplateView
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import json
import os
import glob
import uuid
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import mimetypes
from django.http import FileResponse, Http404, HttpResponse
from images.models import UploadedImage
from pages.models import Page

class IndexView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["debug"] = settings.DEBUG
        
        # Try to get page metadata based on the URL path
        path = self.request.path.strip('/')
        page_slug = path if path else 'home'  # Default to 'home' for root path
        
        # Try to fetch the page from database
        try:
            page = Page.objects.get(slug=page_slug, is_published=True)
            context["page_title"] = page.meta_title or page.title
            context["page_description"] = page.meta_description or f"Welcome to {page.title}"
        except Page.DoesNotExist:
            # Default metadata if page not found
            context["page_title"] = "Welcome"
            context["page_description"] = "Welcome to our website"
        
        # In production, read the manifest to get hashed filenames
        if not settings.DEBUG:
            manifest_path = os.path.join(settings.STATIC_ROOT, "manifest.json")
            if os.path.exists(manifest_path):
                with open(manifest_path, "r") as f:
                    manifest = json.load(f)
                    # The manifest uses "index.html" entry point which outputs to "index.js"
                    context["main_js"] = manifest.get("index.html", {}).get("file", "index.js")
                    # CSS is nested differently
                    context["main_css"] = "index.css"
            else:
                # Fallback if manifest doesn't exist
                context["main_js"] = "index.js"
                context["main_css"] = "index.css"
        
        return context 

def list_available_backgrounds(request):
    # Try multiple possible locations for background SVG files
    possible_paths = [
        os.path.join(settings.BASE_DIR.parent, 'design-system', 'backgrounds'),
        os.path.join(settings.BASE_DIR.parent, 'public', 'images', 'backgrounds'),
        os.path.join(settings.BASE_DIR.parent, 'public_collected', 'images', 'backgrounds'),
    ]
    
    available_backgrounds = []
    
    for backgrounds_path in possible_paths:
        if os.path.exists(backgrounds_path):
            svg_files = glob.glob(os.path.join(backgrounds_path, '*.svg'))
            for file_path in svg_files:
                filename = os.path.basename(file_path)
                name_without_ext = os.path.splitext(filename)[0]
                
                label = name_without_ext.replace('_', ' ').replace('-', ' ').title()
                
                available_backgrounds.append({
                    'value': name_without_ext,
                    'label': label
                })
            if svg_files:  # If we found files, stop looking
                break
    
    available_backgrounds.sort(key=lambda x: x['label'])
    
    return JsonResponse({
        'animated_backgrounds': available_backgrounds
    })

@method_decorator(csrf_exempt, name='dispatch')  
class ImageUploadView(APIView):
    """Handle image uploads with auto-generated names"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate file size (5MB limit)
        if image_file.size > 5 * 1024 * 1024:  # 5MB in bytes
            return Response({'error': 'File size exceeds 5MB limit'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type
        content_type = image_file.content_type
        if not content_type or not content_type.startswith('image/'):
            return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        file_extension = image_file.name.split('.')[-1].lower() if '.' in image_file.name else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        try:
            # Read the entire image data into memory
            image_data = image_file.read()
            
            # Save to database instead of filesystem
            uploaded_image = UploadedImage.objects.create(
                filename=unique_filename,
                original_filename=image_file.name,
                content_type=content_type,
                size=image_file.size,
                image_data=image_data
            )
            
            # Return database-backed URL
            file_url = f"/api/v1/images/{unique_filename}"
            
            return Response({
                'success': True,
                'url': file_url,
                'filename': unique_filename,
                'size': image_file.size
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to save image: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def serve_media_file(request, path):
    """Serve media files in production when web server doesn't handle them"""
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Security check - ensure the file is within MEDIA_ROOT
    file_path = os.path.abspath(file_path)
    media_root = os.path.abspath(settings.MEDIA_ROOT)
    
    if not file_path.startswith(media_root):
        raise Http404("File not found")
    
    if not os.path.exists(file_path):
        raise Http404("File not found")
    
    # Get content type
    content_type, _ = mimetypes.guess_type(file_path)
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # Return file response
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type,
        as_attachment=False
    )
    return response

def serve_database_image(request, filename):
    """Serve images stored in the database"""
    try:
        # Fetch image from database
        image = UploadedImage.objects.get(filename=filename)
        
        # Create HTTP response with image data
        response = HttpResponse(
            image.image_data,
            content_type=image.content_type
        )
        
        # Set appropriate headers
        response['Content-Length'] = image.size
        response['Cache-Control'] = 'public, max-age=31536000'  # Cache for 1 year
        response['Content-Disposition'] = f'inline; filename="{image.original_filename}"'
        
        return response
        
    except UploadedImage.DoesNotExist:
        raise Http404("Image not found")