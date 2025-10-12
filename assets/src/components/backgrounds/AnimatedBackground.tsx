import React, { useState, useEffect } from 'react';

interface AnimatedBackgroundProps {
  type: string; // filename without .svg extension
  opacity?: number;
  className?: string;
  children?: React.ReactNode;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  type, 
  opacity = 0.6, // Default opacity, will be used from Home.tsx or this default
  className = '', 
  children 
}) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    const loadSvgContent = async () => {
      if (!type) return;
      
      try {
        const response = await fetch(`/static/images/backgrounds/${type}.svg`);
        if (response.ok) {
          let content = await response.text();
          
          // Remove existing style attribute from SVG tag to prevent conflicts with injected styles
          content = content.replace(/<svg([^>]+)style="[^"]*"([^>]*)>/g, '<svg$1$2>');
          // Remove any inline background declarations within the SVG itself
          content = content.replace(/background:[^;\s"']*/gi, '');
          content = content.replace(/background-color:[^;\s"']*/gi, '');
          // Remove width and height attributes to prevent stretching
          content = content.replace(/\s+width="[^"]*"/g, '');
          content = content.replace(/\s+height="[^"]*"/g, '');

          // Use xMidYMid slice for cover-like behavior instead of none
          if (content.includes('preserveAspectRatio')) {
            content = content.replace(/preserveAspectRatio="[^"]*"/g, 'preserveAspectRatio="xMidYMid slice"');
          } else {
            content = content.replace('<svg', '<svg preserveAspectRatio="xMidYMid slice"');
          }

          // Replace hardcoded colors with theme CSS variables
          content = content.replace(/stroke="#9bcc31"/g, 'stroke="var(--primary)"');
          content = content.replace(/stroke="#089ccc"/g, 'stroke="var(--secondary)"');
          content = content.replace(/stroke="#f5b70f"/g, 'stroke="var(--accent)"');
          content = content.replace(/stroke="#e7e0c9"/g, 'stroke="var(--muted-foreground)"');
          content = content.replace(/stroke="#cc0505"/g, 'stroke="var(--accent)"'); // Mapping red to accent as well
          
          // Replace fill colors as well as stroke colors
          content = content.replace(/fill="#9bcc31"/g, 'fill="var(--primary)"');
          content = content.replace(/fill="#089ccc"/g, 'fill="var(--secondary)"');
          content = content.replace(/fill="#f5b70f"/g, 'fill="var(--accent)"');
          content = content.replace(/fill="#e7e0c9"/g, 'fill="var(--muted-foreground)"');
          content = content.replace(/fill="#cc0505"/g, 'fill="var(--accent)"');
          
          // Replace stop-color in gradients (flexible regex to handle additional attributes)
          content = content.replace(/stop-color="#9bcc31"/g, 'stop-color="var(--primary)"');
          content = content.replace(/stop-color="#089ccc"/g, 'stop-color="var(--secondary)"');
          content = content.replace(/stop-color="#f5b70f"/g, 'stop-color="var(--accent)"');
          content = content.replace(/stop-color="#e7e0c9"/g, 'stop-color="var(--muted-foreground)"');
          content = content.replace(/stop-color="#cc0505"/g, 'stop-color="var(--accent)"');

          // Remove color animations that override CSS variables (keep position/transform animations)
          // This removes <animate> tags that change stroke, fill, or stop-color attributes
          content = content.replace(/<animate[^>]*attributeName="stroke"[^>]*>[\s\S]*?<\/animate>/gi, '');
          content = content.replace(/<animate[^>]*attributeName="fill"[^>]*>[\s\S]*?<\/animate>/gi, '');
          content = content.replace(/<animate[^>]*attributeName="stop-color"[^>]*>[\s\S]*?<\/animate>/gi, '');

          // Also remove hue-rotate filters that change colors
          content = content.replace(/style="filter:hue-rotate\([^)]+\)"/g, '');

          // For bokeh_up, make it mostly gold by using primary color for all particles
          if (type === 'bokeh_up') {
            // Replace all secondary and accent with primary to make it all gold
            content = content.replace(/var\(--secondary\)/g, 'var(--primary)');
            content = content.replace(/var\(--accent\)/g, 'var(--primary)');
          }

          // Debug logging for waves_floor
          if (type === 'waves_floor') {
            console.log('🌊 waves_floor SVG before replacement:', content.substring(0, 500));
            console.log('🌊 waves_floor SVG after replacement:', content.substring(0, 500));
          }

          setSvgContent(content);
        } else {
          console.warn(`[AnimatedBackground] Failed to load SVG (${type}): ${response.status}`);
        }
      } catch (error) {
        console.warn(`[AnimatedBackground] Error fetching SVG (${type}):`, error);
      }
    };

    loadSvgContent();
  }, [type]);

  return (
    <div className={`relative ${className}`}>
      {/* Animated SVG Background - Inline for animations to work */}
      {svgContent && (
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden" // Container for the SVG
          style={{ 
            opacity, // Use the passed-in or default opacity
            // No explicit zIndex here, relies on DOM order and content's z-index
          }}
        >
          <div 
            className="w-full h-full" // Inner div for dangerouslySetInnerHTML
            dangerouslySetInnerHTML={{ 
              __html: svgContent.replace(
                '<svg',
                // Updated style for proper cover behavior without stretching
                '<svg style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 100%; min-height: 100%; width: auto; height: auto; display: block !important; visibility: visible !important; background-color: transparent !important; overflow: visible !important;" class="w-full h-full"'
              )
            }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground; 