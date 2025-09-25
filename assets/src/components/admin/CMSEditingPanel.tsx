import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCMS } from './CMSContext'
import { useCMSPreview } from './CMSPreviewContext'
import { PageSections } from './PageSections'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '../ui/image-upload'
import { HeaderLinksModal } from './HeaderLinksModal'


// Icons from lucide-react
import { 
  Edit3, 
  Settings, 
  Save,
  Plus,
  Trash2,
  Image,
  Link2
} from 'lucide-react'

export const CMSEditingPanel: React.FC = () => {
  const { isOpen, setIsOpen, isEditMode, setIsEditMode, currentPage, shouldShowPanel, setCurrentPage } = useCMS()
  const { previewSettings, updatePreview, saveChanges, resetToSaved, isDirty, isSaving } = useCMSPreview()
  const [isHovered, setIsHovered] = useState(false)
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false)
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingPage, setIsDeletingPage] = useState(false)
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false)
  const [isFaviconModalOpen, setIsFaviconModalOpen] = useState(false)
  const [logoPreviewTheme, setLogoPreviewTheme] = useState<'light' | 'dark'>('light')
  const [tempLogoLight, setTempLogoLight] = useState('')
  const [tempLogoDark, setTempLogoDark] = useState('')
  const [tempFavicon, setTempFavicon] = useState('')
  const [isHeaderLinksModalOpen, setIsHeaderLinksModalOpen] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Header type options based on backend choices
  const headerTypeOptions = [
    { value: 'floating', label: 'Floating Header' },
    { value: 'clean', label: 'Clean Header' },
    { value: 'professional', label: 'Professional Header' }
  ]

  const handleHeaderTypeChange = (newHeaderType: string) => {
    // Update preview settings immediately (no API call, no page refresh)
    updatePreview({ header_type: newHeaderType as any })
  }
  
  const handleSaveChanges = async () => {
    try {
      await saveChanges()
      console.log('All settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const handleOpenLogoModal = () => {
    // Initialize temp logos with current values
    setTempLogoLight(previewSettings?.company_logo_light || '')
    setTempLogoDark(previewSettings?.company_logo_dark || '')
    setIsLogoModalOpen(true)
  }

  const handleSaveLogos = () => {
    // Apply the temp logos to the actual settings
    console.log('Saving logos:', { tempLogoLight, tempLogoDark })
    updatePreview({ 
      company_logo_light: tempLogoLight,
      company_logo_dark: tempLogoDark
    })
    setIsLogoModalOpen(false)
  }

  const handleCancelLogos = () => {
    // Reset temp values and close modal
    setTempLogoLight(previewSettings?.company_logo_light || '')
    setTempLogoDark(previewSettings?.company_logo_dark || '')
    setIsLogoModalOpen(false)
  }

  const handleOpenFaviconModal = () => {
    // Initialize temp favicon with current value
    setTempFavicon(previewSettings?.favicon || '')
    setIsFaviconModalOpen(true)
  }

  const handleSaveFavicon = () => {
    // Apply the temp favicon to the actual settings
    updatePreview({ favicon: tempFavicon })
    setIsFaviconModalOpen(false)
  }

  const handleCancelFavicon = () => {
    // Reset temp value and close modal
    setTempFavicon(previewSettings?.favicon || '')
    setIsFaviconModalOpen(false)
  }
  
  const handleResetChanges = () => {
    resetToSaved()
    console.log('Changes reset to saved settings')
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return
    
    setIsCreatingPage(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                       document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
      
      const slug = newPageSlug.trim() || generateSlug(newPageTitle.trim())
      
      const response = await fetch('/api/v1/pages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newPageTitle.trim(),
          slug: slug,
          is_published: true,
          show_in_header: true,
          sections: []
        })
      })
      
      if (response.ok) {
        const newPage = await response.json()
        setCurrentPage({
          id: newPage.id,
          title: newPage.title,
          slug: newPage.slug,
          is_published: newPage.is_published
        })
        setIsNewPageModalOpen(false)
        setNewPageTitle('')
        setNewPageSlug('')
        setHasManuallyEditedSlug(false)
        navigate(`/${slug}/`)
        toast({
          title: "Page created successfully",
          description: `"${newPage.title}" has been created and you can now add sections to it.`
        })
        // Refresh navigation to show new page in header
        window.dispatchEvent(new CustomEvent('refreshNavigation'))
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to create page",
          description: errorData.detail || "An error occurred while creating the page",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast({
        title: "Failed to create page",
        description: "An error occurred while creating the page",
        variant: "destructive"
      })
    } finally {
      setIsCreatingPage(false)
    }
  }

  const handleDeletePage = async () => {
    if (!currentPage?.id) return
    
    setIsDeletingPage(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                       document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
      
      const response = await fetch(`/api/v1/pages/${currentPage.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        setIsDeleteModalOpen(false)
        navigate('/')
        toast({
          title: "Page deleted successfully",
          description: `"${currentPage.title}" has been deleted.`
        })
        setCurrentPage(undefined)
        // Refresh navigation to remove deleted page from header
        window.dispatchEvent(new CustomEvent('refreshNavigation'))
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to delete page",
          description: errorData.detail || "An error occurred while deleting the page",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: "Failed to delete page",
        description: "An error occurred while deleting the page",
        variant: "destructive"
      })
    } finally {
      setIsDeletingPage(false)
    }
  }
  const barVariants = {
    initial: { x: -60, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: { delay: 0.8, duration: 0.7, ease: "easeOut" }
    }
  }

  return (
    <>
      <TooltipProvider>
        {/* Expandable CMS Bar */}
        <motion.div
          className="fixed left-0 top-0 z-50"
          variants={barVariants}
          initial="initial"
          animate="animate"
          style={{ display: shouldShowPanel ? 'block' : 'none' }}
        >
          <div 
            className="h-screen bg-background border-r relative group transition-all duration-300 flex items-center !rounded-none"
            style={{ width: isOpen ? '320px' : isHovered ? '24px' : '16px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Button tab - always visible */}
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2"
              initial={false}
              animate={{
                left: isOpen ? '320px' : isHovered ? '24px' : '16px'
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.div 
                className="bg-primary text-primary-foreground py-4 px-4 flex flex-col items-center gap-2 cursor-pointer shadow-lg"
                style={{
                  borderTopRightRadius: 'var(--radius)',
                  borderBottomRightRadius: 'var(--radius)',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0
                }}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ 
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {isOpen ? (
                  <>
                    <Edit3 className="h-5 w-5 rotate-180" />
                    <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl' }}>
                      CLOSE
                    </span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-5 w-5" />
                    <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl' }}>
                      EDIT
                    </span>
                  </>
                )}
              </motion.div>
            </motion.div>

            {/* Expanded CMS Content */}
            {isOpen && (
              <motion.div 
                className="absolute left-0 top-0 h-full flex flex-col bg-background text-foreground !rounded-none border-r shadow-lg"
                style={{ width: '320px' }}
                                  initial={{ x: -320 }}
                  animate={{ x: 0 }}
                  exit={{ x: -320 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <ScrollArea className="flex-1">
                  <div className="h-full">
                                      {/* Header Settings */}
                    <div className="px-6 pb-4 border-b">
                    <h2 className="text-xl font-semibold text-left mb-4 mt-4 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Header Settings
                    </h2>
                    
                    <div className="space-y-3">
                      <div>
                        <Select value={previewSettings?.header_type} onValueChange={handleHeaderTypeChange}>
                          <SelectTrigger className="bg-muted/50 text-foreground border-border hover:bg-muted">
                            <SelectValue placeholder="Select header type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {headerTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Logo Settings Button */}
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          size="sm"
                          onClick={handleOpenLogoModal}
                        >
                          <Image className="h-4 w-4" />
                          Manage Logos
                        </Button>
                      </div>

                      {/* Favicon Settings Button */}
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          size="sm"
                          onClick={handleOpenFaviconModal}
                        >
                          <Image className="h-4 w-4" />
                          Manage Favicon
                        </Button>
                      </div>

                      {/* Header Links Button */}
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          size="sm"
                          onClick={() => setIsHeaderLinksModalOpen(true)}
                        >
                          <Link2 className="h-4 w-4" />
                          Header Links
                        </Button>
                      </div>
                      
                    </div>
                  </div>

                                  {/* Content */}
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <div className="space-y-6">
                        <PageSections />
                        
                        {/* Save/Reset Actions */}
                        <AnimatePresence>
                          {isDirty && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex items-center justify-between gap-4"
                            >
                              <div></div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleResetChanges}
                                >
                                  Reset Changes
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={handleSaveChanges}
                                  disabled={isSaving}
                                  className="gap-2"
                                >
                                  <Save className="h-4 w-4" />
                                  'Save Changes'
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </ScrollArea>

                {/* Footer Actions */}
                <div className="p-6 pt-4 border-t space-y-3">
                  {/* Add New Page Button */}
                  <Dialog open={isNewPageModalOpen} onOpenChange={setIsNewPageModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add a new page
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Page</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="page-title">Page Title</Label>
                          <Input
                            id="page-title"
                            value={newPageTitle}
                            onChange={(e) => {
                              setNewPageTitle(e.target.value)
                              if (!hasManuallyEditedSlug) {
                                setNewPageSlug(generateSlug(e.target.value))
                              }
                            }}
                            placeholder="Enter page title..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="page-slug">Page Slug (URL)</Label>
                          <Input
                            id="page-slug"
                            value={newPageSlug}
                            onChange={(e) => {
                              setNewPageSlug(e.target.value)
                              setHasManuallyEditedSlug(true)
                            }}
                            placeholder="page-url-slug"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newPageTitle.trim()) {
                                handleCreatePage()
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground">
                            URL will be: /{newPageSlug || generateSlug(newPageTitle)}/
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsNewPageModalOpen(false)
                            setNewPageTitle('')
                            setNewPageSlug('')
                            setHasManuallyEditedSlug(false)
                          }}
                          disabled={isCreatingPage}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreatePage}
                          disabled={!newPageTitle.trim() || isCreatingPage}
                        >
                          {isCreatingPage ? 'Creating...' : 'Create Page'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Page Button - Only show if not homepage */}
                  {currentPage?.slug !== 'home' && (
                    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="w-full gap-2"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete this page
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Page</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete "<strong>{currentPage?.title}</strong>"? 
                            This action cannot be undone.
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeletingPage}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeletePage}
                            disabled={isDeletingPage}
                          >
                            {isDeletingPage ? 'Deleting...' : 'Delete Page'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}


                </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Logo Management Modal */}
        <Dialog open={isLogoModalOpen} onOpenChange={handleCancelLogos}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Logos</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Preview Theme</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${logoPreviewTheme === 'light' ? 'font-medium' : 'text-muted-foreground'}`}>Light</span>
                  <Switch 
                    checked={logoPreviewTheme === 'dark'}
                    onCheckedChange={(checked) => setLogoPreviewTheme(checked ? 'dark' : 'light')}
                  />
                  <span className={`text-sm ${logoPreviewTheme === 'dark' ? 'font-medium' : 'text-muted-foreground'}`}>Dark</span>
                </div>
              </div>

              {/* Logo Preview */}
              <div 
                className={`p-8 rounded-lg border-2 border-dashed transition-colors ${
                  logoPreviewTheme === 'dark' 
                    ? 'bg-gray-900 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center h-16">
                  {(logoPreviewTheme === 'light' ? tempLogoLight : tempLogoDark) ? (
                    <img 
                      src={logoPreviewTheme === 'light' ? tempLogoLight : tempLogoDark}
                      alt="Logo preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <div className={`text-sm ${logoPreviewTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No logo uploaded for {logoPreviewTheme} theme
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Upload {logoPreviewTheme === 'light' ? 'Light Theme' : 'Dark Theme'} Logo
                </Label>
                <ImageUpload
                  value={logoPreviewTheme === 'light' ? tempLogoLight : tempLogoDark}
                  onChange={(url) => logoPreviewTheme === 'light' ? setTempLogoLight(url) : setTempLogoDark(url)}
                  className="w-full"
                  hidePreview={true}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {logoPreviewTheme === 'light' 
                    ? 'Logo for light backgrounds (should be dark colored)'
                    : 'Logo for dark backgrounds (should be light colored)'
                  }
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelLogos}>
                Cancel
              </Button>
              <Button onClick={handleSaveLogos}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header Links Modal */}
        <HeaderLinksModal 
          isOpen={isHeaderLinksModalOpen}
          onClose={() => setIsHeaderLinksModalOpen(false)}
        />

        {/* Favicon Management Modal */}
        <Dialog open={isFaviconModalOpen} onOpenChange={handleCancelFavicon}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Favicon</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Current Favicon Preview */}
              {tempFavicon && (
                <div className="p-6 rounded-lg border bg-muted/20">
                  <div className="flex items-center justify-center gap-4">
                    <img 
                      src={tempFavicon}
                      alt="Favicon preview"
                      className="w-8 h-8 object-contain"
                    />
                    <div className="text-sm text-muted-foreground">
                      Current favicon
                    </div>
                  </div>
                </div>
              )}

              {/* Favicon Upload */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Upload Favicon
                </Label>
                <ImageUpload
                  value={tempFavicon}
                  onChange={setTempFavicon}
                  className="w-full"
                  hidePreview={true}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Browser tab icon (recommended: 32x32 or 16x16 PNG/ICO format)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelFavicon}>
                Cancel
              </Button>
              <Button onClick={handleSaveFavicon}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </TooltipProvider>
    </>
  )
} 