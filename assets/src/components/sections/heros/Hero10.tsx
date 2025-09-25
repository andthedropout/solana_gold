import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Star } from "lucide-react";
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
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const Hero10Schema = z.object({
  textContent: z.object({
    heading: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  layout: z.object({
    imagePosition: z.enum(['left', 'right'])
  }),
  heroImage: z.object({
    url: z.string(),
    alt: z.string()
  }),
  reviews: z.object({
    visible: z.boolean().optional(),
    count: z.number(),
    rating: z.number(),
    avatar1: z.object({
      url: z.string(),
      alt: z.string()
    }),
    avatar2: z.object({
      url: z.string(),
      alt: z.string()
    }),
    avatar3: z.object({
      url: z.string(),
      alt: z.string()
    }),
    avatar4: z.object({
      url: z.string(),
      alt: z.string()
    }),
    avatar5: z.object({
      url: z.string(),
      alt: z.string()
    })
  }),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero10Content = z.infer<typeof Hero10Schema>;

const DEFAULT_CONTENT: Hero10Content = {
  textContent: {
    heading: "Experience Excellence Every Time",
    description: "Join thousands of satisfied customers who trust us for quality service, exceptional results, and outstanding customer care. Your satisfaction is our guarantee.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  layout: {
    imagePosition: "right"
  },
  heroImage: {
    url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
    alt: "Happy customers"
  },
  reviews: {
    visible: true,
    count: 500,
    rating: 4.9,
    avatar1: {
      url: "https://www.shadcnblocks.com/images/block/avatar-1.webp",
      alt: "Customer 1"
    },
    avatar2: {
      url: "https://www.shadcnblocks.com/images/block/avatar-2.webp",
      alt: "Customer 2"
    },
    avatar3: {
      url: "https://www.shadcnblocks.com/images/block/avatar-3.webp",
      alt: "Customer 3"
    },
    avatar4: {
      url: "https://www.shadcnblocks.com/images/block/avatar-4.webp",
      alt: "Customer 4"
    },
    avatar5: {
      url: "https://www.shadcnblocks.com/images/block/avatar-5.webp",
      alt: "Customer 5"
    }
  },
  primaryCta: {
    visible: true,
    text: "Book Now",
    url: "/book",
    variant: "default",
    size: "default",
    icon: "",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "View Our Work",
    url: "/portfolio",
    variant: "outline",
    size: "default",
    icon: "arrow-down-right",
    iconPosition: "right"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Hero10Props {
  sectionId: string;
}

const Hero10: React.FC<Hero10Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero10-responsive-padding');

  const imagePosition = content.layout?.imagePosition || DEFAULT_CONTENT.layout.imagePosition;
  const imageOnRight = imagePosition === 'right';

  const avatars = [
    { 
      src: content.reviews?.avatar1?.url || DEFAULT_CONTENT.reviews.avatar1.url, 
      alt: content.reviews?.avatar1?.alt || DEFAULT_CONTENT.reviews.avatar1.alt 
    },
    { 
      src: content.reviews?.avatar2?.url || DEFAULT_CONTENT.reviews.avatar2.url, 
      alt: content.reviews?.avatar2?.alt || DEFAULT_CONTENT.reviews.avatar2.alt 
    },
    { 
      src: content.reviews?.avatar3?.url || DEFAULT_CONTENT.reviews.avatar3.url, 
      alt: content.reviews?.avatar3?.alt || DEFAULT_CONTENT.reviews.avatar3.alt 
    },
    { 
      src: content.reviews?.avatar4?.url || DEFAULT_CONTENT.reviews.avatar4.url, 
      alt: content.reviews?.avatar4?.alt || DEFAULT_CONTENT.reviews.avatar4.alt 
    },
    { 
      src: content.reviews?.avatar5?.url || DEFAULT_CONTENT.reviews.avatar5.url, 
      alt: content.reviews?.avatar5?.alt || DEFAULT_CONTENT.reviews.avatar5.alt 
    }
  ];

  const rating = content.reviews?.rating || DEFAULT_CONTENT.reviews.rating;
  const reviewCount = content.reviews?.count || DEFAULT_CONTENT.reviews.count;

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className={`mx-auto flex flex-col items-center text-center md:ml-auto lg:max-w-3xl lg:items-start lg:text-left ${imageOnRight ? 'lg:order-1' : 'lg:order-2'}`}>
            <h1 className={`my-6 text-4xl font-bold text-pretty lg:text-6xl xl:text-7xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
              {content.textContent?.heading || DEFAULT_CONTENT.textContent.heading}
            </h1>
            
            <p className={`mb-8 max-w-xl lg:text-xl ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
              {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
            </p>
            
            {(content.reviews?.visible !== false) && (
              <div className="mb-12 flex w-fit flex-col items-center gap-4 sm:flex-row">
                <span className="inline-flex items-center -space-x-4">
                  {avatars.map((avatar, index) => (
                    <Avatar key={index} className="size-12 border">
                      <AvatarImage src={avatar.src} alt={avatar.alt} />
                    </Avatar>
                  ))}
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className="size-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                    <span className="mr-1 font-semibold">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-left font-medium text-muted-foreground">
                    from {reviewCount}+ reviews
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
              {content.primaryCta.visible !== false && (
                <ButtonWithIcon cta={{
                  ...content.primaryCta,
                  className: "w-full sm:w-auto"
                }} />
              )}
              {content.secondaryCta.visible !== false && (
                <ButtonWithIcon cta={{
                  ...content.secondaryCta,
                  variant: "outline"
                }} />
              )}
            </div>
          </div>
          
          <div className={`flex ${imageOnRight ? 'lg:order-2' : 'lg:order-1'}`}>
            <img
              src={content.heroImage?.url || DEFAULT_CONTENT.heroImage.url}
              alt={content.heroImage?.alt || DEFAULT_CONTENT.heroImage.alt}
              className="max-h-[600px] w-full rounded-md object-cover lg:max-h-[800px]"
            />
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero10;
export type { Hero10Content };
export { DEFAULT_CONTENT as Hero10DefaultContent };
export { Hero10Schema }; 