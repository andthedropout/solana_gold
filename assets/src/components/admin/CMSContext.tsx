import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface CMSContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isEditMode: boolean
  setIsEditMode: (editMode: boolean) => void
  currentPage?: {
    id: string
    title: string
    slug: string
    is_published: boolean
    meta_title?: string
    meta_description?: string
  }
  setCurrentPage: (page: CMSContextType['currentPage']) => void
  isCMSPageActive: boolean
  setIsCMSPageActive: (active: boolean) => void
  shouldShowPanel: boolean
  onThemeEditorChange: (isOpen: boolean) => void
}

const CMSContext = createContext<CMSContextType | undefined>(undefined)

export const useCMS = () => {
  const context = useContext(CMSContext)
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider')
  }
  return context
}

interface CMSProviderProps {
  children: ReactNode
}

export const CMSProvider: React.FC<CMSProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentPage, setCurrentPage] = useState<CMSContextType['currentPage']>()
  const [isCMSPageActive, setIsCMSPageActive] = useState(false)
  const [isThemeEditorOpen, setIsThemeEditorOpen] = useState(false)
  
  const { user, isAuthenticated } = useAuth()
  
  // Check if panel should actually affect layout
  const shouldShowPanel = Boolean(isAuthenticated && user?.is_site_manager && isCMSPageActive)

  // Handle theme editor state changes
  const onThemeEditorChange = (themeEditorOpen: boolean) => {
    if (themeEditorOpen) {
      setIsOpen(false) // Close CMS panel when theme editor opens
      
      // Debug: Check what classes/styles are being added to body/html
      setTimeout(() => {
        console.log('Body classes:', document.body.className)
        console.log('Body style:', document.body.style.cssText)
        console.log('HTML classes:', document.documentElement.className)
        console.log('Body computed margin:', getComputedStyle(document.body).marginLeft)
      }, 100)
    }
    setIsThemeEditorOpen(themeEditorOpen)
  }

  // Push page content when panel is open AND should be visible AND theme editor is not open
  useEffect(() => {
    document.body.style.transition = 'margin-left 0.3s ease, padding-left 0.3s ease'
    
    if (isThemeEditorOpen) {
      // When theme editor is open, reset both margin AND padding to 0
      document.body.style.marginLeft = '0px'
      document.body.style.paddingLeft = '0px'
      document.body.style.setProperty('padding-left', '0px', 'important')
      console.log('Theme editor open - forcing margin and padding to 0px')
    } else if (isOpen && shouldShowPanel) {
      // Only apply CMS margin when theme editor is closed
      document.body.style.marginLeft = '320px'
      document.body.style.paddingLeft = '0px'
      console.log('CMS panel open - setting margin to 320px')
    } else {
      document.body.style.marginLeft = '0px'
      document.body.style.paddingLeft = '0px'
      console.log('Both closed - setting margin and padding to 0px')
    }
    
    return () => {
      document.body.style.marginLeft = '0px'
      document.body.style.paddingLeft = '0px'
      document.body.style.transition = ''
    }
  }, [isOpen, shouldShowPanel, isThemeEditorOpen])

  const value = {
    isOpen,
    setIsOpen,
    isEditMode,
    setIsEditMode,
    currentPage,
    setCurrentPage,
    isCMSPageActive,
    setIsCMSPageActive,
    shouldShowPanel,
    onThemeEditorChange
  }

  return (
    <CMSContext.Provider value={value}>
      {children}
    </CMSContext.Provider>
  )
} 