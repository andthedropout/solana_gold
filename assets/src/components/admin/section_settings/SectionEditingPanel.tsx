import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSectionEditor } from './SectionEditorContext';
import { SchemaForm } from './SchemaForm';
import { useSectionContent } from '@/hooks/useSectionContent';
import { aiSectionAssistant } from '@/api/aiSectionAssistant';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Save, Bot, Loader2 } from 'lucide-react';

// Import all schemas and default content statically
import { CTA1Schema, CTA1DefaultContent } from '@/components/sections/ctas/CTA1';
import { CTA2Schema, CTA2DefaultContent } from '@/components/sections/ctas/CTA2';
import { Hero1Schema, Hero1DefaultContent } from '@/components/sections/heros/Hero1';
import { Hero2Schema, Hero2DefaultContent } from '@/components/sections/heros/Hero2';
import { Hero3Schema, Hero3DefaultContent } from '@/components/sections/heros/Hero3';
import { Hero4Schema, Hero4DefaultContent } from '@/components/sections/heros/Hero4';
import { Hero5Schema, Hero5DefaultContent } from '@/components/sections/heros/Hero5';
import { Hero6Schema, Hero6DefaultContent } from '@/components/sections/heros/Hero6';
import { Hero7Schema, Hero7DefaultContent } from '@/components/sections/heros/Hero7';
import { Hero8Schema, Hero8DefaultContent } from '@/components/sections/heros/Hero8';
import { Hero9Schema, Hero9DefaultContent } from '@/components/sections/heros/Hero9';
import { Hero10Schema, Hero10DefaultContent } from '@/components/sections/heros/Hero10';
import { Hero11Schema, Hero11DefaultContent } from '@/components/sections/heros/Hero11';
import { ClientList2Schema, ClientList2DefaultContent } from '@/components/sections/clientlists/ClientList2';
import { Testimonial5Schema, Testimonial5DefaultContent } from '@/components/sections/testimonials/Testimonial5';
import { Feature5Schema, Feature5DefaultContent } from '@/components/sections/features/Feature5';
import { Timeline1Schema, Timeline1DefaultContent } from '@/components/sections/timelines/Timeline1';
import { Simple1Schema, Simple1DefaultContent } from '@/components/sections/simple/Simple1';
import { TabbedList1Schema, TabbedList1DefaultContent } from '@/components/sections/tabbedlists/TabbedList1';
import { Video1Schema, Video1DefaultContent } from '@/components/sections/videos/Video1';

// Create static mappings
const SCHEMA_MAP = {
  CTA1: CTA1Schema,
  CTA2: CTA2Schema,
  Hero1: Hero1Schema,
  Hero2: Hero2Schema,
  Hero3: Hero3Schema,
  Hero4: Hero4Schema,
  Hero5: Hero5Schema,
  Hero6: Hero6Schema,
  Hero7: Hero7Schema,
  Hero8: Hero8Schema,
  Hero9: Hero9Schema,
  Hero10: Hero10Schema,
  Hero11: Hero11Schema,
  ClientList2: ClientList2Schema,
  Testimonial5: Testimonial5Schema,
  Feature5: Feature5Schema,
  Timeline1: Timeline1Schema,
  Simple1: Simple1Schema,
  TabbedList1: TabbedList1Schema,
  Video1: Video1Schema,
} as const;

const DEFAULT_CONTENT_MAP = {
  CTA1: CTA1DefaultContent,
  CTA2: CTA2DefaultContent,
  Hero1: Hero1DefaultContent,
  Hero2: Hero2DefaultContent,
  Hero3: Hero3DefaultContent,
  Hero4: Hero4DefaultContent,
  Hero5: Hero5DefaultContent,
  Hero6: Hero6DefaultContent,
  Hero7: Hero7DefaultContent,
  Hero8: Hero8DefaultContent,
  Hero9: Hero9DefaultContent,
  Hero10: Hero10DefaultContent,
  Hero11: Hero11DefaultContent,
  ClientList2: ClientList2DefaultContent,
  Testimonial5: Testimonial5DefaultContent,
  Feature5: Feature5DefaultContent,
  Timeline1: Timeline1DefaultContent,
  Simple1: Simple1DefaultContent,
  TabbedList1: TabbedList1DefaultContent,
  Video1: Video1DefaultContent,
} as const;

