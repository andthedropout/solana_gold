from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from .models import SubscriptionPlan
import stripe
from django.conf import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'amount_display', 'interval', 'is_active_badge', 'subscriber_count', 'stripe_price_id', 'created_at']
    list_filter = ['is_active', 'interval', 'created_at']
    search_fields = ['name', 'description', 'stripe_price_id']
    readonly_fields = ['created_at', 'updated_at', 'stripe_price_id']
    
    fieldsets = (
        ('Plan Details', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Pricing', {
            'fields': ('amount_cents', 'interval')
        }),
        ('Stripe Integration', {
            'fields': ('stripe_price_id',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['create_stripe_price', 'make_active']

    def amount_display(self, obj):
        return f"${obj.amount_cents/100:.2f}"
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount_cents'

    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Active</span>')
        return format_html('<span style="color: gray;">Inactive</span>')
    is_active_badge.short_description = 'Status'

    def subscriber_count(self, obj):
        # Since we removed the Subscription model, this now shows Stripe-based count
        return format_html('<span style="color: gray;">Check Stripe Dashboard</span>')
    subscriber_count.short_description = 'Subscribers'

    def create_stripe_price(self, request, queryset):
        """Create Stripe prices for selected plans"""
        for plan in queryset:
            if plan.stripe_price_id:
                messages.warning(request, f'{plan.name} already has a Stripe price ID')
                continue
                
            try:
                # Create Stripe product if needed
                product = stripe.Product.create(
                    name=plan.name,
                    description=plan.description
                )
                
                # Create Stripe price
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=plan.amount_cents,
                    currency='usd',
                    recurring={'interval': plan.interval}
                )
                
                # Update plan with Stripe price ID
                plan.stripe_price_id = price.id
                plan.save()
                
                messages.success(request, f'Created Stripe price for {plan.name}: {price.id}')
                
            except Exception as e:
                messages.error(request, f'Error creating Stripe price for {plan.name}: {str(e)}')
    
    create_stripe_price.short_description = 'Create Stripe prices for selected plans'

    def make_active(self, request, queryset):
        """Make the selected plan active (deactivates others)"""
        if queryset.count() > 1:
            messages.error(request, 'You can only activate one plan at a time')
            return
            
        plan = queryset.first()
        if plan:
            SubscriptionPlan.objects.update(is_active=False)
            plan.is_active = True
            plan.save()
            messages.success(request, f'{plan.name} is now the active plan')
    
    make_active.short_description = 'Make selected plan active'


# Subscription admin removed - using direct Stripe API calls for real-time data

# User admin configurations will be added here as needed 