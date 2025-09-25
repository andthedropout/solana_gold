from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# User-related models will be added here as needed 

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100, default='Professional Hosting')
    description = models.TextField(default='Monthly hosting subscription with custom domain support')
    amount_cents = models.IntegerField(default=1500, help_text='Amount in cents (1500 = $15.00)')
    interval = models.CharField(max_length=20, default='month', choices=[
        ('month', 'Monthly'),
        ('year', 'Yearly'),
    ])
    stripe_price_id = models.CharField(max_length=255, blank=True, help_text='Stripe Price ID (auto-generated)')
    is_active = models.BooleanField(default=True, help_text='Only one plan can be active at a time')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', '-created_at']

    def __str__(self):
        return f"{self.name} - ${self.amount_cents/100:.2f}/{self.interval}"

    @property
    def amount_dollars(self):
        return self.amount_cents / 100

    def save(self, *args, **kwargs):
        # Ensure only one plan is active
        if self.is_active:
            SubscriptionPlan.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_active_plan(cls):
        return cls.objects.filter(is_active=True).first()


# Subscription model removed - using direct Stripe API calls for real-time data 