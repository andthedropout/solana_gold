import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
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

export const CMSPageRoute: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('No page slug provided');
      setLoading(false);
      return;
    }

    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/v1/pages/by-slug/${slug}/`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Page not found');
          } else {
            setError('Failed to load page');
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
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pageData) {
    return <Navigate to="/" replace />;
  }

  return <PageRenderer pageData={pageData} />;
}; 