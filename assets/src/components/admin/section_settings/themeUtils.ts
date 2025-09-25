export const TEXT_COLOR_OPTIONS = [
  'foreground', 
  'muted-foreground', 
  'primary', 
  'primary-foreground',
  'secondary-foreground', 
  'accent-foreground', 
  'destructive-foreground',
  'card-foreground',
  'popover-foreground'
] as const;

export type TextColor = typeof TEXT_COLOR_OPTIONS[number];

interface SectionBackground {
  type: 'static' | 'animated';
  static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
  animated_type?: string;
  opacity?: number;
}

export const getTextColorClasses = (background?: SectionBackground) => {
  if (background?.type === 'static' && background.static_color) { 
    return {
      title: '', 
      subtitle: 'opacity-80', 
    };
  }
  return {
    title: 'text-foreground',
    subtitle: 'text-muted-foreground',
  };
};

export const getButtonVariants = (background?: SectionBackground, primaryVariant?: string, secondaryVariant?: string) => {
  if (background?.type === 'static' && background.static_color) {
    return {
      primary: 'secondary',
      secondary: 'outline',
    };
  }
  return {
    primary: primaryVariant || 'default',
    secondary: secondaryVariant || 'outline',
  };
};

export const getTextColorClass = (textColor?: string) => {
  return `text-${textColor || 'foreground'}`;
}; 