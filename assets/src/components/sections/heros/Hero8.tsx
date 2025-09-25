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

const Hero8Schema = z.object({
  textContent: z.object({
    heading: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  socialProof: z.object({
    reviewCount: z.number(),
    rating: z.number(),
    reviewText: z.string()
  }),
  primaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero8Content = z.infer<typeof Hero8Schema>;

const DEFAULT_CONTENT: Hero8Content = {
  textContent: {
    heading: "Your Local Trusted Service Provider",
    description: "Providing quality service and exceptional customer care to our community for over 10 years. Join hundreds of satisfied customers who trust us with their needs.",
    textColor: "foreground"
  },
  socialProof: {
    reviewCount: 127,
    rating: 4.9,
    reviewText: "from happy customers"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  primaryCta: {
    visible: true,
    text: "Get Your Free Quote",
    url: "/contact",
    variant: "default",
    size: "lg",
    icon: "phone",
    iconPosition: "left"
  }
};

interface Hero8Props {
  sectionId: string;
}

const Hero8: React.FC<Hero8Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero8-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`py-32 ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container text-center">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <h1 className={`text-3xl font-extrabold lg:text-6xl ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
              {content.textContent?.heading || "Your Local Trusted Service Provider"}
            </h1>
            
            <p className={`text-balance lg:text-lg ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80`}>
              {content.textContent?.description || "Providing quality service and exceptional customer care to our community."}
            </p>
          </div>
          
          {(content.primaryCta.visible !== false) && (
            <div className="mt-10">
              <ButtonWithIcon cta={{
                ...content.primaryCta,
                size: "lg"
              }} />
            </div>
          )}
          
          <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-4 sm:flex-row">
            <span className="mx-4 inline-flex items-center -space-x-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <Avatar key={num} className="size-14 border">
                  <AvatarImage 
                    src={`https://www.shadcnblocks.com/images/block/avatar-${num}.webp`} 
                    alt={`Customer ${num}`} 
                  />
                </Avatar>
              ))}
            </span>
            
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`size-5 ${
                      index < Math.floor(Number(content.socialProof?.rating || 5)) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
                <span className="ml-1 font-semibold">
                  {Number(content.socialProof?.rating || 4.9).toFixed(1)}
                </span>
              </div>
              
              <p className="text-left font-medium text-muted-foreground">
                from {content.socialProof?.reviewCount || 127}+ {content.socialProof?.reviewText || "happy customers"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero8;
export type { Hero8Content };
export { DEFAULT_CONTENT as Hero8DefaultContent };
export { Hero8Schema }; 