import React, { useEffect } from 'react';
import { SectionWrapper } from './SectionWrapper';
import { useCMS } from '@/components/admin/CMSContext';
import { useCMSPreview } from '@/components/admin/CMSPreviewContext';

interface PageData {
  id: string;
  title: string;
  slug: string;
  sections: Array<{
    id: string;
    component_type: string;
    visible?: boolean;
    background?: {
      static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
      animated_type?: string;
      opacity?: number;
    };
  }>;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
}

interface PageRendererProps {
  pageData: PageData;
}

export const PageRenderer: React.FC<PageRendererProps> = ({ pageData }) => {
  const { setCurrentPage, setIsCMSPageActive } = useCMS();
  const { getCurrentSections } = useCMSPreview();

  // Set current page in CMS context when this page renders
  useEffect(() => {
    setCurrentPage(pageData);
    setIsCMSPageActive(true);
    
    // Clean up when leaving CMS page
    return () => {
      setIsCMSPageActive(false);
    };
  }, [pageData, setCurrentPage, setIsCMSPageActive]);

  // Use preview sections if available, otherwise fall back to pageData sections
  const allSections = getCurrentSections() || pageData.sections;
  
  // Filter out hidden sections (visible === false)
  const sectionsToRender = allSections.filter(section => section.visible !== false);

  return (
    <div className="min-h-screen">
      {sectionsToRender.map((section, index) => (
        <div key={section.id}>
          <SectionWrapper
            sectionId={section.id}
            componentType={section.component_type}
            background={section.background}
            isFirst={index === 0}
            isLast={index === sectionsToRender.length - 1}
          />
        </div>
      ))}
    </div>
  );
}; 