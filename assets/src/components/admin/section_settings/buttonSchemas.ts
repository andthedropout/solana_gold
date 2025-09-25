import { z } from 'zod';

export const BUTTON_VARIANTS = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
export const BUTTON_SIZES = ['default', 'sm', 'lg', 'icon'] as const;
export const ICON_NAMES = ['none', 'arrow-right', 'chevron-right', 'download', 'external-link', 'mail', 'phone', 'play', 'send', 'star', 'user', 'zap', 'home', 'settings', 'search', 'heart', 'check', 'plus', 'minus'] as const;
export const ICON_POSITIONS = ['left', 'right'] as const;

export const createButtonSchema = () => z.object({
  visible: z.boolean(),
  text: z.string(),
  url: z.string(),
  variant: z.enum(BUTTON_VARIANTS),
  size: z.enum(BUTTON_SIZES),
  icon: z.enum(ICON_NAMES),
  iconPosition: z.enum(ICON_POSITIONS)
});

export type ButtonContent = z.infer<ReturnType<typeof createButtonSchema>>; 