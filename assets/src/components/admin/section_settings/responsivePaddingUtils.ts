import { z } from 'zod';

// Reusable responsive padding schema
export const createResponsivePaddingSchema = () => z.object({
  mobile: z.object({
    top: z.number().min(0).max(200),
    bottom: z.number().min(0).max(200),
    horizontal: z.number().min(0).max(50)
  }),
  tablet: z.object({
    top: z.number().min(0).max(200),
    bottom: z.number().min(0).max(200),
    horizontal: z.number().min(0).max(100)
  }),
  desktop: z.object({
    top: z.number().min(0).max(200),
    bottom: z.number().min(0).max(200),
    horizontal: z.number().min(0).max(200)
  })
});

// Type for responsive padding
export type ResponsivePadding = z.infer<ReturnType<typeof createResponsivePaddingSchema>>;

// Default responsive padding values
export const DEFAULT_RESPONSIVE_PADDING: ResponsivePadding = {
  mobile: {
    top: 0,
    bottom: 0,
    horizontal: 16
  },
  tablet: {
    top: 0,
    bottom: 0,
    horizontal: 32
  },
  desktop: {
    top: 0,
    bottom: 0,
    horizontal: 48
  }
};

// Generate responsive CSS for padding
export const generateResponsivePaddingCSS = (
  padding: ResponsivePadding,
  sectionClass: string = 'section-responsive-padding'
) => {
  const getEffectivePadding = (value: number) => value === 0 ? 96 : value;
  const isFullScreen = padding.desktop.top === 200 && padding.desktop.bottom === 200;

  return {
    className: sectionClass,
    styles: {
      '--mobile-pt': isFullScreen ? '0px' : `${getEffectivePadding(padding.mobile.top)}px`,
      '--mobile-pb': isFullScreen ? '0px' : `${getEffectivePadding(padding.mobile.bottom)}px`,
      '--mobile-px': `${padding.mobile.horizontal}px`,
      '--tablet-pt': isFullScreen ? '0px' : `${getEffectivePadding(padding.tablet.top)}px`,
      '--tablet-pb': isFullScreen ? '0px' : `${getEffectivePadding(padding.tablet.bottom)}px`,
      '--tablet-px': `${padding.tablet.horizontal}px`,
      '--desktop-pt': isFullScreen ? '0px' : `${getEffectivePadding(padding.desktop.top)}px`,
      '--desktop-pb': isFullScreen ? '0px' : `${getEffectivePadding(padding.desktop.bottom)}px`,
      '--desktop-px': `${padding.desktop.horizontal}px`,
    } as React.CSSProperties,
    css: `
      .${sectionClass} {
        padding: var(--mobile-pt) var(--mobile-px) var(--mobile-pb);
      }
      @media (min-width: 768px) {
        .${sectionClass} {
          padding: var(--tablet-pt) var(--tablet-px) var(--tablet-pb);
        }
      }
      @media (min-width: 1024px) {
        .${sectionClass} {
          padding: var(--desktop-pt) var(--desktop-px) var(--desktop-pb);
        }
      }
    `,
    isFullScreen,
    fullScreenClasses: isFullScreen ? 'lg:min-h-screen lg:flex lg:items-center' : ''
  };
};

// Helper to normalize legacy padding format
export const normalizePadding = (
  padding: ResponsivePadding | { vertical?: number; horizontal?: number } | undefined
): ResponsivePadding => {
  if (!padding) return DEFAULT_RESPONSIVE_PADDING;

  // Check if it's the new responsive format with top/bottom
  if ('mobile' in padding && 'tablet' in padding && 'desktop' in padding) {
    const typedPadding = padding as any;
    
    // Check if it has the new top/bottom structure
    if (typedPadding.mobile?.top !== undefined && typedPadding.mobile?.bottom !== undefined) {
      return padding as ResponsivePadding;
    }
    
    // Convert from old vertical structure to new top/bottom structure
    if (typedPadding.mobile?.vertical !== undefined) {
      return {
        mobile: { 
          top: typedPadding.mobile.vertical, 
          bottom: typedPadding.mobile.vertical, 
          horizontal: typedPadding.mobile.horizontal 
        },
        tablet: { 
          top: typedPadding.tablet.vertical, 
          bottom: typedPadding.tablet.vertical, 
          horizontal: typedPadding.tablet.horizontal 
        },
        desktop: { 
          top: typedPadding.desktop.vertical, 
          bottom: typedPadding.desktop.vertical, 
          horizontal: typedPadding.desktop.horizontal 
        }
      };
    }
  }

  // Convert legacy format
  const legacy = padding as { vertical?: number; horizontal?: number };
  const vertical = legacy.vertical ?? 0;
  const horizontal = legacy.horizontal ?? 16;

  return {
    mobile: { top: vertical, bottom: vertical, horizontal },
    tablet: { top: vertical, bottom: vertical, horizontal: horizontal + 8 },
    desktop: { top: vertical, bottom: vertical, horizontal: horizontal + 16 }
  };
}; 