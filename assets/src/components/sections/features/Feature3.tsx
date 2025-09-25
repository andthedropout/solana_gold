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

const Feature3Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  primaryCta: createButtonSchema(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    listItems: z.array(z.string()).max(10),
    featureCta: createButtonSchema(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(200).max(600).default(512)
    })
  })).max(8),
  sectionPadding: createResponsivePaddingSchema()
});

type Feature3Content = z.infer<typeof Feature3Schema>;

const DEFAULT_CONTENT: Feature3Content = {
  textContent: {
    title: "Powerful Features",
    subtitle: "Discover what makes our platform different. From advanced analytics to seamless integrations, we've built everything you need to succeed.",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  primaryCta: {
    visible: true,
    text: "View All Features",
    url: "/features",
    variant: "default",
    size: "default",
    icon: "arrow-right",
    iconPosition: "right"
  },
  features: [
    {
      title: "Advanced Analytics",
      description: "Get deep insights into your performance with comprehensive analytics and reporting tools that help you make data-driven decisions.",
      listItems: [
        "Real-time performance tracking",
        "Custom dashboard creation",
        "Automated report generation",
        "Data export and sharing"
      ],
      featureCta: {
        visible: true,
        text: "Learn More",
        url: "/analytics",
        variant: "outline",
        size: "sm",
        icon: "arrow-right",
        iconPosition: "right"
      },
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Advanced Analytics Dashboard",
        height: 512
      }
    },
    {
      title: "Seamless Integration",
      description: "Connect with all your favorite tools and services. Our platform integrates with over 100+ popular applications and services.",
      listItems: [
        "100+ pre-built integrations",
        "API-first architecture",
        "Webhook support",
        "Custom connector builder"
      ],
      featureCta: {
        visible: true,
        text: "View Integrations",
        url: "/integrations",
        variant: "outline",
        size: "sm",
        icon: "arrow-right",
        iconPosition: "right"
      },
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-2.svg",
        alt: "Integration Hub",
        height: 512
      }
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Feature3Props {
  sectionId: string;
}

const Feature3: React.FC<Feature3Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'feature3-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container flex flex-col gap-16 lg:px-16">
          <div className="lg:max-w-sm">
            {content.textContent?.title && (
              <h2 className={`mb-3 text-xl font-semibold md:mb-4 md:text-4xl lg:mb-6 ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            )}
            {content.textContent?.subtitle && (
              <p className={`mb-8 lg:text-lg ${getTextColorClass(content.textContent?.subtitleColor || "muted-foreground")}`}>
                {content.textContent.subtitle}
              </p>
            )}
            
            {(content.primaryCta.visible !== false) && (
              <ButtonWithIcon cta={content.primaryCta} />
            )}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {(content.features || DEFAULT_CONTENT.features).map((feature, index) => {
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={index}
                  className={`flex overflow-clip rounded-xl border border-border bg-card md:col-span-2 md:grid md:grid-cols-2 md:gap-6 lg:gap-8 ${
                    isEven ? 'flex-col' : 'flex-col-reverse'
                  }`}
                >
                  {isEven ? (
                    <>
                      <div className="md:min-h-[24rem] lg:min-h-[28rem] xl:min-h-[32rem]">
                        <img
                          src={feature.image?.url || "https://shadcnblocks.com/images/block/placeholder-1.svg"}
                          alt={feature.image?.alt || feature.title}
                          className="h-full w-full object-cover object-center"
                          style={{ height: `${feature.image?.height || 512}px` }}
                        />
                      </div>
                      <div className="flex flex-col justify-center px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                        <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                          {feature.title}
                        </h3>
                        <p className="mb-4 text-muted-foreground lg:text-lg">
                          {feature.description}
                        </p>
                        
                        {feature.listItems && feature.listItems.length > 0 && (
                          <ul className="mb-6 space-y-3">
                            {feature.listItems.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                </div>
                                <span className="text-muted-foreground">{typeof item === 'string' ? item : String(item)}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {(feature.featureCta.visible !== false) && (
                          <div className="w-fit">
                            <ButtonWithIcon cta={feature.featureCta} />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col justify-center px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                        <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                          {feature.title}
                        </h3>
                        <p className="mb-4 text-muted-foreground lg:text-lg">
                          {feature.description}
                        </p>
                        
                        {feature.listItems && feature.listItems.length > 0 && (
                          <ul className="mb-6 space-y-3">
                            {feature.listItems.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                </div>
                                <span className="text-muted-foreground">{typeof item === 'string' ? item : String(item)}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {(feature.featureCta.visible !== false) && (
                          <div className="w-fit">
                            <ButtonWithIcon cta={feature.featureCta} />
                          </div>
                        )}
                      </div>
                      <div className="md:min-h-[24rem] lg:min-h-[28rem] xl:min-h-[32rem]">
                        <img
                          src={feature.image?.url || "https://shadcnblocks.com/images/block/placeholder-2.svg"}
                          alt={feature.image?.alt || feature.title}
                          className="h-full w-full object-cover object-center"
                          style={{ height: `${feature.image?.height || 512}px` }}
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Feature3;
export type { Feature3Content };
export { DEFAULT_CONTENT as Feature3DefaultContent };
export { Feature3Schema }; 