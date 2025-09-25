import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Globe } from 'lucide-react';

interface DomainQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onYes: () => void;
  onNo: () => void;
}

export default function DomainQuestionModal({ isOpen, onClose, onYes, onNo }: DomainQuestionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        className="rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{ backgroundColor: 'var(--card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-semibold" style={{ color: 'var(--card-foreground)' }}>
            Custom Domain
          </h2>
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
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 mb-4 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent)' }}>
              <Globe className="h-6 w-6" style={{ color: 'var(--accent-foreground)' }} />
            </div>
            
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--card-foreground)' }}>
              Would you like a custom domain?
            </h3>
            
            <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Example: www.yourdomain.com
            </p>
            
            <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
              We can help you find and register the perfect domain name for your website.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={onNo}
                variant="outline"
                className="px-6"
              >
                No, just hosting
              </Button>
              <Button
                onClick={onYes}
                className="px-6"
              >
                Yes, find domain
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
} 