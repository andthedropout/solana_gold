import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { PageRenderer } from './PageRenderer';

interface PageData {
  id: string;
  title: string;
  slug: string;
  sections: Array<{
    id: string;
    component_type: string;
    background?: {
      type: 'static' | 'animated';
      static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
      animated_type?: string;
      opacity?: number;
    };
  }>;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
}

export const CMSHomepage: React.FC = () => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        const response = await fetch('/api/v1/pages/by-slug/home/');
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Homepage not found. Create a page with slug "home" in the admin.');
          } else {
            setError('Failed to load homepage');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPageData(data);
        
        // Set page meta tags
        if (data.meta_title) {
          document.title = data.meta_title;
        } else {
          document.title = data.title;
        }
        
        if (data.meta_description) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.meta_description);
          }
        }
        
      } catch (err) {
        setError('Failed to load homepage');
      } finally {
        setLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Homepage Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || 'Homepage could not be loaded.'}
          </p>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p><strong>Admin Instructions:</strong></p>
            <p>1. Go to Django admin</p>
            <p>2. Create a new Page</p>
            <p>3. Set slug to "home"</p>
            <p>4. Mark as published</p>
          </div>
        </div>
      </div>
    );
  }

  return <PageRenderer pageData={pageData} />;
}; 