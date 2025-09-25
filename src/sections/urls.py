from django.urls import path
from . import views

app_name = 'sections'

urlpatterns = [
    path('', views.SectionListView.as_view(), name='section-list'),
    path('<str:section_id>/', views.SectionDetailView.as_view(), name='section-detail'),
] 