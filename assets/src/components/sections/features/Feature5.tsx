import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TimelineFeatureEntrySchema = z.object({
  label: z.string(),
  heroContent: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    primaryCta: createButtonSchema(),
    secondaryCta: createButtonSchema().optional()
  })
});

const Feature5Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS).optional()
  }),
  features: z.array(TimelineFeatureEntrySchema).min(2).max(6),
  timeline: z.object({
    autoAdvance: z.boolean(),
    duration: z.number().min(3000).max(15000),
    pauseOnHover: z.boolean(),
    showProgress: z.boolean(),
    allowManualNavigation: z.boolean()
  }),
  display: z.object({
    timelineStyle: z.enum(['bars', 'dots', 'steps']),
    transitionStyle: z.enum(['fade', 'slide', 'scale']),
    showLabels: z.boolean()
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Feature5Content = z.infer<typeof Feature5Schema>;

const DEFAULT_CONTENT: Feature5Content = {
  textContent: {
    title: "Discover Our Revolutionary Features",
    subtitle: "Experience the next generation of technology solutions",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  features: [
    {
      label: "AI-Powered Analytics",
      heroContent: {
        title: "Transform Data Into Actionable Insights",
        subtitle: "Advanced Intelligence",
        description: "Leverage cutting-edge artificial intelligence to analyze complex data patterns and generate actionable insights that drive business growth. Our AI algorithms process millions of data points in real-time.",
        textColor: "foreground",
        image: {
          url: "/static/images/ai-analytics-dashboard.png",
          alt: "AI Analytics Dashboard"
        },
        primaryCta: {
          text: "Explore AI Features",
          style: "primary",
          size: "default",
          icon: "ArrowRight",
          iconPosition: "right",
          url: "/ai-analytics"
        }
      }
    },
    {
      label: "Smart Automation",
      heroContent: {
        title: "Automate Complex Workflows Effortlessly",
        subtitle: "Intelligent Automation",
        description: "Streamline your operations with intelligent automation that learns from your processes and continuously optimizes performance. Reduce manual tasks by up to 85% with our smart workflow engine.",
        textColor: "foreground",
        image: {
          url: "/static/images/automation-workflow.png",
          alt: "Smart Automation Workflow"
        },
        primaryCta: {
          text: "See Automation",
          style: "primary",
          size: "default",
          icon: "Zap",
          iconPosition: "right",
          url: "/automation"
        }
      }
    },
    {
      label: "Real-time Collaboration",
      heroContent: {
        title: "Connect Teams Across the Globe",
        subtitle: "Seamless Collaboration",
        description: "Enable real-time collaboration with advanced communication tools, shared workspaces, and synchronized editing capabilities. Keep your global teams aligned and productive 24/7.",
        textColor: "foreground",
        image: {
          url: "/static/images/collaboration-tools.png",
          alt: "Team Collaboration Interface"
        },
        primaryCta: {
          text: "Start Collaborating",
          style: "primary",
          size: "default",
          icon: "Users",
          iconPosition: "right",
          url: "/collaboration"
        }
      }
    },
    {
      label: "Advanced Security",
      heroContent: {
        title: "Enterprise-Grade Security You Can Trust",
        subtitle: "Uncompromising Protection",
        description: "Protect your data with military-grade encryption, multi-factor authentication, and continuous security monitoring. Our security framework exceeds industry standards and compliance requirements.",
        textColor: "foreground",
        image: {
          url: "/static/images/security-dashboard.png",
          alt: "Security Monitoring Dashboard"
        },
        primaryCta: {
          text: "Learn About Security",
          style: "primary",
          size: "default",
          icon: "Shield",
          iconPosition: "right",
          url: "/security"
        }
      }
    }
  ],
  timeline: {
    autoAdvance: true,
    duration: 6000,
    pauseOnHover: true,
    showProgress: true,
    allowManualNavigation: true
  },
  display: {
    timelineStyle: 'bars',
    transitionStyle: 'fade',
    showLabels: true
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface TimelineBarProps {
  features: Feature5Content['features'];
  activeIndex: number;
  progress: number;
  onFeatureClick: (index: number) => void;
  timelineStyle: 'bars' | 'dots' | 'steps';
  showLabels: boolean;
  showProgress: boolean;
  allowManualNavigation: boolean;
  onHover?: (isHovering: boolean) => void;
}

const TimelineBar: React.FC<TimelineBarProps> = ({
  features,
  activeIndex,
  progress,
  onFeatureClick,
  timelineStyle,
  showLabels,
  showProgress,
  allowManualNavigation,
  onHover
}) => {
  const sectionWidth = 100 / features.length;

  return (
    <div className="mb-16">
      <div 
        className="relative w-full"
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        {/* Feature Labels */}
        {showLabels && (
          <div className="flex" style={{ marginBottom: '4px' }}>
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex-1 text-center"
                style={{ width: `${sectionWidth}%` }}
              >
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    index === activeIndex ? 'text-foreground' : 'text-muted-foreground'
                  } ${allowManualNavigation ? 'cursor-pointer hover:text-foreground/80' : ''}`}
                  onClick={allowManualNavigation ? () => onFeatureClick(index) : undefined}
                >
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar Container */}
        <div className="relative w-full h-4 bg-muted rounded-lg border border-border overflow-hidden shadow-sm p-0.5">
          {/* Background sections with borders */}
          <div className="absolute inset-0.5 flex rounded-md">
            {features.map((_, index) => (
              <div
                key={index}
                className="flex-1 relative"
                style={{ width: `${sectionWidth}%` }}
              >
                {/* Section border (except for last one) */}
                {index < features.length - 1 && (
                  <div className="absolute right-0 top-0 w-px h-full bg-border z-10" />
                )}
              </div>
            ))}
          </div>

          {/* Progress Fill - Single continuous bar */}
          <div className="absolute inset-0.5 rounded-md overflow-hidden">
            <div
              className="absolute inset-0 bg-primary rounded-md transition-all duration-300 ease-out"
              style={{ 
                width: `${((activeIndex + (showProgress ? progress / 100 : 0)) / features.length) * 100}%`
              }}
            />
            {/* Debug indicator */}
            {process.env.NODE_ENV === 'development' && (
              <div className="absolute -top-6 left-0 text-xs text-primary font-mono">
                {Math.round(((activeIndex + (showProgress ? progress / 100 : 0)) / features.length) * 100)}%
              </div>
            )}
          </div>

          {/* Click targets for manual navigation */}
          {allowManualNavigation && (
            <div className="absolute inset-0.5 flex rounded-md">
              {features.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 cursor-pointer"
                  style={{ width: `${sectionWidth}%` }}
                  onClick={() => onFeatureClick(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface Feature5Props {
  sectionId: string;
}

const Feature5: React.FC<Feature5Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'feature5-padding');

  const currentFeature = content.features[activeIndex];

  // Auto-advance logic
  useEffect(() => {
    if (!content.timeline.autoAdvance || (isHovered && content.timeline.pauseOnHover) || isPaused) {
      return;
    }

    const intervalDuration = 50; // Update every 50ms for smoother animation
    const incrementPerInterval = (100 / content.timeline.duration) * intervalDuration;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + incrementPerInterval;
        if (newProgress >= 100) {
          setActiveIndex(current => (current + 1) % content.features.length);
          return 0;
        }
        return newProgress;
      });
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [content.timeline.autoAdvance, content.timeline.duration, content.timeline.pauseOnHover, isHovered, isPaused, content.features.length]);

  const handleFeatureClick = (index: number) => {
    if (!content.timeline.allowManualNavigation) return;
    
    setActiveIndex(index);
    setProgress(0);
    setIsPaused(true);
    
    // Resume auto-advance after a delay
    setTimeout(() => setIsPaused(false), 2000);
  };

  const contentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: content.display.transitionStyle === 'scale' ? 0.95 : 1,
      x: content.display.transitionStyle === 'slide' ? 30 : 0
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      scale: content.display.transitionStyle === 'scale' ? 1.05 : 1,
      x: content.display.transitionStyle === 'slide' ? -30 : 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${getTextColorClass(content.textContent.titleColor)}`}>
              {content.textContent.title}
            </h2>
            {content.textContent.subtitle && (
              <p className={`mt-4 text-lg leading-8 ${getTextColorClass(content.textContent.subtitleColor || 'muted-foreground')}`}>
                {content.textContent.subtitle}
              </p>
            )}
          </div>

          {/* Timeline Navigation - Aligned with hero content */}
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-16">
            <div className="lg:col-span-2">
              <TimelineBar
                features={content.features}
                activeIndex={activeIndex}
                progress={progress}
                onFeatureClick={handleFeatureClick}
                timelineStyle={content.display.timelineStyle}
                showLabels={content.display.showLabels}
                showProgress={content.timeline.showProgress}
                allowManualNavigation={content.timeline.allowManualNavigation}
                onHover={setIsHovered}
              />
            </div>
          </div>

          {/* Hero Content Area */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={`text-${activeIndex}`}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {currentFeature.heroContent.subtitle && (
                  <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground">
                    {currentFeature.heroContent.subtitle}
                  </div>
                )}
                
                <h3 className={`text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl ${getTextColorClass(currentFeature.heroContent.textColor)}`}>
                  {currentFeature.heroContent.title}
                </h3>
                
                <p className={`text-lg leading-8 ${getTextColorClass('muted-foreground')}`}>
                  {currentFeature.heroContent.description}
                </p>
                
                <div className={`flex flex-col sm:flex-row gap-4 ${
                  currentFeature.heroContent.secondaryCta?.visible 
                    ? 'justify-center sm:justify-start' 
                    : 'justify-center'
                }`}>
                  <ButtonWithIcon cta={currentFeature.heroContent.primaryCta} />
                  {currentFeature.heroContent.secondaryCta && (
                    <ButtonWithIcon cta={currentFeature.heroContent.secondaryCta} />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right: Image Content */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={`image-${activeIndex}`}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative"
              >
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={currentFeature.heroContent.image.url}
                    alt={currentFeature.heroContent.image.alt}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Feature5;
export type { Feature5Content };
export { DEFAULT_CONTENT as Feature5DefaultContent };
export { Feature5Schema };