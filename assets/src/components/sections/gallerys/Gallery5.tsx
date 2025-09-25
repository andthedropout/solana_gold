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

const Gallery5Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  layout: z.object({
    cardsPerRow: z.number().min(1).max(6).default(3)
  }),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    caption: z.string().optional()
  })).min(1, "At least one image is required").max(12, "Maximum 12 images allowed"),
  sectionPadding: createResponsivePaddingSchema()
});

type Gallery5Content = z.infer<typeof Gallery5Schema>;

const DEFAULT_CONTENT: Gallery5Content = {
  textContent: {
    title: "Image Gallery",
    description: "A collection of our finest work",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  layout: {
    cardsPerRow: 3
  },
  images: [
    {
      url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      alt: "Gallery image 1",
      caption: "Beautiful landscape"
    },
    {
      url: "https://shadcnblocks.com/images/block/placeholder-2.svg", 
      alt: "Gallery image 2",
      caption: "Modern architecture"
    },
    {
      url: "https://shadcnblocks.com/images/block/placeholder-3.svg",
      alt: "Gallery image 3", 
      caption: "Urban design"
    },
    {
      url: "https://shadcnblocks.com/images/block/placeholder-4.svg",
      alt: "Gallery image 4",
      caption: "Natural beauty"
    },
    {
      url: "https://shadcnblocks.com/images/block/placeholder-5.svg",
      alt: "Gallery image 5",
      caption: "Creative concept"
    },
    {
      url: "https://shadcnblocks.com/images/block/placeholder-6.svg",
      alt: "Gallery image 6",
      caption: "Artistic vision"
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Gallery5Props {
  sectionId: string;
}

const Gallery5: React.FC<Gallery5Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'gallery5-responsive-padding');

  // Generate responsive grid classes based on cards per row
  const getGridClasses = () => {
    const { cardsPerRow } = content.layout;
    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    };
    return gridClasses[cardsPerRow as keyof typeof gridClasses] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            {content.textContent?.title && (
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            )}
            {content.textContent?.description && (
              <p className={`text-lg max-w-2xl mx-auto ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                {content.textContent.description}
              </p>
            )}
          </div>

          {/* Image Grid */}
          <div className={`grid gap-6 ${getGridClasses()}`}>
            {content.images?.map((image, index) => (
              <div key={index} className="group">
                <div className="relative overflow-hidden rounded-lg bg-muted aspect-square">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {image.caption && (
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Gallery5;
export type { Gallery5Content };
export { DEFAULT_CONTENT as Gallery5DefaultContent };
export { Gallery5Schema }; 