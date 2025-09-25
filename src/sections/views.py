from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import AllowAny
from .models import Section
from .serializers import SectionSerializer

# Create your views here.

class SectionDetailView(APIView):
    """
    Retrieve, update, or create a section by section_id.
    GET: Returns section content (404 if doesn't exist)
    POST: Creates section with provided content
    PUT/PATCH: Updates section content
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def get(self, request, section_id):
        """Get section content"""
        try:
            section = Section.objects.get(section_id=section_id)
            serializer = SectionSerializer(section)
            return Response(serializer.data)
        except Section.DoesNotExist:
            return Response(
                {'error': 'Section not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def post(self, request, section_id):
        """Create a new section with the provided section_id and content"""
        # Check if section already exists
        if Section.objects.filter(section_id=section_id).exists():
            return Response(
                {'error': 'Section with this ID already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create section with provided content
        data = request.data.copy()
        data['section_id'] = section_id
        
        serializer = SectionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, section_id):
        """Update section content"""
        try:
            section = Section.objects.get(section_id=section_id)
        except Section.DoesNotExist:
            return Response(
                {'error': 'Section not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = SectionSerializer(section, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, section_id):
        """Update section content (full replace)"""
        return self.patch(request, section_id)
    
    def delete(self, request, section_id):
        """Delete a section"""
        try:
            section = Section.objects.get(section_id=section_id)
            section.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Section.DoesNotExist:
            return Response(
                {'error': 'Section not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class SectionListView(generics.ListAPIView):
    """List all sections"""
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
