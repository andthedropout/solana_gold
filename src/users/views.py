import json
import stripe
import requests
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.contrib.auth.models import User
from .models import SubscriptionPlan

stripe.api_key = settings.STRIPE_SECRET_KEY


class TestView(View):
    def get(self, request):
        active_plan = SubscriptionPlan.get_active_plan()
        fallback_settings = settings.STRIPE_SETTINGS
        
        return JsonResponse({
            'status': 'Subscription API working',
            'active_plan': {
                'name': active_plan.name if active_plan else fallback_settings['PRODUCT_NAME'],
                'amount': f"${(active_plan.amount_cents if active_plan else fallback_settings['MONTHLY_AMOUNT'])/100:.2f}",
                'interval': active_plan.interval if active_plan else 'month',
                'stripe_price_id': active_plan.stripe_price_id if active_plan else settings.STRIPE_PRICE_ID,
                'source': 'database' if active_plan else 'settings_fallback'
            }
        })


@method_decorator(csrf_exempt, name='dispatch')
class CreateStripeProductView(View):
    def post(self, request):
        """Create Stripe product and price for subscription"""
        try:
            active_plan = SubscriptionPlan.get_active_plan()
            if not active_plan:
                return JsonResponse({'error': 'No active subscription plan found. Create one in admin first.'}, status=400)
            
            if active_plan.stripe_price_id:
                return JsonResponse({'error': f'Plan already has Stripe price ID: {active_plan.stripe_price_id}'}, status=400)
            
            # Create product
            product = stripe.Product.create(
                name=active_plan.name,
                description=active_plan.description
            )
            
            # Create price
            price = stripe.Price.create(
                product=product.id,
                unit_amount=active_plan.amount_cents,
                currency='usd',
                recurring={'interval': active_plan.interval}
            )
            
            # Update plan with Stripe price ID
            active_plan.stripe_price_id = price.id
            active_plan.save()
            
            return JsonResponse({
                'status': 'Product and price created',
                'product_id': product.id,
                'price_id': price.id,
                'amount': f"${active_plan.amount_cents/100:.2f}/{active_plan.interval}",
                'message': f'Stripe price created and saved to plan: {price.id}'
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class TestCheckoutView(View):
    def post(self, request):
        """Test endpoint to create checkout session - no auth required for testing"""
        try:
            active_plan = SubscriptionPlan.get_active_plan()
            if not active_plan or not active_plan.stripe_price_id:
                # Fallback to settings
                price_id = settings.STRIPE_PRICE_ID
                amount_display = f"${settings.STRIPE_SETTINGS['MONTHLY_AMOUNT']/100:.2f}/month (fallback)"
            else:
                price_id = active_plan.stripe_price_id
                amount_display = f"${active_plan.amount_cents/100:.2f}/{active_plan.interval}"
            
            # Create a test checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url='http://localhost:8000/dashboard?success=true',
                cancel_url='http://localhost:8000/dashboard?canceled=true',
                metadata={'user_id': 'test_user'}
            )
            return JsonResponse({
                'checkout_url': session.url,
                'session_id': session.id,
                'status': 'success',
                'price_id': price_id,
                'amount': amount_display
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(login_required, name='dispatch')
class CreateCheckoutView(View):
    def post(self, request):
        try:
            # Debug: Log user info
            print(f"DEBUG: Creating checkout for user {request.user.id} ({request.user.username})")
            
            active_plan = SubscriptionPlan.get_active_plan()
            plan_id = None
            
            if active_plan:
                plan_id = active_plan.id
                print(f"DEBUG: Using database plan: {active_plan.name}, amount: ${active_plan.amount_cents/100:.2f}")
                line_items = [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': active_plan.name,
                            'description': active_plan.description,
                        },
                        'unit_amount': active_plan.amount_cents,
                        'recurring': {'interval': active_plan.interval}
                    },
                    'quantity': 1,
                }]
            else:
                # Fallback to settings
                fallback_settings = settings.STRIPE_SETTINGS
                print(f"DEBUG: Using fallback settings: ${fallback_settings['MONTHLY_AMOUNT']/100:.2f}")
                line_items = [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': fallback_settings['PRODUCT_NAME'],
                            'description': fallback_settings['PRODUCT_DESCRIPTION'],
                        },
                        'unit_amount': fallback_settings['MONTHLY_AMOUNT'],
                        'recurring': {'interval': 'month'}
                    },
                    'quantity': 1,
                }]
            
            # Create Stripe checkout session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='subscription',
                success_url=request.build_absolute_uri('/dashboard?success=true'),
                cancel_url=request.build_absolute_uri('/dashboard?canceled=true'),
                metadata={
                    'user_id': str(request.user.id),
                    'plan_id': str(plan_id) if plan_id else None
                }
            )
            
            print(f"DEBUG: Created Stripe session {session.id} with metadata: {session.metadata}")
            
            return JsonResponse({
                'checkout_url': session.url,
                'session_id': session.id,
                'debug': {
                    'user_id': request.user.id,
                    'plan_id': plan_id
                }
            })
        except Exception as e:
            print(f"DEBUG: Error creating checkout: {str(e)}")
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(login_required, name='dispatch')
class SubscriptionStatusView(View):
    def get(self, request):
        """Check subscription status directly from Stripe"""
        try:
            # Get user's email to find Stripe customer
            user_email = request.user.email
            print(f"DEBUG: Checking subscription for user email: {user_email}")
            
            # Search for customer by email in Stripe
            customers = stripe.Customer.list(email=user_email, limit=10)
            print(f"DEBUG: Found {len(customers.data)} customers for email {user_email}")
            
            if not customers.data:
                # Also try searching for email without .com and with .com variations
                email_variations = []
                if user_email.endswith('.com'):
                    email_variations.append(user_email[:-4])  # Remove .com
                else:
                    email_variations.append(user_email + '.com')  # Add .com
                
                print(f"DEBUG: Trying email variations: {email_variations}")
                for email_variant in email_variations:
                    variant_customers = stripe.Customer.list(email=email_variant, limit=10)
                    if variant_customers.data:
                        print(f"DEBUG: Found {len(variant_customers.data)} customers for email variant {email_variant}")
                        customers = variant_customers
                        break
                
                if not customers.data:
                    print(f"DEBUG: No Stripe customers found for {user_email} or variations")
                    return JsonResponse({
                        'has_subscription': False,
                        'status': None,
                        'period_end': None,
                        'plan': None,
                        'source': 'stripe_direct',
                        'debug': f'No Stripe customer found for {user_email}'
                    })
            
            customer = customers.data[0]
            print(f"DEBUG: Using customer {customer.id} with email {customer.email}")
            
            # Get customer's subscriptions (check all statuses, not just active)
            all_subscriptions = stripe.Subscription.list(
                customer=customer.id,
                limit=10
            )
            
            print(f"DEBUG: Found {len(all_subscriptions.data)} total subscriptions for customer")
            for sub in all_subscriptions.data:
                period_end = getattr(sub, 'current_period_end', 'N/A')
                print(f"DEBUG: Subscription {sub.id}: status={sub.status}, current_period_end={period_end}")
            
            # Check for any valid subscriptions (active, trialing, past_due)
            valid_statuses = ['active', 'trialing', 'past_due']
            valid_subscriptions = [sub for sub in all_subscriptions.data if sub.status in valid_statuses]
            print(f"DEBUG: Found {len(valid_subscriptions)} valid subscriptions (active, trialing, past_due)")
            
            if not valid_subscriptions:
                # Show all subscription statuses for debugging
                statuses = [f"{sub.id}:{sub.status}" for sub in all_subscriptions.data]
                return JsonResponse({
                    'has_subscription': False,
                    'status': None,
                    'period_end': None,
                    'plan': None,
                    'source': 'stripe_direct',
                    'debug': f'Customer {customer.id} has no valid subscriptions. Found: {statuses}'
                })
            
            subscription = valid_subscriptions[0]
            plan_name = None
            
            # Get pricing from our database plan (more reliable than Stripe items)
            active_plan = SubscriptionPlan.get_active_plan()
            amount = None
            plan_name = None
            
            if active_plan:
                amount = active_plan.amount_cents
                plan_name = active_plan.name
                print(f"DEBUG: Using database plan pricing: {amount} cents")
            else:
                # Fallback to settings
                fallback_settings = settings.STRIPE_SETTINGS
                amount = fallback_settings['MONTHLY_AMOUNT']
                plan_name = fallback_settings['PRODUCT_NAME']
                print(f"DEBUG: Using fallback pricing: {amount} cents")
            
            # Handle subscriptions that may not have current_period_end (e.g., incomplete, canceled)
            period_end = getattr(subscription, 'current_period_end', None)

            return JsonResponse({
                'has_subscription': True,
                'status': subscription.status,
                'period_end': period_end,
                'plan': plan_name,
                'amount': f"${amount/100:.0f}" if amount else None,
                'source': 'stripe_direct',
                'stripe_customer_id': customer.id,
                'stripe_subscription_id': subscription.id
            })

        except Exception as e:
            print(f"DEBUG: Error checking Stripe subscription: {str(e)}")
            import traceback
            print(f"DEBUG: Full traceback: {traceback.format_exc()}")
            return JsonResponse({'error': str(e)}, status=400)


