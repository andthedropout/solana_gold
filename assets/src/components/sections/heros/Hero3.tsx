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

const Hero3Schema = z.object({
  textContent: z.object({
    badge: z.string(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  image: z.object({
    url: z.string(),
    alt: z.string(),
    useCustomImage: z.boolean()
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero3Content = z.infer<typeof Hero3Schema>;

const DEFAULT_CONTENT: Hero3Content = {
  textContent: {
    badge: "New Release",
    title: "Build faster with our modern tools",
    subtitle: "The complete platform for developers",
    description: "Everything you need to build, deploy, and scale your applications. From development to production, we've got you covered with enterprise-grade infrastructure.",
    textColor: "foreground"
  },
  image: {
    url: "/static/images/hero-dashboard.png",
    alt: "Dashboard mockup showing modern interface",
    useCustomImage: true
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Get Started Free",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "View Documentation",
    url: "/docs",
    variant: "outline",
    size: "lg",
    icon: "external-link",
    iconPosition: "right"
  },
};

interface Hero3Props {
  sectionId: string;
}

const Hero3: React.FC<Hero3Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero3-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-6">
              {/* Badge */}
              {(content.textContent?.badge || DEFAULT_CONTENT.textContent.badge).trim() && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <span className={`text-sm font-medium ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                    {content.textContent?.badge || DEFAULT_CONTENT.textContent.badge}
                  </span>
                </div>
              )}
              
              {/* Main Headline */}
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
              </h1>
              
              {/* Subtitle */}
              <h2 className={`text-xl md:text-2xl font-semibold opacity-90 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.subtitle || DEFAULT_CONTENT.textContent.subtitle}
              </h2>
              
              {/* Description */}
              <p className={`text-lg leading-relaxed opacity-80 max-w-xl ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                {(content.primaryCta.visible !== false) && (
                  <ButtonWithIcon cta={content.primaryCta} />
                )}
                {(content.secondaryCta.visible !== false) && (
                  <ButtonWithIcon cta={content.secondaryCta} />
                )}
              </div>
            </div>
            
            {/* Right Visual */}
            <div className="relative">
              {content.image?.useCustomImage ? (
                /* Custom Image */
                <div className="relative">
                  <img 
                    src={content.image.url || DEFAULT_CONTENT.image.url}
                    alt={content.image.alt || DEFAULT_CONTENT.image.alt}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                /* Mock Dashboard */
                <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-border">
                  {/* Placeholder for dashboard/product mockup */}
                  <div className="bg-card rounded-lg border border-border shadow-lg overflow-hidden">
                    {/* Mock header */}
                    <div className="bg-muted px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    
                    {/* Mock content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-8 bg-primary rounded w-20"></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-muted rounded"></div>
                        <div className="h-20 bg-muted rounded"></div>
                        <div className="h-20 bg-muted rounded"></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-4/5"></div>
                        <div className="h-3 bg-muted rounded w-3/5"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary rounded-full opacity-80"></div>
                  <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary rounded-full opacity-60"></div>
                </div>
              )}
              
              {/* Background decorations */}
              <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero3;
export type { Hero3Content };
export { DEFAULT_CONTENT as Hero3DefaultContent };
export { Hero3Schema }; 