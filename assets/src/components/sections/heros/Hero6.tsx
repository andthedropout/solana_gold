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
import { Check, Sparkles, Zap, Shield, Circle, Star, Heart } from 'lucide-react';

const Hero6Schema = z.object({
  textContent: z.object({
    badge: z.string(),
    title: z.string(),
    subtitle: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  layout: z.object({
    imagePosition: z.enum(['left', 'right'])
  }),
  benefits: z.object({
    benefit1: z.string(),
    benefit2: z.string(),
    benefit3: z.string(),
    benefit4: z.string()
  }),
  productImage: z.object({
    url: z.string().optional(),
    alt: z.string().optional()
  }),
  floatingElements: z.object({
    topElement: z.object({
      visible: z.boolean().optional(),
      text: z.string(),
      icon: z.enum(['circle', 'zap', 'check', 'star', 'heart', 'shield', 'sparkles'])
    }),
    bottomElement: z.object({
      visible: z.boolean().optional(),
      text: z.string(),
      icon: z.enum(['circle', 'zap', 'check', 'star', 'heart', 'shield', 'sparkles'])
    })
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero6Content = z.infer<typeof Hero6Schema>;

const DEFAULT_CONTENT: Hero6Content = {
  textContent: {
    badge: "✨ New Product Launch",
    title: "The all-in-one platform that grows with your business",
    subtitle: "Streamline your workflow, boost productivity, and scale faster with our comprehensive business solution.",
    textColor: "foreground"
  },
  layout: {
    imagePosition: "right"
  },
  benefits: {
    benefit1: "Automate repetitive tasks",
    benefit2: "Real-time collaboration",
    benefit3: "Advanced analytics & insights",
    benefit4: "Enterprise-grade security"
  },
  productImage: {
    url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
    alt: "Product dashboard interface"
  },
  floatingElements: {
    topElement: {
      visible: true,
      text: "Live",
      icon: "circle"
    },
    bottomElement: {
      visible: true,
      text: "Fast",
      icon: "zap"
    }
  },
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
    text: "Watch Demo",
    url: "/demo",
    variant: "outline", 
    size: "lg",
    icon: "play",
    iconPosition: "left"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Hero6Props {
  sectionId: string;
}

const Hero6: React.FC<Hero6Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero6-responsive-padding');

  const imagePosition = content.layout?.imagePosition || DEFAULT_CONTENT.layout.imagePosition;
  const imageOnRight = imagePosition === 'right';

  const benefits = [
    content.benefits?.benefit1 || DEFAULT_CONTENT.benefits.benefit1,
    content.benefits?.benefit2 || DEFAULT_CONTENT.benefits.benefit2,
    content.benefits?.benefit3 || DEFAULT_CONTENT.benefits.benefit3,
    content.benefits?.benefit4 || DEFAULT_CONTENT.benefits.benefit4
  ];

  const getIcon = (iconName: string) => {
    const iconMap = {
      circle: Circle,
      zap: Zap,
      check: Check,
      star: Star,
      heart: Heart,
      shield: Shield,
      sparkles: Sparkles
    };
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Circle;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses} relative overflow-hidden`}
        style={paddingCSS.styles}
      >
        {/* Background Elements */}
        
        <div className="container mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div className={`space-y-8 ${imageOnRight ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
              {/* Badge */}
              <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium">
                <span className={`${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-70`}>
                  {content.textContent?.badge || DEFAULT_CONTENT.textContent.badge}
                </span>
              </div>
              
              {/* Main Title */}
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
              </h1>
              
              {/* Subtitle */}
              <p className={`text-lg md:text-xl leading-relaxed opacity-80 max-w-lg ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.subtitle || DEFAULT_CONTENT.textContent.subtitle}
              </p>
              
              {/* Benefits List */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className={`text-lg ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {(content.primaryCta.visible !== false) && (
                  <ButtonWithIcon cta={content.primaryCta} />
                )}
                {(content.secondaryCta.visible !== false) && (
                  <ButtonWithIcon cta={content.secondaryCta} />
                )}
              </div>
            </div>
            
            {/* Product Mockup */}
            <div className={`relative ${imageOnRight ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-60"></div>
              
              {/* Main Product Image */}
              <div className="relative bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
                {content.productImage?.url ? (
                  <img 
                    src={content.productImage.url} 
                    alt={content.productImage?.alt || DEFAULT_CONTENT.productImage.alt}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-foreground/10 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-foreground/10 rounded w-1/2 mx-auto"></div>
                        <div className="h-4 bg-foreground/10 rounded w-2/3 mx-auto"></div>
                      </div>
                      <p className={`text-sm opacity-60 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                        Product Interface Preview
                      </p>
                    </div>
                  </div>
                )}
                
                                 {/* Floating UI Elements */}
                 {(content.floatingElements?.topElement?.visible !== false) && (
                   <div className="absolute -top-4 -right-4 bg-card border border-border rounded-lg p-3 shadow-lg">
                     <div className="flex items-center gap-2">
                       {content.floatingElements?.topElement?.icon === 'circle' ? (
                         <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       ) : (
                         <div className="text-accent">
                           {getIcon(content.floatingElements?.topElement?.icon || 'circle')}
                         </div>
                       )}
                       <span className="text-xs font-medium opacity-70">
                         {content.floatingElements?.topElement?.text || DEFAULT_CONTENT.floatingElements.topElement.text}
                       </span>
                     </div>
                   </div>
                 )}
                 
                 {(content.floatingElements?.bottomElement?.visible !== false) && (
                   <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg p-3 shadow-lg">
                     <div className="flex items-center gap-2">
                       <div className="text-accent">
                         {getIcon(content.floatingElements?.bottomElement?.icon || 'zap')}
                       </div>
                       <span className="text-xs font-medium opacity-70">
                         {content.floatingElements?.bottomElement?.text || DEFAULT_CONTENT.floatingElements.bottomElement.text}
                       </span>
                     </div>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero6;
export type { Hero6Content };
export { DEFAULT_CONTENT as Hero6DefaultContent };
export { Hero6Schema }; 