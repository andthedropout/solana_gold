import { useEffect, useState } from 'react';
import { ThemeData, apiThemeToThemeData } from '@/lib/themeTypes';
import { useDynamicFonts, initializeFontPreloading } from './useDynamicFonts';
import { themeApi } from '@/api/themes';

export const useTheme = () => {
  const [themeSettings, setThemeSettings] = useState<ThemeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamic font loading based on theme variables
  const fontVariables = themeSettings?.css_vars?.theme || {};
  const { fontsReady, loadedFonts } = useDynamicFonts(fontVariables);

  useEffect(() => {
    const loadAndApplyTheme = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current theme from backend API
        const apiTheme = await themeApi.getCurrentTheme();
        const theme = apiThemeToThemeData(apiTheme);
        
        setThemeSettings(theme);
        
        console.log('🎨 Applying theme from backend:', theme.name);
        
        // Initialize font preloading for this theme
        await initializeFontPreloading(theme.css_vars.theme);
        
        // Apply theme to DOM
        applyThemeToDOM(theme);
        
        setError(null);
      } catch (err) {
        console.error('Failed to load theme from backend:', err);
        
        // Fallback to a basic theme if backend fails
        const fallbackTheme: ThemeData = {
          name: 'fallback',
          display_name: 'Fallback Theme',
          css_vars: {
            theme: {
              'font-sans': 'system-ui, sans-serif',
              'font-serif': 'Georgia, serif',
              'font-mono': 'monospace',
              'radius': '0.375rem'
            },
            light: {
              'background': 'oklch(1.0000 0 0)',
              'foreground': 'oklch(0.15 0 0)',
              'primary': 'oklch(0.6231 0.1880 259.8145)',
              'secondary': 'oklch(0.9670 0.0029 264.5419)',
              'accent': 'oklch(0.9514 0.0250 236.8242)',
              'muted': 'oklch(0.9608 0.0155 264.5380)',
              'card': 'oklch(1.0000 0 0)',
              'border': 'oklch(0.9216 0.0266 264.5312)'
            },
            dark: {
              'background': 'oklch(0.0902 0 0)',
              'foreground': 'oklch(0.9216 0.0266 264.5312)',
              'primary': 'oklch(0.6231 0.1880 259.8145)',
              'secondary': 'oklch(0.1725 0.0118 264.5419)',
              'accent': 'oklch(0.1686 0.0157 236.8242)',
              'muted': 'oklch(0.1412 0.0166 264.5380)',
              'card': 'oklch(0.0902 0 0)',
              'border': 'oklch(0.1725 0.0118 264.5419)'
            }
          }
        };
        
        setThemeSettings(fallbackTheme);
        applyThemeToDOM(fallbackTheme);
        setError('Failed to load theme from backend, using fallback');
      } finally {
        setIsLoading(false);
      }
    };

    loadAndApplyTheme();
  }, []);

  // Helper function to apply theme CSS to DOM
  const applyThemeToDOM = (theme: ThemeData) => {
    const root = document.documentElement;
    
    // Apply theme variables (fonts, radius, etc.) as inline styles - these don't change between light/dark
    console.log('🔧 Applying theme variables:', Object.keys(theme.css_vars.theme));
    Object.entries(theme.css_vars.theme).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, String(value));
      
      // For font-size, also set the html element font-size for global scaling
      if (property === 'font-size') {
        document.documentElement.style.fontSize = String(value);
      }
    });
    
    // Create CSS rules for both light and dark mode (not inline styles)
    const themeStyleId = 'tweakcn-theme-styles';
    let themeStyleElement = document.getElementById(themeStyleId) as HTMLStyleElement;
    
    if (!themeStyleElement) {
      themeStyleElement = document.createElement('style');
      themeStyleElement.id = themeStyleId;
      document.head.appendChild(themeStyleElement);
    }
    
    // Generate CSS for both light and dark modes
    const lightCSS = `:root {
      ${Object.entries(theme.css_vars.light).map(([property, value]) => 
        `--${property}: ${value};`
      ).join('\n  ')}
    }`;
    
    const darkCSS = `.dark {
      ${Object.entries(theme.css_vars.dark).map(([property, value]) => 
        `--${property}: ${value};`
      ).join('\n  ')}
    }`;
    
    const fullCSS = lightCSS + '\n\n' + darkCSS;
    
    console.log('☀️ Generated light mode CSS variables:', Object.keys(theme.css_vars.light).length, 'variables');
    console.log('🌙 Generated dark mode CSS variables:', Object.keys(theme.css_vars.dark).length, 'variables');
    
    themeStyleElement.textContent = fullCSS;
    
    // Debug: Check if variables are applied
    console.log('🔍 Sample CSS variables check:');
    console.log('--background:', root.style.getPropertyValue('--background'));
    console.log('--primary:', root.style.getPropertyValue('--primary'));
    console.log('--foreground:', root.style.getPropertyValue('--foreground'));
    console.log('--font-sans:', root.style.getPropertyValue('--font-sans'));
    console.log('--font-serif:', root.style.getPropertyValue('--font-serif'));

    // Check computed style on body
    const bodyStyle = window.getComputedStyle(document.body);
    console.log('💡 Body computed font-family:', bodyStyle.fontFamily);
  };

  const refreshTheme = async () => {
    setIsLoading(true);
    try {
      // Fetch current theme from backend
      const apiTheme = await themeApi.getCurrentTheme();
      const theme = apiThemeToThemeData(apiTheme);
      
      setThemeSettings(theme);
      
      // Re-initialize font preloading for this theme
      await initializeFontPreloading(theme.css_vars.theme);
      
      // Re-apply theme to DOM
      applyThemeToDOM(theme);
      
      setError(null);
    } catch (err) {
      console.error('Failed to refresh theme:', err);
      setError('Failed to refresh theme');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to switch themes
  const switchTheme = async (themeName: string) => {
    setIsLoading(true);
    try {
      // Set the new theme as current in backend
      await themeApi.setCurrentTheme(themeName);
      
      // Refresh to apply the new theme
      await refreshTheme();
    } catch (err) {
      console.error('Failed to switch theme:', err);
      setError('Failed to switch theme');
      setIsLoading(false);
    }
  };

  return {
    themeSettings,
    isLoading: isLoading || !fontsReady,
    error,
    refreshTheme,
    switchTheme,
    loadedFonts,
    fontsReady
  };
}; 