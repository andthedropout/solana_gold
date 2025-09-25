import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { ArrowUpRight } from "lucide-react";
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

const Hero7Schema = z.object({
  textContent: z.object({
    heading: z.string(),
    subheading: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  layout: z.object({
    imagePosition: z.enum(['left', 'right'])
  }),
  productImage: z.object({
    url: z.string().optional(),
    alt: z.string().optional()
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero7Content = z.infer<typeof Hero7Schema>;

const DEFAULT_CONTENT: Hero7Content = {
  textContent: {
    heading: "Epic Blocks",
    subheading: " built with shadcn/ui & Tailwind",
    description: "Finely crafted components built with React, Tailwind and Shadcn UI. Developers can copy and paste these blocks directly into their project.",
    textColor: "foreground"
  },
  layout: {
    imagePosition: "right"
  },
  productImage: {
    url: "https://shadcnblocks.com/images/block/placeholder-dark-7-tall.svg",
    alt: "Product mockup"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Get Started",
    url: "/get-started",
    variant: "default",
    size: "lg",
    icon: "arrow-up-right",
    iconPosition: "left"
  },
  secondaryCta: {
    visible: true,
    text: "Read the docs",
    url: "/docs",
    variant: "link",
    size: "lg",
    icon: "",
    iconPosition: "right"
  }
};

interface Hero7Props {
  sectionId: string;
}

const Hero7: React.FC<Hero7Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero7-responsive-padding');

  const imagePosition = content.layout?.imagePosition || DEFAULT_CONTENT.layout.imagePosition;
  const imageOnRight = imagePosition === 'right';

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`py-20 lg:py-32 ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container flex flex-col items-center gap-10 lg:my-0 lg:flex-row">
          <div className={`flex flex-col gap-7 lg:w-2/3 ${imageOnRight ? 'lg:order-1' : 'lg:order-2'}`}>
            <h2 className={`text-5xl font-semibold md:text-5xl lg:text-8xl ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              <span>{content.textContent?.heading || "Epic Blocks"}</span>
              <span className="text-muted-foreground">{content.textContent?.subheading || " built with shadcn/ui & Tailwind"}</span>
            </h2>
            
            <p className="text-base text-muted-foreground md:text-lg lg:text-xl">
              {content.textContent?.description || "Finely crafted components built with React, Tailwind and Shadcn UI."}
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-7">
              {(content.primaryCta.visible !== false) && (
                <ButtonWithIcon cta={{
                  ...content.primaryCta,
                  size: "lg"
                }} />
              )}
              {(content.secondaryCta.visible !== false) && (
                <ButtonWithIcon cta={{
                  ...content.secondaryCta,
                  variant: "link",
                  size: "lg"
                }} />
              )}
            </div>
          </div>
          
          <div className={`relative z-10 ${imageOnRight ? 'lg:order-2' : 'lg:order-1'}`}>
            <div className="absolute top-2.5 left-1/2 h-[92%] w-[69%] -translate-x-[52%] overflow-hidden rounded-[35px]">
              <img
                src={content.productImage?.url || "https://shadcnblocks.com/images/block/placeholder-dark-7-tall.svg"}
                alt={content.productImage?.alt || "Product mockup"}
                className="size-full object-cover object-[50%_0%]"
              />
            </div>
            <img
              className="relative z-10"
              src="https://shadcnblocks.com/images/block/mockups/phone-2.png"
              width={450}
              height={889}
              alt="iphone mockup frame"
            />
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero7;
export type { Hero7Content };
export { DEFAULT_CONTENT as Hero7DefaultContent };
export { Hero7Schema }; 