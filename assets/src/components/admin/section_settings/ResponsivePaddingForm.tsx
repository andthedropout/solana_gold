import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

interface ResponsivePaddingFormProps {
  values: {
    mobile?: { top: number; bottom: number; horizontal: number };
    tablet?: { top: number; bottom: number; horizontal: number };
    desktop?: { top: number; bottom: number; horizontal: number };
    // Legacy format support
    vertical?: number;
    horizontal?: number;
  };
  onChange: (values: {
    mobile: { top: number; bottom: number; horizontal: number };
    tablet: { top: number; bottom: number; horizontal: number };
    desktop: { top: number; bottom: number; horizontal: number };
  }) => void;
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINT_CONFIG = {
  mobile: { 
    label: 'Mobile', 
    icon: Smartphone,
    maxHorizontal: 50,
    maxTop: 200,
    maxBottom: 200
  },
  tablet: { 
    label: 'Tablet', 
    icon: Tablet,
    maxHorizontal: 100,
    maxTop: 200,
    maxBottom: 200
  },
  desktop: { 
    label: 'Desktop', 
    icon: Monitor,
    maxHorizontal: 200,
    maxTop: 200,
    maxBottom: 200
  }
} as const;

export const ResponsivePaddingForm: React.FC<ResponsivePaddingFormProps> = ({ values, onChange }) => {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');

  // Normalize values to handle both old and new formats
  const normalizedValues = useMemo(() => {
    // If we have the new responsive format with top/bottom, use it
    if (values.mobile?.top !== undefined && values.mobile?.bottom !== undefined) {
      return {
        mobile: values.mobile,
        tablet: values.tablet!,
        desktop: values.desktop!
      };
    }
    
    // If we have the old responsive format with vertical, convert it
    if (values.mobile && values.tablet && values.desktop) {
      const oldValues = values as any;
      return {
        mobile: { 
          top: oldValues.mobile.vertical, 
          bottom: oldValues.mobile.vertical, 
          horizontal: oldValues.mobile.horizontal 
        },
        tablet: { 
          top: oldValues.tablet.vertical, 
          bottom: oldValues.tablet.vertical, 
          horizontal: oldValues.tablet.horizontal 
        },
        desktop: { 
          top: oldValues.desktop.vertical, 
          bottom: oldValues.desktop.vertical, 
          horizontal: oldValues.desktop.horizontal 
        }
      };
    }
    
    // Convert legacy format to responsive format
    const legacyVertical = values.vertical ?? 0;
    const legacyHorizontal = values.horizontal ?? 16;
    
    return {
      mobile: { top: legacyVertical, bottom: legacyVertical, horizontal: legacyHorizontal },
      tablet: { top: legacyVertical, bottom: legacyVertical, horizontal: legacyHorizontal + 8 },
      desktop: { top: legacyVertical, bottom: legacyVertical, horizontal: legacyHorizontal + 16 }
    };
  }, [values]);

  const updateBreakpoint = (breakpoint: Breakpoint, field: 'top' | 'bottom' | 'horizontal', value: number) => {
    const newValues = {
      ...normalizedValues,
      [breakpoint]: {
        ...normalizedValues[breakpoint],
        [field]: value
      }
    };
    onChange(newValues);
  };

  const displayValue = (value: number, field: 'top' | 'bottom' | 'horizontal', breakpoint: Breakpoint) => {
    if (value === 0) return 'default';
    if ((field === 'top' || field === 'bottom') && value === BREAKPOINT_CONFIG[breakpoint].maxTop) return 'full screen';
    if (field === 'horizontal' && value === BREAKPOINT_CONFIG[breakpoint].maxHorizontal) return 'max width';
    return `${value}px`;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
      </div>

      {/* Breakpoint Tabs */}
      <div className="flex bg-muted rounded-md p-1">
        {(Object.keys(BREAKPOINT_CONFIG) as Breakpoint[]).map((breakpoint) => {
          const config = BREAKPOINT_CONFIG[breakpoint];
          const Icon = config.icon;
          const isActive = activeBreakpoint === breakpoint;

          return (
            <button
              key={breakpoint}
              onClick={() => setActiveBreakpoint(breakpoint)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                isActive 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Note about current editing context */}
      <div className="text-xs text-muted-foreground text-center py-1">
        Editing {BREAKPOINT_CONFIG[activeBreakpoint].label.toLowerCase()} appearance
      </div>

      {/* Sliders for Active Breakpoint */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Padding
            </Label>
            <span className="text-xs text-muted-foreground">
              {displayValue(normalizedValues[activeBreakpoint].top, 'top', activeBreakpoint)}
            </span>
          </div>
          <Slider
            value={[normalizedValues[activeBreakpoint].top]}
            onValueChange={(value) => updateBreakpoint(activeBreakpoint, 'top', value[0])}
            min={0}
            max={BREAKPOINT_CONFIG[activeBreakpoint].maxTop}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bottom Padding
            </Label>
            <span className="text-xs text-muted-foreground">
              {displayValue(normalizedValues[activeBreakpoint].bottom, 'bottom', activeBreakpoint)}
            </span>
          </div>
          <Slider
            value={[normalizedValues[activeBreakpoint].bottom]}
            onValueChange={(value) => updateBreakpoint(activeBreakpoint, 'bottom', value[0])}
            min={0}
            max={BREAKPOINT_CONFIG[activeBreakpoint].maxBottom}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Horizontal Padding
            </Label>
            <span className="text-xs text-muted-foreground">
              {displayValue(normalizedValues[activeBreakpoint].horizontal, 'horizontal', activeBreakpoint)}
            </span>
          </div>
          <Slider
            value={[normalizedValues[activeBreakpoint].horizontal]}
            onValueChange={(value) => updateBreakpoint(activeBreakpoint, 'horizontal', value[0])}
            min={0}
            max={BREAKPOINT_CONFIG[activeBreakpoint].maxHorizontal}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}; 