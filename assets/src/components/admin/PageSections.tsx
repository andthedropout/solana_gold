import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, GripVertical, X, Layers, Brush, ChevronRight, Edit3, Eye, EyeOff, Bot, Sparkles, Settings } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useCMS } from './CMSContext'
import { useCMSPreview } from './CMSPreviewContext'
import { useSectionEditor } from './section_settings/SectionEditorContext'
import { aiSectionAssistant } from '@/api/aiSectionAssistant'
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground'
import { MetadataModal } from './MetadataModal'

// Lazy load default content to avoid circular dependencies
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
import {
  CSS,
} from '@dnd-kit/utilities'

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

interface PageSectionsProps {
  className?: string
}

// Define section categories - components are auto-discovered from these
const SECTION_CATEGORIES = [
  { category: 'Hero', plural: 'heros', emoji: '🦸', label: 'Hero Section' },
  { category: 'Feature', plural: 'features', emoji: '⭐', label: 'Feature Section' },
  { category: 'Pricing', plural: 'pricing', emoji: '💰', label: 'Pricing Section' },
  { category: 'Testimonial', plural: 'testimonials', emoji: '💬', label: 'Testimonials' },
  { category: 'Contact', plural: 'contacts', emoji: '📧', label: 'Contact Section' },
];

// Auto-discover ALL components by actually scanning the sections folder
const discoverAvailableComponents = async () => {
  const availableComponents: Array<{ value: string; label: string; emoji: string }> = [];
  
  // Use Vite's glob import to find ALL .tsx files in sections folder and subfolders
  const modules = import.meta.glob('../sections/**/*.tsx', { eager: false });
  
  for (const [path, moduleLoader] of Object.entries(modules)) {
    try {
      // Load the module
      const module = await moduleLoader() as any;
      
      // Check if it has a default export (the component)
      if (module?.default) {
        // Extract component name from file path
        // ../sections/heros/Hero2Test.tsx -> Hero2Test
        const fileName = path.split('/').pop()?.replace('.tsx', '') || 'Unknown';
        
        // Extract category from folder path
        // ../sections/heros/Hero2Test.tsx -> heros -> hero
        const pathParts = path.split('/');
        const folderName = pathParts[pathParts.length - 2] || 'unknown';
        const category = folderName.endsWith('s') ? folderName.slice(0, -1) : folderName;
        const emoji = getCategoryEmoji(category);
        
        availableComponents.push({
          value: fileName,
          label: fileName,
          emoji: emoji
        });
      }
    } catch (error) {
      console.warn(`Failed to load component from ${path}:`, error);
      continue;
    }
  }
  
  return availableComponents;
};

// Helper to get emoji for category
const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'hero': '🦸',
    'feature': '⭐',
    'pricing': '💰',
    'testimonial': '💬',
    'contact': '📧',
    'content': '📝',
    'footer': '🔗',
    'navigation': '🧭',
    'form': '📋',
    'gallery': '🖼️',
    'stat': '📊',
    'team': '👥',
    'about': 'ℹ️',
    'service': '🛠️',
    'portfolio': '💼',
    'blog': '📰',
    'faq': '❓'
  };
  
  return emojiMap[category] || '📄';
};

// Get available component types (always fresh, no caching)
const getAvailableComponents = async () => {
  return await discoverAvailableComponents();
};

// Helper function to generate unique section IDs
const generateSectionId = (componentType: string, existingSections: PageSection[]): string => {
  const baseType = componentType.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  
  return `${baseType}-${timestamp}-${randomSuffix}`
}

// Background options
const STATIC_BACKGROUNDS = [
  { value: 'background', label: 'Default Background' },
  { value: 'muted', label: 'Muted' },
  { value: 'accent', label: 'Accent' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'primary', label: 'Primary' },
  { value: 'card', label: 'Card' },
] as const

// Static Color Selector Component
interface StaticColorSelectorProps {
  currentBackground?: PageSection['background']
  onSelect: (background: PageSection['background']) => void
  hasBackgroundContext?: boolean
}

