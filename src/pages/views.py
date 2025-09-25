from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Page
from .serializers import PageSerializer, PageListSerializer, PageHeaderSerializer

# Create your views here.

class PageListCreateView(generics.ListCreateAPIView):
    queryset = Page.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PageListSerializer
        return PageSerializer


class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = 'id'


class PageBySlugView(generics.RetrieveAPIView):
    queryset = Page.objects.filter(is_published=True)
    serializer_class = PageSerializer
    lookup_field = 'slug'


class PageHeaderView(generics.ListAPIView):
    queryset = Page.objects.filter(is_published=True, show_in_header=True).order_by('header_order', 'title')
    serializer_class = PageHeaderSerializer


class PageHeaderReorderView(APIView):
    """API endpoint to reorder pages in the header navigation"""
    
    def post(self, request):
        """
        Expects a list of page IDs in the desired order:
        { "page_ids": [1, 3, 2, 4] }
        """
        page_ids = request.data.get('page_ids', [])
        
        if not page_ids:
            return Response(
                {"error": "page_ids list is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update header_order for each page
        for index, page_id in enumerate(page_ids):
            try:
                page = Page.objects.get(id=page_id, show_in_header=True)
                page.header_order = index
                page.save(update_fields=['header_order'])
            except Page.DoesNotExist:
                # Skip pages that don't exist or aren't in header
                continue
        
        return Response({"success": True}, status=status.HTTP_200_OK)
