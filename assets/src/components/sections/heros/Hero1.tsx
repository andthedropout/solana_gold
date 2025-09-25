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

const Hero1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero1Content = z.infer<typeof Hero1Schema>;

const DEFAULT_CONTENT: Hero1Content = {
  textContent: {
    title: "Welcome to our CMS System",
    subtitle: "This is a dynamically rendered hero section from the CMS. You can easily add new components and configure them through the admin interface.",
    textColor: "foreground"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Get Started",
    url: "/dashboard",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "Learn More", 
    url: "example.com",
    variant: "outline",
    size: "lg",
    icon: "external-link",
    iconPosition: "right"
  },
};

interface Hero1Props {
  sectionId: string;
}

const Hero1: React.FC<Hero1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="w-full max-w-6xl mx-auto text-center">
          <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 break-words ${getTextColorClass(content.textContent?.textColor || content.textColor)}`}>
            {content.textContent?.title || content.title || "Welcome to our CMS System"}
          </h1>
          
          <p className={`text-xl mb-8 max-w-3xl mx-auto opacity-80 break-words ${getTextColorClass(content.textContent?.textColor || content.textColor)}`}>
            {content.textContent?.subtitle || content.subtitle || "This is a dynamically rendered hero section from the CMS."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(content.primaryCta.visible !== false) && (
              <ButtonWithIcon cta={content.primaryCta} />
            )}
            {(content.secondaryCta.visible !== false) && (
              <ButtonWithIcon cta={content.secondaryCta} />
            )}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero1;
export type { Hero1Content };
export { DEFAULT_CONTENT as Hero1DefaultContent };
export { Hero1Schema }; 