from django.urls import path
from .views import (
    CreateCheckoutView, 
    SubscriptionStatusView, 
    TestView,
    TestCheckoutView,
    CreateStripeProductView,
    ForceCreateStripeProductView,
    PricingView,
    DomainCheckView,
    DomainOrderView,
    DomainOrderWithHostingView,
    CreateCustomerPortalView
)

app_name = 'users'
 
urlpatterns = [
    path('test/', TestView.as_view(), name='test'),
    path('pricing/', PricingView.as_view(), name='pricing'),
    path('create-stripe-product/', CreateStripeProductView.as_view(), name='create_stripe_product'),
    path('force-create-stripe-product/', ForceCreateStripeProductView.as_view(), name='force_create_stripe_product'),
    path('test-checkout/', TestCheckoutView.as_view(), name='test_checkout'),
    path('subscriptions/create-checkout/', CreateCheckoutView.as_view(), name='create_checkout'),
    path('subscriptions/status/', SubscriptionStatusView.as_view(), name='subscription_status'),
    path('subscriptions/manage/', CreateCustomerPortalView.as_view(), name='create_customer_portal'),
    path('domains/check/', DomainCheckView.as_view(), name='domain_check'),
    path('domains/order/', DomainOrderView.as_view(), name='domain_order'),
    path('domains/order-with-hosting/', DomainOrderWithHostingView.as_view(), name='domain_order_with_hosting'),
] 