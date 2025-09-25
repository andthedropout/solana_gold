import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Palette } from 'lucide-react';
import SubscriptionPlan from '@/components/admin/SubscriptionPlan';
import DomainSelectionModal from '@/components/admin/DomainSelectionModal';

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string | null;
  period_end: number | null;
  plan: string | null;
  amount: string | null;
  source: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);

  // Fetch subscription status from backend
  useEffect(() => {
    if (isAuthenticated && user?.is_site_manager) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated, user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/v1/subscriptions/status/', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      } else {
        setError('Failed to load subscription status');
      }
    } catch (err) {
      setError('Error loading subscription status');
      console.error('Subscription status error:', err);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Check if user is a site manager
  if (!isAuthenticated || !user?.is_site_manager) {
    return <Navigate to="/login" replace />;
  }

  const handleSubscribe = () => {
    // After successful subscription, refresh status
    setTimeout(() => {
      fetchSubscriptionStatus();
    }, 3000);
  };

  // Helper function to get CSRF token
  const getCookie = (name: string): string | null => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/v1/subscriptions/manage/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe customer portal
        window.location.href = data.portal_url;
      } else {
        console.error('Failed to create portal session');
      }
    } catch (err) {
      console.error('Error creating portal session:', err);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-7xl mx-auto py-8 px-6">
          <CardContent className="p-6">
            {/* Introduction Section */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Welcome to Your Website!
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {isLoadingSubscription
                  ? "Loading your subscription status..."
                  : subscriptionStatus?.has_subscription
                  ? (
                    <>
                      If you'd like to change the theme of your website, click the{' '}
                      <Palette className="inline h-4 w-4 mx-1" />
                      {' '}button in the top right corner.
                    </>
                  )
                  : "Get started with professional website hosting in just a few clicks."
                }
              </p>
              {subscriptionStatus?.has_subscription && (
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
                  Or simply navigate to another page to edit the content.
                </p>
              )}
            </div>

            <hr className="my-12" />

            {/* Subscription Status */}
            {isLoadingSubscription ? (
              <div className="max-w-2xl mx-auto text-center">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-muted-foreground">Checking subscription status...</span>
                </div>
              </div>
            ) : error ? (
              <div className="max-w-2xl mx-auto text-center">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-2xl mb-2">⚠️</div>
                    <div className="text-lg font-semibold mb-2" style={{ color: 'var(--destructive)' }}>
                      Error
                    </div>
                    <p style={{ color: 'var(--muted-foreground)' }}>{error}</p>
                  </CardContent>
                </Card>
              </div>
            ) : subscriptionStatus?.has_subscription ? (
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Hosting Subscription Management - Full Width */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <h3 className="text-lg font-semibold mb-0" style={{ color: 'var(--card-foreground)' }}>
                            Basic hosting - active
                          </h3>
                          <p className="text-sm text-left" style={{ color: 'var(--muted-foreground)' }}>
                            {subscriptionStatus.amount}/month
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleManageSubscription}
                        variant="outline"
                        size="sm"
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Row - Domain and Contact Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Domain Order Section */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl mb-2">🌐</div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--card-foreground)' }}>
                        Add a Custom Domain
                      </h3>
                      
                      <p className="text-sm font-mono mb-4" style={{ color: 'var(--muted-foreground)' }}>
                        www.yourdomain.com
                      </p>
                      
                      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                        Give your website a professional look with a custom domain name. We'll handle the registration and setup.
                      </p>
                      
                      <Button
                        onClick={() => setIsDomainModalOpen(true)}
                        className="w-full"
                      >
                        Order Custom Domain
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Contact Developer Section */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl mb-2">💬</div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--card-foreground)' }}>
                        Contact the Developer
                      </h3>
                      
                      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
                        Need custom features, integrations, or have questions about your website? Get in touch with the developer for personalized support.
                      </p>
                      
                      <Button
                        onClick={() => window.open('mailto:metaphicker@gmail.com', '_blank')}
                        variant="outline"
                        className="w-full"
                      >
                        Get Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Subscription Plan */
              <div className="mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Hosting Plan</h2>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Get professional website hosting with all the features you need to succeed online. 
                    No setup fees, no long-term contracts.
                  </p>
                </div>
                
                <SubscriptionPlan onSubscribe={handleSubscribe} />
              </div>
            )}


          </CardContent>
        </Card>
      </div>

      {/* Domain Selection Modal */}
      <DomainSelectionModal
        isOpen={isDomainModalOpen}
        onClose={() => setIsDomainModalOpen(false)}
        hasActiveSubscription={subscriptionStatus?.has_subscription || false}
      />
    </div>
  );
};

export default Dashboard; 