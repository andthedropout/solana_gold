/**
 * Global Settings
 * 
 * Centralized configuration for the entire application.
 * This file contains all frontend settings, theme preferences, and company information.
 */

// Import User type
type User = {
  id: number;
  username: string;
  email: string;
  displayName: string;
  is_staff: boolean;
  is_site_manager: boolean;
} | null;

// Define navigation item types
interface NavigationItem {
  name: string;
  href: string;
  action: 'route';
}

interface NavigationButton {
  name: string;
  href: string;
  action: 'route' | 'auth';
}

// export const PREFERRED_THEME = 'claude';

export const NAVIGATION_CONFIG = {
  // Navigation items are populated by CMS system - keep this array for dynamic loading
  navItems: [] as { name: string; link: string }[],
};

// Utility function to get navigation items based on user state
// Note: This is now superseded by useNavigation hook for dynamic page loading
export const getNavigationItems = (user: User | null, isAuthenticated: boolean) => {
  // Start with base navigation items from config
  const navigationItems: NavigationItem[] = NAVIGATION_CONFIG.navItems.map(item => ({
    name: item.name,
    href: item.link,
    action: 'route' as const
  }));

  // Admin links go in leftButtons, not main navigation
  const leftButtons: NavigationItem[] = [];
  if (isAuthenticated && user?.is_site_manager) {
    leftButtons.push({
      name: 'Home',
      href: '/',
      action: 'route'
    });
    leftButtons.push({
      name: 'Exchange Admin',
      href: '/exchange-admin',
      action: 'route'
    });
  }

  return {
    items: navigationItems,
    leftButtons,
    rightButtons: isAuthenticated
      ? [{ name: 'Logout', href: '/logout', action: 'auth' as const }]
      : [
          { name: 'Login', href: '/login', action: 'route' as const },
          { name: 'Sign Up', href: '/register', action: 'route' as const }
        ]
  };
};

// #### **modern-minimal**
// - **Fonts**: Inter (sans), Fira Code (mono), Georgia (serif)
// - **Style**: Clean, minimal design with subtle shadows and 0.35rem radius
// - **Colors**: Neutral grays with blue accents
// - **Best for**: Corporate websites, SaaS platforms, professional portfolios
// - **Characteristics**: Highly readable, professional, excellent for business applications

// #### **claude**
// - **Fonts**: System fonts (ui-sans-serif, ui-monospace, ui-serif)
// - **Style**: Official Claude AI theme with warm orange accents and subtle shadows
// - **Colors**: Warm grays with orange primary colors
// - **Best for**: AI applications, chat interfaces, professional tools
// - **Characteristics**: Clean, accessible, optimized for readability

// #### **elegant-luxury**
// - **Fonts**: Poppins (sans), IBM Plex Mono (mono), Libre Baskerville (serif)
// - **Style**: Sophisticated luxury theme with warm gold tones and elegant soft shadows
// - **Colors**: Cream backgrounds with gold and brown accents
// - **Best for**: Luxury brands, high-end services, premium products
// - **Characteristics**: Sophisticated typography, warm elegant feel

// #### **clean-slate**
// - **Fonts**: System fonts with clean, minimal styling
// - **Style**: Pure, minimal theme with zero decorations
// - **Colors**: Pure whites and grays
// - **Best for**: Minimalist designs, content-focused sites, documentation
// - **Characteristics**: Maximum simplicity, distraction-free

// #### **graphite**
// - **Fonts**: Inter (sans), Fira Code (mono), Georgia (serif)
// - **Style**: Monochromatic grayscale theme with subtle shadows
// - **Colors**: Pure grayscale palette
// - **Best for**: Technical documentation, developer tools, monochrome designs
// - **Characteristics**: High contrast, no color distractions, professional

// #### **vercel**
// - **Fonts**: System fonts with Vercel-inspired styling
// - **Style**: Official Vercel-inspired theme with blue accents
// - **Colors**: Clean whites with blue primary colors
// - **Best for**: Developer tools, deployment platforms, tech startups
// - **Characteristics**: Modern, clean, developer-friendly

