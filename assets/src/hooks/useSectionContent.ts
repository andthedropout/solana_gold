import { useEffect, useState, useRef } from 'react';
import { useCMSPreview } from '@/components/admin/CMSPreviewContext';

interface UseSectionContentReturn<T> {
  content: T;
  loading: boolean;
  error: string | null;
  updateContent: (newContent: Partial<T>) => Promise<void>;
  previewContent: (newContent: Partial<T>) => void;
  saveContent: (newContent: Partial<T>) => Promise<void>;
}

// Track ongoing section creation to prevent race conditions
const creatingSection = new Set<string>();

export function useSectionContent<T>(
  sectionId: string, 
  defaultContent: T
): UseSectionContentReturn<T> {
  // Safely access CMSPreview context with fallback
  let getSectionContent, updateSectionContent;
  try {
    const context = useCMSPreview();
    getSectionContent = context.getSectionContent;
    updateSectionContent = context.updateSectionContent;
  } catch (error) {
    // Fallback when context is not available
    getSectionContent = () => null;
    updateSectionContent = () => {};
  }
  
  const [backendContent, setBackendContent] = useState<T>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!sectionId) return;
    
    const fetchContent = async () => {
      // Prevent duplicate requests for the same section
      if (creatingSection.has(sectionId)) {
        if (mountedRef.current) setLoading(false);
        return;
      }
      
      try {
        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }
        
        let response = await fetch(`/public/sections/${sectionId}/`);
        
        if (!mountedRef.current) return;
        
        if (response.status === 404) {
          // Section doesn't exist in backend yet - use default content locally
          if (mountedRef.current) {
            setBackendContent(defaultContent);
            setLoading(false);
          }
          return;
        } else if (!response.ok) {
          throw new Error(`Failed to fetch section: ${response.status}`);
        }
        
        if (!mountedRef.current) return;
        
        const data = await response.json();
        const mergedContent = { ...defaultContent, ...data.content };
        
        if (mountedRef.current) {
          setBackendContent(mergedContent);
        }
        
      } catch (err) {
        if (!mountedRef.current) return;
        
        console.error('Error fetching section content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setBackendContent(defaultContent);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        creatingSection.delete(sectionId);
      }
    };

    fetchContent();
    
    return () => {
      mountedRef.current = false;
      creatingSection.delete(sectionId);
    };
  }, [sectionId]);

  // Merge preview content with backend content, ensuring we always have complete structure
  const previewData = getSectionContent(sectionId);
  
  // Defensive check: ensure preview data structure matches expected schema
  let safePreviewData = previewData;
  if (previewData && defaultContent) {
    // Filter out properties that don't exist in the default content schema
    const allowedKeys = Object.keys(defaultContent);
    safePreviewData = Object.keys(previewData)
      .filter(key => allowedKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = previewData[key];
        return obj;
      }, {} as any);
  }
  
  const content = safePreviewData ? { ...backendContent, ...safePreviewData } : backendContent;
  
  // Force re-render when preview content changes by checking if the preview data changed
  const lastPreviewDataRef = useRef<string>('');
  useEffect(() => {
    try {
      const currentPreviewData = JSON.stringify(safePreviewData);
      if (currentPreviewData !== lastPreviewDataRef.current) {
        lastPreviewDataRef.current = currentPreviewData;
        // Use requestAnimationFrame to avoid conflicts with React's rendering cycle
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            setForceUpdateCounter(prev => prev + 1);
          }
        });
      }
    } catch (error) {
      // Silently handle any JSON serialization errors
      console.warn('Preview data serialization warning:', error);
    }
  }, [safePreviewData]);

  const previewContent = (newContent: Partial<T>): void => {
    try {
      const updatedContent = { ...content, ...newContent };
      console.log('📝 PREVIEW CONTENT CALLED:');
      console.log('Section ID:', sectionId);
      console.log('New content to preview:', newContent);
      console.log('Updated content (merged):', updatedContent);
      
      // Wrap in requestAnimationFrame to ensure it doesn't interfere with React's render cycle
      requestAnimationFrame(() => {
        try {
          updateSectionContent(sectionId, updatedContent);
          console.log('✅ updateSectionContent called with section ID:', sectionId);
        } catch (error) {
          console.warn('Preview update warning:', error);
        }
      });
    } catch (error) {
      console.warn('Preview content processing warning:', error);
    }
  };

  const saveContent = async (newContent: Partial<T>): Promise<void> => {
    try {
      const updatedContent = { ...content, ...newContent };
      
      // First try to update (PATCH)
      let response = await fetch(`/public/sections/${sectionId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });
      
      // If section doesn't exist (404), create it (POST)
      if (response.status === 404) {
        response = await fetch(`/public/sections/${sectionId}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: updatedContent })
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to save section: ${response.status}`);
      }
      
      setBackendContent(updatedContent);
      
    } catch (err) {
      console.error('Error saving section content:', err);
      setError(err instanceof Error ? err.message : 'Failed to save content');
      throw err;
    }
  };

  const updateContent = async (newContent: Partial<T>): Promise<void> => {
    return saveContent(newContent);
  };

  return { 
    content, 
    loading, 
    error,
    updateContent,
    previewContent,
    saveContent
  };
} 