import { loadStripe } from '@stripe/stripe-js';

// This will be configured with environment variables later
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Initialize Stripe
export const stripePromise = loadStripe(stripePublicKey);

// Subscription configuration
export const SUBSCRIPTION_CONFIG = {
  hostingPlan: {
    name: 'Professional Hosting',
    price: 15,
    currency: 'usd',
    interval: 'month',
    features: [
      'Professional Website Hosting',
      'Custom Domain Support', 
      'SSL Certificate Included',
      '99.9% Uptime Guarantee',
      '24/7 Technical Support',
      'Monthly Performance Reports'
    ]
  }
} as const;

// Stripe configuration options
export const STRIPE_OPTIONS = {
  mode: 'subscription' as const,
  submit_type: 'auto' as const,
} as const; 