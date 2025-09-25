# Claude Development Guide

A comprehensive guide for AI-powered development of this React + Django CMS project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Component System](#component-system)
3. [Section Development](#section-development)
4. [Animation System](#animation-system)
5. [Theming System](#theming-system)
6. [Navigation Configuration](#navigation-configuration)
7. [AI Image Generation](#ai-image-generation)
8. [Development Workflow](#development-workflow)

---

## Project Overview

This is a full-stack CMS project combining:
- **Frontend**: React + TypeScript with Vite
- **Backend**: Django with REST API
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **Theming**: CSS variables with curated theme system
- **CMS**: Section-based content management with auto-generated forms
- **Environment**: Docker-based development - user handles all testing and deployment

### Key Directories
- `/assets/src/components/sections/` - CMS section components
- `/design-system/component-library/` - Curated component definitions
- `/design-system/themes/` - Theme configurations
- `/assets/src/components/admin/` - CMS admin interface
- `/public/images/` - Static image assets

---

## Component System

### Component Library Approach

Instead of building custom components, select from pre-vetted component library definitions:

#### Available Categories
- `heroes.json` - Hero sections and landing headers
- `pricing.json` - Pricing tables and subscription sections  
- `features.json` - Feature showcases and benefit sections
- `testimonials.json` - Customer testimonials and social proof
- `navigation.json` - Headers, navbars, and navigation
- `forms.json` - Contact forms, signup forms, and inputs
- `content.json` - Text sections, about pages, content blocks
- `footers.json` - Footer sections and site information
- `components.json` - Individual UI components

#### Selection Process
```typescript
// For each section needed:
1. Read appropriate JSON file (e.g., heroes.json for hero section)
2. Review ALL 20-30 options in that category
3. Use selection criteria to pick best match:
   - Check `bestFor` array for project type match
   - Avoid options in `avoid` array
   - Consider `complexity`, `performance`, `bundleSize`
   - Read `styleNotes` for theme compatibility
4. Select the optimal component for the specific use case
```

#### Installation & Implementation
```bash
# Install required shadcn components
npx shadcn@latest add button
npx shadcn@latest add card
# etc.

# Components automatically use theme system via CSS variables
```

---

## Section Development

### File Structure & Naming
```
assets/src/components/sections/
├── heros/
│   ├── Hero1.tsx
│   ├── Hero2.tsx
├── features/
│   ├── Feature1.tsx
└── testimonials/
    ├── Testimonial1.tsx
```

**Naming Conventions:**
- Component: `{Category}{Number}` (e.g., `Hero1`, `Feature2`)
- File: `{ComponentName}.tsx`
- Directory: `{category}s/` (plural)
- Schema: `{ComponentName}Schema`
- Type: `{ComponentName}Content`
- Default: `{ComponentName}DefaultContent`

### Required Imports
```typescript
import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  createButtonSchema,
  ButtonWithIcon,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';
```

### Schema Development
```typescript
const ComponentSchema = z.object({
  // Text content grouped in nested object
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  
  // Buttons (ALWAYS use createButtonSchema)
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  
  // REQUIRED: Always include responsive padding
  sectionPadding: createResponsivePaddingSchema()
});
```

### Component Structure
```typescript
interface ComponentProps {
  sectionId: string;
}

const Component: React.FC<ComponentProps> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'unique-class-name');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        {/* Component content */}
      </section>
    </SectionWrapper>
  );
};
```

### Required Exports
```typescript
export default Component;
export type { ComponentContent };
export { DEFAULT_CONTENT as ComponentDefaultContent };
export { ComponentSchema };
```

### Form Integration
If using button field names other than `primaryCta` or `secondaryCta`, update `SchemaForm.tsx`:

```typescript
// Add your button field names to this check:
const isCTASection = key === 'primaryCta' || key === 'secondaryCta' || key === 'yourButtonName';
```

---

## Animation System

### Business-Appropriate Animation Guidelines

#### Professional Services (Law, Finance, Consulting)
- **Stagger Delay**: 0.1-0.15s
- **Duration**: 0.6-0.8s 
- **Easing**: "easeOut"
- **Transforms**: Subtle y-movement (10-20px)

```tsx
const professionalVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" }
  }
};
```

#### Tech/SaaS
- **Stagger Delay**: 0.05-0.1s
- **Duration**: 0.3-0.5s
- **Easing**: "easeOut" or springs
- **Transforms**: Scale, x/y movement

```tsx
const techVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};
```

#### Food & Beverage
- **Stagger Delay**: 0.08-0.12s
- **Duration**: 0.4-0.6s
- **Easing**: Bouncy springs
- **Transforms**: Playful bounces, gentle sways

```tsx
const foodBeverageVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 150, 
      damping: 10,
      duration: 0.5
    }
  }
};
```

### Core Animation Patterns

#### 1. Cascading List Animations
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};
```

#### 2. Scroll-Triggered Animations
```tsx
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const ScrollReveal = ({ children, businessType = "tech" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -100px 0px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { duration: 0.6, ease: "easeOut" }
      } : {}}
    >
      {children}
    </motion.div>
  );
};
```

### Performance Considerations
1. **Use transform properties**: x, y, scale, rotate (GPU accelerated)
2. **Avoid animating**: width, height, padding, margin
3. **Limit simultaneous animations**: Max 10-15 elements
4. **Respect reduced motion preferences**

---

## Theming System

### How to Change Themes

1. Open `globalSettings.ts` in project root
2. Update `PREFERRED_THEME` value
3. Theme applies automatically on app startup

```typescript
export const PREFERRED_THEME = 'sunset-horizon'; // Change this value
```

### Section Background Variety

Use CSS variables for background variety:

```jsx
{/* Default background */}
<div style={{ backgroundColor: 'var(--background)' }}>
  <Component />
</div>

{/* Subtle variation */}
<div style={{ backgroundColor: 'var(--muted)' }}>
  <Component />
</div>

{/* Accent background */}
<div style={{ backgroundColor: 'var(--accent)' }}>
  <Component />
</div>
```

### Available CSS Variables
- `--background` - Main background color
- `--foreground` - Main text color
- `--card` - Card background
- `--muted` - Subtle background
- `--accent` - Accent background
- `--primary` - Primary brand color
- `--secondary` - Secondary color

**Important**: Use inline styles with CSS variables, not Tailwind classes like `bg-muted`

### Theme Characteristics
- **Border Radius**: 0px (sharp) to 0.625rem (friendly)
- **Shadows**: Hard (neo-brutalism) to soft (elegant)
- **Fonts**: System fonts, modern sans, serif accents, monospace

---

## Navigation Configuration

All header and footer behavior is controlled by `NAVIGATION_CONFIG` in `globalSettings.ts`.

### Header Types
- `'floating'` - Animated floating header
- `'clean'` - Minimal professional design  
- `'professional'` - Corporate business layout
- `'sidebar'` - Fixed vertical sidebar

### Configuration Structure
```typescript
NAVIGATION_CONFIG = {
  headerType: 'professional',
  settings: {
    showLogo: true,
    showCompanyName: true,
    showDarkModeToggle: true,
    showLogin: false,
    showSignup: false,
    backgroundTransparent: false,
    isSticky: true,
    logoPath: "/static/images/logo.png",
    logoAlt: "Company Logo"
  },
  footer: {
    showFooter: true,
    showTopSection: true,
    showBottomSection: true,
    showLogo: true,
    showTagline: true,
    showNavigation: true
  }
}
```

### Important Rules
1. **Only edit `globalSettings.ts`** - Never modify individual header components
2. **All headers support all settings** - No compatibility issues
3. **Use `COMPANY_INFO`** - Don't hardcode company names

---

## SVG Background Animation System

### How Background Animations Work

Our animated backgrounds use SVG files with CSS variables for dynamic theming. The system has specific requirements that MUST be followed exactly.

#### File Locations & Loading Order

1. **Where to put SVG files**: `/design-system/backgrounds/`
   - NOT in `/public/images/backgrounds/` (Django won't find them there first)
   - The backend checks directories in order and stops at the first one with SVGs

2. **How Django serves them**:
   ```
   /design-system/backgrounds/ → collectstatic → /public_collected/images/backgrounds/ → served at /static/images/backgrounds/
   ```

#### CSS Variable Requirements

**CRITICAL**: The `AnimatedBackground` component strips certain styles:
- Removes `background:` and `background-color:` from style attributes
- Removes `width` and `height` attributes
- Modifies `preserveAspectRatio` to "xMidYMid slice"

**Solution**: Use a gradient-filled rectangle instead of background styles:
```xml
<!-- ❌ WRONG - This will be stripped -->
<svg style="background: var(--primary);">

<!-- ✅ CORRECT - Use a rectangle with gradient -->
<defs>
  <linearGradient id="bg-gradient">
    <stop offset="0" stop-color="var(--primary)"></stop>
    <stop offset="1" stop-color="var(--secondary)"></stop>
  </linearGradient>
</defs>
<rect fill="url(#bg-gradient)" width="100%" height="100%"></rect>
```

#### Theme Color Variables

Use these CSS variables directly in your SVG:
- `var(--primary)` - Primary brand color
- `var(--secondary)` - Secondary color
- `var(--accent)` - Accent color
- `var(--background)` - Main background
- `var(--muted)` - Muted background
- `var(--muted-foreground)` - Muted text color

#### Adding a New Animation

1. **Create SVG with CSS variables**:
   ```xml
   <svg viewBox="0 0 1000 1000" width="100%" height="100%">
     <defs>
       <linearGradient id="gradient1">
         <stop offset="0" stop-color="var(--primary)"/>
         <stop offset="1" stop-color="var(--secondary)"/>
       </linearGradient>
     </defs>
     <circle fill="var(--accent)" cx="500" cy="500" r="100"/>
   </svg>
   ```

2. **Save to correct location**:
   ```bash
   # Save your SVG here
   /design-system/backgrounds/your_animation.svg
   ```

3. **Update Django's static files**:
   ```bash
   # Copy to public directory
   cp /design-system/backgrounds/your_animation.svg /public/images/backgrounds/
   
   # Run collectstatic with --clear to force update
   docker-compose exec web python manage.py collectstatic --noinput --clear
   ```

4. **Verify it's served correctly**:
   ```bash
   # Check what Django is actually serving
   curl http://localhost:8000/static/images/backgrounds/your_animation.svg
   ```

#### Common Issues & Solutions

**Problem**: Colors not changing with theme
- **Cause**: CSS variables not in SVG or stripped by AnimatedBackground
- **Solution**: Use rectangles with gradients, not background styles

**Problem**: Animation not showing in dropdown
- **Cause**: File in wrong directory
- **Solution**: Must be in `/design-system/backgrounds/`

**Problem**: Changes not appearing
- **Cause**: Django serving cached version
- **Solution**: Use `collectstatic --clear` to force refresh

**Problem**: Background color not working
- **Cause**: `background:` styles are stripped
- **Solution**: Use a filled rectangle as first element

#### Working Example (cloud_ocean.svg pattern)
```xml
<svg viewBox="0 0 1742 928" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-gradient">
      <stop offset="0" stop-color="var(--primary)"/>
      <stop offset="1" stop-color="var(--secondary)"/>
    </linearGradient>
  </defs>
  <!-- Background rectangle instead of style attribute -->
  <rect fill="url(#bg-gradient)" width="1742" height="928"/>
  <!-- Animated elements -->
  <circle fill="var(--accent)" r="50" cx="100" cy="100">
    <animateTransform attributeName="transform" type="translate" .../>
  </circle>
</svg>
```

---

## Image Storage System (Database-Backed for Railway Persistence)

### Overview

**IMPORTANT**: User-uploaded images are stored directly in PostgreSQL database to survive Railway redeployments. This is a permanent solution that ensures images persist across all deployments without requiring external storage services.

### How It Works

1. **Upload Process**:
   - User uploads image via CMS (same `ImageUpload` component)
   - Image sent to `/api/v1/upload/image/` endpoint
   - Backend saves image binary data to `UploadedImage` model in PostgreSQL
   - Returns URL like `/api/v1/images/abc123.jpg`

2. **Storage**:
   - Images stored as `BinaryField` in PostgreSQL database
   - Each image has unique filename, content type, size, and binary data
   - Database handles images efficiently (5MB limit keeps size reasonable)

3. **Serving**:
   - When browser requests `/api/v1/images/abc123.jpg`
   - Django fetches image data from database
   - Serves with proper content type and caching headers
   - 1-year cache header reduces database load

4. **CMS Integration**:
   - Section schemas store image URLs in JSON (unchanged)
   - Frontend components use URLs normally (unchanged)
   - Only difference: URLs now point to database-backed endpoint

### Key Files

- **Model**: `src/images/models.py` - `UploadedImage` model
- **Upload**: `src/config/views.py` - `ImageUploadView` saves to database
- **Serving**: `src/config/views.py` - `serve_database_image` retrieves from database
- **URLs**: `src/config/urls.py` - Routes for upload and serving

### Benefits for Railway Production

✅ **Images persist through all redeployments** - No more lost images!
✅ **No volume configuration needed** - Pure database solution
✅ **Works with scaled instances** - All instances access same database
✅ **Included in database backups** - Images backed up with other data
✅ **No external services** - No S3, Cloudinary, or other dependencies

### Admin Interface

View and manage uploaded images at `/admin/images/uploadedimage/`:
- See image previews
- Track which sections use each image
- Delete unused images if needed

### Migration from Old System

Old filesystem URLs (`/media/uploads/`) will 404 after implementing this system. To migrate:
1. Re-upload images through CMS
2. Update section content with new URLs
3. Old filesystem can be deleted

### Database Impact

- PostgreSQL handles binary data efficiently
- 5MB limit per image keeps database manageable
- For a typical site with 100 images @ 500KB each = ~50MB database growth
- Can implement cleanup for unused images if needed

---

## AI Image Generation

### DALL-E MCP Integration

This project includes DALL-E MCP server for AI image generation during development.

#### Setup
```bash
./scripts/setup-dalle-mcp.sh
```

#### Django Static File Structure
**IMPORTANT**: Django serves static files from `/static/` URLs.

- **Save Location**: `/Users/a_/Github/client_template/public/images/`
- **Reference in Components**: `/static/images/filename.png`

#### Usage Examples
```typescript
// Generate image
mcp_dalle-mcp_generate_image({
  prompt: "Modern tech workspace with holographic displays",
  saveDir: "/Users/a_/Github/client_template/public/images",
  fileName: "hero-background"
});

// Use in component
<img src="/static/images/hero-background.png" alt="Hero background" />
```

#### Available Parameters
- `prompt` (required): Text description
- `saveDir` (required): Always use project's `public/images/`
- `model`: "dall-e-2" or "dall-e-3" (default: "dall-e-3")
- `size`: Image dimensions (default: "1024x1024")
- `quality`: "standard" or "hd" (DALL-E 3 only)
- `fileName`: Base filename without extension

#### Django Workflow
1. **Generate Image**: AI saves to `public/images/`
2. **Django Collection**: `python manage.py collectstatic` copies to `public_collected/images/`
3. **URL Serving**: Django serves from `/static/images/` URLs
4. **Component Reference**: Always use `/static/images/filename.png`

---

## Development Workflow

### 1. Analyze Requirements
- Project type (SaaS, agency, e-commerce)
- Target audience (B2B, consumer, enterprise)
- Performance needs vs visual impact
- Complexity tolerance

### 2. Component Selection
- Read appropriate JSON files from component library
- Review ALL options in each category
- Match components to project type using `bestFor` array
- Consider performance, complexity, and bundle size
- Check theme compatibility via `styleNotes`

### 3. Section Development
- Follow naming conventions exactly
- Include all required imports and patterns
- Use `createButtonSchema()` for all buttons
- Always include `sectionPadding` schema
- Provide realistic default content
- Export all required items

### 4. Animation Implementation
- Match animation style to business type
- Use appropriate stagger delays and durations
- Implement loading state transitions
- Add scroll-triggered reveals
- Respect reduced motion preferences

### 5. Theming Integration
- Use CSS variables for colors
- Apply theme-appropriate styling
- Add section background variety sparingly
- Ensure accessibility and contrast

### 6. Form Integration
- Update `SchemaForm.tsx` for custom button fields
- Register component in both `SectionEditingPanel.tsx` and `DynamicComponent.tsx`
- User handles all testing and verification in Docker environment

### Error Prevention Checklist

**Never do these:**
- ❌ Create custom button schemas (use `createButtonSchema()`)
- ❌ Use Tailwind color classes like `bg-muted` (use CSS variables)
- ❌ Hardcode company names (use `COMPANY_INFO`)
- ❌ Modify header components directly (edit `globalSettings.ts`)
- ❌ Use arbitrary hex colors (use theme variables)
- ❌ Skip responsive padding implementation
- ❌ Miss required exports from section components

**Always do these:**
- ✅ Read component library files before building
- ✅ Include all required imports and patterns
- ✅ Use unique CSS class names for responsive padding
- ✅ Provide content fallbacks for missing data
- ✅ Test admin interface after adding sections
- ✅ Use business-appropriate animation timing
- ✅ Match theme system patterns

---

## Quick Reference

### Essential Files
- `globalSettings.ts` - Theme, navigation, company info
- `design-system/component-library/` - Component definitions
- `assets/src/components/sections/` - Section implementations
- `assets/src/components/admin/section_settings/` - CMS utilities

### Key Patterns
- Schema defines everything (validation, forms, types)
- CSS variables enable theming
- Responsive padding system for sections
- Button system handles all CTAs
- Animation timing matches business personality

### Development Priority
1. **Schema correctness** - Everything depends on this
2. **Theme integration** - Use CSS variables properly  
3. **Component selection** - Choose optimal library components
4. **Animation appropriateness** - Match business expectations
5. **Admin interface** - Ensure forms generate correctly

This guide ensures consistent, high-quality development that integrates seamlessly with the project's architecture and design systems.