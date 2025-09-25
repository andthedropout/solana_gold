import { 
  ArrowRight, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  Mail, 
  Phone, 
  Play, 
  Send, 
  Star, 
  User, 
  Zap,
  Home,
  Settings,
  Search,
  Heart,
  Check,
  Plus,
  Minus
} from 'lucide-react';

export const ICON_OPTIONS = {
  'none': null,
  'arrow-right': ArrowRight,
  'chevron-right': ChevronRight,
  'download': Download,
  'external-link': ExternalLink,
  'mail': Mail,
  'phone': Phone,
  'play': Play,
  'send': Send,
  'star': Star,
  'user': User,
  'zap': Zap,
  'home': Home,
  'settings': Settings,
  'search': Search,
  'heart': Heart,
  'check': Check,
  'plus': Plus,
  'minus': Minus
} as const;

export type IconName = keyof typeof ICON_OPTIONS;

export const getIconComponent = (iconName: string) => {
  if (iconName === 'none') return null;
  return ICON_OPTIONS[iconName as IconName] || null;
}; 