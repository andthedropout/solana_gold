import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useSiteSettings as useOriginalSiteSettings } from '@/hooks/useSiteSettings'
import { useCMS } from './CMSContext'

// Page section interface
interface PageSection {
  id: string
  component_type: string
  visible?: boolean
  background?: {
    static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card'
    animated_type?: string
    opacity?: number
  }
}

// Type matching the backend SiteSettings model structure
interface SiteSettings {
  // Company Information
  company_name: string
  company_logo: string
  company_logo_light: string
  company_logo_dark: string
  favicon: string
  
  // Contact Information  
  contact_email: string
  contact_phone: string
  contact_address: string
  
  // Header Configuration
  header_type: 'floating' | 'clean' | 'professional' | 'sidebar'
  header_show_logo: boolean
  header_show_company_name: boolean
  header_show_dark_mode_toggle: boolean
  header_show_login: boolean
  header_show_signup: boolean
  header_background_transparent: boolean
  header_is_sticky: boolean
  header_logo_alt: string
  
  // Footer Configuration
  footer_show_footer: boolean
  footer_show_top_section: boolean
  footer_show_bottom_section: boolean
  footer_show_logo: boolean
  footer_show_tagline: boolean
  footer_show_navigation: boolean
  
  // Social Media
  social_facebook: string
  social_twitter: string
  social_instagram: string
  social_linkedin: string
  social_youtube: string
}

interface CMSPreviewContextType {
  // Settings state
  savedSettings: SiteSettings | null
  previewSettings: SiteSettings | null
  
  // Page sections state
  savedSections: PageSection[] | null
  previewSections: PageSection[] | null
  
  // Section content state (for real-time preview)
  sectionContent: Map<string, any>
  
  // State flags
  isDirty: boolean
  isSectionsLoading: boolean
  isSaving: boolean
  
  // Actions
  updatePreview: (partial: Partial<SiteSettings>) => void
  updateSections: (sections: PageSection[]) => void
  updateSectionContent: (sectionId: string, content: any) => void
  getSectionContent: (sectionId: string) => any
  loadPageSections: (pageId: string) => Promise<void>
  saveChanges: () => Promise<void>
  resetToSaved: () => void
  
  // Helper to get current settings (preview or saved)
  getCurrentSettings: () => SiteSettings | null
  getCurrentSections: () => PageSection[] | null
}

const CMSPreviewContext = createContext<CMSPreviewContextType | undefined>(undefined)

interface CMSPreviewProviderProps {
  children: ReactNode
}

// Helper function to get default content for a section type
const getDefaultContentForSection = async (componentType: string) => {
  try {
    // Use the same glob pattern as the discovery system to find the component
    const modules = import.meta.glob('../sections/**/*.tsx', { eager: false });
    
    for (const [path, moduleLoader] of Object.entries(modules)) {
      // Extract component name from file path
      const fileName = path.split('/').pop()?.replace('.tsx', '') || '';
      
      if (fileName === componentType) {
        const module = await moduleLoader();
        return module[`${componentType}DefaultContent`] || {};
      }
    }
    
    throw new Error(`Component ${componentType} not found`)
  } catch (error) {
    console.error(`Failed to get default content for ${componentType}:`, error)
    return {}
  }
}