class PricingView(View):
    def get(self, request):
        """Get current pricing for frontend display"""
        active_plan = SubscriptionPlan.get_active_plan()
        fallback_settings = settings.STRIPE_SETTINGS
        
        if active_plan:
            return JsonResponse({
                'name': active_plan.name,
                'description': active_plan.description,
                'price': active_plan.amount_cents,
                'price_display': f"${active_plan.amount_cents/100:.0f}",
                'interval': active_plan.interval,
                'features': [
                    'Custom domain hosting',
                    'SSL certificates included',
                    'CDN acceleration',
                    'Email support',
                ]
            })
        else:
            # Fallback to settings
            return JsonResponse({
                'name': fallback_settings['PRODUCT_NAME'],
                'description': fallback_settings['PRODUCT_DESCRIPTION'],
                'price': fallback_settings['MONTHLY_AMOUNT'],
                'price_display': f"${fallback_settings['MONTHLY_AMOUNT']/100:.0f}",
                'interval': 'month',
                'features': [
                    'Custom domain hosting',
                    'SSL certificates included',
                    'CDN acceleration',
                    'Email support',
                ]
            })


@method_decorator(csrf_exempt, name='dispatch')
class ForceCreateStripeProductView(View):
    def post(self, request):
        """Force create new Stripe product and price for subscription (overwrites existing)"""
        try:
            active_plan = SubscriptionPlan.get_active_plan()
            if not active_plan:
                return JsonResponse({'error': 'No active subscription plan found. Create one in admin first.'}, status=400)
            
            # Create new product
            product = stripe.Product.create(
                name=active_plan.name,
                description=active_plan.description
            )
            
            # Create new price
            price = stripe.Price.create(
                product=product.id,
                unit_amount=active_plan.amount_cents,
                currency='usd',
                recurring={'interval': active_plan.interval}
            )
            
            # Update plan with new Stripe price ID
            old_price_id = active_plan.stripe_price_id
            active_plan.stripe_price_id = price.id
            active_plan.save()
            
            return JsonResponse({
                'status': 'New product and price created',
                'old_price_id': old_price_id,
                'new_price_id': price.id,
                'product_id': product.id,
                'amount': f"${active_plan.amount_cents/100:.2f}/{active_plan.interval}",
                'message': f'New Stripe price created: {price.id} (replaced {old_price_id})'
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@method_decorator(login_required, name='dispatch')
class DomainCheckView(View):
    """Check domain availability and pricing using real domain APIs"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name', '').strip().lower()
            
            if not domain_name:
                return JsonResponse({'error': 'Domain name is required'}, status=400)
            
            # Validate domain format
            if not self._is_valid_domain(domain_name):
                return JsonResponse({'error': 'Invalid domain format'}, status=400)
            
            # Check availability using Cloudflare
            availability_data = self._check_cloudflare_availability(domain_name)
            
            if availability_data.get('error'):
                return JsonResponse({'error': availability_data['error']}, status=500)
            
            return JsonResponse(availability_data)

        except Exception as e:
            print(f"ERROR: Domain check failed: {str(e)}")
            return JsonResponse({'error': 'Domain check failed'}, status=500)
    
    def _is_valid_domain(self, domain):
        """Validate basic domain format"""
        import re
        pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$'
        return re.match(pattern, domain) is not None
    
    def _check_cloudflare_availability(self, domain):
        """Check domain availability using Cloudflare's public domain API"""
        try:
            # Use Cloudflare's public domain checker (no auth required)
            # This checks domain registration status via WHOIS
            url = f'https://cloudflare-dns.com/dns-query'
            headers = {
                'Accept': 'application/dns-json',
            }
            
            # Query for SOA record - if domain has SOA, it's registered
            params = {
                'name': domain,
                'type': 'SOA'
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            print(f"DEBUG: Cloudflare DNS response for {domain}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"DEBUG: Cloudflare DNS data for {domain}: {data}")
                
                # If we get DNS records, domain is registered (unavailable)
                # Status 0 = NOERROR (domain exists), Status 3 = NXDOMAIN (domain doesn't exist)
                status = data.get('Status', 0)
                answers = data.get('Answer', [])
                
                if status == 0 and answers:
                    # Domain has DNS records = registered
                    available = False
                elif status == 3:
                    # NXDOMAIN = domain not registered = available
                    available = True
                else:
                    # No clear answer, assume unavailable for safety
                    available = False
                    
            else:
                print(f"DEBUG: Cloudflare DNS error: {response.status_code} - {response.text}")
                return {'error': f'DNS query failed: {response.status_code}'}
            
            # Get pricing from our standard pricing table
            tld = domain.split('.')[-1]
            pricing = settings.DOMAIN_API_CONFIG['STANDARD_PRICING'].get(tld)
            
            if not pricing:
                pricing = 19.99  # Default price for unknown TLDs
            
            return {
                'domain': domain,
                'available': available,
                'price_usd': pricing,
                'provider': 'cloudflare_dns',
                'registrar': 'Manual Registration'
            }
            
        except requests.RequestException as e:
            print(f"DEBUG: Cloudflare DNS request error: {str(e)}")
            return {'error': 'Network error checking domain'}
        except Exception as e:
            print(f"DEBUG: Cloudflare availability check error: {str(e)}")
            return {'error': 'Domain availability check failed'}


@method_decorator(login_required, name='dispatch')
class DomainOrderView(View):
    """Create Stripe checkout session for domain purchase"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            domain_name = data.get('domain_name', '').strip().lower()
            price_usd = data.get('price_usd')
            
            if not domain_name or not price_usd:
                return JsonResponse({'error': 'Domain name and price are required'}, status=400)
            
            # Verify domain is still available (final check before payment)
            domain_check = DomainCheckView()
            availability_response = domain_check.post(request)
            
            if availability_response.status_code != 200:
                return JsonResponse({'error': 'Unable to verify domain availability'}, status=400)
            
            availability_data = json.loads(availability_response.content)
            
            if not availability_data.get('available'):
                return JsonResponse({'error': 'Domain is no longer available'}, status=400)
            
            # Verify pricing matches (prevent price manipulation)
            if abs(float(availability_data.get('price_usd', 0)) - float(price_usd)) > 0.01:
                return JsonResponse({'error': 'Price has changed, please refresh'}, status=400)
            
            # Create Stripe checkout session for domain purchase
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Domain Registration: {domain_name}',
                            'description': f'1-year registration for {domain_name}',
                        },
                        'unit_amount': int(float(price_usd) * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',  # One-time payment, not subscription
                customer_email=request.user.email,
                success_url=request.build_absolute_uri('/dashboard?domain_success=true'),
                cancel_url=request.build_absolute_uri('/dashboard'),
                metadata={
                    'type': 'domain_purchase',
                    'domain_name': domain_name,
                    'user_email': request.user.email,
                    'price_usd': str(price_usd),
                    'provider': availability_data.get('provider', 'cloudflare_dns')
                }
            )
            
            print(f"DEBUG: Created domain checkout for {domain_name} at ${price_usd} for user {request.user.email}")
            
            return JsonResponse({
                'checkout_url': checkout_session.url,
                'domain': domain_name,
                'price': price_usd
            })
            
        except stripe.error.StripeError as e:
            print(f"ERROR: Stripe error creating domain checkout: {str(e)}")
            return JsonResponse({'error': 'Payment processing error'}, status=500)
        except Exception as e:
            print(f"ERROR: Domain order creation failed: {str(e)}")
            return JsonResponse({'error': 'Domain order failed'}, status=500)


@method_decorator(login_required, name='dispatch')
class DomainOrderWithHostingView(View):
    """Create Stripe checkout session for domains + hosting subscription"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            domains = data.get('domains', [])
            include_hosting = data.get('include_hosting', False)
            
            if not domains and not include_hosting:
                return JsonResponse({'error': 'Either domains or hosting is required'}, status=400)
            
            # Verify all domains are still available (if any domains provided)
            domain_check = DomainCheckView()
            line_items = []
            domain_metadata = []
            
            for domain_data in domains:
                domain_name = domain_data.get('domain_name', '').strip().lower()
                price_usd = domain_data.get('price_usd')
                
                if not domain_name or not price_usd:
                    return JsonResponse({'error': f'Invalid domain data for {domain_name}'}, status=400)
                
                # Verify domain availability
                mock_request = type('MockRequest', (), {
                    'method': 'POST',
                    'body': json.dumps({'domain_name': domain_name}).encode(),
                    'user': request.user
                })()
                
                availability_response = domain_check.post(mock_request)
                if availability_response.status_code != 200:
                    return JsonResponse({'error': f'Unable to verify {domain_name} availability'}, status=400)
                
                availability_data = json.loads(availability_response.content)
                if not availability_data.get('available'):
                    return JsonResponse({'error': f'{domain_name} is no longer available'}, status=400)
                
                # Verify pricing matches
                if abs(float(availability_data.get('price_usd', 0)) - float(price_usd)) > 0.01:
                    return JsonResponse({'error': f'Price changed for {domain_name}, please refresh'}, status=400)
                
                # Add domain to line items
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Domain Registration: {domain_name}',
                            'description': f'1-year registration for {domain_name}',
                        },
                        'unit_amount': int(float(price_usd) * 100),  # Convert to cents
                    },
                    'quantity': 1,
                })
                
                domain_metadata.append(f"{domain_name}:${price_usd}")
            
            # Add hosting subscription if requested
            if include_hosting:
                active_plan = SubscriptionPlan.get_active_plan()
                if active_plan:
                    # Create dynamic price data from database
                    line_items.append({
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': active_plan.name,
                                'description': active_plan.description,
                            },
                            'unit_amount': active_plan.amount_cents,
                            'recurring': {'interval': active_plan.interval}
                        },
                        'quantity': 1,
                    })
                else:
                    # Fallback to settings with dynamic pricing
                    fallback_settings = settings.STRIPE_SETTINGS
                    line_items.append({
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': fallback_settings['PRODUCT_NAME'],
                                'description': fallback_settings['PRODUCT_DESCRIPTION'],
                            },
                            'unit_amount': fallback_settings['MONTHLY_AMOUNT'],
                            'recurring': {'interval': 'month'}
                        },
                        'quantity': 1,
                    })
            
            # Determine checkout mode
            mode = 'subscription' if include_hosting else 'payment'
            
            # Create Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode=mode,
                customer_email=request.user.email,
                success_url=request.build_absolute_uri('/dashboard?domain_hosting_success=true'),
                cancel_url=request.build_absolute_uri('/dashboard'),
                metadata={
                    'type': 'domain_hosting_bundle',
                    'domains': ';'.join(domain_metadata),
                    'user_email': request.user.email,
                    'include_hosting': str(include_hosting),
                    'user_id': str(request.user.id)
                }
            )
            
            print(f"DEBUG: Created combined checkout for {len(domains)} domains + hosting for user {request.user.email}")
            
            return JsonResponse({
                'checkout_url': checkout_session.url,
                'domains': [d['domain_name'] for d in domains],
                'include_hosting': include_hosting
            })
            
        except stripe.error.StripeError as e:
            print(f"ERROR: Stripe error creating combined checkout: {str(e)}")
            return JsonResponse({'error': 'Payment processing error'}, status=500)
        except Exception as e:
            print(f"ERROR: Combined order creation failed: {str(e)}")
            return JsonResponse({'error': 'Order creation failed'}, status=500)


