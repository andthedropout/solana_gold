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
import { Card, CardContent } from "@/components/ui/card";

const Hero11Schema = z.object({
  textContent: z.object({
    badge: z.string(),
    heading: z.string(),
    description: z.string(),
    badgeColor: z.enum(TEXT_COLOR_OPTIONS),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  layout: z.object({
    imagePosition: z.enum(['left', 'right'])
  }),
  heroImage: z.object({
    url: z.string(),
    alt: z.string(),
    height: z.number().min(200).max(800).default(400),
    objectFit: z.enum(['cover', 'contain']).default('cover')
  }),
  cardStyling: z.object({
    backgroundOpacity: z.number().min(0).max(1).default(1)
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero11Content = z.infer<typeof Hero11Schema>;

const DEFAULT_CONTENT: Hero11Content = {
  textContent: {
    badge: "Premium Service",
    heading: "Exceptional Quality, Every Time",
    description: "Experience professional service with a personal touch. We combine expertise with care to deliver results that exceed your expectations.",
    badgeColor: "primary",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  layout: {
    imagePosition: "left"
  },
  heroImage: {
    url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
    alt: "Professional service showcase",
    height: 400,
    objectFit: "cover"
  },
  cardStyling: {
    backgroundOpacity: 1
  },
  primaryCta: {
    visible: true,
    text: "Get Started",
    url: "/get-started",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "Learn More",
    url: "/about",
    variant: "ghost",
    size: "lg",
    icon: "",
    iconPosition: "right"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Hero11Props {
  sectionId: string;
}

const Hero11: React.FC<Hero11Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero11-responsive-padding');

  const imagePosition = content.layout?.imagePosition || DEFAULT_CONTENT.layout.imagePosition;
  const imageOnLeft = imagePosition === 'left';
  const objectFit = content.heroImage?.objectFit || DEFAULT_CONTENT.heroImage.objectFit;
  const cardOpacity = content.cardStyling?.backgroundOpacity ?? DEFAULT_CONTENT.cardStyling.backgroundOpacity;

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className={`${imageOnLeft ? 'order-2 lg:order-1' : 'order-2 lg:order-2'}`}>
              <img
                src={content.heroImage?.url || DEFAULT_CONTENT.heroImage.url}
                alt={content.heroImage?.alt || DEFAULT_CONTENT.heroImage.alt}
                className={`w-full rounded-3xl shadow-2xl ${objectFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                style={{ height: `${content.heroImage?.height || DEFAULT_CONTENT.heroImage.height}px` }}
              />
            </div>
            
            <div className={`${imageOnLeft ? 'order-1 lg:order-2' : 'order-1 lg:order-1'}`}>
              <Card 
                className="border-2 shadow-xl"
                style={{ backgroundColor: `color-mix(in srgb, var(--card) ${cardOpacity * 100}%, transparent)` }}
              >
                <CardContent className="p-8 lg:p-12 text-center">
                  {(content.textContent?.badge && content.textContent.badge.trim() !== '') && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-6 bg-primary/10 ${getTextColorClass(content.textContent?.badgeColor || "primary")}`}>
                      {content.textContent.badge}
                    </div>
                  )}
                  
                  <h1 className={`text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-6 ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                    {content.textContent?.heading || DEFAULT_CONTENT.textContent.heading}
                  </h1>
                  
                  <p className={`text-lg mb-8 leading-relaxed ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                    {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {content.primaryCta.visible !== false && (
                      <ButtonWithIcon cta={{
                        ...content.primaryCta,
                        className: "w-full sm:w-auto"
                      }} />
                    )}
                    {content.secondaryCta.visible !== false && (
                      <ButtonWithIcon cta={{
                        ...content.secondaryCta,
                        className: "w-full sm:w-auto"
                      }} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero11;
export type { Hero11Content };
export { DEFAULT_CONTENT as Hero11DefaultContent };
export { Hero11Schema }; 