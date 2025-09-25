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
import { LayoutGrid } from '@/components/ui/layout-grid';

const GridItemSchema = z.object({
  title: z.string().default("New Gallery Item"),
  description: z.string().default("Brief description of this gallery item and its key features."),
  image: z.string().default("https://shadcnblocks.com/images/block/placeholder-1.svg"),
  size: z.enum(['small', 'medium', 'large']).default('medium')
});

const Gallery3Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  items: z.array(GridItemSchema).min(1, "At least one gallery item is required"),
  sectionPadding: createResponsivePaddingSchema()
});

type Gallery3Content = z.infer<typeof Gallery3Schema>;

const DEFAULT_CONTENT: Gallery3Content = {
  textContent: {
    title: "Interactive Gallery",
    description: "Explore our work through this interactive grid. Click on any item to see more details and get an immersive view of our projects.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  items: [
    {
      title: "Brand Identity Design",
      description: "Complete brand identity package including logo design, color palette, typography, and brand guidelines for a tech startup.",
      image: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      size: "large"
    },
    {
      title: "Mobile App Interface",
      description: "User interface design for a fitness tracking mobile application with intuitive navigation and beautiful visualizations.",
      image: "https://shadcnblocks.com/images/block/placeholder-2.svg",
      size: "medium"
    },
    {
      title: "E-commerce Website",
      description: "Modern e-commerce website design with advanced filtering, wishlist functionality, and seamless checkout experience.",
      image: "https://shadcnblocks.com/images/block/placeholder-3.svg",
      size: "small"
    },
    {
      title: "Dashboard Design",
      description: "Analytics dashboard with data visualization, real-time updates, and customizable widgets for business intelligence.",
      image: "https://shadcnblocks.com/images/block/placeholder-4.svg",
      size: "small"
    },
    {
      title: "Marketing Campaign",
      description: "Comprehensive marketing campaign including social media graphics, banner ads, and promotional materials.",
      image: "https://shadcnblocks.com/images/block/placeholder-5.svg",
      size: "medium"
    },
    {
      title: "Logo Collection",
      description: "Collection of logo designs for various industries showcasing versatility and creative approach to brand identity.",
      image: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      size: "small"
    },
    {
      title: "Web Development",
      description: "Custom web development solutions with modern technologies and responsive design principles.",
      image: "https://shadcnblocks.com/images/block/placeholder-2.svg",
      size: "medium"
    },
    {
      title: "UI/UX Design",
      description: "User experience design focusing on intuitive interfaces and seamless user journeys.",
      image: "https://shadcnblocks.com/images/block/placeholder-3.svg",
      size: "large"
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

const getSizeClassName = (size: string, index: number) => {
  // Distribute sizes more evenly to avoid clustering
  const baseClass = "col-span-1";
  
  switch (size) {
    case 'small':
      return `${baseClass} row-span-1`;
    case 'large':
      // Limit large items to prevent layout dominance
      return `${baseClass} md:col-span-2 row-span-2`;
    case 'medium':
    default:
      return `${baseClass} row-span-2`;
  }
};

interface Gallery3Props {
  sectionId: string;
}

const Gallery3: React.FC<Gallery3Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'gallery3-responsive-padding');

  const cards = content.items?.map((item, index) => ({
    id: index,
    content: (
      <div className="text-white">
        <h3 className="text-xl md:text-2xl font-bold mb-2">
          {item.title}
        </h3>
        <p className="text-sm md:text-base opacity-90">
          {item.description}
        </p>
      </div>
    ),
    className: getSizeClassName(item.size, index),
    thumbnail: item.image,
  })) || [];

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
          <div className="min-h-[600px]">
            <LayoutGrid cards={cards} />
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Gallery3;
export type { Gallery3Content };
export { DEFAULT_CONTENT as Gallery3DefaultContent };
export { Gallery3Schema }; 