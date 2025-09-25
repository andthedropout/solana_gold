import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { GripVertical, Link2, Eye, EyeOff } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface HeaderPage {
  id: string
  title: string
  slug: string
  header_order: number
}

interface HeaderLinksModalProps {
  isOpen: boolean
  onClose: () => void
}

// Sortable Item Component
interface SortablePageItemProps {
  page: HeaderPage
}

const SortablePageItem: React.FC<SortablePageItemProps> = ({ page }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 bg-background border rounded-lg ${
        isDragging ? 'opacity-50 z-40' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      <div className="flex-1">
        <div className="font-medium text-sm">{page.title}</div>
        <div className="text-xs text-muted-foreground">/{page.slug}/</div>
      </div>
    </div>
  )
}

export const HeaderLinksModal: React.FC<HeaderLinksModalProps> = ({ isOpen, onClose }) => {
  const [pages, setPages] = useState<HeaderPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load header pages
  useEffect(() => {
    if (isOpen) {
      loadHeaderPages()
    }
  }, [isOpen])

  const loadHeaderPages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/pages/header/')
      if (response.ok) {
        const data = await response.json()
        // Sort by header_order on the frontend to ensure correct initial order
        const sortedPages = data.sort((a: HeaderPage, b: HeaderPage) => a.header_order - b.header_order)
        setPages(sortedPages)
      } else {
        toast({
          title: "Failed to load pages",
          description: "Could not fetch header pages",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to load header pages:', error)
      toast({
        title: "Failed to load pages",
        description: "An error occurred while loading pages",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = pages.findIndex(page => page.id === active.id)
      const newIndex = pages.findIndex(page => page.id === over?.id)
      
      setPages(arrayMove(pages, oldIndex, newIndex))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                       document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || ''
      
      const response = await fetch('/api/v1/pages/header/reorder/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          page_ids: pages.map(p => p.id)
        })
      })

      if (response.ok) {
        toast({
          title: "Order saved",
          description: "Header links order has been updated"
        })
        // Refresh navigation
        window.dispatchEvent(new CustomEvent('refreshNavigation'))
        onClose()
      } else {
        toast({
          title: "Failed to save order",
          description: "An error occurred while saving the order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to save order:', error)
      toast({
        title: "Failed to save order",
        description: "An error occurred while saving the order",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Header Links
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading pages...
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No pages in header</p>
              <p className="text-xs text-muted-foreground">
                Enable "Show in Header" in page metadata to add pages here
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={pages.map(p => p.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <SortablePageItem key={page.id} page={page} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading || pages.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}