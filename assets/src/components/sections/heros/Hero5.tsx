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

const Hero5Schema = z.object({
  textContent: z.object({
    badge: z.string(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  stat1: z.object({
    visible: z.boolean().optional(),
    number: z.string(),
    label: z.string(),
    description: z.string(),
    color: z.enum(['primary', 'secondary', 'accent', 'destructive', 'success', 'warning', 'info'])
  }),
  stat2: z.object({
    visible: z.boolean().optional(),
    number: z.string(),
    label: z.string(),
    description: z.string(),
    color: z.enum(['primary', 'secondary', 'accent', 'destructive', 'success', 'warning', 'info'])
  }),
  stat3: z.object({
    visible: z.boolean().optional(),
    number: z.string(),
    label: z.string(),
    description: z.string(),
    color: z.enum(['primary', 'secondary', 'accent', 'destructive', 'success', 'warning', 'info'])
  }),
  stat4: z.object({
    visible: z.boolean().optional(),
    number: z.string(),
    label: z.string(),
    description: z.string(),
    color: z.enum(['primary', 'secondary', 'accent', 'destructive', 'success', 'warning', 'info'])
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero5Content = z.infer<typeof Hero5Schema>;

const DEFAULT_CONTENT: Hero5Content = {
  textContent: {
    badge: "Trusted by Industry Leaders",
    title: "Scale your business with confidence",
    subtitle: "Join thousands of companies already transforming their operations",
    description: "Our platform helps businesses of all sizes achieve their goals faster with powerful tools, dedicated support, and proven results.",
    textColor: "foreground"
  },
  stat1: {
    visible: true,
    number: "10K+",
    label: "Active Users",
    description: "Growing daily",
    color: "primary"
  },
  stat2: {
    visible: true,
    number: "99.9%",
    label: "Uptime",
    description: "Reliable service",
    color: "primary"
  },
  stat3: {
    visible: true,
    number: "500+",
    label: "Integrations",
    description: "Connect everything",
    color: "primary"
  },
  stat4: {
    visible: true,
    number: "24/7",
    label: "Support",
    description: "Always here to help",
    color: "primary"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Start Free Trial",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "See How It Works",
    url: "/demo",
    variant: "outline",
    size: "lg",
    icon: "play",
    iconPosition: "left"
  },
};

interface Hero5Props {
  sectionId: string;
}

const getStatGradientClasses = (color: string, isHover = false) => {
  const gradients = {
    primary: isHover 
      ? 'from-primary to-primary/70' 
      : 'from-primary to-primary/70',
    secondary: isHover 
      ? 'from-secondary to-secondary/70' 
      : 'from-secondary to-secondary/70',
    accent: isHover 
      ? 'from-accent to-accent/70' 
      : 'from-accent to-accent/70',
    destructive: isHover 
      ? 'from-destructive to-destructive/70' 
      : 'from-destructive to-destructive/70',
    success: isHover 
      ? 'from-green-500 to-green-400' 
      : 'from-green-500 to-green-400',
    warning: isHover 
      ? 'from-yellow-500 to-yellow-400' 
      : 'from-yellow-500 to-yellow-400',
    info: isHover 
      ? 'from-blue-500 to-blue-400' 
      : 'from-blue-500 to-blue-400'
  };
  
  return gradients[color as keyof typeof gradients] || gradients.primary;
};

const getStatLineGradientClasses = (color: string, isHover = false) => {
  const gradients = {
    primary: isHover 
      ? 'from-primary to-primary/80' 
      : 'from-primary/30 to-primary/60',
    secondary: isHover 
      ? 'from-secondary to-secondary/80' 
      : 'from-secondary/30 to-secondary/60',
    accent: isHover 
      ? 'from-accent to-accent/80' 
      : 'from-accent/30 to-accent/60',
    destructive: isHover 
      ? 'from-destructive to-destructive/80' 
      : 'from-destructive/30 to-destructive/60',
    success: isHover 
      ? 'from-green-500 to-green-400' 
      : 'from-green-500/30 to-green-400/60',
    warning: isHover 
      ? 'from-yellow-500 to-yellow-400' 
      : 'from-yellow-500/30 to-yellow-400/60',
    info: isHover 
      ? 'from-blue-500 to-blue-400' 
      : 'from-blue-500/30 to-blue-400/60'
  };
  
  return gradients[color as keyof typeof gradients] || gradients.primary;
};

const Hero5: React.FC<Hero5Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero5-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses} relative`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto">
          {/* Main Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            {/* Badge */}
            {(content.textContent?.badge || DEFAULT_CONTENT.textContent.badge).trim() && (
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium mb-6">
                <span className={`${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-70`}>
                  {content.textContent?.badge || DEFAULT_CONTENT.textContent.badge}
                </span>
              </div>
            )}
            
            {/* Main Title */}
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
            </h1>
            
            {/* Subtitle */}
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-medium mb-6 opacity-80 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.subtitle || DEFAULT_CONTENT.textContent.subtitle}
            </h2>
            
            {/* Description */}
            <p className={`text-lg leading-relaxed mb-10 max-w-2xl mx-auto opacity-70 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              {(content.primaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.primaryCta} />
              )}
              {(content.secondaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.secondaryCta} />
              )}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                content.stat1 || DEFAULT_CONTENT.stat1,
                content.stat2 || DEFAULT_CONTENT.stat2,
                content.stat3 || DEFAULT_CONTENT.stat3,
                content.stat4 || DEFAULT_CONTENT.stat4
              ].filter(stat => stat.visible !== false).map((stat, index) => (
                                 <div 
                   key={index} 
                   className="text-center group"
                 >
                   {/* Stat Number */}
                   <div className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-br ${getStatGradientClasses(stat.color)} bg-clip-text text-transparent transition-all duration-300`}>
                     {stat.number}
                   </div>
                   
                   {/* Stat Label */}
                   <div className={`text-sm md:text-base font-semibold mb-1 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                     {stat.label}
                   </div>
                   
                   {/* Stat Description */}
                   <div className={`text-xs md:text-sm opacity-60 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                     {stat.description}
                   </div>
                   
                   {/* Decorative line */}
                   <div className={`w-8 h-0.5 bg-gradient-to-r ${getStatLineGradientClasses(stat.color)} mx-auto mt-4 group-hover:${getStatLineGradientClasses(stat.color, true)} transition-all duration-300`}></div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero5;
export type { Hero5Content };
export { DEFAULT_CONTENT as Hero5DefaultContent };
export { Hero5Schema }; 