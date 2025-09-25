import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
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

const Feature4Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  primaryCta: createButtonSchema(),
  features: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    })
  })).max(8),
  sectionPadding: createResponsivePaddingSchema()
});

type Feature4Content = z.infer<typeof Feature4Schema>;

const DEFAULT_CONTENT: Feature4Content = {
  textContent: {
    title: "Powerful Features",
    description: "Discover the powerful features that make our platform stand out from the rest. Built with the latest technology and designed for maximum productivity.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  primaryCta: {
    visible: true,
    text: "Book a Demo",
    url: "/demo",
    variant: "ghost",
    size: "default",
    icon: "arrow-right",
    iconPosition: "right"
  },
  features: [
    {
      id: "feature-1",
      title: "Modern Design",
      description: "Clean and intuitive interface built with the latest design principles. Optimized for the best user experience.",
      image: {
        url: "https://www.shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Modern Design"
      }
    },
    {
      id: "feature-2",
      title: "Responsive Layout",
      description: "Fully responsive design that works seamlessly across all devices and screen sizes. Perfect for any platform.",
      image: {
        url: "https://www.shadcnblocks.com/images/block/placeholder-2.svg",
        alt: "Responsive Layout"
      }
    },
    {
      id: "feature-3",
      title: "Easy Integration",
      description: "Simple integration process with comprehensive documentation and dedicated support team.",
      image: {
        url: "https://www.shadcnblocks.com/images/block/placeholder-3.svg",
        alt: "Easy Integration"
      }
    },
    {
      id: "feature-4",
      title: "Advanced Analytics",
      description: "Powerful analytics tools to help you understand your users and make data-driven decisions.",
      image: {
        url: "https://www.shadcnblocks.com/images/block/placeholder-4.svg",
        alt: "Advanced Analytics"
      }
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Feature4Props {
  sectionId: string;
}

const Feature4: React.FC<Feature4Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'feature4-responsive-padding');

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
            {content.textContent?.description && (
              <p className={`mb-8 lg:text-lg ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                {content.textContent.description}
              </p>
            )}
            
            {(content.primaryCta.visible !== false) && (
              <ButtonWithIcon cta={content.primaryCta} />
            )}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
            {(content.features || DEFAULT_CONTENT.features).map((feature) => (
              <div
                key={feature.id}
                className="flex flex-col overflow-clip rounded-xl border border-border bg-card"
              >
                <div>
                  <img
                    src={feature.image?.url || "https://www.shadcnblocks.com/images/block/placeholder-1.svg"}
                    alt={feature.image?.alt || feature.title}
                    className="aspect-video h-full w-full object-cover object-center"
                  />
                </div>
                <div className="px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
                  <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground lg:text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Feature4;
export type { Feature4Content };
export { DEFAULT_CONTENT as Feature4DefaultContent };
export { Feature4Schema };