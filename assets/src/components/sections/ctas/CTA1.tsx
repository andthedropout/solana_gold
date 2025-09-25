import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Check } from 'lucide-react';
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

const CTA1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  primaryCta: createButtonSchema(),
  features: z.array(z.string()).min(1).max(8),
  sectionPadding: createResponsivePaddingSchema()
});

type CTA1Content = z.infer<typeof CTA1Schema>;

const DEFAULT_CONTENT: CTA1Content = {
  textContent: {
    title: "Ready to Transform Your Business?",
    description: "Join thousands of companies who have revolutionized their operations with our innovative platform. Experience the difference today.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  primaryCta: {
    visible: true,
    text: "Get Started Now",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  features: [
    "Easy Integration",
    "24/7 Expert Support",
    "Customizable Design",
    "Scalable Performance",
    "Advanced Analytics"
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface CTA1Props {
  sectionId: string;
}

const CTA1: React.FC<CTA1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'cta1-responsive-padding');

  const features = content.features?.length ? content.features : DEFAULT_CONTENT.features;

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="max-w-5xl w-full">
              <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-muted px-6 py-10 md:flex-row lg:px-20 lg:py-16">
                <div className="md:w-1/2">
                  {content.textContent?.title && (
                    <h4 className={`mb-1 text-2xl font-bold md:text-3xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                      {content.textContent.title}
                    </h4>
                  )}
                  {content.textContent?.description && (
                    <p className={`${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                      {content.textContent.description}
                    </p>
                  )}
                  {(content.primaryCta.visible !== false) && (
                    <div className="mt-6">
                      <ButtonWithIcon cta={content.primaryCta} />
                    </div>
                  )}
                </div>
                <div className="md:w-1/3">
                  <ul className="flex flex-col space-y-2 text-sm font-medium">
                    {features.map((item, idx) => (
                      <li className="flex items-center" key={idx}>
                        <Check className="mr-4 size-4 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default CTA1;
export type { CTA1Content };
export { DEFAULT_CONTENT as CTA1DefaultContent };
export { CTA1Schema }; 