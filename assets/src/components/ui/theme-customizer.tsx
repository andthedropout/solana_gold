'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Palette, Settings, X, Shuffle, Undo2, Type, Sliders, Check, Save, Trash2, Sparkles, Code2, Copy, Download } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Import your existing theme system
import { useTheme } from '@/hooks/useTheme'
import { useDynamicFonts, initializeFontPreloading } from '@/hooks/useDynamicFonts'
import { themeApi } from '@/api/themes'
import { useToast } from '@/hooks/use-toast'
import { DarkModeToggle } from '@/components/dark-mode-toggle'
import { AIThemeGenerator } from '@/components/ui/ai-theme-generator'

interface ThemeCustomizerProps {
  isVisible?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Helper functions for color conversion
const oklchToHex = (oklchString: string): string => {
  try {
    // Parse OKLCH string like "oklch(0.6 0.15 260)"
    const match = oklchString.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
    if (!match) {
      // If already hex, return it
      if (oklchString.startsWith('#')) {
        return oklchString
      }
      console.warn('Failed to parse OKLCH:', oklchString)
      return '#808080' // neutral gray fallback
    }
    
    const [, lStr, cStr, hStr] = match
    const L = parseFloat(lStr) // lightness 0-1
    const C = parseFloat(cStr) // chroma 0-0.4+
    const H = parseFloat(hStr) // hue 0-360
    
    // Convert to OKLab
    const hRad = (H * Math.PI) / 180
    const a = C * Math.cos(hRad)
    const b = C * Math.sin(hRad)
    
    // OKLab to linear RGB
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b
    
    const l = l_ * l_ * l_
    const m = m_ * m_ * m_
    const s = s_ * s_ * s_
    
    let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    let blue = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    
    // Apply gamma correction (linear to sRGB)
    const gammaCorrect = (channel: number) => {
      if (channel <= 0.0031308) {
        return 12.92 * channel
      }
      return 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
    }
    
    r = gammaCorrect(r)
    g = gammaCorrect(g)
    blue = gammaCorrect(blue)
    
    // Clamp and convert to 0-255
    r = Math.max(0, Math.min(1, r)) * 255
    g = Math.max(0, Math.min(1, g)) * 255
    blue = Math.max(0, Math.min(1, blue)) * 255
    
    // Convert to hex
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(blue)}`
    
  } catch (error) {
    console.error('Error converting OKLCH to hex:', error, oklchString)
    return '#808080' // neutral gray fallback
  }
}

const hexToOklch = (hex: string): string => {
  // For simplicity, just return the hex value
  // CSS can handle hex colors in OKLCH contexts
  return hex
}

// CSS Parser functions for Raw CSS Editor
const parseCSSVariables = (cssText: string): Record<string, string> => {
  const variables: Record<string, string> = {}
  
  // Remove comments
  let cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  
  // Match CSS variable declarations like --variable-name: value;
  const variableRegex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g
  let match
  
  while ((match = variableRegex.exec(cleanCss)) !== null) {
    const [, name, value] = match
    variables[name] = value.trim()
  }
  
  return variables
}

const generateCSSFromTheme = (themeData: any, mode: 'light' | 'dark' = 'light'): string => {
  if (!themeData?.css_vars) return ''
  
  const variables = { ...themeData.css_vars.theme, ...themeData.css_vars[mode] }
  
  const cssLines = Object.entries(variables).map(([key, value]) => {
    return `  --${key}: ${value};`
  })
  
  return `:root {\n${cssLines.join('\n')}\n}`
}

const validateCSSVariables = (cssText: string): { isValid: boolean; error: string } => {
  try {
    // Check basic CSS syntax
    if (!cssText.trim()) {
      return { isValid: false, error: 'CSS content is empty' }
    }
    
    // Check for basic CSS structure
    const hasValidStructure = cssText.includes(':root') || cssText.includes('--')
    if (!hasValidStructure) {
      return { isValid: false, error: 'No CSS variables found. Make sure to include :root { --variable: value; } format' }
    }
    
    // Try to parse variables
    const variables = parseCSSVariables(cssText)
    if (Object.keys(variables).length === 0) {
      return { isValid: false, error: 'No valid CSS variables found in the format --variable-name: value;' }
    }
    
    return { isValid: true, error: '' }
  } catch (error) {
    return { isValid: false, error: 'Invalid CSS syntax' }
  }
}

// Component to render color swatches using backend API
const ThemeColorPreview = ({ themeName }: { themeName: string }) => {
  const [colors, setColors] = useState<{
    primary: string
    secondary: string
    accent: string
    background: string
  } | null>(null)

  useEffect(() => {
    const getThemePreviewColors = async () => {
      try {
        const themeData = await themeApi.getTheme(themeName)
        const colors = themeData.css_vars.light
        return {
          primary: colors?.primary || 'oklch(0.6231 0.1880 259.8145)',
          secondary: colors?.secondary || 'oklch(0.9670 0.0029 264.5419)',
          accent: colors?.accent || 'oklch(0.9514 0.0250 236.8242)',
          background: colors?.background || 'oklch(1.0000 0 0)'
        }
      } catch (error) {
        console.warn(`Theme preview failed for ${themeName}:`, error)
        // Fallback colors if API fails (theme might be deleted)
        return {
          primary: 'oklch(0.6231 0.1880 259.8145)',
          secondary: 'oklch(0.9670 0.0029 264.5419)', 
          accent: 'oklch(0.9514 0.0250 236.8242)',
          background: 'oklch(1.0000 0 0)'
        }
      }
    }

    getThemePreviewColors().then(setColors)
  }, [themeName])

  if (!colors) {
    return (
      <div className="flex gap-1">
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex gap-1">
      <div 
        className="w-3 h-3 rounded-full border border-gray-200" 
        style={{ backgroundColor: colors.primary }}
      />
      <div 
        className="w-3 h-3 rounded-full border border-gray-200" 
        style={{ backgroundColor: colors.accent }}
      />
      <div 
        className="w-3 h-3 rounded-full border border-gray-200" 
        style={{ backgroundColor: colors.secondary }}
      />
    </div>
  )
}

// Color variable groups for organization
const colorGroups = {
  'Primary Colors': ['background', 'foreground', 'primary', 'primary-foreground'],
  'Secondary Colors': ['secondary', 'secondary-foreground', 'accent', 'accent-foreground'],
  'Utility Colors': ['muted', 'muted-foreground', 'card', 'card-foreground'],
  'Interactive Colors': ['border', 'input', 'ring', 'destructive', 'destructive-foreground']
}

// Typography variables
const typographyVars = {
  'Font Families': ['font-sans', 'font-serif', 'font-mono'],
  'Font Size': ['font-size'],
  'Letter Spacing': ['letter-spacing']
}

// Other variables
const otherVars = {
  'Border Radius': ['radius']
}

export function ThemeCustomizer({ isVisible = true, open = false, onOpenChange, trigger }: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [previewTheme, setPreviewTheme] = useState<string>('') // For real-time preview without saving
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [hexValues, setHexValues] = useState<Record<string, string>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentShadowColor, setCurrentShadowColor] = useState('#000000')
  const [fontFamiliesLoaded, setFontFamiliesLoaded] = useState(false)
  const [fontLoadingProgress, setFontLoadingProgress] = useState(0)
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [savePresetOpen, setSavePresetOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [isSavingPreset, setIsSavingPreset] = useState(false)
  const [rawCssContent, setRawCssContent] = useState('')
  const [rawCssError, setRawCssError] = useState('')
  const { themeSettings, refreshTheme, switchTheme, isLoading: themeLoading } = useTheme()
  const { toast } = useToast()
  
  // Get current CSS variables for font loading
  const currentCSSVars = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const vars: Record<string, string> = {}
    
    // Get all font-related CSS variables (exclude font-size which is not a font family)
    const fontVars = ['font-sans', 'font-serif', 'font-mono']
    fontVars.forEach(varName => {
      const value = style.getPropertyValue(`--${varName}`)
      if (value && value.trim()) {
        vars[varName] = value.trim()
      }
    })
    
    // Debug: Log what we're getting for fonts
    console.log('🔤 Font variables extracted:', vars)
    
    return vars
  }, [customValues, selectedTheme])
  
  // Use dynamic fonts hook
  const { fontsReady, loadedFonts } = useDynamicFonts(currentCSSVars)

  // Function to extract unique font families from dropdown options
  const extractUniqueFonts = useCallback(() => {
    const allFonts = new Set<string>()
    
    // Get font options (we'll define this in the render section)
    const fontOptions = {
      'font-sans': [
        // === SYSTEM FONTS === (skip these, they don't need loading)
        
        // === CORPORATE/PROFESSIONAL ===
        'Inter', 'Source Sans Pro', 'Work Sans', 'Lato', 'Open Sans', 'Roboto',
        'IBM Plex Sans', 'Libre Franklin', 'PT Sans', 'Chivo',
        
        // === MODERN/TECH/STARTUP ===
        'DM Sans', 'Space Grotesk', 'Manrope', 'Outfit', 'Plus Jakarta Sans',
        'Fira Sans', 'Karla', 'Rubik', 'Overpass', 'Spartan', 'Instrument Sans',
        'Bricolage Grotesque',
        
        // === CREATIVE/AGENCY/DESIGN ===
        'Syne', 'Archivo Narrow', 'Josefin Sans', 'Raleway', 'Nunito Sans',
        'Barlow Condensed', 'Oswald', 'Fjalla One', 'Familjen Grotesk',
        
        // === E-COMMERCE/RETAIL ===
        'Poppins', 'Montserrat', 'Alegreya Sans', 'Proza Libre', 'Varela Round', 'Bitter',
        
        // === MUSIC/ENTERTAINMENT ===
        'Pathway Gothic One', 'Rajdhani', 'Bebas Neue', 'Anton', 'Righteous', 
        'Fredoka One', 'Bungee',
        
        // === FRIENDLY/APPROACHABLE ===
        'Nunito', 'Comfortaa', 'Mukti', 'Hind', 'Dosis', 'Catamaran',
        
        // === INTERNATIONAL/MULTILINGUAL ===
        'Noto Sans', 'M PLUS 1p', 'Sarabun', 'Kanit', 'Prompt',
        
        // === CONDENSED/HEADLINE ===
        'Titillium Web', 'Exo 2', 'PT Sans Caption', 'Archivo Black', 'Squada One',
        
        // === SPECIAL FONTS ===
        'Geist', 'Quicksand', 'Architects Daughter', 'Oxanium'
      ],
      'font-serif': [
        // === LUXURY/FASHION/EDITORIAL ===
        'Playfair Display', 'Cormorant', 'Libre Baskerville', 'Fraunces',
        'Abril Fatface', 'Ultra', 'Rozha One', 'DM Serif Display', 'DM Serif Text',
        
        // === PROFESSIONAL/CORPORATE ===
        'Source Serif Pro', 'Source Serif 4', 'PT Serif', 'Spectral',
        'Literata', 'Newsreader', 'Roboto Serif',
        
        // === TRADITIONAL/CLASSIC ===
        'Merriweather', 'Lora', 'Alegreya', 'Cardo', 'Old Standard TT', 'Gentium Basic',
        
        // === CREATIVE/ARTISTIC ===
        'Eczar', 'BioRhyme', 'Inknut Antiqua', 'Neuton',
        'Zilla Slab', 'Josefin Slab',
        
        // === INSTRUMENT/MODERN ===
        'Instrument Serif',
        
        // === SCRIPT/HANDWRITING ===
        'Dancing Script', 'Pacifico', 'Kaushan Script', 'Satisfy', 'Caveat',
        'Sacramento', 'Great Vibes', 'Tangerine',
        
        // === SLAB SERIF ===
        'Roboto Slab', 'Arvo', 'Crimson Text', 'Volkhov', 'Rokkitt', 'Bitter', 'Slabo 27px',
        
        // === DISPLAY SERIF ===
        'Yeseva One', 'Cinzel', 'Playfair Display SC', 'Sorts Mill Goudy', 'Crimson Pro'
      ],
      'font-mono': [
        // === MODERN CODE FONTS ===
        'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'IBM Plex Mono',
        'Geist Mono', 'Azeret Mono', 'Roboto Mono', 'Ubuntu Mono',
        
        // === CLASSIC/RETRO ===
        'Space Mono', 'Inconsolata'
      ]
    }
    
    // Add all unique font names (Set automatically handles duplicates)
    Object.values(fontOptions).flat().forEach(font => {
      if (font && font !== 'monospace') {
        allFonts.add(font)
      }
    })
    
    return Array.from(allFonts).sort() // Sort alphabetically for easier debugging
  }, [])

  // Batch font loading function with progress tracking
  const preloadFontDropdownFonts = useCallback(async () => {
    if (fontFamiliesLoaded || isLoadingFonts) return
    
    setIsLoadingFonts(true)
    setFontLoadingProgress(0)
    
    const fonts = extractUniqueFonts()
    console.log(`🔤 Starting batch font loading: ${fonts.length} fonts`)
    
    // Batch size - load 5 fonts at a time to avoid overwhelming
    const batchSize = 5
    const batches = []
    
    for (let i = 0; i < fonts.length; i += batchSize) {
      batches.push(fonts.slice(i, i + batchSize))
    }
    
    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        // Load this batch in parallel
        const batchPromises = batch.map(async (fontName) => {
          try {
            const fontVars = { [`font-temp`]: `${fontName}, sans-serif` }
            await initializeFontPreloading(fontVars)
            console.log(`✅ Loaded: ${fontName}`)
          } catch (error) {
            console.warn(`❌ Failed to load: ${fontName}`, error)
          }
        })
        
        await Promise.all(batchPromises)
        
        // Update progress
        const progress = Math.round(((batchIndex + 1) / batches.length) * 100)
        setFontLoadingProgress(progress)
        
        // Small delay between batches to avoid overwhelming the system
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log(`✅ All fonts loaded successfully!`)
      setFontFamiliesLoaded(true)
    } catch (error) {
      console.error('Font loading failed:', error)
    } finally {
      setIsLoadingFonts(false)
    }
  }, [fontFamiliesLoaded, isLoadingFonts, extractUniqueFonts])

  // Handle font families accordion open
  const handleFontFamiliesAccordionChange = useCallback((value: string[]) => {
    if (value.includes('font-families') && !fontFamiliesLoaded && !isLoadingFonts) {
      // Delay slightly to let the accordion animation complete
      setTimeout(() => {
        preloadFontDropdownFonts()
      }, 100)
    }
  }, [fontFamiliesLoaded, isLoadingFonts, preloadFontDropdownFonts])
  
  // Get available themes from backend with full data
  const [availableThemes, setAvailableThemes] = useState<Array<{
    id: number;
    name: string;
    display_name: string;
    description: string;
    is_system_theme: boolean;
    version: string;
  }>>([])
  
  // Load themes from backend on mount
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themeList = await themeApi.getThemes()
        setAvailableThemes(themeList.results)
      } catch (error) {
        console.error('Failed to load themes:', error)
        // Fallback to hardcoded list if API fails (all marked as system themes)
        const fallbackThemes = [
          'modern-minimal', 't3-chat', 'twitter', 'mono', 'mocha-mousse',
          'bubblegum', 'amethyst-haze', 'notebook', 'doom-64', 'catppuccin',
          'graphite', 'perpetuity', 'kodama-grove', 'cosmic-night', 'tangerine',
          'quantum-rose', 'nature', 'bold-tech', 'elegant-luxury', 'amber-minimal',
          'supabase', 'neo-brutalism', 'solar-dusk', 'claymorphism', 'cyberpunk',
          'pastel-dreams', 'clean-slate', 'caffeine', 'ocean-breeze', 'retro-arcade', 'popstar',
          'midnight-bloom', 'candyland', 'northern-lights', 'vintage-paper',
          'sunset-horizon', 'starry-night', 'claude', 'vercel', 'ghibli-studio'
        ].map((name, index) => ({
          id: index,
          name,
          display_name: name.replace(/-/g, ' '),
          description: `${name} theme`,
          is_system_theme: true,
          version: '1.0.0'
        }))
        setAvailableThemes(fallbackThemes)
      }
    }
    
    loadThemes()
  }, [])

  useEffect(() => {
    if (themeSettings) {
      setSelectedTheme(themeSettings.name)
      setPreviewTheme(themeSettings.name)
    }
    // Check dark mode
    setIsDarkMode(document.documentElement.classList.contains('dark'))
  }, [themeSettings])

  // Helper to extract current shadow color from theme
  const getCurrentShadowColor = useCallback(() => {
    if (!themeSettings) return '#000000'
    
    const mode = isDarkMode ? 'dark' : 'light'
    const shadowValue = themeSettings.css_vars[mode]['shadow'] || themeSettings.css_vars[mode]['shadow-sm']
    
    if (shadowValue) {
      // Try to extract HSL color from shadow
      const hslMatch = shadowValue.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\s*(?:\/\s*([\d.]+))?\)/)
      if (hslMatch) {
        const [, h, s, l] = hslMatch
        // Convert HSL to hex (approximate)
        const hslToHex = (h: number, s: number, l: number) => {
          const c = (1 - Math.abs(2 * l - 1)) * s
          const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
          const m = l - c / 2
          let r = 0, g = 0, b = 0
          
          if (0 <= h && h < 60) {
            r = c; g = x; b = 0
          } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0
          } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x
          } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c
          } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c
          } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x
          }
          
          r = Math.round((r + m) * 255)
          g = Math.round((g + m) * 255)
          b = Math.round((b + m) * 255)
          
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        }
        
        return hslToHex(parseInt(h), parseInt(s) / 100, parseInt(l) / 100)
      }
    }
    
    return '#000000'
  }, [themeSettings, isDarkMode])

  // Helper to convert hex to HSL string
  const hexToHslString = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    
    return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`
  }, [])

  // Variable change handler (needed by shadow functions)
  const handleVariableChange = useCallback(async (variable: string, value: string) => {
    const root = document.documentElement
    const mode = isDarkMode ? 'dark' : 'light'
    
    // Store custom value with correct key format
    // Theme-level variables (fonts, radius, font-size) don't need mode prefix
    const isThemeVariable = variable.startsWith('font-') || variable === 'radius' || variable.includes('tracking')
    const customKey = isThemeVariable ? variable : `${mode}-${variable}`
    
    setCustomValues(prev => ({
      ...prev,
      [customKey]: value
    }))
    
    // Apply the CSS variable immediately (for non-color variables)
    root.style.setProperty(`--${variable}`, value)
    
    // For font-size, also set the html element font-size for global scaling
    if (variable === 'font-size') {
      document.documentElement.style.fontSize = value
    }
    
    // If it's a font variable, trigger font loading
    if (variable.startsWith('font-')) {
      const fontFamily = value.split(',')[0].trim().replace(/['"]/g, '')
      if (fontFamily && fontFamily !== 'ui-sans-serif' && fontFamily !== 'ui-serif' && fontFamily !== 'ui-monospace') {
        try {
          const updatedVars = { ...currentCSSVars, [variable]: value }
          await initializeFontPreloading(updatedVars)
          console.log(`✅ Font loaded and applied: ${fontFamily}`)
        } catch (error) {
          console.warn(`Failed to load font ${fontFamily}:`, error)
        }
      }
    }
  }, [isDarkMode, currentCSSVars])



  // Debounced shadow color update
  const debouncedShadowColorUpdate = useDebounce((newColor: string) => {
    // Convert hex to HSL values for CSS
    const r = parseInt(newColor.slice(1, 3), 16) / 255
    const g = parseInt(newColor.slice(3, 5), 16) / 255
    const b = parseInt(newColor.slice(5, 7), 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    
    // Set CSS custom property for shadow color
    const hslString = `${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`
    document.documentElement.style.setProperty('--shadow-color-hsl', hslString)
    handleVariableChange('shadow-color-hsl', hslString)
  }, 100)

  // Update shadow color when theme or dark mode changes
  useEffect(() => {
    const newShadowColor = getCurrentShadowColor()
    setCurrentShadowColor(newShadowColor)
  }, [themeSettings, isDarkMode, getCurrentShadowColor])

  // Shadow color update function
  const updateShadowColor = useCallback((newColor: string) => {
    // Immediate visual feedback
    setCurrentShadowColor(newColor)
    
    // Debounced expensive updates
    debouncedShadowColorUpdate(newColor)
  }, [debouncedShadowColorUpdate])



  // Performance optimized color change handler
  const updateCSSVariable = useCallback((variable: string, value: string) => {
    // Direct CSS variable update for immediate visual feedback (fast)
    document.documentElement.style.setProperty(`--${variable}`, value)
  }, [])

  // Debounced expensive operations
  const debouncedStateUpdate = useDebounce((variable: string, hexValue: string, mode: string) => {
    const key = `${mode}-${variable}`
    
    // Batch state updates
    setHexValues(prev => ({ ...prev, [key]: hexValue }))
    setCustomValues(prev => ({ ...prev, [key]: hexValue }))
  }, 50) // 50ms debounce for state updates

  const debouncedCSSRegeneration = useDebounce((variable: string, hexValue: string) => {
    // Only regenerate full CSS if needed (for theme persistence)
    const themeStyleElement = document.getElementById('tweakcn-theme-styles') as HTMLStyleElement
    if (themeStyleElement && themeSettings) {
      const currentMode = isDarkMode ? 'dark' : 'light'
      const currentVars = { ...themeSettings.css_vars[currentMode], [variable]: hexValue }
      
      // Regenerate CSS for current mode
      const lightVars = currentMode === 'light' ? currentVars : themeSettings.css_vars.light
      const darkVars = currentMode === 'dark' ? currentVars : themeSettings.css_vars.dark
      
      const lightCSS = `:root {
        ${Object.entries(lightVars).map(([property, val]) => 
          `--${property}: ${val};`
        ).join('\n  ')}
      }`
      
      const darkCSS = `.dark {
        ${Object.entries(darkVars).map(([property, val]) => 
          `--${property}: ${val};`
        ).join('\n  ')}
      }`
      
      themeStyleElement.textContent = lightCSS + '\n\n' + darkCSS
    }
  }, 200) // 200ms debounce for expensive CSS regeneration

  const handleColorChange = useCallback((variable: string, hexValue: string) => {
    const mode = isDarkMode ? 'dark' : 'light'
    
    // 1. Immediate visual feedback (fast, no debounce)
    updateCSSVariable(variable, hexValue)
    
    // 2. Debounced state updates (batched)
    debouncedStateUpdate(variable, hexValue, mode)
    
    // 3. Debounced CSS regeneration (expensive, longer debounce)
    debouncedCSSRegeneration(variable, hexValue)
  }, [isDarkMode, updateCSSVariable, debouncedStateUpdate, debouncedCSSRegeneration])

  // Preview theme without saving to backend
  const handleThemePreview = useCallback(async (themeName: string) => {
    setPreviewTheme(themeName)
    
    try {
      // Get theme data from backend
      const apiTheme = await themeApi.getTheme(themeName)
      
      // Clear all custom inline CSS variables first
      const root = document.documentElement
      const colorVarsList = Object.values(colorGroups).flat()
      const typographyVarsList = Object.values(typographyVars).flat()
      const otherVarsList = Object.values(otherVars).flat()
      
      // Remove inline styles for all custom variables
      const allVariables = [...colorVarsList, ...typographyVarsList, ...otherVarsList]
      allVariables.forEach(variable => {
        root.style.removeProperty(`--${variable}`)
      })
      
      // Apply theme CSS variables directly for preview
      Object.entries(apiTheme.css_vars.theme).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, String(value))
      })
      
      // Update both light and dark mode styles for preview
      const themeStyleId = 'tweakcn-theme-styles'
      let themeStyleElement = document.getElementById(themeStyleId) as HTMLStyleElement
      
      if (!themeStyleElement) {
        themeStyleElement = document.createElement('style')
        themeStyleElement.id = themeStyleId
        document.head.appendChild(themeStyleElement)
      }
      
      const lightCSS = `:root {
        ${Object.entries(apiTheme.css_vars.light).map(([property, value]) => 
          `--${property}: ${value};`
        ).join('\n  ')}
      }`
      
      const darkCSS = `.dark {
        ${Object.entries(apiTheme.css_vars.dark).map(([property, value]) => 
          `--${property}: ${value};`
        ).join('\n  ')}
      }`
      
      themeStyleElement.textContent = lightCSS + '\n\n' + darkCSS
      
      // Load fonts for the new theme
      setTimeout(async () => {
        try {
          await initializeFontPreloading(apiTheme.css_vars.theme)
          console.log(`✅ Theme fonts loaded for preview: ${themeName}`)
        } catch (error) {
          console.warn(`Failed to load theme fonts:`, error)
        }
      }, 100)
      
      // Reset custom values when previewing themes
      setCustomValues({})
      setHexValues({})
    } catch (error) {
      console.error('Failed to preview theme:', error)
    }
  }, [])
  
  // Apply selected theme and save to backend
  const handleApplyTheme = useCallback(async () => {
    if (!previewTheme) return
    
    try {
      setSelectedTheme(previewTheme)
      await switchTheme(previewTheme)
      
      // Get theme display name for toast
      const themeDisplayName = availableThemes.find(t => t.name === previewTheme)?.display_name || previewTheme
      toast({
        title: "🎨 Theme Applied!",
        description: `${themeDisplayName} theme is now live!`,
      })
      
      console.log(`✅ Theme applied and saved: ${previewTheme}`)
    } catch (error) {
      console.error('Failed to apply theme:', error)
      toast({
        title: "❌ Error",
        description: "Failed to apply theme. Please try again.",
        variant: "destructive",
      })
    }
  }, [previewTheme, switchTheme, availableThemes, toast])

  const handleRandomizeTheme = useCallback(() => {
    if (availableThemes.length === 0) return
    const randomIndex = Math.floor(Math.random() * availableThemes.length)
    const randomTheme = availableThemes[randomIndex]
    handleThemePreview(randomTheme.name)
  }, [availableThemes, handleThemePreview])



  const resetCustomizations = async () => {
    setCustomValues({})
    setHexValues({})
    await refreshTheme()
  }

  // Save current customizations as a new preset
  const handleSavePreset = useCallback(async () => {
    if (!presetName.trim() || !themeSettings) return

    setIsSavingPreset(true)
    try {
      // Build the new theme data by merging base theme with customizations
      const newThemeData = {
        name: presetName.toLowerCase().replace(/\s+/g, '-'),
        display_name: presetName,
        description: `Custom theme based on ${themeSettings.display_name}`,
        css_vars: {
          theme: { ...themeSettings.css_vars.theme },
          light: { ...themeSettings.css_vars.light },
          dark: { ...themeSettings.css_vars.dark }
        }
      }

      // Apply customizations to the appropriate mode/theme
      Object.entries(customValues).forEach(([key, value]) => {
        if (key.startsWith('light-')) {
          const variable = key.replace('light-', '')
          newThemeData.css_vars.light[variable] = value
        } else if (key.startsWith('dark-')) {
          const variable = key.replace('dark-', '')
          newThemeData.css_vars.dark[variable] = value
        } else {
          // Theme-level variables (fonts, radius, etc.)
          newThemeData.css_vars.theme[key] = value
        }
      })

      // Create the new theme via API
      await themeApi.createTheme(newThemeData)

      // Refresh the themes list
      const themeList = await themeApi.getThemes()
      setAvailableThemes(themeList.results)

      // Close modal and reset
      setSavePresetOpen(false)
      setPresetName('')
      
      // Switch to the newly created theme
      setTimeout(() => {
        handleThemePreview(newThemeData.name)
      }, 100)
      
      // Show success toast
      toast({
        title: "✨ Preset Saved!",
        description: `"${presetName}" preset saved successfully!`,
      })
      
      console.log(`✅ Custom preset saved: ${presetName}`)
    } catch (error) {
      console.error('Failed to save preset:', error)
      toast({
        title: "❌ Error",
        description: "Failed to save preset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingPreset(false)
    }
  }, [presetName, themeSettings, customValues, handleThemePreview, toast])

  // Check if there are any customizations to save
  const hasCustomizations = Object.keys(customValues).length > 0 || Object.keys(hexValues).length > 0

  // Delete a custom preset
  const handleDeletePreset = useCallback(async (themeName: string, event: React.PointerEvent | React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation() // Prevent SelectItem from being triggered
    
    const themeDisplayName = availableThemes.find(t => t.name === themeName)?.display_name || themeName
    if (!confirm(`Are you sure you want to delete the "${themeDisplayName}" preset? This action cannot be undone.`)) {
      return
    }

    try {
      await themeApi.deleteTheme(themeName)
      
      // Refresh themes list
      const themeList = await themeApi.getThemes()
      setAvailableThemes(themeList.results)
      
      // If we deleted the currently selected or previewed theme, switch to first available
      if (selectedTheme === themeName || previewTheme === themeName) {
        const firstTheme = themeList.results[0]
        if (firstTheme) {
          setSelectedTheme(firstTheme.name)
          setPreviewTheme(firstTheme.name)
          await switchTheme(firstTheme.name)
        }
      }
      
      toast({
        title: "🗑️ Preset Deleted",
        description: `"${themeDisplayName}" preset has been deleted.`,
      })
      
      console.log(`✅ Preset deleted: ${themeName}`)
    } catch (error) {
      console.error('Failed to delete preset:', error)
      toast({
        title: "❌ Error",
        description: "Failed to delete preset. Please try again.",
        variant: "destructive",
      })
    }
  }, [selectedTheme, previewTheme, switchTheme, availableThemes, toast])

  // Raw CSS handling functions
  const loadCurrentThemeToRawCSS = useCallback(() => {
    if (!themeSettings) return
    
    const mode = isDarkMode ? 'dark' : 'light'
    const css = generateCSSFromTheme(themeSettings, mode)
    setRawCssContent(css)
    setRawCssError('')
  }, [themeSettings, isDarkMode])

  const handleRawCSSChange = useCallback((content: string) => {
    setRawCssContent(content)
    
    // Validate CSS
    const validation = validateCSSVariables(content)
    if (!validation.isValid) {
      setRawCssError(validation.error)
      return
    }
    
    setRawCssError('')
    
    // Parse and apply CSS variables
    const variables = parseCSSVariables(content)
    
    // Apply to DOM immediately for preview
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
    
    // Update custom values state
    const mode = isDarkMode ? 'dark' : 'light'
    const updatedCustomValues = { ...customValues }
    
    Object.entries(variables).forEach(([key, value]) => {
      const isThemeVariable = key.startsWith('font-') || key === 'radius' || key.includes('tracking')
      const customKey = isThemeVariable ? key : `${mode}-${key}`
      updatedCustomValues[customKey] = value
    })
    
    setCustomValues(updatedCustomValues)
  }, [customValues, isDarkMode])

  const copyCurrentThemeCSS = useCallback(async () => {
    if (!themeSettings) return
    
    const mode = isDarkMode ? 'dark' : 'light'
    const css = generateCSSFromTheme(themeSettings, mode)
    
    try {
      await navigator.clipboard.writeText(css)
      toast({
        title: "📋 Copied!",
        description: "Theme CSS copied to clipboard",
      })
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = css
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      toast({
        title: "📋 Copied!",
        description: "Theme CSS copied to clipboard",
      })
    }
  }, [themeSettings, isDarkMode, toast])

  const resetRawCSS = useCallback(() => {
    setRawCssContent('')
    setRawCssError('')
    
    // Reset to current theme
    if (themeSettings) {
      refreshTheme()
    }
  }, [themeSettings, refreshTheme])

  const getCurrentValue = useCallback((variable: string): string => {
    const mode = isDarkMode ? 'dark' : 'light'
    const isThemeVariable = variable.startsWith('font-') || variable === 'radius' || variable.includes('tracking')
    const customKey = isThemeVariable ? variable : `${mode}-${variable}`
    
    if (customValues[customKey]) {
      return customValues[customKey]
    }
    
    if (themeSettings) {
      if (isThemeVariable) {
        return themeSettings.css_vars.theme[variable] || ''
      } else {
        return themeSettings.css_vars[mode][variable] || ''
      }
    }
    
    return ''
  }, [isDarkMode, customValues, themeSettings])

  // Ensure theme data is loaded when customizer opens
  useEffect(() => {
    if (open && !themeSettings && !themeLoading) {
      console.log('🎨 Theme customizer opened but no theme loaded, refreshing...')
      refreshTheme()
    }
  }, [open, themeSettings, themeLoading, refreshTheme])

  const getHexValue = useCallback((variable: string): string => {
    const mode = isDarkMode ? 'dark' : 'light'
    const customKey = `${mode}-${variable}`
    
    // Return custom hex value if user has set one
    if (hexValues[customKey]) {
      return hexValues[customKey]
    }
    
    // If we have a custom value that's already hex, use it
    if (customValues[customKey]) {
      if (customValues[customKey].startsWith('#')) {
        return customValues[customKey]
      }
      // If custom value is OKLCH, convert it
      if (customValues[customKey].includes('oklch')) {
        return oklchToHex(customValues[customKey])
      }
    }
    
    // Get the theme value first if available
    if (themeSettings && themeSettings.css_vars) {
      // Check mode-specific values first
      const modeValue = themeSettings.css_vars[mode]?.[variable]
      if (modeValue) {
        // If it's already hex, return it
        if (modeValue.startsWith('#')) {
          return modeValue
        }
        // Convert OKLCH to hex
        if (modeValue.includes('oklch')) {
          const hexValue = oklchToHex(modeValue)
          // Cache the converted value
          setHexValues(prev => ({ ...prev, [customKey]: hexValue }))
          return hexValue
        }
      }
      
      // Check theme-level values as fallback
      const themeValue = themeSettings.css_vars.theme?.[variable]
      if (themeValue) {
        if (themeValue.startsWith('#')) {
          return themeValue
        }
        if (themeValue.includes('oklch')) {
          const hexValue = oklchToHex(themeValue)
          setHexValues(prev => ({ ...prev, [customKey]: hexValue }))
          return hexValue
        }
      }
    }
    
    // If theme is still loading or not available, try DOM as last resort
    if (!themeSettings || themeLoading) {
      const style = getComputedStyle(document.documentElement)
      const cssValue = style.getPropertyValue(`--${variable}`)
      if (cssValue && cssValue.trim()) {
        // If it's already a hex color, return it
        if (cssValue.trim().startsWith('#')) {
          return cssValue.trim()
        }
        // If it's an OKLCH value, convert it
        if (cssValue.includes('oklch')) {
          return oklchToHex(cssValue.trim())
        }
      }
      // Return a neutral gray as loading placeholder
      return '#808080'
    }
    
    // Fallback to neutral gray
    return '#808080'
  }, [isDarkMode, hexValues, customValues, themeSettings, themeLoading, setHexValues])

  const renderColorSection = useCallback((title: string, variables: string[]) => (
    <div className="space-y-3">
      {variables.map((variable) => (
        <div key={variable} className="space-y-1">
          <Label htmlFor={variable} className="text-xs text-muted-foreground">
            {variable.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
          <div className="flex gap-2 items-center">
            <div className="w-12 h-8 rounded border border-border overflow-hidden">
              <input
                type="color"
                value={getHexValue(variable)}
                onChange={(e) => handleColorChange(variable, e.target.value)}
                className="w-full h-full cursor-pointer appearance-none border-none outline-none"
                style={{ 
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  padding: '0',
                  margin: '0',
                  border: 'none',
                  outline: 'none'
                }}
                title="Pick a color"
              />
            </div>
            <input
              type="text"
              value={getHexValue(variable)}
              onChange={(e) => handleColorChange(variable, e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono border border-border rounded-md bg-background"
              placeholder="#000000"
            />
          </div>
        </div>
      ))}
    </div>
  ), [getHexValue, handleColorChange])

  const renderTypographySection = useCallback((title: string, variables: string[]) => {
    const renderTypographyInput = (variable: string) => {
      const currentValue = getCurrentValue(variable)
      
      if (variable === 'radius') {
        // Border radius slider: 0 to 2rem
        const parsedValue = parseFloat(currentValue.replace('rem', ''))
        const numericValue = isNaN(parsedValue) ? 0.5 : parsedValue
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{numericValue.toFixed(2)}rem</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVariableChange(variable, '0.5rem')}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="px-2 slider-container">
              <Slider
                value={[numericValue]}
                onValueChange={(value) => handleVariableChange(variable, `${value[0]}rem`)}
                max={2}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        )
      }
      
      if (variable === 'letter-spacing') {
        // Letter spacing slider: -0.1em to 0.1em
        const numericValue = parseFloat(currentValue.replace('em', '')) || 0
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {numericValue > 0 ? '+' : ''}{numericValue.toFixed(3)}em
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVariableChange(variable, '0em')}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="px-2 slider-container">
              <Slider
                value={[numericValue]}
                onValueChange={(value) => handleVariableChange(variable, `${value[0]}em`)}
                max={0.1}
                min={-0.1}
                step={0.005}
                className="w-full"
              />
            </div>
          </div>
        )
      }
      
      if (variable === 'font-size') {
        // Base font size slider: 12px to 24px
        const baseSize = parseFloat(currentValue.replace('px', '')) || 16
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{baseSize}px</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVariableChange(variable, '16px')}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="px-2 slider-container">
              <Slider
                value={[baseSize]}
                onValueChange={(value) => handleVariableChange(variable, `${value[0]}px`)}
                max={24}
                min={12}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )
      }
      
      // Font family dropdowns
      if (variable.startsWith('font-')) {
        const fontOptions: Record<string, string[]> = {
          'font-sans': [
            // === SYSTEM FONTS ===
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\'',
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif',
            
            // === CORPORATE/PROFESSIONAL ===
            'Inter, sans-serif',
            'Source Sans Pro, sans-serif',
            'Work Sans, sans-serif',
            'Lato, sans-serif',
            'Open Sans, sans-serif',
            'Roboto, sans-serif',
            'IBM Plex Sans, sans-serif',
            'Libre Franklin, sans-serif',
            'PT Sans, sans-serif',
            'Chivo, sans-serif',
            
            // === MODERN/TECH/STARTUP ===
            'DM Sans, sans-serif',
            'Space Grotesk, sans-serif',
            'Manrope, sans-serif',
            'Outfit, sans-serif',
            'Plus Jakarta Sans, sans-serif',
            'Fira Sans, sans-serif',
            'Karla, sans-serif',
            'Rubik, sans-serif',
            'Overpass, sans-serif',
            'Spartan, sans-serif',
            'Instrument Sans, sans-serif',
            'Bricolage Grotesque, sans-serif',
            
            // === CREATIVE/AGENCY/DESIGN ===
            'Syne, sans-serif',
            'Archivo Narrow, sans-serif',
            'Josefin Sans, sans-serif',
            'Raleway, sans-serif',
            'Nunito Sans, sans-serif',
            'Barlow Condensed, sans-serif',
            'Oswald, sans-serif',
            'Fjalla One, sans-serif',
            'Familjen Grotesk, sans-serif',
            
            // === E-COMMERCE/RETAIL ===
            'Poppins, sans-serif',
            'Montserrat, sans-serif',
            'Alegreya Sans, sans-serif',
            'Proza Libre, sans-serif',
            'Varela Round, sans-serif',
            'Bitter, sans-serif',
            
            // === MUSIC/ENTERTAINMENT ===
            'Pathway Gothic One, sans-serif',
            'Rajdhani, sans-serif',
            'Bebas Neue, sans-serif',
            'Anton, sans-serif',
            'Righteous, sans-serif',
            'Fredoka One, sans-serif',
            'Bungee, sans-serif',
            
            // === FRIENDLY/APPROACHABLE ===
            'Nunito, sans-serif',
            'Comfortaa, sans-serif',
            'Quicksand, sans-serif',
            'Mukti, sans-serif',
            'Hind, sans-serif',
            'Dosis, sans-serif',
            'Catamaran, sans-serif',
            
            // === INTERNATIONAL/MULTILINGUAL ===
            'Noto Sans, sans-serif',
            'M PLUS 1p, sans-serif',
            'Sarabun, sans-serif',
            'Kanit, sans-serif',
            'Prompt, sans-serif',
            
            // === CONDENSED/HEADLINE ===
            'Titillium Web, sans-serif',
            'Exo 2, sans-serif',
            'PT Sans Caption, sans-serif',
            'Archivo Black, sans-serif',
            'Squada One, sans-serif',
            
            // === EXISTING THEME FONTS ===
            'Geist, sans-serif',
            'Architects Daughter, sans-serif',
            'Oxanium, sans-serif',
            // Cross-category fonts used as sans in themes
            'Libre Baskerville, serif',
            'Source Code Pro, monospace',
            'Courier New, monospace',
            'Geist Mono, monospace',
            '\'Bungee\', \'Montserrat Alternates\', \'Archivo Black\', \'Arial Black\', Arial, sans-serif'
          ],
          'font-serif': [
            // === SYSTEM SERIF FONTS ===
            'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            'ui-serif, Georgia, Cambria, Times New Roman, Times, serif',
            '"Times New Roman", Times, serif',
            'Georgia, serif',
            
            // === LUXURY/FASHION/EDITORIAL ===
            'Playfair Display, serif',
            'Cormorant, serif',
            'Libre Baskerville, serif',
            'Fraunces, serif',
            'Abril Fatface, serif',
            'Ultra, serif',
            'Rozha One, serif',
            'DM Serif Display, serif',
            'DM Serif Text, serif',
            
            // === PROFESSIONAL/CORPORATE ===
            'Source Serif Pro, serif',
            'Source Serif 4, serif',
            'PT Serif, serif',
            'Spectral, serif',
            'Literata, serif',
            'Newsreader, serif',
            'Roboto Serif, serif',
            
            // === TRADITIONAL/CLASSIC ===
            'Merriweather, serif',
            'Lora, serif',
            'Alegreya, serif',
            'Cardo, serif',
            'Old Standard TT, serif',
            'Gentium Basic, serif',
            
            // === CREATIVE/ARTISTIC ===
            'Eczar, serif',
            'BioRhyme, serif',
            'Inknut Antiqua, serif',
            'Neuton, serif',
            'Zilla Slab, serif',
            'Josefin Slab, serif',
            
            // === INSTRUMENT/MODERN ===
            'Instrument Serif, serif',
            
            // === SCRIPT/HANDWRITING ===
            'Dancing Script, cursive',
            'Pacifico, cursive',
            'Kaushan Script, cursive',
            'Satisfy, cursive',
            'Caveat, cursive',
            'Sacramento, cursive',
            'Great Vibes, cursive',
            'Tangerine, cursive',
            
            // === SLAB SERIF ===
            'Roboto Slab, serif',
            'Arvo, serif',
            'Crimson Text, serif',
            'Volkhov, serif',
            'Rokkitt, serif',
            'Bitter, serif',
            'Slabo 27px, serif',
            
            // === DISPLAY SERIF ===
            'Yeseva One, serif',
            'Cinzel, serif',
            'Playfair Display SC, serif',
            'Sorts Mill Goudy, serif',
            'Crimson Pro, serif',
            
            // === EXISTING THEME FONTS ===
            '\'Staatliches\', \'Bebas Neue\', \'Oswald\', Impact, serif',
            // Cross-category fonts used as serif in themes
            'Geist Mono, monospace',
            'Source Code Pro, monospace',
            'Courier New, monospace'
          ],
          'font-mono': [
            // === SYSTEM MONOSPACE ===
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            'Menlo, monospace',
            'monospace',
            
            // === MODERN CODE FONTS ===
            'Fira Code, monospace',
            'JetBrains Mono, monospace',
            'Source Code Pro, monospace',
            '"Source Code Pro", monospace',
            'IBM Plex Mono, monospace',
            'Geist Mono, monospace',
            'Azeret Mono, monospace',
            'Roboto Mono, monospace',
            'Ubuntu Mono, monospace',
            
            // === CLASSIC/RETRO ===
            'Space Mono, monospace',
            'Inconsolata, monospace',
            '"Courier New", Courier, monospace',
            
            // === EXISTING THEME COMBINATIONS ===
            '"Fira Code", "Courier New", monospace',
            '\'Space Mono\', \'Major Mono Display\', \'Fira Mono\', monospace'
          ]
        }
        
        const options = fontOptions[variable as keyof typeof fontOptions] || []
        const displayName = variable === 'font-sans' ? 'Sans Serif Font' :
                           variable === 'font-serif' ? 'Serif Font' :
                           variable === 'font-mono' ? 'Monospace Font' : 
                           variable.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        return (
          <div className="space-y-1">
            <Label htmlFor={variable} className="text-xs text-muted-foreground">
              {displayName}
            </Label>
            <Select value={currentValue} onValueChange={(value: string) => handleVariableChange(variable, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((font: string) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font.split(',')[0].replace(/['"]/g, '') }}>
                      {font.split(',')[0].replace(/['"]/g, '')}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
      
      // Font size slider
      if (variable === 'font-size') {
        const baseSize = parseFloat(currentValue.replace('px', '')) || 16
        
        return (
          <div className="space-y-2">
            <Label htmlFor={variable} className="text-xs text-muted-foreground">
              Base Font Size
            </Label>
            <div className="space-y-2">
              <Slider
                value={[baseSize]}
                onValueChange={(value) => handleVariableChange(variable, `${value[0]}px`)}
                max={24}
                min={12}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12px</span>
                <span className="font-medium">{baseSize}px</span>
                <span>24px</span>
              </div>
            </div>
          </div>
        )
      }
      
      // Default text input for other variables
      return (
        <Input
          id={variable}
          value={currentValue}
          onChange={(e) => handleVariableChange(variable, e.target.value)}
          className="text-xs font-mono"
          placeholder="Value"
        />
      )
    }
    
    return (
      <div key={title} className="space-y-3">
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable}>
              {renderTypographyInput(variable)}
            </div>
          ))}
        </div>
      </div>
    )
  }, [getCurrentValue, handleVariableChange])

  const renderOtherSection = useCallback((title: string, variables: string[]) => {
    const renderOtherInput = (variable: string) => {
      const currentValue = getCurrentValue(variable)
      
      if (variable === 'radius') {
        // Border radius slider: 0 to 2rem
        const parsedValue = parseFloat(currentValue.replace('rem', ''))
        const numericValue = isNaN(parsedValue) ? 0.5 : parsedValue
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{numericValue.toFixed(2)}rem</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVariableChange(variable, '0.5rem')}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="px-2 slider-container">
              <Slider
                value={[numericValue]}
                onValueChange={(value) => handleVariableChange(variable, `${value[0]}rem`)}
                max={2}
                min={0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        )
      }
      



      
      // Default text input for any remaining variables
      return (
        <div className="space-y-1">
          <Label htmlFor={variable} className="text-xs text-muted-foreground">
            {variable.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
          <Input
            id={variable}
            value={currentValue}
            onChange={(e) => handleVariableChange(variable, e.target.value)}
            className="text-xs font-mono"
            placeholder="Value"
          />
        </div>
      )
    }
    
    return (
      <div key={title} className="space-y-3">
        <div className="space-y-4">
          {variables.map((variable) => (
            <div key={variable}>
              {renderOtherInput(variable)}
            </div>
          ))}
        </div>
      </div>
    )
  }, [getCurrentValue, handleVariableChange, updateShadowColor, currentShadowColor])

  if (!isVisible) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="min-w-[350px] sm:min-w-[480px] px-2 theme-customizer">
        <style>{`
          .theme-customizer button.absolute.top-4.right-4 { display: none !important; }
          
          @keyframes pulse-subtle {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 0 0 hsl(var(--primary) / 0.4);
            }
            50% { 
              transform: scale(1.03);
              box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
            }
          }
          
          .animate-pulse-subtle {
            animation: pulse-subtle 2s ease-in-out infinite;
          }
          .animate-pulse-subtle:hover {
            opacity: 0.8;
          }
        `}</style>
        
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Theme Customizer
            </SheetTitle>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <SheetClose asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className={`${hasCustomizations ? 'h-[calc(100vh-160px)]' : 'h-[calc(100vh-80px)]'}`}>
          <div className="p-6 space-y-6">
            {/* Theme Preset Selection */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Presets
                </div>
                <div className="flex gap-2">
                  <AIThemeGenerator
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Generate
                      </Button>
                    }
                    onThemeGenerated={(theme) => {
                      // Refresh the themes list and set as preview
                      const loadThemes = async () => {
                        try {
                          const themeList = await themeApi.getThemes()
                          setAvailableThemes(themeList.results)
                          // Auto-preview the generated theme
                          handleThemePreview(theme.name)
                        } catch (error) {
                          console.error('Failed to refresh themes:', error)
                        }
                      }
                      loadThemes()
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRandomizeTheme}
                    className="flex items-center gap-1"
                  >
                    <Shuffle className="h-3 w-3" />
                    Random
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Select value={previewTheme} onValueChange={handleThemePreview}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableThemes.map((theme) => (
                      <SelectItem key={theme.name} value={theme.name}>
                        <div className="flex items-center gap-3 w-full">
                          <ThemeColorPreview themeName={theme.name} />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="capitalize truncate max-w-[120px]" title={theme.display_name}>
                                {theme.display_name}
                              </span>
                            </div>
                            {theme.name === selectedTheme && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                Current
                              </Badge>
                            )}
                            {theme.name === previewTheme && theme.name !== selectedTheme && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Preview
                              </Badge>
                            )}
                            {!theme.is_system_theme && 
                             theme.name !== selectedTheme && 
                             theme.name !== previewTheme && (
                              <div
                                className="h-5 w-5 ml-auto shrink-0 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer"
                                onPointerDown={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeletePreset(theme.name, e)
                                }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                                title={`Delete ${theme.display_name} preset`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {previewTheme && previewTheme !== selectedTheme && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleApplyTheme}
                      className="flex-1 animate-pulse-subtle"
                      size="sm"
                    >
                      Publish This Theme
                    </Button>
                    <Button 
                      onClick={() => {
                        setPreviewTheme(selectedTheme)
                        refreshTheme()
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <hr className="mt-4" />


            {/* Advanced Theme Editing - Hidden by default */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings">
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced Theme Editor
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation()
                        
                        // Remove all inline CSS custom properties from DOM
                        const root = document.documentElement
                        const allVariables = [
                          ...Object.values(colorGroups).flat(),
                          ...Object.values(typographyVars).flat(), 
                          ...Object.values(otherVars).flat(),
                          'shadow-color-hsl' // Don't forget shadow color
                        ]
                        
                        // Remove all custom CSS variables we might have set
                        allVariables.forEach(variable => {
                          root.style.removeProperty(`--${variable}`)
                        })
                        
                        // Clear all custom values state
                        setCustomValues({})
                        setHexValues({})
                        setRawCssContent('')
                        setRawCssError('')
                        
                        // Refresh theme to reload original values
                        try {
                          await refreshTheme()
                          
                          // Debug: Check if theme data loaded properly
                          console.log('🔍 Theme refresh result:', themeSettings)
                          
                          // Load CSS after ensuring theme is refreshed
                          setTimeout(() => {
                            if (themeSettings && themeSettings.css_vars) {
                              loadCurrentThemeToRawCSS()
                              console.log('✅ CSS loaded into editor')
                            } else {
                              console.warn('⚠️ No theme settings available for CSS loading')
                              toast({
                                title: "⚠️ Warning",
                                description: "Theme data appears to be empty. Try refreshing the page.",
                                variant: "destructive",
                              })
                            }
                          }, 300) // Increased delay for production
                        } catch (error) {
                          console.error('❌ Failed to refresh theme:', error)
                          toast({
                            title: "❌ Error",
                            description: "Failed to load theme data. Check your connection.",
                            variant: "destructive",
                          })
                        }
                        
                        toast({
                          title: "🔄 Theme Refreshed",
                          description: "Reset to current theme values and cleared customizations",
                        })
                      }}
                      className="flex items-center gap-1 mr-2"
                    >
                      <Download className="h-3 w-3" />
                      Load Current
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Advanced Controls Tabs with Accordions */}
                  <Tabs defaultValue="colors" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="colors" className="flex items-center gap-2">
                        <Palette className="h-3 w-3" />
                        Colors
                      </TabsTrigger>
                      <TabsTrigger value="typography" className="flex items-center gap-2">
                        <Type className="h-3 w-3" />
                        Typography
                      </TabsTrigger>
                      <TabsTrigger value="other" className="flex items-center gap-2">
                        <Sliders className="h-3 w-3" />
                        Other
                      </TabsTrigger>
                      <TabsTrigger value="rawcss" className="flex items-center gap-2">
                        <Code2 className="h-3 w-3" />
                        Raw CSS
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="colors" className="mt-6">
                      <Accordion type="multiple" className="w-full">
                        {Object.entries(colorGroups).map(([title, variables]) => (
                          <AccordionItem key={title} value={title.toLowerCase().replace(/\s+/g, '-')}>
                            <AccordionTrigger>
                              {title}
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderColorSection(title, variables)}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="typography" className="mt-6">
                      <Accordion type="multiple" className="w-full" onValueChange={handleFontFamiliesAccordionChange}>
                        {Object.entries(typographyVars).map(([title, variables]) => (
                          <AccordionItem key={title} value={title.toLowerCase().replace(/\s+/g, '-')}>
                            <AccordionTrigger>
                              <div className="flex items-center justify-between w-full">
                                <span>{title}</span>
                                {title === 'Font Families' && isLoadingFonts && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className="w-12 bg-muted rounded-full h-1">
                                      <div 
                                        className="bg-primary h-1 rounded-full transition-all duration-300" 
                                        style={{ width: `${fontLoadingProgress}%` }}
                                      />
                                    </div>
                                    <span>{fontLoadingProgress}%</span>
                                  </div>
                                )}
                                {title === 'Font Families' && fontFamiliesLoaded && (
                                  <Badge variant="secondary" className="text-xs">
                                    {extractUniqueFonts().length} fonts loaded
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderTypographySection(title, variables)}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="other" className="mt-6">
                      <Accordion type="multiple" className="w-full">
                        {Object.entries(otherVars).map(([title, variables]) => (
                          <AccordionItem key={title} value={title.toLowerCase().replace(/\s+/g, '-')}>
                            <AccordionTrigger>
                              {title}
                            </AccordionTrigger>
                            <AccordionContent>
                              {renderOtherSection(title, variables)}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>
                    
                    <TabsContent value="rawcss" className="mt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Raw CSS Editor</h3>
                            <p className="text-sm text-muted-foreground">
                              Paste CSS variables directly from tweakcn
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyCurrentThemeCSS}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-3 w-3" />
                              Copy CSS
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="raw-css-textarea" className="text-sm font-medium">
                            CSS Variables
                          </Label>
                          <Textarea
                            id="raw-css-textarea"
                            value={rawCssContent}
                            onChange={(e) => handleRawCSSChange(e.target.value)}
                            placeholder={`:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* Add more CSS variables here... */
}`}
                            className="min-h-[300px] font-mono text-xs"
                            spellCheck={false}
                          />
                          {rawCssError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                              <p className="text-sm text-destructive font-medium">Error:</p>
                              <p className="text-sm text-destructive">{rawCssError}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={resetRawCSS}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Undo2 className="h-3 w-3" />
                            Reset
                          </Button>
                          {rawCssContent && !rawCssError && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>CSS applied successfully</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">How to use:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Copy CSS variables from <a href="https://tweakcn.com/editor/theme" target="_blank" rel="noopener" className="text-primary hover:underline">tweakcn.com</a></li>
                            <li>• Paste the CSS block in the textarea above</li>
                            <li>• Variables will be applied immediately for preview</li>
                            <li>• Use "Save as New Preset" to save your custom theme</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        {/* Fixed Footer - Dynamic Save as New Preset Button */}
        {hasCustomizations && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
            <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full flex items-center gap-2"
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                  Save as New Preset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Theme Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Enter preset name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && presetName.trim()) {
                          handleSavePreset()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSavePresetOpen(false)
                        setPresetName('')
                      }}
                      disabled={isSavingPreset}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSavePreset}
                      disabled={!presetName.trim() || isSavingPreset}
                    >
                      {isSavingPreset ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
} 