export const CMSPreviewProvider: React.FC<CMSPreviewProviderProps> = ({ children }) => {
  const { settings: originalSettings, loading: originalLoading } = useOriginalSiteSettings()
  const { currentPage } = useCMS()
  
  const [savedSettings, setSavedSettings] = useState<SiteSettings | null>(null)
  const [previewSettings, setPreviewSettings] = useState<SiteSettings | null>(null)
  const [savedSections, setSavedSections] = useState<PageSection[] | null>(null)
  const [previewSections, setPreviewSections] = useState<PageSection[] | null>(null)
  const [sectionContent, setSectionContent] = useState<Map<string, any>>(new Map())
  const [isSectionsLoading, setIsSectionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Sync with backend settings when they load
  useEffect(() => {
    if (originalSettings && !originalLoading) {
      setSavedSettings(originalSettings)
      // Only set preview if it hasn't been set yet (preserve user changes)
      if (!previewSettings) {
        setPreviewSettings(originalSettings)
      }
    }
  }, [originalSettings, originalLoading])
  
  // Calculate if there are unsaved changes
  const settingsDirty = previewSettings && savedSettings ? 
    JSON.stringify(previewSettings) !== JSON.stringify(savedSettings) : false
  const sectionsDirty = previewSections && savedSections ?
    JSON.stringify(previewSections) !== JSON.stringify(savedSections) : false
  const isDirty = settingsDirty || sectionsDirty
  
  const updatePreview = (partial: Partial<SiteSettings>) => {
    if (!previewSettings) return
    
    setPreviewSettings(prev => ({
      ...prev!,
      ...partial
    }))
  }

  const updateSections = (sections: PageSection[]) => {
    setPreviewSections([...sections])
  }

  const updateSectionContent = (sectionId: string, content: any) => {
    try {
      console.log('🗄️ UPDATING SECTION CONTENT IN CONTEXT:');
      console.log('Section ID:', sectionId);
      console.log('Content:', content);
      
      setSectionContent(prev => {
        try {
          const newMap = new Map(prev)
          newMap.set(sectionId, content)
          console.log('📊 Section content map updated. Current size:', newMap.size);
          console.log('📊 All section IDs in map:', Array.from(newMap.keys()));
          return newMap
        } catch (error) {
          console.warn('Section content map update warning:', error);
          return prev; // Return previous state on error
        }
      })
    } catch (error) {
      console.warn('Section content update warning:', error);
    }
  }

  const getSectionContent = (sectionId: string) => {
    return sectionContent.get(sectionId)
  }

  const loadPageSections = useCallback(async (pageId: string) => {
    setIsSectionsLoading(true)
    try {
      const response = await fetch(`/api/v1/pages/${pageId}/`)
      if (response.ok) {
        const pageData = await response.json()
        const sections = pageData.sections || []
        setSavedSections(sections)
        setPreviewSections([...sections])
      }
    } catch (error) {
      console.error('Error loading page sections:', error)
    } finally {
      setIsSectionsLoading(false)
    }
  }, [])

  // Load sections when current page changes
  useEffect(() => {
    if (currentPage?.id) {
      loadPageSections(currentPage.id)
    }
  }, [currentPage?.id])
  
  const saveChanges = async () => {
    if (!isDirty) return
    
    setIsSaving(true)
    try {
      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                       document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
      
      // Save settings if they've changed
      if (settingsDirty && previewSettings) {
        console.log('Saving preview settings:', previewSettings)
        const response = await fetch('/api/v1/settings/', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify(previewSettings)
        })
        
        if (response.ok) {
          const updatedSettings = await response.json()
          setSavedSettings(updatedSettings)
          setPreviewSettings(updatedSettings)
          console.log('Settings saved successfully')
        } else {
          const errorData = await response.json()
          console.error('Backend validation errors:', errorData)
          console.error('Request payload was:', JSON.stringify(previewSettings, null, 2))
          throw new Error('Failed to save settings')
        }
      }

      // Save any modified section content first
      if (sectionContent.size > 0) {
        for (const [sectionId, content] of sectionContent.entries()) {
          const response = await fetch(`/public/sections/${sectionId}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to save section ${sectionId}: ${response.status}`);
          }
        }
        
        // Clear section content after successful save
        setSectionContent(new Map())
      }

      // Save sections if they've changed
      if (sectionsDirty && previewSections && savedSections && currentPage?.id) {
        // First, create any new sections that exist in preview but not in backend
        const newSections = previewSections.filter(preview => 
          !savedSections.find(saved => saved.id === preview.id)
        )
        
        for (const newSection of newSections) {
          try {
            // Get the content for this section (either modified or default)
            const content = sectionContent.get(newSection.id) || await getDefaultContentForSection(newSection.component_type)
            
            await fetch(`/public/sections/${newSection.id}/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            })
            console.log('Created new section in backend:', newSection.id)
          } catch (error) {
            console.error('Failed to create section in backend:', newSection.id, error)
            throw new Error(`Failed to create section ${newSection.id}`)
          }
        }
        
        // Second, delete any sections that were removed
        const removedSections = savedSections.filter(saved => 
          !previewSections.find(preview => preview.id === saved.id)
        )
        
        for (const removedSection of removedSections) {
          try {
            await fetch(`/public/sections/${removedSection.id}/`, {
              method: 'DELETE'
            })
            console.log('Deleted section from backend:', removedSection.id)
          } catch (error) {
            console.warn('Failed to delete section from backend:', removedSection.id, error)
          }
        }
        
        console.log('Saving sections for page:', currentPage.id, 'sections:', previewSections)
        
        const response = await fetch(`/api/v1/pages/${currentPage.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ sections: previewSections })
        })
        
        if (response.ok) {
          setSavedSections([...previewSections])
          console.log('Page sections saved successfully')
        } else {
          const errorData = await response.json()
          console.error('Failed to save sections:', errorData)
          throw new Error('Failed to save sections')
        }
      }
      
    } catch (error) {
      console.error('Error saving changes:', error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }
  
  const resetToSaved = () => {
    if (savedSettings) {
      setPreviewSettings({ ...savedSettings })
    }
    if (savedSections) {
      setPreviewSections([...savedSections])
    }
  }
  
  const getCurrentSettings = () => previewSettings || savedSettings
  const getCurrentSections = () => previewSections || savedSections
  
  const value: CMSPreviewContextType = {
    savedSettings,
    previewSettings,
    savedSections,
    previewSections,
    sectionContent,
    isDirty,
    isSectionsLoading,
    isSaving,
    updatePreview,
    updateSections,
    updateSectionContent,
    getSectionContent,
    loadPageSections,
    saveChanges,
    resetToSaved,
    getCurrentSettings,
    getCurrentSections
  }
  
  return (
    <CMSPreviewContext.Provider value={value}>
      {children}
    </CMSPreviewContext.Provider>
  )
}

export const useCMSPreview = () => {
  const context = useContext(CMSPreviewContext)
  if (context === undefined) {
    throw new Error('useCMSPreview must be used within a CMSPreviewProvider')
  }
  return context
} 