const loadSectionSchema = async (componentType: string) => {
  try {
    // Extract category and construct relative import path
    const category = componentType.replace(/\d+$/, '').toLowerCase() + 's';
    
    let importPath;
    if (process.env.NODE_ENV === 'production') {
      // In production, try to get the hashed filename from manifest
      try {
        const manifestResponse = await fetch('/static/manifest.json');
        const manifest = await manifestResponse.json();
        
        // Look for the component file in the manifest
        const manifestKey = `src/components/sections/${category}/${componentType}.tsx`;
        const manifestEntry = manifest[manifestKey];
        
        if (manifestEntry && manifestEntry.file) {
          importPath = `/static/${manifestEntry.file}`;
        } else {
          // Fallback: try direct path (might work if no hashing)
          importPath = `/static/${componentType}.js`;
        }
      } catch (manifestError) {
        console.warn('Failed to load manifest, using fallback path:', manifestError);
        importPath = `/static/${componentType}.js`;
      }
    } else {
      importPath = `../../sections/${category}/${componentType}`;
    }
    
    console.log(`Loading schema for: ${componentType}`);
    
    // Get schema from static mapping
    const schema = SCHEMA_MAP[componentType as keyof typeof SCHEMA_MAP];
    
    if (!schema) {
      console.error(`Schema not found for ${componentType}`);
      console.log(`Available schemas:`, Object.keys(SCHEMA_MAP));
      return null;
    }
    
    return schema;
  } catch (error) {
    console.error(`Failed to load schema for ${componentType}:`, error);
    return null;
  }
};

const loadSectionDefaultContent = async (componentType: string) => {
  try {
    // Extract category and construct relative import path
    const category = componentType.replace(/\d+$/, '').toLowerCase() + 's';
    const importPath = process.env.NODE_ENV === 'production' 
      ? `/static/${componentType}` 
      : `../../sections/${category}/${componentType}`;
    
    // Get default content from static mapping
    const defaultContent = DEFAULT_CONTENT_MAP[componentType as keyof typeof DEFAULT_CONTENT_MAP];
    
    if (!defaultContent) {
      console.error(`Default content not found for ${componentType}`);
      console.log(`Available default content:`, Object.keys(DEFAULT_CONTENT_MAP));
      return {};
    }
    
    return defaultContent;
  } catch (error) {
    console.error(`Failed to load default content for ${componentType}:`, error);
    return {};
  }
};

