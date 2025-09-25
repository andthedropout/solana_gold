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

const CTA2Schema = z.object({
  textContent: z.object({
    heading: z.string(),
    description: z.string(),
    headingColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type CTA2Content = z.infer<typeof CTA2Schema>;

const DEFAULT_CONTENT: CTA2Content = {
  textContent: {
    heading: "Take Your Business to the Next Level",
    description: "Join over 10,000 companies that trust our platform to streamline operations, boost productivity, and accelerate growth. Experience the future of business automation today.",
    headingColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  primaryCta: {
    visible: true,
    text: "Start Free Trial",
    url: "/trial",
    variant: "default",
    size: "lg",
    icon: "rocket",
    iconPosition: "left"
  },
  secondaryCta: {
    visible: true,
    text: "View Demo",
    url: "/demo",
    variant: "outline",
    size: "lg",
    icon: "play",
    iconPosition: "left"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface CTA2Props {
  sectionId: string;
}

const CTA2: React.FC<CTA2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'cta2-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center rounded-lg bg-accent p-8 text-center md:rounded-xl lg:p-16">
            {content.textContent?.heading && (
              <h3 className={`mb-3 max-w-3xl text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6 ${getTextColorClass(content.textContent?.headingColor || "foreground")}`}>
                {content.textContent.heading}
              </h3>
            )}
            {content.textContent?.description && (
              <p className={`mb-8 max-w-3xl lg:text-lg ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                {content.textContent.description}
              </p>
            )}
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
              {(content.secondaryCta.visible !== false) && (
                <div className="w-full sm:w-auto">
                  <ButtonWithIcon cta={content.secondaryCta} />
                </div>
              )}
              {(content.primaryCta.visible !== false) && (
                <div className="w-full sm:w-auto">
                  <ButtonWithIcon cta={content.primaryCta} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default CTA2;
export type { CTA2Content };
export { DEFAULT_CONTENT as CTA2DefaultContent };
export { CTA2Schema }; 