// #### **supabase**
// - **Fonts**: System fonts with Supabase-inspired styling
// - **Style**: Official Supabase-inspired theme with green accents
// - **Colors**: Dark backgrounds with green primary colors
// - **Best for**: Database tools, backend services, developer platforms
// - **Characteristics**: Developer-focused, modern, technical

// ### Creative & Artistic

// #### **sunset-horizon** ⭐ (Currently Selected)
// - **Fonts**: Montserrat (sans), Ubuntu Mono (mono), Merriweather (serif)
// - **Style**: Warm sunset colors with golden orange tones and soft shadows
// - **Colors**: Warm oranges, golds, and sunset hues
// - **Best for**: Creative agencies, lifestyle brands, warm welcoming sites
// - **Characteristics**: Large border radius (0.625rem), warm and inviting

// #### **ocean-breeze**
// - **Fonts**: DM Sans (sans), IBM Plex Mono (mono), Lora (serif)
// - **Style**: Refreshing aqua tones with calming blue-green colors
// - **Colors**: Ocean blues and aqua greens
// - **Best for**: Wellness sites, travel agencies, coastal businesses
// - **Characteristics**: Calming, refreshing, nature-inspired

// #### **midnight-bloom**
// - **Fonts**: Montserrat (sans), Source Code Pro (mono), Playfair Display (serif)
// - **Style**: Elegant purple theme with sophisticated typography
// - **Colors**: Deep purples with blooming accent colors
// - **Best for**: Creative portfolios, artistic showcases, elegant brands
// - **Characteristics**: Sophisticated serif typography, elegant shadows

// #### **northern-lights**
// - **Fonts**: Aurora-inspired fonts with cool styling
// - **Style**: Aurora-inspired theme with cool blues and greens
// - **Colors**: Cool blues, greens, and aurora-like gradients
// - **Best for**: Tech companies, innovative brands, Nordic-inspired designs
// - **Characteristics**: Cool, innovative, mystical feel

// #### **starry-night**
// - **Fonts**: Cosmic-inspired typography
// - **Style**: Deep space theme with cosmic colors and stellar accents
// - **Colors**: Deep space blues and purples with star-like accents
// - **Best for**: Astronomy sites, space tech, futuristic brands
// - **Characteristics**: Cosmic, mysterious, deep

// #### **vintage-paper**
// - **Fonts**: Classic serif fonts with vintage styling
// - **Style**: Nostalgic paper texture theme with warm sepia tones
// - **Colors**: Sepia, cream, and vintage paper colors
// - **Best for**: Historical sites, vintage brands, literary projects
// - **Characteristics**: Nostalgic, warm, paper-like textures

// #### **pastel-dreams**
// - **Fonts**: Soft, dreamy typography
// - **Style**: Soft pastel colors with dreamy, gentle aesthetics
// - **Colors**: Soft pastels in pink, blue, and lavender
// - **Best for**: Children's sites, gentle brands, creative projects
// - **Characteristics**: Soft, dreamy, gentle

// #### **popstar**
// - **Fonts**: Bungee (sans), Staatliches (serif), Space Mono (mono)
// - **Style**: Neon pink and blue theme with bold, in-your-face aesthetics
// - **Colors**: Neon pinks, electric blues, and gold accents
// - **Best for**: Music artists, stage-inspired brands, cutting-edge sites
// - **Characteristics**: Bold, in-your-face, neon colors, stage-inspired

// ### Nature & Organic

// #### **nature**
// - **Fonts**: Natural, organic typography
// - **Style**: Earth-inspired theme with natural greens and browns
// - **Colors**: Forest greens, earth browns, natural tones
// - **Best for**: Environmental sites, outdoor brands, organic products
// - **Characteristics**: Earthy, natural, grounded

// #### **kodama-grove**
// - **Fonts**: Merriweather (sans), JetBrains Mono (mono), Source Serif 4 (serif)
// - **Style**: Forest-inspired theme with green tones and nature aesthetics
// - **Colors**: Forest greens with natural earth accents
// - **Best for**: Environmental organizations, nature blogs, outdoor companies
// - **Characteristics**: Serif-heavy typography, natural shadows, forest vibes