const StaticColorSelector: React.FC<StaticColorSelectorProps> = ({ currentBackground, onSelect, hasBackgroundContext = false }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleStaticSelect = useCallback((color: string) => {
    const newBackground = {
      ...currentBackground,
      static_color: color as any,
      opacity: currentBackground?.opacity || 1
    }
    onSelect(newBackground)
    setIsOpen(false)
  }, [currentBackground, onSelect])

  const handleOpacityChange = useCallback((value: number[]) => {
    if (!currentBackground?.static_color) return
    
    const newBackground = {
      ...currentBackground,
      opacity: value[0]
    }
    onSelect(newBackground)
  }, [currentBackground, onSelect])

  const handleRemoveStatic = useCallback(() => {
    if (currentBackground?.animated_type) {
      const newBackground = {
        ...currentBackground,
        static_color: undefined
      }
      onSelect(newBackground)
    } else {
      onSelect(undefined)
    }
    setIsOpen(false)
  }, [currentBackground, onSelect])

  const hasStaticColor = !!currentBackground?.static_color
  const currentOpacity = currentBackground?.opacity ?? 1

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.stopPropagation()}
          className={`h-5 w-5 p-0 ${
            hasBackgroundContext 
              ? 'opacity-70 hover:opacity-90' 
              : hasStaticColor 
                ? 'text-primary hover:text-primary/80' 
                : 'text-gray-400 hover:text-gray-600'
          }`}
          title="Static Color Background"
        >
          <Brush className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start" side="bottom" sideOffset={4}>
        <div className="max-h-64 overflow-y-auto">
          <div className="p-1">
            {hasStaticColor && (
              <div 
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveStatic()
                }}
                className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Color
              </div>
            )}
            
            {hasStaticColor && (
              <>
                <div className="px-3 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Opacity</span>
                    <span className="text-xs text-muted-foreground">{Math.round(currentOpacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[currentOpacity]}
                    onValueChange={handleOpacityChange}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="h-px bg-border mx-2" />
              </>
            )}
            
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
              Static Colors
            </div>
            {STATIC_BACKGROUNDS.map((bg) => (
              <div 
                key={`static-${bg.value}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleStaticSelect(bg.value)
                }}
                className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
              >
                <div 
                  className="w-4 h-4 mr-3 rounded-sm border"
                  style={{ backgroundColor: `var(--${bg.value})` }}
                ></div>
                <span>{bg.label}</span>
                {currentBackground?.static_color === bg.value && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Animated Background Selector Component
interface AnimatedBackgroundSelectorProps {
  currentBackground?: PageSection['background']
  onSelect: (background: PageSection['background']) => void
  hasBackgroundContext?: boolean
}

const AnimatedBackgroundSelector: React.FC<AnimatedBackgroundSelectorProps> = ({ currentBackground, onSelect, hasBackgroundContext = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [animatedBackgrounds, setAnimatedBackgrounds] = useState<Array<{value: string, label: string}>>([])
  
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch('/api/v1/backgrounds/')
        if (response.ok) {
          const data = await response.json()
          setAnimatedBackgrounds(data.animated_backgrounds || [])
        }
      } catch (error) {
        console.error('Failed to fetch backgrounds:', error)
      }
    }
    
    fetchBackgrounds()
  }, [])

  const handleAnimatedSelect = useCallback((animationType: string) => {
    const newBackground = {
      ...currentBackground,
      animated_type: animationType as any,
      opacity: currentBackground?.opacity || 0.6
    }
    onSelect(newBackground)
    setIsOpen(false)
  }, [currentBackground, onSelect])

  const handleOpacityChange = useCallback((value: number[]) => {
    if (!currentBackground?.animated_type) return
    
    const newBackground = {
      ...currentBackground,
      opacity: value[0]
    }
    onSelect(newBackground)
  }, [currentBackground, onSelect])

  const handleRemoveAnimated = useCallback(() => {
    if (currentBackground?.static_color) {
      const newBackground = {
        ...currentBackground,
        animated_type: undefined
      }
      onSelect(newBackground)
    } else {
      onSelect(undefined)
    }
    setIsOpen(false)
  }, [currentBackground, onSelect])

  const hasAnimatedBackground = !!currentBackground?.animated_type
  const currentOpacity = currentBackground?.opacity ?? 0.6

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.stopPropagation()}
          className={`h-5 w-5 p-0 ${
            hasBackgroundContext 
              ? 'opacity-70 hover:opacity-90' 
              : hasAnimatedBackground 
                ? 'text-primary hover:text-primary/80' 
                : 'text-gray-400 hover:text-gray-600'
          }`}
          title="Animated Background"
        >
          <Layers className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start" side="bottom" sideOffset={4}>
        <div className="max-h-80 overflow-y-auto">
          <div className="p-1">
            {hasAnimatedBackground && (
              <>
                <div 
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemoveAnimated()
                  }}
                  className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Animation
                </div>
                
                <div className="h-px bg-border mx-2 my-1" />
                
                {/* Opacity Control */}
                <div className="px-3 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Opacity</span>
                    <span className="text-xs text-muted-foreground">{Math.round(currentOpacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[currentOpacity]}
                    onValueChange={handleOpacityChange}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div className="h-px bg-border mx-2 my-1" />
              </>
            )}
            
            <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
              Animated Effects
            </div>
            {animatedBackgrounds.map((bg) => (
              <div 
                key={`animated-${bg.value}`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAnimatedSelect(bg.value)
                }}
                className="flex items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm"
              >
                <div className="w-4 h-4 mr-3 bg-gradient-to-r from-primary/60 to-secondary/60 rounded-sm border"></div>
                <span>{bg.label}</span>
                {currentBackground?.animated_type === bg.value && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Add Section Between Items Component  
interface AddSectionBetweenProps {
  onAddSection: (componentType: string) => void
  availableComponents: Array<{ value: string; label: string; emoji: string }>
}

const AddSectionBetween: React.FC<AddSectionBetweenProps> = ({ onAddSection, availableComponents }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleAddSection = (componentType: string) => {
    onAddSection(componentType)
    setIsOpen(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
    }
    // Show tooltip after line animation completes
    const timeout = setTimeout(() => setShowTooltip(true), 300)
    setTooltipTimeout(timeout)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setShowTooltip(false)
    // Clear timeout when leaving
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout)
      }
    }
  }, [tooltipTimeout])

  return (
    <div 
      className="relative group flex items-center z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Entire area is clickable */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="w-full h-3 absolute inset-0 cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 z-[60]" align="center">
          <Command>
            <CommandInput placeholder="Search sections" />
            <CommandList>
              <CommandEmpty>No sections found.</CommandEmpty>
              <CommandGroup heading="Sections">
                {availableComponents.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.label}
                    onSelect={() => handleAddSection(type.value)}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                  >
                    <div className="w-3 h-3 bg-gray-800 rounded-sm flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">
                        {type.label.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium">{type.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Animated primary line - visual only */}
      <div className="relative w-full h-0.5 bg-transparent overflow-hidden pointer-events-none">
        <div 
          className={`h-full bg-primary transform transition-all duration-300 ease-out ${
            isHovered ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
          }`}
          style={{ transformOrigin: 'center center' }}
        />
      </div>

      {/* Circle Plus Icon */}
      {isHovered && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center transition-colors">
            <Plus className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}

    </div>
  )
}

// Sortable Item Component
interface SortableItemProps {
  section: PageSection
  index: number
  onRemove: (index: number) => void
  onUpdateBackground: (index: number, background: PageSection['background']) => void
  onToggleVisibility: (index: number) => void
  availableComponents: Array<{ value: string; label: string; emoji: string }>
}

const SortableItem: React.FC<SortableItemProps> = ({ section, index, onRemove, onUpdateBackground, onToggleVisibility, availableComponents }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { openSectionEditor } = useSectionEditor()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const componentType = availableComponents.find(t => t.value === section.component_type)
  
  // Get background and foreground styles for static colors
  const getStaticBackgroundStyle = () => {
    if (section.background?.static_color) {
      const opacity = section.background.opacity || 1
      return {
        backgroundColor: `color-mix(in srgb, var(--${section.background.static_color}) ${opacity * 100}%, transparent)`,
        color: `var(--${section.background.static_color}-foreground)`
      }
    }
    return {}
  }
  
  const hasAnimatedBackground = section.background?.animated_type
  
  const getTextColorClass = () => {
    if (section.background?.static_color) {
      return ''
    }
    if (section.background?.animated_type) {
      return ''
    }
    return 'text-gray-900'
  }

  const itemContent = (
    <div
      className={`
        flex items-center justify-between px-2 py-2.5
        transition-colors duration-150 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 z-40' : ''}
        ${!section.background && (isHovered ? 'bg-gray-100' : 'hover:bg-gray-50')}
      `}
      style={{
        ...getStaticBackgroundStyle(),
        borderRadius: 'var(--radius)'
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        {/* Drag handle or icon */}
        <div className="flex items-center justify-center w-4 h-4">
          {isHovered ? (
            <GripVertical className={`h-3 w-3 ${(section.background?.static_color || section.background?.animated_type) ? 'opacity-70' : 'text-gray-400'}`} />
          ) : (
            <div className="w-3 h-3 bg-gray-800 rounded-sm flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">
                {componentType?.label?.charAt(0) || 'S'}
              </span>
            </div>
          )}
        </div>
        
        {/* Section title */}
        <span className={`text-sm font-normal ${getTextColorClass()} ${section.visible === false ? 'opacity-50' : ''}`}>
          {componentType?.label || section.component_type}
        </span>
        
        {/* Visibility toggle - always visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleVisibility(index)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`h-5 w-5 p-0 ml-2 ${
            (section.background?.static_color || section.background?.animated_type)
              ? 'opacity-70 hover:opacity-90' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={section.visible === false ? "Show Section" : "Hide Section"}
        >
          {section.visible === false ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
        

      </div>
      
      {/* Background and Remove buttons - only visible on hover */}
      {isHovered && (
        <div className="flex items-center gap-1">
          <StaticColorSelector
            currentBackground={section.background}
            onSelect={(background) => onUpdateBackground(index, background)}
            hasBackgroundContext={!!(section.background?.static_color || section.background?.animated_type)}
          />
          <AnimatedBackgroundSelector
            currentBackground={section.background}
            onSelect={(background) => onUpdateBackground(index, background)}
            hasBackgroundContext={!!(section.background?.static_color || section.background?.animated_type)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(index)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`h-5 w-5 p-0 ${
              (section.background?.static_color || section.background?.animated_type)
                ? 'opacity-70 hover:opacity-90' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )

  if (hasAnimatedBackground && section.background?.animated_type) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-0"
        {...attributes}
        {...listeners}
      >
        <AnimatedBackground
          type={section.background.animated_type}
          opacity={section.background.opacity || 0.6}
          className="rounded-[var(--radius)] overflow-hidden"
        >
          {itemContent}
        </AnimatedBackground>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-0"
      {...attributes}
      {...listeners}
    >
      {itemContent}
    </div>
  )
}

export const PageSections: React.FC<PageSectionsProps> = ({ className }) => {
  const { currentPage } = useCMS()
  const { 
    getCurrentSections, 
    updateSections, 
    updateSectionContent,
    loadPageSections, 
    isSectionsLoading 
  } = useCMSPreview()
  const { toast } = useToast()
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false)
  const [availableComponents, setAvailableComponents] = useState<Array<{ value: string; label: string; emoji: string }>>([])
  const [componentsLoading, setComponentsLoading] = useState(true)
  
  // AI Page Generation state
  const [isAIPageModalOpen, setIsAIPageModalOpen] = useState(false)
  const [aiPagePrompt, setAiPagePrompt] = useState('')
  const [isAIPageProcessing, setIsAIPageProcessing] = useState(false)
  const [fillOutContent, setFillOutContent] = useState(false)
  
  // Metadata modal state
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false)
  const [pageData, setPageData] = useState<any>({})

  // Load available components on mount
  useEffect(() => {
    const loadComponents = async () => {
      setComponentsLoading(true)
      try {
        const components = await getAvailableComponents()
        setAvailableComponents(components)
      } catch (error) {
        console.error('Failed to load available components:', error)
      } finally {
        setComponentsLoading(false)
      }
    }
    
    loadComponents()
  }, [])
  
  // Load page data when currentPage changes
  useEffect(() => {
    if (currentPage) {
      // Fetch full page data to get all fields
      fetch(`/api/v1/pages/${currentPage.id}/`)
        .then(res => res.json())
        .then(data => {
          setPageData({
            title: data.title || '',
            slug: data.slug || '',
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            show_in_header: data.show_in_header || false
          })
        })
        .catch(err => console.error('Failed to fetch page data:', err))
    }
  }, [currentPage])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get current sections from preview context
  const sections = getCurrentSections() || []

  // Note: Page sections are loaded by CMSPreviewContext

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex(item => item.id === active.id)
      const newIndex = sections.findIndex(item => item.id === over?.id)

      const newItems = arrayMove(sections, oldIndex, newIndex)
      updateSections(newItems)
    }
  }

  // Add new section at end
  const addSection = (componentType: string) => {
    const newSection: PageSection = {
      id: generateSectionId(componentType, sections),
      component_type: componentType,
      visible: true
    }
    
    updateSections([...sections, newSection])
    setIsAddSectionOpen(false) // Close the dropdown
  }

  // Add section at specific position
  const addSectionAt = (componentType: string, position: number) => {
    const newSection: PageSection = {
      id: generateSectionId(componentType, sections),
      component_type: componentType,
      visible: true
    }
    
    const newSections = [...sections]
    newSections.splice(position, 0, newSection)
    updateSections(newSections)
  }

  // Remove section
  const removeSection = (index: number) => {
    // Just remove from page sections array - backend deletion happens on save
    updateSections(sections.filter((_, i) => i !== index))
  }

  // Update section background
  const updateSectionBackground = (index: number, background: PageSection['background']) => {
    console.log('updateSectionBackground called with:', { index, background })
    console.log('Current sections:', sections)
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], background }
    console.log('New sections with background:', newSections)
    updateSections(newSections)
  }

  // Toggle section visibility
  const toggleSectionVisibility = (index: number) => {
    const newSections = [...sections]
    newSections[index] = { 
      ...newSections[index], 
      visible: newSections[index].visible === false ? true : false 
    }
    updateSections(newSections)
  }

  // Handle AI Page Generation
  const handleAIPageGenerate = async () => {
    if (!aiPagePrompt.trim() || availableComponents.length === 0) return
    
    setIsAIPageProcessing(true)
    try {
      // Get component names only
      const componentNames = availableComponents.map(comp => comp.value)
      
      // Call AI service to generate page structure
      const response = await aiSectionAssistant.generatePage({
        userPrompt: aiPagePrompt,
        availableComponents: componentNames
      })
      
      console.log('🎯 AI RESPONSE RECEIVED:', response);
      console.log('🔧 SECTIONS FROM AI:', response.sections);
      
      // Transform AI response to PageSection format with IDs
      const newSections = response.sections.map(aiSection => {
        console.log('🎨 PROCESSING AI SECTION:', aiSection);
        console.log('📦 BACKGROUND DATA:', aiSection.background);
        
        return {
          id: generateSectionId(aiSection.component_type, []),
          component_type: aiSection.component_type,
          visible: aiSection.visible !== false,
          background: aiSection.background
        };
      });
      
      console.log('✨ FINAL SECTIONS TO RENDER:', newSections);
      
      // Update sections in preview (no backend save)
      updateSections(newSections)
      
      // If fillOutContent is enabled, populate each section with AI content (PREVIEW ONLY)
      if (fillOutContent && newSections.length > 0) {
        console.log('🤖 FILLING OUT SECTION CONTENT FOR', newSections.length, 'SECTIONS (PREVIEW ONLY)');
        
        // Process each section sequentially
        for (const section of newSections) {
          try {
            console.log('🎯 PROCESSING SECTION:', section.component_type, section.id);
            
            // Load the default content for this component type
            let defaultContent;
            try {
              // Use lazy imports to avoid circular dependencies
              const getDefaultContent = async (componentType: string) => {
                switch (componentType) {
                  case 'CTA1':
                    return (await import('@/components/sections/ctas/CTA1')).CTA1DefaultContent;
                  case 'Hero1':
                    return (await import('@/components/sections/heros/Hero1')).Hero1DefaultContent;
                  case 'Hero4':
                    return (await import('@/components/sections/heros/Hero4')).Hero4DefaultContent;
                  case 'Testimonial1':
                    return (await import('@/components/sections/testimonials/Testimonial1')).Testimonial1DefaultContent;
                  case 'ClientList2':
                    return (await import('@/components/sections/clientlists/ClientList2')).ClientList2DefaultContent;
                  default:
                    return null;
                }
              };
              
              defaultContent = await getDefaultContent(section.component_type);
            } catch (importError) {
              console.warn(`Failed to import ${section.component_type} module:`, importError);
              continue;
            }
            
            if (!defaultContent) {
              console.warn(`No default content found for ${section.component_type}, skipping content generation`);
              continue;
            }
            
            // Call existing AI enhance API with the original prompt
            const enhanceResponse = await aiSectionAssistant.enhanceSection({
              currentContent: defaultContent,
              userPrompt: aiPagePrompt, // Use the original page prompt
              componentType: section.component_type
            });
            
            console.log('✅ ENHANCED CONTENT FOR', section.component_type, enhanceResponse.enhancedContent);
            
            // Update section content in preview state (NO backend save - same as existing AI enhancement)
            updateSectionContent(section.id, enhanceResponse.enhancedContent);
            
          } catch (error) {
            console.error('Failed to enhance content for section', section.component_type, error);
            // Continue with next section even if one fails
          }
        }
        
        console.log('🎉 FINISHED FILLING OUT ALL SECTION CONTENT (PREVIEW ONLY)');
      }
      
      // Close modal and show success
      setIsAIPageModalOpen(false)
      setAiPagePrompt('')
      setFillOutContent(false)
      toast({
        title: "Page Generated",
        description: fillOutContent 
          ? "AI has created your page structure and filled out all section content. Review and save when ready."
          : "AI has created your page structure. Review and save when ready.",
      })
      
    } catch (error) {
      console.error('AI page generation failed:', error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate page with AI",
        variant: "destructive",
      })
    } finally {
      setIsAIPageProcessing(false)
    }
  }

  // Helper function to get category folder from component name
  const getCategoryFolder = (componentType: string): string => {
    const categoryMap: Record<string, string> = {
      'Hero': 'heros',
      'Feature': 'features', 
      'Pricing': 'pricings',
      'Testimonial': 'testimonials',
      'Contact': 'contacts',
      'Gallery': 'gallerys',
      'CTA': 'ctas',
      'Faq': 'faqs',
      'ClientList': 'clientlists',
      'Timeline': 'timelines'
    }
    
    // Extract category from component name (e.g., "Hero1" -> "Hero")
    const category = componentType.replace(/\d+$/, '');
    return categoryMap[category] || 'unknown';
  }

  if (isSectionsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Page Sections</h3>
        </div>
        <div className="text-sm text-muted-foreground">Loading sections...</div>
      </div>
    )
  }

  if (!currentPage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Page Sections</h3>
        </div>
        <div className="text-sm text-muted-foreground">No page selected</div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {currentPage?.title || "Sections"}
        </h3>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMetadataModalOpen(true)}
            className="h-8 w-8 p-0"
            title="Page Metadata"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIPageModalOpen(true)}
            className="h-8 w-8 p-0"
            title="AI Generate Page"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-0">
        {sections.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">No sections yet</p>
            <p className="text-xs text-gray-400 mt-1">Add a section to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section, index) => (
                <div key={section.id}>
                  <SortableItem
                    section={section}
                    index={index}
                    onRemove={removeSection}
                    onUpdateBackground={updateSectionBackground}
                    onToggleVisibility={toggleSectionVisibility}
                    availableComponents={availableComponents}
                  />
                  
                  {/* Add section between items */}
                  <AddSectionBetween 
                    onAddSection={(type) => addSectionAt(type, index + 1)} 
                    availableComponents={availableComponents}
                  />
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Section Button - Always visible */}
      <div>
        <Popover open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 px-2 py-2.5 text-sm text-foreground font-normal hover:bg-gray-50"
              style={{ borderRadius: 'var(--radius)' }}
              disabled={componentsLoading}
            >
              <Plus className="h-3 w-3" />
              {componentsLoading ? 'Loading components...' : 'Add section'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 z-[60]" align="start">
            <Command>
              <CommandInput placeholder="Search sections" />
              <CommandList>
                <CommandEmpty>No sections found.</CommandEmpty>
                <CommandGroup heading="Sections">
                  {availableComponents.map((type) => (
                    <CommandItem
                      key={type.value}
                      value={type.label}
                      onSelect={() => addSection(type.value)}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                    >
                      <div className="w-3 h-3 bg-gray-800 rounded-sm flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">
                          {type.label.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{type.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Note: Save button is in the main CMS panel */}
      
      {/* AI Page Generation Modal */}
      <Dialog open={isAIPageModalOpen} onOpenChange={setIsAIPageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Page Generator
            </DialogTitle>
            <DialogDescription>
              Describe the type of page you want to create and AI will generate a complete section layout for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ai-page-prompt">
                Describe the page you want to create:
              </Label>
              <Textarea
                id="ai-page-prompt"
                placeholder="e.g., A landing page for a SaaS product with hero, features, pricing, and testimonials"
                value={aiPagePrompt}
                onChange={(e) => setAiPagePrompt(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="fill-out-content"
                checked={fillOutContent}
                onCheckedChange={setFillOutContent}
              />
              <Label htmlFor="fill-out-content" className="text-sm">
                Fill out section content
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAIPageModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAIPageGenerate}
                disabled={isAIPageProcessing}
              >
                {isAIPageProcessing ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Metadata Modal */}
      {currentPage && (
        <MetadataModal
          isOpen={isMetadataModalOpen}
          onClose={() => setIsMetadataModalOpen(false)}
          pageId={currentPage.id}
          pageData={pageData}
          onSave={(updatedData) => {
            setPageData(updatedData)
            // Update currentPage in CMS context if needed
            if (updatedData.title || updatedData.slug) {
              // Refresh the page data
              window.location.reload()
            }
          }}
        />
      )}
    </div>
  )
} 