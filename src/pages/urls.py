from django.urls import path
from .views import PageListCreateView, PageDetailView, PageBySlugView, PageHeaderView, PageHeaderReorderView

app_name = 'pages'

urlpatterns = [
    path('', PageListCreateView.as_view(), name='page-list-create'),
    path('<int:id>/', PageDetailView.as_view(), name='page-detail'),
    path('by-slug/<slug:slug>/', PageBySlugView.as_view(), name='page-by-slug'),
    path('header/', PageHeaderView.as_view(), name='page-header'),
    path('header/reorder/', PageHeaderReorderView.as_view(), name='page-header-reorder'),
] 