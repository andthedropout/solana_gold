import React, { useEffect } from 'react'
import Header from './headers'
import Footer from './Footer'
import { Toaster } from '@/components/ui/toaster'
import { useStaticSiteSettings } from '@/hooks/useStaticSiteSettings'


interface LayoutProps {
  children: React.ReactNode
  showNavbar?: boolean
  showFooter?: boolean
  className?: string
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showNavbar = true,
  showFooter = true,
  className = ""
}) => {
  const { settings, loading } = useStaticSiteSettings();
  
  // Update favicon dynamically when settings change
  useEffect(() => {
    if (settings?.favicon) {
      // Find existing favicon link elements
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      
      // Remove existing favicon links
      existingFavicons.forEach(favicon => favicon.remove());
      
      // Create new favicon link element
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = settings.favicon;
      
      // Determine type based on URL extension
      if (settings.favicon.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (settings.favicon.endsWith('.png')) {
        link.type = 'image/png';
      } else if (settings.favicon.endsWith('.ico')) {
        link.type = 'image/x-icon';
      }
      
      // Add to document head
      document.head.appendChild(link);
    }
  }, [settings?.favicon]);
  
  if (loading) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${className}`}>
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  
  const isSidebar = settings?.header_type === 'sidebar';
  
  if (isSidebar) {
    // Sidebar layout: horizontal with sidebar on left, content on right
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        {showNavbar && <Header />}
        <div className="ml-64 min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          {showFooter && settings?.footer_show_footer && <Footer />}
        </div>
        <Toaster />
      </div>
    );
  }

  // Standard layout: vertical with header on top, content below
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      {showNavbar && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {showFooter && settings?.footer_show_footer && <Footer />}
      <Toaster />
    </div>
  )
}

export default Layout 