# Navigation Configuration Guide

## Overview

All header and footer behavior is controlled by `NAVIGATION_CONFIG` in `globalSettings.ts`. The system supports 4 header types with universal settings.

## Quick Reference

### Header Types
- `'floating'` - Animated floating header
- `'clean'` - Minimal professional design  
- `'professional'` - Corporate business layout
- `'sidebar'` - Fixed vertical sidebar (dashboard style)

### Universal Settings
```typescript
NAVIGATION_CONFIG = {
  headerType: 'professional', // Change header type here
  settings: {
    showLogo: boolean,
    showCompanyName: boolean,
    showDarkModeToggle: boolean,
    showLogin: boolean,
    showSignup: boolean,
    backgroundTransparent: boolean,
    isSticky: boolean,
    logoPath: string,
    logoAlt: string
  },
  footer: {
    showFooter: boolean,
    showTopSection: boolean,     // Company info & nav links
    showBottomSection: boolean,  // Copyright & legal links
    showLogo: boolean,
    showTagline: boolean,
    showNavigation: boolean
  }
}
```

## Key Behaviors

- **Logo sizing**: Automatically larger when `showCompanyName: false`
- **Sidebar layout**: Automatically switches to horizontal layout when `headerType: 'sidebar'`
- **Footer spacing**: Reduces padding when only bottom section visible
- **All settings work across all header types**

## Common Patterns

**Minimal setup:**
```typescript
settings: { showLogo: true, showDarkModeToggle: true }
footer: { showTopSection: false, showBottomSection: true }
```

**Marketing setup:**
```typescript
settings: { showLogo: true, showLogin: true, showSignup: true }
footer: { showTopSection: true, showBottomSection: true }
```

## Important Rules

1. **Only edit `globalSettings.ts`** - Never modify individual header components
2. **Test header switching** - Ensure changes work across all header types
3. **Use `COMPANY_INFO`** - Don't hardcode company names
4. **All headers support all settings** - No feature compatibility issues 