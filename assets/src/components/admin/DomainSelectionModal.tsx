import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Loader2 } from 'lucide-react';

interface DomainResult {
  domain: string;
  available: boolean;
  price_usd: number;
  provider: string;
  registrar: string;
}

interface DomainSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasActiveSubscription: boolean;
}

// Helper function to get CSRF token
function getCookie(name: string): string | null {
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
}

export default function DomainSelectionModal({ isOpen, onClose, hasActiveSubscription }: DomainSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<DomainResult[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hostingPrice, setHostingPrice] = useState(15.00);
  const [currentStep, setCurrentStep] = useState<'selection' | 'checkout'>('selection');

  // Fetch pricing when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const fetchPricing = async () => {
        try {
          const response = await fetch('/api/v1/pricing/');
          if (response.ok) {
            const data = await response.json();
            setHostingPrice(data.price / 100); // Convert cents to dollars
          }
        } catch (error) {
          console.error('Failed to fetch pricing:', error);
          // Keep default $15.00 if fetch fails
        }
      };
      fetchPricing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinueToCheckout = () => {
    setCurrentStep('checkout');
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError('Please enter a domain name');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setDomainResults([]);

    try {
      // Generate domain variations to check
      const baseDomain = searchTerm.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const domainsToCheck = [
        `${baseDomain}.com`,
        `${baseDomain}.net`,
        `${baseDomain}.org`,
        `${baseDomain}.io`,
        `${baseDomain}.co`
      ];

      const results: DomainResult[] = [];

      // Check each domain sequentially to avoid rate limiting
      for (const domain of domainsToCheck) {
        try {
          const response = await fetch('/api/v1/domains/check/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken') || '',
            },
            credentials: 'include',
            body: JSON.stringify({ domain_name: domain })
          });

          if (response.ok) {
            const data = await response.json();
            results.push(data);
          } else {
            console.error(`Failed to check ${domain}:`, response.status);
          }
        } catch (error) {
          console.error(`Error checking ${domain}:`, error);
        }

        // Small delay between requests to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Sort results: available domains first, then unavailable
      const sortedResults = results.sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return 0;
      });

      setDomainResults(sortedResults);

      if (results.length === 0) {
        setSearchError('Unable to check domain availability. Please try again.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDomain = (domain: DomainResult) => {
    setSelectedDomains(prev => {
      const isAlreadySelected = prev.some(d => d.domain === domain.domain);
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(d => d.domain !== domain.domain);
      } else {
        // Add to selection
        return [...prev, domain];
      }
    });
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setSearchError('');

    try {
      // Create combined checkout for domains + hosting subscription
      const response = await fetch('/api/v1/domains/order-with-hosting/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          domains: selectedDomains.map(domain => ({
            domain_name: domain.domain,
            price_usd: domain.price_usd
          })),
          include_hosting: !hasActiveSubscription
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        const errorData = await response.json();
        setSearchError(errorData.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setSearchError('Failed to create order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getTotalPrice = () => {
    return selectedDomains.reduce((total, domain) => total + domain.price_usd, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-4">
            {currentStep === 'checkout' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
            )}
            <h2 className="text-xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
              {currentStep === 'selection' ? 'Select Domains' : 'Review & Checkout'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'selection' ? (
            <>
              {/* Search Section */}
              <div className="mb-6">
                <label 
                  htmlFor="domain-search" 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--card-foreground)' }}
                >
                  Search for available domains
                </label>
                <div className="flex gap-3">
                  <Input
                    id="domain-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter domain name (e.g., myawesome site)"
                    disabled={isSearching}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
                {searchError && (
                  <p className="mt-2 text-sm text-red-600">{searchError}</p>
                )}
              </div>

              {/* Results Section */}
              {domainResults.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--card-foreground)' }}>
                    Available Domains
                  </h3>
                  {domainResults.map((result) => {
                    const isSelected = selectedDomains.some(d => d.domain === result.domain);
                    return (
                      <Card
                        key={result.domain}
                        className={result.available ? (isSelected ? 'border-blue-300' : 'border-green-200') : ''}
                        style={{
                          backgroundColor: result.available 
                            ? (isSelected ? 'var(--primary)/10' : 'var(--accent)') 
                            : 'var(--muted)',
                          borderColor: result.available 
                            ? (isSelected ? '#93c5fd' : '#bbf7d0') 
                            : 'var(--border)'
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium" style={{ color: 'var(--card-foreground)' }}>
                                  {result.domain}
                                </h4>
                                <Badge variant={result.available ? 'default' : 'secondary'}>
                                  {result.available ? 'Available' : 'Unavailable'}
                                </Badge>
                                {isSelected && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                              {result.available && result.price_usd && (
                                <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                                  ${result.price_usd}/year
                                </p>
                              )}
                            </div>
                            {result.available && result.price_usd && (
                              <Button
                                onClick={() => handleSelectDomain(result)}
                                variant={isSelected ? "destructive" : "default"}
                                className="px-4"
                              >
                                {isSelected ? 'Remove' : 'Select'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleContinueToCheckout}
                  className="px-6"
                  disabled={hasActiveSubscription && selectedDomains.length === 0}
                >
                  Continue
                </Button>
              </div>
              
              {/* Help text for existing subscribers */}
              {hasActiveSubscription && selectedDomains.length === 0 && (
                <p className="text-xs text-center mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Select at least one domain to continue
                </p>
              )}

              {/* Loading State */}
              {isSearching && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>Checking domain availability...</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Checkout Section */}
              <div className="space-y-6">
                <div className="text-left">
                  <h4 className="font-medium mb-4" style={{ color: 'var(--card-foreground)' }}>
                    {selectedDomains.length > 0 ? `Selected Domains (${selectedDomains.length})` : hasActiveSubscription ? 'Domain Purchase' : 'Hosting Subscription'}
                  </h4>
                  <div className="space-y-3 text-sm">
                    {selectedDomains.length > 0 && (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span style={{ color: 'var(--card-foreground)' }}>
                            Domains (1 year) - {selectedDomains.map(domain => domain.domain).join(', ')}:
                          </span>
                        </div>
                        <span style={{ color: 'var(--muted-foreground)' }}>${getTotalPrice().toFixed(2)}</span>
                      </div>
                    )}
                    {!hasActiveSubscription && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--card-foreground)' }}>Hosting (monthly):</span>
                        <span style={{ color: 'var(--muted-foreground)' }}>${hostingPrice.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex justify-between font-medium text-lg">
                        <span style={{ color: 'var(--card-foreground)' }}>Today's Total:</span>
                        <span style={{ color: 'var(--card-foreground)' }}>${(getTotalPrice() + (hasActiveSubscription ? 0 : hostingPrice)).toFixed(2)}</span>
                      </div>
                      <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        {selectedDomains.length > 0 ? '' + (hasActiveSubscription ? '' : ', hosting billed monthly') : 'Hosting billed monthly'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="px-8"
                    size="lg"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Purchase'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 