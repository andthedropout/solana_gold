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
import { Wifi, Zap, Building, Star, Award, ShoppingBag, Heart, Shield, CheckCircle } from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'wifi', icon: Wifi, label: 'Wi-Fi' },
  { value: 'zap', icon: Zap, label: 'Lightning' },
  { value: 'building', icon: Building, label: 'Building' },
  { value: 'star', icon: Star, label: 'Star' },
  { value: 'award', icon: Award, label: 'Award' },
  { value: 'shopping-bag', icon: ShoppingBag, label: 'Shopping Bag' },
  { value: 'heart', icon: Heart, label: 'Heart' },
  { value: 'shield', icon: Shield, label: 'Shield' },
  { value: 'check-circle', icon: CheckCircle, label: 'Check Circle' }
];

const Hero9Schema = z.object({
  textContent: z.object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    trustText: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS),
    trustColor: z.enum(TEXT_COLOR_OPTIONS),
    badgeColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  icon: z.enum(['wifi', 'zap', 'building', 'star', 'award', 'shopping-bag', 'heart', 'shield', 'check-circle']),
  heroImage: z.object({
    url: z.string(),
    alt: z.string(),
    height: z.number().min(200).max(800).default(524)
  }),
  primaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero9Content = z.infer<typeof Hero9Schema>;

const DEFAULT_CONTENT: Hero9Content = {
  textContent: {
    badge: "Family Owned Since 1995",
    title: "Quality Service You Can Trust",
    description: "We're your local experts, providing reliable solutions with a personal touch. From initial consultation to final delivery, we're here to exceed your expectations.",
    trustText: "Serving 5,000+ Happy Customers in Our Community",
    titleColor: "foreground",
    descriptionColor: "muted-foreground",
    trustColor: "muted-foreground",
    badgeColor: "foreground"
  },
  icon: "building",
  heroImage: {
    url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
    alt: "Our work showcase",
    height: 524
  },
  primaryCta: {
    visible: true,
    text: "Get Started Today",
    url: "/contact",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Hero9Props {
  sectionId: string;
}

const Hero9: React.FC<Hero9Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero9-responsive-padding');

  const getIcon = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(option => option.value === iconName);
    const IconComponent = iconOption?.icon || Building;
    return <IconComponent className="size-6" />;
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`overflow-hidden ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="flex flex-col gap-5">
            <div className="relative flex flex-col gap-5">
              <div
                style={{
                  transform: "translate(-50%, -50%)",
                }}
                className="absolute top-1/2 left-1/2 -z-10 mx-auto size-[800px] rounded-full border p-16 [mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1300px] md:p-32"
              >
                <div className="size-full rounded-full border p-16 md:p-32">
                  <div className="size-full rounded-full border"></div>
                </div>
              </div>
              
              {(content.textContent?.badge || DEFAULT_CONTENT.textContent.badge).trim() && (
                <div className="mx-auto mb-4">
                  <div className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getTextColorClass(content.textContent?.badgeColor || "foreground")}`}>
                    {content.textContent?.badge || DEFAULT_CONTENT.textContent.badge}
                  </div>
                </div>
              )}
              
              <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
                {getIcon(content.icon || DEFAULT_CONTENT.icon)}
              </span>
              
              <h1 className={`mx-auto max-w-5xl text-center text-3xl font-medium text-balance md:text-6xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent?.title || DEFAULT_CONTENT.textContent.title}
              </h1>
              
              <p className={`mx-auto max-w-3xl text-center md:text-lg ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
              </p>
              
              <div className="flex flex-col items-center justify-center gap-3 pt-3 pb-12">
                {content.primaryCta.visible !== false && (
                  <ButtonWithIcon cta={content.primaryCta} />
                )}
                <div className={`text-xs ${getTextColorClass(content.textContent?.trustColor || "muted-foreground")}`}>
                  {content.textContent?.trustText || DEFAULT_CONTENT.textContent.trustText}
                </div>
              </div>
            </div>
            
            <img
              src={content.heroImage?.url || DEFAULT_CONTENT.heroImage.url}
              alt={content.heroImage?.alt || DEFAULT_CONTENT.heroImage.alt}
              className="mx-auto w-full max-w-5xl rounded-2xl object-cover"
              style={{ height: `${content.heroImage?.height || DEFAULT_CONTENT.heroImage.height}px` }}
            />
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero9;
export type { Hero9Content };
export { DEFAULT_CONTENT as Hero9DefaultContent };
export { Hero9Schema }; 