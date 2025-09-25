import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Info } from 'lucide-react'

interface PageData {
  title: string
  slug: string
  meta_title: string
  meta_description: string
  show_in_header: boolean
}

interface MetadataModalProps {
  isOpen: boolean
  onClose: () => void
  pageId: string
  pageData: Partial<PageData>
  onSave: (data: Partial<PageData>) => void
}

export const MetadataModal: React.FC<MetadataModalProps> = ({
  isOpen,
  onClose,
  pageId,
  pageData,
  onSave
}) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<PageData>>({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    show_in_header: false,
    ...pageData
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')

  useEffect(() => {
    setFormData({
      title: '',
      slug: '',
      meta_title: '',
      meta_description: '',
      show_in_header: false,
      ...pageData
    })
  }, [pageData])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]

      const response = await fetch(`/api/v1/pages/${pageId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save page settings')
      }

      onSave(formData)
      toast({
        title: 'Settings saved',
        description: 'Page settings have been updated successfully.',
      })
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const titleLength = formData.meta_title?.length || 0
  const descriptionLength = formData.meta_description?.length || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Page Settings</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter page title"
              />
              <p className="text-xs text-muted-foreground">
                The title displayed in the CMS and navigation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="page-url-slug"
              />
              <p className="text-xs text-muted-foreground">
                The URL path for this page (e.g., /about-us).
                {formData.slug === 'home' && (
                  <span className="block mt-1 text-primary">
                    Note: The 'home' slug will display at the root (/) not /home
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show_in_header">Show in Header</Label>
                <p className="text-xs text-muted-foreground">
                  Display this page as a link in the navigation header.
                </p>
              </div>
              <Switch
                id="show_in_header"
                checked={formData.show_in_header || false}
                onCheckedChange={(checked) => setFormData({ ...formData, show_in_header: checked })}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="metadata" className="space-y-6 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meta_title">Meta Title</Label>
                <span className={`text-xs ${titleLength > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {titleLength}/60
                </span>
              </div>
              <Input
                id="meta_title"
                value={formData.meta_title || ''}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                placeholder="Page title for search engines"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Appears in browser tabs and search results. Keep under 60 characters for best display.</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="meta_description">Meta Description</Label>
                <span className={`text-xs ${descriptionLength > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {descriptionLength}/160
                </span>
              </div>
              <Textarea
                id="meta_description"
                value={formData.meta_description || ''}
                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                placeholder="Brief description of the page content"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Shows in search results below the title. Keep under 160 characters for full visibility.</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}