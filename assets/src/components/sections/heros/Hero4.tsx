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
import { Zap, Shield, Users, Check, Star, Heart, Settings, Home } from 'lucide-react';

const Hero4Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  feature1: z.object({
    visible: z.boolean().optional(),
    title: z.string(),
    description: z.string(),
    icon: z.enum(['zap', 'shield', 'users', 'check', 'star', 'heart', 'settings', 'home'])
  }),
  feature2: z.object({
    visible: z.boolean().optional(),
    title: z.string(),
    description: z.string(),
    icon: z.enum(['zap', 'shield', 'users', 'check', 'star', 'heart', 'settings', 'home'])
  }),
  feature3: z.object({
    visible: z.boolean().optional(),
    title: z.string(),
    description: z.string(),
    icon: z.enum(['zap', 'shield', 'users', 'check', 'star', 'heart', 'settings', 'home'])
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero4Content = z.infer<typeof Hero4Schema>;

const DEFAULT_CONTENT: Hero4Content = {
  textContent: {
    title: "The future of development is here",
    subtitle: "Build, deploy, and scale with confidence",
    description: "Join thousands of developers who trust our platform to bring their ideas to life. Experience the power of modern development tools designed for teams that move fast.",
    textColor: "foreground"
  },
  feature1: {
    visible: true,
    title: "Lightning Fast",
    description: "Deploy in seconds, not minutes. Our optimized infrastructure ensures your applications run at peak performance.",
    icon: "zap"
  },
  feature2: {
    visible: true,
    title: "Enterprise Security",
    description: "Bank-level security with end-to-end encryption. Your data and your users' data are always protected.",
    icon: "shield"
  },
  feature3: {
    visible: true,
    title: "Team Collaboration",
    description: "Built for teams. Real-time collaboration tools that keep everyone in sync and productive.",
    icon: "users"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Start Building Today",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "Watch Demo",
    url: "/demo",
    variant: "outline",
    size: "lg",
    icon: "play",
    iconPosition: "left"
  },
};

interface Hero4Props {
  sectionId: string;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'zap':
      return Zap;
    case 'shield':
      return Shield;
    case 'users':
      return Users;
    case 'check':
      return Check;
    case 'star':
      return Star;
    case 'heart':
      return Heart;
    case 'settings':
      return Settings;
    case 'home':
      return Home;
    default:
      return Zap;
  }
};

const Hero4: React.FC<Hero4Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero4-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses} relative overflow-hidden`}
        style={paddingCSS.styles}
      >
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        
        {/* Background Decorations */}
        <div className="absolute top-1/4 -left-12 w-96 h-96 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-12 w-96 h-96 bg-gradient-to-l from-secondary/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="container mx-auto relative z-10">
          {/* Main Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
            </h1>
            
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-semibold mb-6 opacity-90 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.subtitle || DEFAULT_CONTENT.textContent.subtitle}
            </h2>
            
            <p className={`text-lg md:text-xl leading-relaxed mb-8 max-w-3xl mx-auto opacity-80 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {(content.primaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.primaryCta} />
              )}
              {(content.secondaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.secondaryCta} />
              )}
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              content.feature1 || DEFAULT_CONTENT.feature1,
              content.feature2 || DEFAULT_CONTENT.feature2,
              content.feature3 || DEFAULT_CONTENT.feature3
            ].filter(feature => feature.visible !== false).map((feature, index) => {
              const IconComponent = getIconComponent(feature.icon);
              return (
                <div 
                  key={index} 
                  className="relative group"
                >
                  {/* Card */}
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 h-full transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/20">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Content */}
                    <h3 className={`text-xl font-semibold mb-3 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                      {feature.title}
                    </h3>
                    
                    <p className={`leading-relaxed opacity-80 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                      {feature.description}
                    </p>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero4;
export type { Hero4Content };
export { DEFAULT_CONTENT as Hero4DefaultContent };
export { Hero4Schema }; 