@method_decorator(login_required, name='dispatch')
class CreateCustomerPortalView(View):
    """Create Stripe customer portal session for subscription management"""
    
    def post(self, request):
        try:
            # Get user's email to find Stripe customer
            user_email = request.user.email
            print(f"DEBUG: Creating portal session for user email: {user_email}")
            
            # Search for customer by email in Stripe
            customers = stripe.Customer.list(email=user_email, limit=10)
            print(f"DEBUG: Found {len(customers.data)} customers for email {user_email}")
            
            if not customers.data:
                return JsonResponse({'error': 'No Stripe customer found'}, status=404)
            
            customer = customers.data[0]
            print(f"DEBUG: Using customer {customer.id} with email {customer.email}")
            
            # Create customer portal session
            portal_session = stripe.billing_portal.Session.create(
                customer=customer.id,
                return_url=request.build_absolute_uri('/dashboard'),
            )
            
            print(f"DEBUG: Created portal session {portal_session.id} for customer {customer.id}")
            
            return JsonResponse({
                'portal_url': portal_session.url,
                'customer_id': customer.id
            })
            
        except stripe.error.StripeError as e:
            print(f"ERROR: Stripe error creating portal session: {str(e)}")
            return JsonResponse({'error': 'Failed to create portal session'}, status=500)
        except Exception as e:
            print(f"ERROR: Portal session creation failed: {str(e)}")
            return JsonResponse({'error': 'Portal session creation failed'}, status=500)

# User views will be added here as needed 