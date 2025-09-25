import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { getCookie } from '@/utils/getCookie';
import DomainQuestionModal from './DomainQuestionModal';
import DomainSelectionModal from './DomainSelectionModal';

interface PricingData {
  name: string;
  description: string;
  price: number;
  price_display: string;
  interval: string;
  features: string[];
}

interface SubscriptionPlanProps {
  onSubscribe?: () => void;
}

const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({ onSubscribe }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDomainQuestionOpen, setIsDomainQuestionOpen] = useState(false);
  const [isDomainSelectionOpen, setIsDomainSelectionOpen] = useState(false);

  // Fetch pricing data from backend
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/v1/pricing/');
        if (!response.ok) {
          throw new Error('Failed to fetch pricing');
        }
        const data = await response.json();
        setPricingData(data);
      } catch (err) {
        setError('Failed to load pricing information');
        console.error('Error fetching pricing:', err);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricing();
  }, []);

  const handleSubscribe = () => {
    // Show domain question modal instead of going directly to checkout
    setIsDomainQuestionOpen(true);
  };

  const handleDomainQuestionYes = () => {
    setIsDomainQuestionOpen(false);
    setIsDomainSelectionOpen(true);
  };

  const handleDomainQuestionNo = async () => {
    setIsDomainQuestionOpen(false);
    // Proceed directly to subscription checkout
    await proceedToCheckout();
  };

  const proceedToCheckout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get CSRF token using the same pattern as login/signup
      await fetch('/api/v1/csrf_token/', {
        method: 'GET',
        credentials: 'include',
      });

      const csrfToken = getCookie('csrftoken');
      
      if (!csrfToken) {
        throw new Error('CSRF token not found. Please refresh and try again.');
      }

      // Create checkout session
      const response = await fetch('/api/v1/subscriptions/create-checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('CSRF verification failed. Please refresh the page and try again.');
        }
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start subscription. Please try again.');
      console.error('Error creating checkout:', err);
      setIsLoading(false);
    }
  };

  if (isLoadingPricing) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-primary shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading pricing...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !pricingData) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-destructive shadow-lg">
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pricingData) return null;

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-primary shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">{pricingData.name}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {pricingData.description}
          </CardDescription>
          
          <div className="pt-4">
            <div className="text-5xl font-bold text-foreground">
              {pricingData.price_display}
            </div>
            <div className="text-muted-foreground">
              per {pricingData.interval}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Billed {pricingData.interval}ly • Cancel anytime
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {pricingData.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          
          {error && (
            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}
          
          <Button 
            className="w-full text-lg py-6" 
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating checkout...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Start Subscription
              </>
            )}
          </Button>
          
          <div className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe
          </div>
        </CardContent>
      </Card>

      {/* Domain Question Modal */}
      <DomainQuestionModal
        isOpen={isDomainQuestionOpen}
        onClose={() => setIsDomainQuestionOpen(false)}
        onYes={handleDomainQuestionYes}
        onNo={handleDomainQuestionNo}
      />

      {/* Domain Selection Modal */}
      <DomainSelectionModal
        isOpen={isDomainSelectionOpen}
        onClose={() => setIsDomainSelectionOpen(false)}
      />
    </div>
  );
};

export default SubscriptionPlan; 