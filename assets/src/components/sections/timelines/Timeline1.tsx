import React, { useMemo } from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Timeline } from '@/components/ui/timeline';
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';
import { CheckCircle, Calendar, Award, TrendingUp, Star, Target, Zap, Users } from 'lucide-react';

// Icon mapping for timeline entries
const TIMELINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'check': CheckCircle,
  'calendar': Calendar,
  'award': Award,
  'trending': TrendingUp,
  'star': Star,
  'target': Target,
  'zap': Zap,
  'users': Users,
};

const TimelineEntrySchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  description: z.string(),
  highlights: z.array(z.string()).max(5).optional(),
  icon: z.enum(['none', 'check', 'calendar', 'award', 'trending', 'star', 'target', 'zap', 'users']).optional(),
  image: z.object({
    url: z.string(),
    alt: z.string(),
    useCustomImage: z.boolean().default(true),
    maxHeight: z.number().min(100).max(600).default(300)
  }).optional(),
  // Additional fields for card mode
  cardDescription: z.string().optional(),
  cardTitleSize: z.enum(['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl']).default('text-lg'),
  cardTitleWeight: z.enum(['font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold']).default('font-bold')
});

const Timeline1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  timeline: z.array(TimelineEntrySchema).min(2).max(10),
  display: z.object({
    showDates: z.boolean().default(true),
    showIcons: z.boolean().default(true),
    showHighlights: z.boolean().default(true),
    timelineStyle: z.enum(['default', 'compact', 'detailed']).default('default'),
    leftColumnWidth: z.number().min(20).max(60).default(40),
    leftColumnStyle: z.enum(['title-only', 'card']).default('title-only'),
    stickyColumnPosition: z.number().min(0).max(80).default(25),
    itemVerticalPadding: z.number().min(0).max(200).default(40)
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Timeline1Content = z.infer<typeof Timeline1Schema>;

const DEFAULT_CONTENT: Timeline1Content = {
  textContent: {
    title: "Our Journey",
    subtitle: "Key milestones in our company's evolution",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  timeline: [
    {
      title: "2024",
      date: "Current",
      description: "Expanding globally with over 1 million users worldwide. Launched enterprise solutions and advanced AI features.",
      highlights: [
        "1M+ active users",
        "Enterprise launch",
        "AI integration",
        "Global expansion"
      ],
      icon: "trending",
      image: {
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Company expansion visualization",
        useCustomImage: false,
        maxHeight: 300
      },
      cardDescription: "Our biggest year yet with global reach.",
      cardTitleSize: "text-lg",
      cardTitleWeight: "font-bold"
    },
    {
      title: "2023",
      date: "Year of Growth",
      description: "Secured Series B funding and tripled our team size. Introduced revolutionary features that changed the industry.",
      highlights: [
        "$50M Series B",
        "300% team growth",
        "Industry awards",
        "New product lines"
      ],
      icon: "zap",
      image: {
        url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Team growth and funding celebration",
        useCustomImage: false,
        maxHeight: 250
      },
      cardDescription: "Breakthrough year with major funding and growth.",
      cardTitleSize: "text-lg",
      cardTitleWeight: "font-bold"
    },
    {
      title: "2022",
      date: "Product Market Fit",
      description: "Found our product-market fit and achieved profitability. Launched mobile apps and expanded to new markets.",
      highlights: [
        "Reached profitability",
        "Mobile apps launched",
        "100k users milestone",
        "Market expansion"
      ],
      icon: "target",
      cardDescription: "Found our sweet spot in the market.",
      cardTitleSize: "text-lg",
      cardTitleWeight: "font-bold"
    },
    {
      title: "2021",
      date: "The Pivot",
      description: "Pivoted our business model based on customer feedback. This crucial decision set us on the path to success.",
      highlights: [
        "Business model pivot",
        "Customer-first approach",
        "Core product redesign"
      ],
      icon: "none",
      cardDescription: "Strategic pivot that changed everything.",
      cardTitleSize: "text-lg",
      cardTitleWeight: "font-bold"
    },
    {
      title: "2020",
      date: "The Beginning",
      description: "Founded with a vision to transform how businesses operate. Started in a garage with just three founders.",
      highlights: [
        "Company founded",
        "First prototype",
        "Seed funding secured"
      ],
      icon: "star",
      image: {
        url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Company founding in garage workspace",
        useCustomImage: false,
        maxHeight: 350
      },
      cardDescription: "Humble beginnings with big dreams.",
      cardTitleSize: "text-lg",
      cardTitleWeight: "font-bold"
    }
  ],
  display: {
    showDates: true,
    showIcons: true,
    showHighlights: true,
    timelineStyle: 'default',
    leftColumnWidth: 40,
    leftColumnStyle: 'title-only',
    stickyColumnPosition: 25,
    itemVerticalPadding: 40
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Timeline1Props {
  sectionId: string;
}

const Timeline1: React.FC<Timeline1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'timeline1-responsive-padding');

  // Transform timeline data for the Timeline component with proper memoization
  const timelineData = useMemo(() => {
    // Define class mappings to ensure Tailwind includes them in the build
    const sizeClasses = {
      'text-sm': 'text-sm',
      'text-base': 'text-base', 
      'text-lg': 'text-lg',
      'text-xl': 'text-xl',
      'text-2xl': 'text-2xl'
    };
    
    const weightClasses = {
      'font-normal': 'font-normal',
      'font-medium': 'font-medium',
      'font-semibold': 'font-semibold', 
      'font-bold': 'font-bold',
      'font-extrabold': 'font-extrabold'
    };
    
    return content.timeline?.map((entry) => {
      const Icon = entry.icon && entry.icon !== 'none' && content.display?.showIcons ? TIMELINE_ICONS[entry.icon] : null;
      
      // Get the safe classes from the mappings
      const titleSizeClass = sizeClasses[entry.cardTitleSize as keyof typeof sizeClasses] || 'text-lg';
      const titleWeightClass = weightClasses[entry.cardTitleWeight as keyof typeof weightClasses] || 'font-bold';
      
      // Render different left column content based on leftColumnStyle
      const leftColumnContent = content.display?.leftColumnStyle === 'card' ? (
        <div className="timeline-card bg-card border border-border rounded-lg p-4 shadow-sm max-w-xs lg:max-w-sm">
          <h3 className={`${titleSizeClass} ${titleWeightClass} text-card-foreground mb-2 text-left`}>
            {entry.title}
          </h3>
          {entry.cardDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed text-left">
              {entry.cardDescription}
            </p>
          )}
          {Icon && content.display?.showIcons && (
            <div className="mt-3 flex justify-end">
              <Icon className="h-5 w-5 text-primary/60" />
            </div>
          )}
        </div>
      ) : entry.title;
      
      return {
        title: leftColumnContent,
        content: (
          <div className="space-y-4">
            {/* Custom Image - positioned above title */}
            {entry.image?.url && entry.image.url.trim() !== '' && (entry.image.useCustomImage === undefined || entry.image.useCustomImage === true) && (
              <div className="mb-4">
                <img 
                  src={entry.image.url} 
                  alt={entry.image.alt}
                  className="w-full rounded-lg shadow-md border border-border object-contain"
                  style={{
                    maxHeight: `${entry.image.maxHeight || 300}px`
                  }}
                  onError={(e) => {
                    // Hide the image container if the image fails to load
                    const target = e.target as HTMLImageElement;
                    const container = target.parentElement;
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
            
            {content.display?.showDates && entry.date && (
              <div className="text-sm font-medium text-primary">
                {entry.date}
              </div>
            )}
            
            <div className="text-base text-muted-foreground leading-relaxed">
              {entry.description}
            </div>
            
            {content.display?.showHighlights && entry.highlights && entry.highlights.length > 0 && (
              <ul className="space-y-2 mt-4">
                {entry.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
            
            
            {content.display?.leftColumnStyle !== 'card' && Icon && content.display?.showIcons && (
              <div className="mt-4">
                <Icon className="h-8 w-8 text-primary/60" />
              </div>
            )}
          </div>
        )
      };
    }) || [];
  }, [JSON.stringify(content.timeline), JSON.stringify(content.display), content.timeline?.map(entry => `${entry.cardTitleSize}-${entry.cardTitleWeight}`).join(',')]);

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <div 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        {/* Custom Header - Timeline component has its own, but we'll override with ours */}
        <div className="w-full">
          <div className="max-w-7xl mx-auto pt-12 pb-2 px-4 md:px-8 lg:px-10 text-center">
            {content.textContent?.title && (
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 max-w-4xl mx-auto ${getTextColorClass(content.textContent.titleColor)}`}>
                {content.textContent.title}
              </h2>
            )}
            {content.textContent?.subtitle && (
              <p className={`text-base md:text-lg max-w-2xl mx-auto ${getTextColorClass(content.textContent.subtitleColor)}`}>
                {content.textContent.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Timeline Component with custom styling */}
        <div className={`timeline-wrapper ${content.display?.timelineStyle}`}>
          <style>{`
            .timeline-wrapper .bg-white,
            .timeline-wrapper .dark\\:bg-neutral-950 {
              background: transparent !important;
            }
            .timeline-wrapper > div > div:first-child {
              display: none !important;
            }
            /* Force all timeline titles to use dark gray */
            .timeline-wrapper h3 {
              color: #424343 !important;
            }
            .timeline-wrapper .text-neutral-500,
            .timeline-wrapper .dark\\:text-neutral-500 {
              color: #424343 !important;
            }
            .timeline-wrapper .timeline-card h3 {
              color: #424343 !important;
            }
            /* Target the specific timeline component h3 elements */
            .timeline-wrapper .md\\:text-5xl {
              color: #424343 !important;
            }
            .timeline-wrapper .text-xl {
              color: #424343 !important;
            }
            .timeline-wrapper .text-2xl {
              color: #424343 !important;
            }
            .timeline-wrapper.compact .md\\:text-5xl {
              font-size: 2rem !important;
            }
            .timeline-wrapper.detailed .md\\:text-5xl {
              font-size: 3rem !important;
            }
            .timeline-wrapper .bg-neutral-200 {
              background: hsl(var(--muted)) !important;
            }
            .timeline-wrapper .dark\\:bg-neutral-800 {
              background: hsl(var(--muted)) !important;
            }
            /* Timeline dot/circle styling */
            .timeline-wrapper .h-4.w-4.rounded-full.bg-neutral-200 {
              background: hsl(var(--primary)) !important;
              position: relative !important;
              right: -1px !important;
            }
            .timeline-wrapper .h-4.w-4.rounded-full.dark\\:bg-neutral-800 {
              background: hsl(var(--primary)) !important;
              position: relative !important;
              right: -1px !important;
            }
            .timeline-wrapper .from-purple-500 {
              --tw-gradient-from: hsl(var(--primary)) !important;
            }
            .timeline-wrapper .via-blue-500 {
              --tw-gradient-via: hsl(var(--primary)) !important;
              --tw-gradient-to: transparent !important;
            }
            .timeline-wrapper .border-neutral-300 {
              border-color: hsl(var(--border)) !important;
            }
            .timeline-wrapper .dark\\:border-neutral-700 {
              border-color: hsl(var(--border)) !important;
            }
            /* Timeline dot/circle border styling - make border black */
            .timeline-wrapper .h-4.w-4.rounded-full.border-neutral-300 {
              border-color: #000000 !important;
            }
            .timeline-wrapper .h-4.w-4.rounded-full.dark\\:border-neutral-700 {
              border-color: #000000 !important;
            }
            /* Timeline rail/line styling */
            .timeline-wrapper .w-px,
            .timeline-wrapper .w-0\\.5,
            .timeline-wrapper .border-l,
            .timeline-wrapper .border-l-2 {
              border-color: hsl(var(--secondary)) !important;
              background-color: hsl(var(--secondary)) !important;
            }
            .timeline-wrapper .via-neutral-200 {
              --tw-gradient-via: hsl(var(--secondary)) !important;
            }
            .timeline-wrapper .dark\\:via-neutral-700 {
              --tw-gradient-via: hsl(var(--secondary)) !important;
            }
            /* Remove max-width constraints on timeline columns */
            .timeline-wrapper .max-w-xs,
            .timeline-wrapper .lg\\:max-w-sm,
            .timeline-wrapper .md\\:w-full {
              max-width: none !important;
            }
            
            /* Custom left column width for desktop */
            @media (min-width: 768px) {
              .timeline-wrapper .flex.justify-start.pt-10.md\\:pt-40.md\\:gap-10 > div:first-child {
                width: ${content.display?.leftColumnWidth || 40}% !important;
                max-width: none !important;
              }
              .timeline-wrapper .flex.justify-start.pt-10.md\\:pt-40.md\\:gap-10 > div:last-child {
                width: ${100 - (content.display?.leftColumnWidth || 40)}% !important;
              }
            }
            
            /* Timeline card styling */
            .timeline-wrapper .timeline-card {
              transition: all 0.2s ease-in-out;
              backdrop-filter: blur(10px);
            }
            
            .timeline-wrapper .timeline-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
            }
            
            /* Adjust timeline card positioning for better alignment */
            @media (min-width: 768px) {
              .timeline-wrapper .timeline-card {
                margin-top: -8px;
              }
            }
            
            /* Custom sticky point positioning */
            .timeline-wrapper .sticky {
              top: ${content.display?.stickyColumnPosition || 25}vh !important;
            }
            
            /* Custom timeline item vertical padding for right column content - only bottom */
            .timeline-wrapper .flex.justify-start.pt-10.md\\:pt-40.md\\:gap-10 > div:last-child {
              padding-bottom: ${content.display?.itemVerticalPadding || 40}px !important;
            }
          `}</style>
          <Timeline key={`timeline-${JSON.stringify(content.timeline)}-${JSON.stringify(content.display)}`} data={timelineData} />
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Timeline1;
export type { Timeline1Content };
export { DEFAULT_CONTENT as Timeline1DefaultContent };
export { Timeline1Schema };