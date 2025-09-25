import stripe
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Create a new Stripe price for subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--amount',
            type=int,
            default=1500,
            help='Amount in cents (default: 1500 = $15.00)',
        )
        parser.add_argument(
            '--currency',
            type=str,
            default='usd',
            help='Currency code (default: usd)',
        )
        parser.add_argument(
            '--interval',
            type=str,
            default='month',
            help='Billing interval (default: month)',
        )
        parser.add_argument(
            '--product-name',
            type=str,
            default='Professional Hosting',
            help='Product name (default: Professional Hosting)',
        )

    def handle(self, *args, **options):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        
        try:
            # Create product
            product = stripe.Product.create(
                name=options['product_name'],
                description=f"Subscription service - ${options['amount']/100:.2f}/{options['interval']}"
            )
            
            # Create price
            price = stripe.Price.create(
                product=product.id,
                unit_amount=options['amount'],
                currency=options['currency'],
                recurring={'interval': options['interval']}
            )
            
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created Stripe price!")
            )
            self.stdout.write(f"Product ID: {product.id}")
            self.stdout.write(f"Price ID: {price.id}")
            self.stdout.write(f"Amount: ${options['amount']/100:.2f}/{options['interval']}")
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(f"Add this to your environment variables:")
            )
            self.stdout.write(f"STRIPE_PRICE_ID={price.id}")
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error creating Stripe price: {str(e)}")
            ) 