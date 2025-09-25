import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';

const Testimonial1Schema = z.object({
  textContent: z.object({
    quote: z.string(),
    quoteColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  author: z.object({
    name: z.string(),
    role: z.string(),
    avatar: z.object({
      url: z.string(),
      alt: z.string()
    })
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Testimonial1Content = z.infer<typeof Testimonial1Schema>;

const DEFAULT_CONTENT: Testimonial1Content = {
  textContent: {
    quote: "This platform has completely transformed how we work. The intuitive design and powerful features have saved us countless hours and improved our productivity dramatically.",
    quoteColor: "foreground"
  },
  author: {
    name: "Sarah Johnson",
    role: "CEO, TechCorp",
    avatar: {
      url: "https://www.shadcnblocks.com/images/block/avatar-1.webp",
      alt: "Sarah Johnson"
    }
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Testimonial1Props {
  sectionId: string;
}

const Testimonial1: React.FC<Testimonial1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'testimonial1-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="flex flex-col items-center text-center">
            {content.textContent?.quote && (
              <p className={`mb-16 max-w-4xl px-8 font-medium lg:text-3xl ${getTextColorClass(content.textContent?.quoteColor || "foreground")}`}>
                &ldquo;{content.textContent.quote}&rdquo;
              </p>
            )}
            
            <div className="flex items-center gap-2 md:gap-4">
              <Avatar className="size-12 md:size-16">
                <AvatarImage 
                  src={content.author?.avatar?.url || DEFAULT_CONTENT.author.avatar.url} 
                  alt={content.author?.avatar?.alt || DEFAULT_CONTENT.author.avatar.alt} 
                />
                <AvatarFallback>
                  {(content.author?.name || DEFAULT_CONTENT.author.name).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium md:text-base">
                  {content.author?.name || DEFAULT_CONTENT.author.name}
                </p>
                <p className="text-sm text-muted-foreground md:text-base">
                  {content.author?.role || DEFAULT_CONTENT.author.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Testimonial1;
export type { Testimonial1Content };
export { DEFAULT_CONTENT as Testimonial1DefaultContent };
export { Testimonial1Schema }; 