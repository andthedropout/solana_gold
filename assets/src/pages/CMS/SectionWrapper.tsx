import React, { useState } from 'react';
import { DynamicComponent } from './DynamicComponent';
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground';
import { useCMS } from '@/components/admin/CMSContext';
import { useSectionEditor } from '@/components/admin/section_settings/SectionEditorContext';
import { Edit3 } from 'lucide-react';

interface SectionBackground {
  static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
  animated_type?: string;
  opacity?: number;
}

interface SectionWrapperProps {
  sectionId: string;
  componentType: string;
  background?: SectionBackground;
  isFirst?: boolean;
  isLast?: boolean;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  sectionId,
  componentType,
  background,
  isFirst,
  isLast
}) => {
  const { isOpen, shouldShowPanel } = useCMS();
  const { openSectionEditor } = useSectionEditor();
  const [isHovered, setIsHovered] = useState(false);

  // Only show edit functionality when CMS panel is actually open
  const canEdit = shouldShowPanel && isOpen;

  const component = (
    <DynamicComponent
      componentType={componentType}
      sectionId={sectionId}
      isFirst={isFirst}
      isLast={isLast}
      background={background}
    />
  );

  const handleSectionClick = () => {
    if (canEdit) {
      openSectionEditor(sectionId, componentType);
    }
  };

  const wrapWithEditOverlay = (content: React.ReactNode) => {
    if (!canEdit) {
      return content;
    }

    return (
      <div 
        className="relative group cursor-pointer"
        onClick={handleSectionClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
        
        {/* Edit overlay */}
        <div 
          className={`absolute inset-0 border-2 border-dashed transition-all duration-200 ${
            isHovered 
              ? 'border-primary bg-primary/5 backdrop-blur-[1px]' 
              : 'border-transparent'
          }`}
        >
        </div>
      </div>
    );
  };

  // Handle layered backgrounds - static base with animated overlay
  const staticStyle = background?.static_color ? {
    backgroundColor: `color-mix(in srgb, var(--${background.static_color}) ${(background.opacity ?? 1) * 100}%, transparent)`,
    color: `var(--${background.static_color}-foreground)`,
  } : {};

  // If we have both static and animated backgrounds
  if (background?.static_color && background?.animated_type) {
    return (
      <div 
        className="relative w-full"
        style={staticStyle}
      >
        <AnimatedBackground
          type={background.animated_type}
          opacity={background.opacity ?? 0.6}
        >
          {wrapWithEditOverlay(component)}
        </AnimatedBackground>
      </div>
    );
  }

  // Only animated background
  if (background?.animated_type) {
    return (
      <AnimatedBackground
        type={background.animated_type}
        opacity={background.opacity ?? 1}
      >
        {wrapWithEditOverlay(component)}
      </AnimatedBackground>
    );
  }

  // Only static background
  if (background?.static_color) {
    return (
      <div 
        className="relative w-full"
        style={staticStyle}
      >
        {wrapWithEditOverlay(component)}
      </div>
    );
  }

  // No background - just render the component with edit overlay
  return wrapWithEditOverlay(component);
}; 