// #### **amber-minimal**
// - **Fonts**: Minimal fonts with amber styling
// - **Style**: Warm amber tones with minimal, clean design
// - **Colors**: Warm ambers and honey tones
// - **Best for**: Minimal brands, warm aesthetics, craft businesses
// - **Characteristics**: Warm, minimal, honey-like

// #### **mocha-mousse**
// - **Fonts**: DM Sans (sans), Menlo (mono), Georgia (serif)
// - **Style**: Coffee-inspired theme with earthy browns and unique offset shadows
// - **Colors**: Coffee browns, cream, and mocha tones
// - **Best for**: Coffee shops, cozy brands, warm businesses
// - **Characteristics**: Unique offset shadows (2px, 2px), cozy coffee vibes

// ### Tech & Futuristic

// #### **cyberpunk**
// - **Fonts**: Outfit (sans), Fira Code (mono), system serif
// - **Style**: Futuristic theme with neon pink accents and high contrast
// - **Colors**: Dark backgrounds with neon pink and cyan accents
// - **Best for**: Gaming sites, tech startups, futuristic brands
// - **Characteristics**: High contrast, neon colors, tech aesthetics

// #### **bold-tech**
// - **Fonts**: Bold, modern tech fonts
// - **Style**: High-contrast tech theme with bold colors and modern fonts
// - **Colors**: Bold blues, blacks, and tech-inspired accents
// - **Best for**: Tech companies, software products, innovation brands
// - **Characteristics**: Bold, high-contrast, modern

// #### **cosmic-night**
// - **Fonts**: Space-age typography
// - **Style**: Space-age theme with deep purples and cosmic accents
// - **Colors**: Deep cosmic purples and space-inspired colors
// - **Best for**: Space tech, futuristic apps, cosmic themes
// - **Characteristics**: Cosmic, deep, space-inspired

// #### **quantum-rose**
// - **Fonts**: Quantum-inspired typography
// - **Style**: Quantum-inspired theme with rose and purple tones
// - **Colors**: Rose pinks with quantum purple accents
// - **Best for**: Quantum computing, advanced tech, scientific applications
// - **Characteristics**: Scientific, advanced, quantum-inspired

// ### Retro & Vintage

// #### **retro-arcade**
// - **Fonts**: Pixel-inspired fonts
// - **Style**: 80s gaming theme with neon colors and pixel aesthetics
// - **Colors**: Neon greens, pinks, and 80s-inspired colors
// - **Best for**: Gaming sites, retro brands, 80s-themed projects
// - **Characteristics**: Pixelated, neon, nostalgic gaming vibes

// #### **doom-64**
// - **Fonts**: Oxanium (sans), Source Code Pro (mono), system serif
// - **Style**: Gaming-inspired theme with zero border radius and strong shadows
// - **Colors**: Gaming-inspired oranges and dark backgrounds
// - **Best for**: Gaming platforms, retro gaming, tech with edge
// - **Characteristics**: Zero border radius, strong shadows, gaming aesthetics

// #### **t3-chat**
// - **Fonts**: Discord-inspired fonts
// - **Style**: Discord-inspired dark theme with modern chat aesthetics
// - **Colors**: Discord-like dark grays with blue accents
// - **Best for**: Chat applications, gaming communities, social platforms
// - **Characteristics**: Dark, modern, chat-optimized

// #### **twitter**
// - **Fonts**: Twitter/X-inspired fonts
// - **Style**: Twitter/X-inspired theme with familiar blue accents
// - **Colors**: Twitter blues with familiar social media styling
// - **Best for**: Social media platforms, communication apps, familiar interfaces
// - **Characteristics**: Familiar, social, blue-focused

// ### Bold & Experimental

// #### **neo-brutalism**
// - **Fonts**: DM Sans (sans), Space Mono (mono), system serif
// - **Style**: Bold brutalist theme with zero border radius and hard shadows
// - **Colors**: High contrast blacks, whites, and bold accent colors
// - **Best for**: Bold brands, artistic projects, statement designs
// - **Characteristics**: Zero border radius, hard shadows (4px, 4px), stark contrast

