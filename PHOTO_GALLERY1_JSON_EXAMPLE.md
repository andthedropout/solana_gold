# Photo Gallery 1 (Scroll Marquee) - JSON Structure

## Overview
Dynamic photo marquee with multiple scrolling rows that respond to scroll velocity. Perfect for showcasing portfolios, agency work, and creative content.

## Features
- Multiple scrolling rows at different velocities
- Scroll-responsive animations (speeds up/slows down based on user scroll)
- Positive velocity = left-to-right scroll
- Negative velocity = right-to-left scroll
- Infinite scroll effect
- Responsive image sizes
- Smooth framer-motion animations

## JSON Structure

### Basic Example (2 rows)
```json
[
  {
    "velocity": 3,
    "images": [
      {
        "title": "Portfolio Item 1",
        "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=640"
      },
      {
        "title": "Portfolio Item 2", 
        "url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=640"
      }
    ]
  },
  {
    "velocity": -2,
    "images": [
      {
        "title": "Creative Work 1",
        "url": "https://images.unsplash.com/photo-1682686581854-5e71f58e7e3f?q=80&w=640"
      },
      {
        "title": "Creative Work 2",
        "url": "https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=640"
      }
    ]
  }
]
```

### Complete Example (3 rows)
```json
[
  {
    "velocity": 3,
    "images": [
      {
        "title": "Creative Work 1",
        "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=640"
      },
      {
        "title": "Creative Work 2",
        "url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=640"
      },
      {
        "title": "Creative Work 3",
        "url": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=640"
      },
      {
        "title": "Creative Work 4",
        "url": "https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?q=80&w=640"
      },
      {
        "title": "Creative Work 5",
        "url": "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=640"
      }
    ]
  },
  {
    "velocity": -2,
    "images": [
      {
        "title": "Portfolio 1",
        "url": "https://images.unsplash.com/photo-1682686581854-5e71f58e7e3f?q=80&w=640"
      },
      {
        "title": "Portfolio 2",
        "url": "https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=640"
      },
      {
        "title": "Portfolio 3",
        "url": "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?q=80&w=640"
      },
      {
        "title": "Portfolio 4",
        "url": "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=640"
      }
    ]
  },
  {
    "velocity": 4,
    "images": [
      {
        "title": "Showcase 1",
        "url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=640"
      },
      {
        "title": "Showcase 2",
        "url": "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=640"
      },
      {
        "title": "Showcase 3",
        "url": "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=640"
      }
    ]
  }
]
```

## Field Specification

### Row Object
- `velocity` (number): Controls scroll speed and direction
  - Positive = left-to-right scroll  
  - Negative = right-to-left scroll
  - Recommended range: -5 to 5
  - Higher absolute values = faster scroll

### Image Object  
- `title` (string): Alt text and accessibility description
- `url` (string): Image URL (preferably 640px width for performance)

## Best Practices

### Visual Design
- **Optimal rows**: 2-4 rows for best visual balance
- **Images per row**: 5-10 images for smooth infinite scrolling
- **Image ratio**: Use consistent aspect ratios within each row
- **Velocity variation**: Mix positive and negative velocities for dynamic effect

### Performance
- Use optimized images (640px width recommended)
- Consider lazy loading for large galleries
- Test scroll performance on mobile devices

### Use Cases
- **Creative portfolios**: Photography, design work, art galleries
- **Agency showcases**: Client work, case studies, team photos  
- **Product galleries**: E-commerce, catalog displays
- **Event photography**: Weddings, corporate events, conferences
- **Brand showcases**: Company culture, behind-the-scenes content

## Velocity Examples
- `velocity: 1` - Slow, gentle scroll
- `velocity: 3` - Medium speed (recommended)
- `velocity: 5` - Fast scroll
- `velocity: -2` - Medium reverse scroll
- `velocity: -4` - Fast reverse scroll

## Image Size Guidelines
- **Mobile**: 6rem × 9rem (96px × 144px)
- **Tablet**: 8rem × 12rem (128px × 192px)  
- **Desktop**: 12rem × 18rem (192px × 288px)
- **Source**: 640px width recommended for quality/performance balance 