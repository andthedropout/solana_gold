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
import { ParallaxScrollSecond } from '@/components/ui/parallax-scroll-2';

const Gallery4Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  images: z.array(z.string()).min(3, "At least 3 images are required for proper parallax effect").max(24, "Maximum 24 images allowed"),
  sectionPadding: createResponsivePaddingSchema()
});

type Gallery4Content = z.infer<typeof Gallery4Schema>;

const DEFAULT_CONTENT: Gallery4Content = {
  textContent: {
    title: "Parallax Gallery",
    description: "Experience our work through this immersive parallax scrolling gallery. Each column moves at different speeds to create a dynamic, engaging visual experience.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  images: [
    "https://shadcnblocks.com/images/block/placeholder-1.svg",
    "https://shadcnblocks.com/images/block/placeholder-2.svg",
    "https://shadcnblocks.com/images/block/placeholder-3.svg",
    "https://shadcnblocks.com/images/block/placeholder-4.svg",
    "https://shadcnblocks.com/images/block/placeholder-5.svg",
    "https://shadcnblocks.com/images/block/placeholder-1.svg",
    "https://shadcnblocks.com/images/block/placeholder-2.svg",
    "https://shadcnblocks.com/images/block/placeholder-3.svg",
    "https://shadcnblocks.com/images/block/placeholder-4.svg",
    "https://shadcnblocks.com/images/block/placeholder-5.svg",
    "https://shadcnblocks.com/images/block/placeholder-1.svg",
    "https://shadcnblocks.com/images/block/placeholder-2.svg"
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Gallery4Props {
  sectionId: string;
}

const Gallery4: React.FC<Gallery4Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'gallery4-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="mb-8 text-center md:mb-14 lg:mb-16">
            {content.textContent?.title && (
              <h2 className={`mb-4 text-3xl font-medium md:text-4xl lg:text-5xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            )}
            {content.textContent?.description && (
              <p className={`mx-auto max-w-2xl ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                {content.textContent.description}
              </p>
            )}
          </div>
        </div>
        
        <ParallaxScrollSecond 
          images={content.images || DEFAULT_CONTENT.images}
          className="w-full"
        />
      </section>
    </SectionWrapper>
  );
};

export default Gallery4;
export type { Gallery4Content };
export { DEFAULT_CONTENT as Gallery4DefaultContent };
export { Gallery4Schema }; 