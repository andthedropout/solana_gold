import { useEffect, useState } from 'react';

// Font name normalization for fontsource URLs
const normalizeFontName = (fontName: string): string => {
  return fontName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// Check if font is a web font that needs loading
const isWebFont = (fontName: string): boolean => {
  const systemFonts = [
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', '-apple-system', 'blinkmacsystemfont',
    'arial', 'helvetica', 'times', 'courier', 'verdana',
    'ui-sans-serif', 'ui-monospace', 'ui-serif',
    // Common serif fonts
    'georgia', 'times new roman', 'cambria',
    // Common sans-serif fonts  
    'arial', 'calibri', 'segoe ui', 'tahoma',
    // Common monospace fonts
    'courier new', 'consolas', 'monaco'
  ];
  
  const normalizedFont = fontName.toLowerCase().trim();
  
  return !systemFonts.some(sysFont => 
    normalizedFont === sysFont || normalizedFont.includes(sysFont)
  );
};

// Cache for loaded fonts to avoid duplicates
const loadedFonts = new Set<string>();
const preloadedFonts = new Set<string>();
const fontLoadingPromises = new Map<string, Promise<void>>();

// Load font and return promise
const preloadFont = (fontName: string): Promise<void> => {
  const normalizedName = normalizeFontName(fontName);
  
  if (preloadedFonts.has(normalizedName)) {
    return fontLoadingPromises.get(normalizedName) || Promise.resolve();
  }

  preloadedFonts.add(normalizedName);

  // Try fontsource first, fallback to Google Fonts
  return loadFontWithSwap(fontName, false).catch(() => {
    console.log(`Fontsource failed for ${fontName}, trying Google Fonts...`);
    return loadFontWithSwap(fontName, true);
  });
};

const loadFontWithSwap = (fontName: string, useGoogleFonts = false): Promise<void> => {
  const normalizedName = normalizeFontName(fontName);
  
  if (loadedFonts.has(normalizedName)) {
    return Promise.resolve();
  }

  // Return existing promise if already loading
  if (fontLoadingPromises.has(normalizedName)) {
    return fontLoadingPromises.get(normalizedName)!;
  }

  const loadingPromise = new Promise<void>((resolve, reject) => {
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      
      if (useGoogleFonts) {
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=block`;
        link.setAttribute('data-font-loader', 'google-fonts');
      } else {
        link.href = `https://cdn.jsdelivr.net/npm/@fontsource/${normalizedName}@latest/index.css`;
        link.setAttribute('data-font-loader', 'fontsource');
      }
      
      link.setAttribute('data-font-name', normalizedName);
      
      // Add font-display block to prevent FOUT
      if (!useGoogleFonts) {
        const style = document.createElement('style');
        style.textContent = `
          @font-face {
            font-family: '${fontName}';
            font-display: block;
          }
        `;
        document.head.appendChild(style);
      }
      
      link.onload = async () => {
        // Wait for the actual font to be ready using Font Loading API
        try {
          if ('fonts' in document) {
            await document.fonts.load(`400 16px "${fontName}"`);
            await document.fonts.load(`500 16px "${fontName}"`);
            await document.fonts.load(`600 16px "${fontName}"`);
          }
          console.log(`✅ Font ready: ${fontName}`);
          loadedFonts.add(normalizedName);
          resolve();
        } catch (fontError) {
          console.warn(`Font loading API failed for ${fontName}, but CSS loaded`);
          loadedFonts.add(normalizedName);
          resolve(); // Still resolve since CSS loaded
        }
      };
      
      link.onerror = () => {
        console.warn(`Failed to load font: ${fontName}`);
        reject(new Error(`Failed to load font: ${fontName}`));
      };
      
      document.head.appendChild(link);
      
    } catch (error) {
      console.error(`Error loading font ${fontName}:`, error);
      reject(error);
    }
  });

  fontLoadingPromises.set(normalizedName, loadingPromise);
  return loadingPromise;
};

// Extract fonts from current theme only
const getThemeFonts = (fontVariables: Record<string, string>): string[] => {
  const themeFonts = new Set<string>();
  
  Object.entries(fontVariables).forEach(([key, value]) => {
    if (key.startsWith('font-') && typeof value === 'string') {
      const fontFamily = value.split(',')[0].trim().replace(/['"]/g, '');
      
      if (fontFamily) {
        const isWeb = isWebFont(fontFamily);
        
        if (isWeb) {
          themeFonts.add(fontFamily);
        }
      }
    }
  });
  
  return Array.from(themeFonts);
};

// Initialize font preloading for specific theme
export const initializeFontPreloading = async (fontVariables: Record<string, string>): Promise<void> => {
  const fontsToPreload = getThemeFonts(fontVariables);
  
  console.log(`🔤 Loading fonts for current theme:`, fontsToPreload);
  
  // Load all fonts with individual error handling - never block the app
  const fontPromises = fontsToPreload.map(async (font) => {
    try {
      await preloadFont(font);
      console.log(`✅ Font loaded: ${font}`);
    } catch (error) {
      console.warn(`⚠️ Font failed to load (continuing anyway): ${font}`, error);
      // Mark as loaded anyway to prevent blocking
      loadedFonts.add(normalizeFontName(font));
    }
  });
  
  try {
    await Promise.allSettled(fontPromises);
    console.log(`✅ Font loading complete (some may have failed)`);
  } catch (error) {
    console.warn(`Font loading had issues, but continuing:`, error);
  }
};

export const useDynamicFonts = (fontVariables: Record<string, string>) => {
  const [fontsReady, setFontsReady] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkFontsReady = async () => {
      const themeFonts = getThemeFonts(fontVariables);
      
      if (themeFonts.length === 0) {
        setFontsReady(true);
        return;
      }
      
      // Check if all theme fonts are loaded
      const allLoaded = themeFonts.every(font => 
        loadedFonts.has(normalizeFontName(font))
      );
      
      setFontsReady(allLoaded);
    };
    
    checkFontsReady();
    
    // Re-check every 100ms until fonts are ready, but give up after 5 seconds
    const interval = setInterval(checkFontsReady, 100);
    
    // Fallback: Force ready after 5 seconds to prevent infinite loading
    timeoutId = setTimeout(() => {
      console.warn('⏰ Font loading timeout - continuing anyway');
      setFontsReady(true);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [fontVariables]);
  
  return {
    fontsReady,
    loadedFonts: Array.from(loadedFonts)
  };
}; 