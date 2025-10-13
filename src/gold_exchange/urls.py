from django.urls import path
from . import views, admin_views

app_name = 'gold_exchange'

urlpatterns = [
    # Quote endpoint
    path('quote', views.get_quote, name='get_quote'),

    # Buy endpoints
    path('buy/initiate', views.buy_initiate, name='buy_initiate'),
    path('buy/confirm', views.buy_confirm, name='buy_confirm'),

    # Sell endpoints
    path('sell/initiate', views.sell_initiate, name='sell_initiate'),
    path('sell/confirm', views.sell_confirm, name='sell_confirm'),

    # Balance and price endpoints
    path('balance/<str:wallet_address>', views.get_balance, name='get_balance'),
    path('price', views.get_price, name='get_price'),

    # Admin endpoints
    path('admin/dashboard', admin_views.admin_dashboard, name='admin_dashboard'),
    path('admin/withdraw', admin_views.withdraw_from_wallet, name='admin_withdraw'),
]