export const SectionEditingPanel: React.FC = () => {
  const { isEditing, editingSectionId, editingComponentType, closeSectionEditor } = useSectionEditor();
  const { toast } = useToast();
  
  // Form state
  const [formValues, setFormValues] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isFormEditing, setIsFormEditing] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [defaultContent, setDefaultContent] = useState<any>({});
  
  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  
  // Get section content
  const { content, previewContent, saveContent } = useSectionContent(editingSectionId || '', defaultContent);

  // Load schema and default content when component type changes
  useEffect(() => {
    if (editingComponentType) {
      loadSectionSchema(editingComponentType).then(setSchema);
      loadSectionDefaultContent(editingComponentType).then(setDefaultContent);
    } else {
      setSchema(null);
      setDefaultContent({});
    }
  }, [editingComponentType]);

  // Initialize form values when content loads (only when not actively editing)
  useEffect(() => {
    if (content && !isFormEditing && JSON.stringify(content) !== JSON.stringify(formValues)) {
      setFormValues(content);
    }
  }, [content, isFormEditing]); // Removed formValues from dependencies to prevent loop

  // Reset form when switching sections - use separate ref to track section changes
  const lastSectionIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (editingSectionId && editingSectionId !== lastSectionIdRef.current) {
      lastSectionIdRef.current = editingSectionId;
      setFormValues(content || {});
      setIsFormEditing(false);
    }
  }, [editingSectionId]); // Only depend on section ID change, not content

  // Handle form changes (real-time preview)
  const handleFormChange = (newValues: any) => {
    setIsFormEditing(true); // Mark as actively editing
    setFormValues(newValues);
    previewContent(newValues); // Update section immediately for preview (NO backend save)
  };

  // Handle save
  const handleSave = async () => {
    if (!editingSectionId || !formValues) return;
    
    setIsSaving(true);
    try {
      // Save to backend ONLY when explicitly requested
      await saveContent(formValues);
      setIsFormEditing(false); // Mark as no longer actively editing
      closeSectionEditor(); // Close the panel after successful save
    } catch (error) {
      console.error('Failed to save section:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle AI submit
  const handleAISubmit = async () => {
    if (!aiPrompt.trim() || !editingSectionId || !editingComponentType) return;
    
    console.log('🤖 AI ENHANCEMENT STARTING:');
    console.log('Section ID:', editingSectionId);
    console.log('Component Type:', editingComponentType);
    console.log('Current Form Values:', formValues);
    console.log('Current Content:', content);
    
    setIsAIProcessing(true);
    try {
      // Get COMPLETE content for AI processing - merge form values with full structure
      const currentContent = { ...defaultContent, ...content, ...formValues };
      console.log('📋 COMPLETE CONTENT SENT TO AI:', JSON.stringify(currentContent, null, 2));
      
      // Call AI service
      const response = await aiSectionAssistant.enhanceSection({
        currentContent,
        userPrompt: aiPrompt,
        componentType: editingComponentType
      });
      
      // Update form values and preview with AI response
      const enhancedContent = response.enhancedContent;
      console.log('✅ AI ENHANCEMENT SUCCESS:');
      console.log('Enhanced content:', enhancedContent);
      console.log('Applying to section ID:', editingSectionId);
      
      setFormValues(enhancedContent);
      previewContent(enhancedContent); // Update preview immediately
      setIsFormEditing(true); // Mark as actively editing
      
      // Close modal and show success
      setIsAIModalOpen(false);
      setAiPrompt('');
      toast({
        title: "Content Enhanced",
        description: "AI has updated your section content. Review and save when ready.",
      });
      
    } catch (error) {
      console.error('AI enhancement failed:', error);
      toast({
        title: "Enhancement Failed",
        description: error instanceof Error ? error.message : "Failed to enhance content with AI",
        variant: "destructive",
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Dragging and resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 320, height: 500 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Mouse movement handler for dragging and resizing
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - startPos.current.x;
      const newY = e.clientY - startPos.current.y;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Constrain position to keep panel fully within viewport
      const constrainedX = Math.max(0, Math.min(newX, viewportWidth - size.width));
      const constrainedY = Math.max(0, Math.min(newY, viewportHeight - size.height));
      
      setPosition({
        x: constrainedX,
        y: constrainedY,
      });
    } else if (isResizing) {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      const newWidth = Math.max(280, Math.min(800, startSize.current.width + deltaX));
      const newHeight = Math.max(300, Math.min(window.innerHeight - position.y, startSize.current.height + deltaY));
      
      setSize({
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, isResizing, size.width, size.height, position.y]);

  // Mouse up handler
  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    document.body.style.cursor = '';
  }, []);

  // Mouse down handler for dragging
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    startPos.current = { 
      x: e.clientX - position.x, 
      y: e.clientY - position.y 
    };
  };

  // Mouse down handler for resizing
  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.cursor = 'nw-resize';
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };
  };

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, isResizing, onMouseMove, onMouseUp]);

  const panelContent = (
    <AnimatePresence>
      {isEditing && editingSectionId && (
        <>
          <motion.div
            key={editingSectionId}
            ref={panelRef}
            initial={{ 
              opacity: 0, 
              scale: 0.95
            }}
            animate={{ 
              opacity: 1, 
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              transition: { duration: 0.15 }
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3
            }}
            className={`fixed bg-background border border-border rounded-lg shadow-lg z-50 select-none overflow-hidden ${
              isDragging || isResizing ? '' : 'transition-shadow duration-200'
            } ${isHovering && !isDragging && !isResizing ? 'shadow-xl' : ''}`}
            style={{
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
              transform: 'translate(0, 0)',
              willChange: isDragging || isResizing ? 'transform' : 'auto'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Header with title and buttons */}
            <div 
              className={`flex items-center justify-between p-2 border-b border-border ${
                isDragging 
                  ? 'cursor-grabbing' 
                  : 'cursor-grab hover:bg-muted/50 transition-colors duration-150'
              }`}
              onMouseDown={onMouseDown}
            >
              <div className="flex items-center gap-2 flex-1">
                <div>
                  <h3 className="font-medium text-sm">{editingComponentType}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* AI button */}
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="p-1 hover:bg-muted rounded-md transition-colors duration-150"
                  onMouseDown={(e) => e.stopPropagation()}
                  title="AI Assistant"
                >
                  <Bot className="h-4 w-4" />
                </button>
                
                {/* Close button */}
                <button
                  onClick={closeSectionEditor}
                  className="p-1 hover:bg-muted rounded-md transition-colors duration-150"
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content area with sticky save button */}
            <div className="flex flex-col" style={{ height: size.height - 48 }}>
              {/* Scrollable form content */}
              <div className="flex-1 overflow-y-auto p-3">
                {schema && formValues ? (
                  <SchemaForm
                    schema={schema}
                    values={formValues}
                    onChange={handleFormChange}
                  />
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {!schema ? 'No schema found for this component type' : 'Loading...'}
                  </div>
                )}
              </div>
              
              {/* Sticky save button */}
              {schema && formValues && (
                <div className="border-t border-border p-3">
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
              onMouseDown={onResizeMouseDown}
              style={{
                background: 'linear-gradient(-45deg, transparent 30%, var(--border) 30%, var(--border) 70%, transparent 70%)',
              }}
            />
          </motion.div>

          {/* AI Enhancement Modal */}
          <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Section Assistant
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-prompt">
                    Describe how you'd like to enhance this {editingComponentType} section:
                  </Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="e.g., Make it more professional, change the topic to healthcare, add urgency to the call-to-action..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="mt-2 min-h-[100px] w-full"
                    disabled={isAIProcessing}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAIModalOpen(false)}
                    disabled={isAIProcessing}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAISubmit}
                    disabled={!aiPrompt.trim() || isAIProcessing}
                  >
                    {isAIProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isAIProcessing ? 'Enhancing...' : 'Enhance Content'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal to avoid z-index issues
  return createPortal(panelContent, document.body);
}; 