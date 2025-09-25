# Component Library

This directory contains curated component definitions for AI-powered website scaffolding. Each JSON file contains vetted components with installation instructions, use cases, and style notes to help AI agents make informed choices.

## Structure

```
component-library/
├── heroes.json          # Hero sections and landing page headers
├── pricing.json         # Pricing tables and subscription sections  
├── features.json        # Feature showcases and benefit sections
├── testimonials.json    # Customer testimonials and social proof
├── navigation.json      # Headers, navbars, and navigation components
├── forms.json          # Contact forms, signup forms, and inputs
├── content.json        # Text sections, about pages, and content blocks
├── footers.json        # Footer sections and site information
└── components.json     # Individual UI components (buttons, cards, etc.)
```

## JSON Structure

Each file contains an array of component definitions:

```json
{
  "category": "heroes",
  "components": [
    {
      "id": "shadcn-hero-centered",
      "name": "Centered Hero",
      "library": "shadcn",
      "description": "Clean, centered hero section with title, subtitle, and CTA buttons",
      "useCase": "Professional business sites, SaaS landing pages",
      "complexity": "low",
      "performance": "excellent",
      "mobileOptimized": true,
      "installCommands": [
        "npx shadcn@latest add button",
        "npx shadcn@latest add badge"
      ],
      "dependencies": [],
      "styleNotes": "Works perfectly with all tweakcn themes. Minimal styling required.",
      "pros": ["Fast loading", "Highly customizable", "Theme-friendly"],
      "cons": ["Less visual impact", "Requires custom content"],
      "bestFor": ["B2B sites", "Professional services", "Fast-loading pages"],
      "avoid": ["Creative agencies", "Entertainment sites"]
    }
  ]
}
```

## Usage for AI Agents

1. **Analyze Requirements**: Understand the project type, target audience, and performance needs
2. **Reference Appropriate File**: Check the relevant category (heroes.json for hero sections)
3. **Select Best Component**: Use `useCase`, `bestFor`, and `styleNotes` to make informed choices
4. **Install Dependencies**: Run the `installCommands` in order
5. **Apply Styling**: Use the `styleNotes` to ensure proper theme integration

## Component Selection Criteria

- **Performance**: Consider bundle size and loading speed
- **Use Case**: Match component to project type and audience
- **Complexity**: Balance visual impact with development time
- **Theme Compatibility**: Ensure components work with tweakcn themes
- **Mobile Optimization**: Prioritize responsive components

## Maintenance

- Keep components up-to-date with latest library versions
- Test all components with current tweakcn theme system
- Add new components based on project needs and quality
- Remove or deprecate components that become outdated 