// #### **claymorphism**
// - **Fonts**: Clay-inspired soft fonts
// - **Style**: Soft, clay-like theme with rounded edges and depth
// - **Colors**: Soft clay colors with depth and texture
// - **Best for**: Playful brands, creative projects, soft aesthetics
// - **Characteristics**: Soft, rounded, clay-like textures

// #### **bubblegum**
// - **Fonts**: Playful, fun typography
// - **Style**: Playful, colorful theme with fun, vibrant aesthetics
// - **Colors**: Bright pinks, blues, and candy colors
// - **Best for**: Children's brands, playful projects, fun applications
// - **Characteristics**: Vibrant, playful, candy-like

// #### **candyland**
// - **Fonts**: Sweet, candy-inspired fonts
// - **Style**: Sweet, candy-inspired theme with bright, cheerful colors
// - **Colors**: Candy colors - bright reds, yellows, and rainbow hues
// - **Best for**: Children's sites, candy brands, cheerful projects
// - **Characteristics**: Sweet, bright, candy-inspired

// ### Monochrome & Minimal

// #### **mono**
// - **Fonts**: Monospace-inspired clean fonts
// - **Style**: Pure black and white theme with high contrast
// - **Colors**: Pure black and white only
// - **Best for**: Minimalist designs, high contrast needs, accessibility
// - **Characteristics**: Maximum contrast, no color, pure minimal

// #### **notebook**
// - **Fonts**: Paper-like, notebook fonts
// - **Style**: Paper-like theme mimicking a clean notebook aesthetic
// - **Colors**: Paper whites with notebook-like lines and margins
// - **Best for**: Note-taking apps, documentation, writing platforms
// - **Characteristics**: Paper-like, clean, notebook aesthetic

// #### **perpetuity**
// - **Fonts**: Timeless, eternal typography
// - **Style**: Timeless, eternal theme with balanced neutral tones
// - **Colors**: Balanced neutrals that never go out of style
// - **Best for**: Long-term projects, timeless brands, classic designs
// - **Characteristics**: Timeless, balanced, eternal

// ### Warm & Cozy

// #### **caffeine**
// - **Fonts**: Coffee shop-inspired fonts
// - **Style**: Coffee shop theme with warm browns and cozy vibes
// - **Colors**: Coffee browns, warm creams, cozy tones
// - **Best for**: Coffee shops, cozy brands, warm businesses
// - **Characteristics**: Warm, cozy, coffee-inspired

// #### **tangerine**
// - **Fonts**: Citrus-inspired typography
// - **Style**: Citrus-inspired theme with bright orange accents
// - **Colors**: Bright oranges, tangerine, and citrus colors
// - **Best for**: Food brands, energetic companies, citrus businesses
// - **Characteristics**: Bright, energetic, citrus-fresh

// #### **solar-dusk**
// - **Fonts**: Sunset-inspired fonts
// - **Style**: Warm sunset theme with golden hour aesthetics
// - **Colors**: Golden hour oranges, warm yellows, sunset hues
// - **Best for**: Warm brands, sunset themes, golden aesthetics
// - **Characteristics**: Golden, warm, sunset-inspired

// ### Cool & Calming

// #### **catppuccin**
// - **Fonts**: Popular pastel fonts
// - **Style**: Popular pastel theme with soft, muted colors
// - **Colors**: Soft pastels in muted tones
// - **Best for**: Developer tools, gentle interfaces, popular aesthetic
// - **Characteristics**: Soft, muted, popular among developers

// #### **amethyst-haze**
// - **Fonts**: Mystical, gemstone-inspired fonts
// - **Style**: Purple gemstone theme with mystical, ethereal vibes
// - **Colors**: Amethyst purples with mystical haze effects
// - **Best for**: Mystical brands, gemstone businesses, ethereal designs
// - **Characteristics**: Mystical, ethereal, gemstone-inspired
