import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';
import { Card, CardContent } from "@/components/ui/card";

const Feature1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  feature1: z.object({
    title: z.string(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(100).max(500).default(200)
    })
  }),
  feature2: z.object({
    title: z.string(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(100).max(500).default(150)
    })
  }),
  feature3: z.object({
    title: z.string(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(100).max(500).default(150)
    })
  }),
  feature4: z.object({
    title: z.string(),
    description: z.string(),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(100).max(500).default(200)
    })
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Feature1Content = z.infer<typeof Feature1Schema>;

const DEFAULT_CONTENT: Feature1Content = {
  textContent: {
    title: "Why Choose Our Services",
    description: "We deliver exceptional results through our proven expertise and customer-focused approach.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  feature1: {
    title: "Expert Team",
    description: "Our skilled professionals bring years of experience and industry knowledge to every project.",
    image: {
      url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      alt: "Expert team",
      height: 200
    }
  },
  feature2: {
    title: "Quality Results",
    description: "We deliver high-quality outcomes that exceed expectations and drive real business value.",
    image: {
      url: "https://shadcnblocks.com/images/block/placeholder-2.svg",
      alt: "Quality results",
      height: 150
    }
  },
  feature3: {
    title: "Customer Support",
    description: "Our dedicated support team is here to help you succeed every step of the way.",
    image: {
      url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      alt: "Customer support",
      height: 150
    }
  },
  feature4: {
    title: "Proven Process",
    description: "Our time-tested methodology ensures consistent results and project success.",
    image: {
      url: "https://shadcnblocks.com/images/block/placeholder-2.svg",
      alt: "Proven process",
      height: 200
    }
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Feature1Props {
  sectionId: string;
}

const Feature1: React.FC<Feature1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'feature1-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="mb-24 flex flex-col items-center gap-6">
            <h1 className={`text-center text-3xl font-semibold lg:max-w-3xl lg:text-5xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
              {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
            </h1>
            <p className={`text-center text-lg font-medium md:max-w-4xl lg:text-xl ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
              {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
            </p>
          </div>
          <div className="relative flex justify-center">
            <div className="relative flex w-full flex-col gap-4 md:w-1/2 lg:w-full lg:gap-6">
              <div className="relative flex flex-col gap-4 lg:flex-row lg:gap-6">
                <Card className="lg:w-3/5">
                  <CardContent className="flex flex-col justify-between p-8 lg:p-10 h-full">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        {content.feature1?.title || DEFAULT_CONTENT.feature1.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {content.feature1?.description || DEFAULT_CONTENT.feature1.description}
                      </p>
                    </div>
                    <img
                      src={content.feature1?.image?.url || DEFAULT_CONTENT.feature1.image.url}
                      alt={content.feature1?.image?.alt || DEFAULT_CONTENT.feature1.image.alt}
                      className="w-full object-cover rounded-lg"
                      style={{ height: `${content.feature1?.image?.height || DEFAULT_CONTENT.feature1.image.height}px` }}
                    />
                  </CardContent>
                </Card>
                <Card className="lg:w-2/5">
                  <CardContent className="flex flex-col justify-between p-8 lg:p-10 h-full">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        {content.feature2?.title || DEFAULT_CONTENT.feature2.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {content.feature2?.description || DEFAULT_CONTENT.feature2.description}
                      </p>
                    </div>
                    <img
                      src={content.feature2?.image?.url || DEFAULT_CONTENT.feature2.image.url}
                      alt={content.feature2?.image?.alt || DEFAULT_CONTENT.feature2.image.alt}
                      className="w-full object-cover rounded-lg"
                      style={{ height: `${content.feature2?.image?.height || DEFAULT_CONTENT.feature2.image.height}px` }}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="relative flex flex-col gap-4 lg:flex-row lg:gap-6">
                <Card className="lg:w-2/5">
                  <CardContent className="flex flex-col justify-between p-8 lg:p-10 h-full">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        {content.feature3?.title || DEFAULT_CONTENT.feature3.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {content.feature3?.description || DEFAULT_CONTENT.feature3.description}
                      </p>
                    </div>
                    <img
                      src={content.feature3?.image?.url || DEFAULT_CONTENT.feature3.image.url}
                      alt={content.feature3?.image?.alt || DEFAULT_CONTENT.feature3.image.alt}
                      className="w-full object-cover rounded-lg"
                      style={{ height: `${content.feature3?.image?.height || DEFAULT_CONTENT.feature3.image.height}px` }}
                    />
                  </CardContent>
                </Card>
                <Card className="lg:w-3/5">
                  <CardContent className="flex flex-col justify-between p-8 lg:p-10 h-full">
                    <div>
                      <h2 className="text-xl font-semibold mb-4">
                        {content.feature4?.title || DEFAULT_CONTENT.feature4.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        {content.feature4?.description || DEFAULT_CONTENT.feature4.description}
                      </p>
                    </div>
                    <img
                      src={content.feature4?.image?.url || DEFAULT_CONTENT.feature4.image.url}
                      alt={content.feature4?.image?.alt || DEFAULT_CONTENT.feature4.image.alt}
                      className="w-full object-cover rounded-lg"
                      style={{ height: `${content.feature4?.image?.height || DEFAULT_CONTENT.feature4.image.height}px` }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Feature1;
export type { Feature1Content };
export { DEFAULT_CONTENT as Feature1DefaultContent };
export { Feature1Schema }; 