import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';

const Testimonial4Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  testimonials: z.array(z.object({
    quote: z.string(),
    name: z.string(),
    title: z.string()
  })).min(3).max(10),
  animation: z.object({
    speed: z.enum(['fast', 'normal', 'slow']).default('normal'),
    pauseOnHover: z.boolean().default(true)
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Testimonial4Content = z.infer<typeof Testimonial4Schema>;

const DEFAULT_CONTENT: Testimonial4Content = {
  textContent: {
    title: "Trusted by Thousands",
    subtitle: "See what our customers are saying about their experience",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  testimonials: [
    {
      quote: "This platform has revolutionized how we handle our business operations. The seamless integration and intuitive design make it a pleasure to use daily.",
      name: "Alexandra Chen",
      title: "Director of Operations, TechForward"
    },
    {
      quote: "Outstanding customer service and innovative features. Our team productivity has increased dramatically since implementation.",
      name: "Marcus Rodriguez",
      title: "CTO, InnovateNow"
    },
    {
      quote: "The attention to detail and user experience is exceptional. It's rare to find a solution that delivers on all its promises.",
      name: "Sarah Mitchell",
      title: "Project Manager, CreativeWorks"
    },
    {
      quote: "From onboarding to daily use, everything is thoughtfully designed. Our clients love the improved efficiency and results.",
      name: "David Park",
      title: "Founder, GrowthLab"
    },
    {
      quote: "Incredible value and performance. The ROI was evident within the first month of using this solution.",
      name: "Emma Thompson",
      title: "VP Marketing, ScaleUp"
    },
    {
      quote: "The most reliable and feature-rich platform we've used. It has become an essential part of our workflow.",
      name: "James Wilson",
      title: "Lead Developer, CodeCraft"
    }
  ],
  animation: {
    speed: 'normal',
    pauseOnHover: true
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Testimonial4Props {
  sectionId: string;
}

const Testimonial4: React.FC<Testimonial4Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'testimonial4-responsive-padding');

  const testimonials = content.testimonials?.length ? content.testimonials : DEFAULT_CONTENT.testimonials;

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4">
          {/* Header */}
          {(content.textContent?.title || content.textContent?.subtitle) && (
            <div className="text-center mb-16">
              {content.textContent?.title && (
                <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                  {content.textContent.title}
                </h2>
              )}
              {content.textContent?.subtitle && (
                <p className={`text-xl ${getTextColorClass(content.textContent?.subtitleColor || "muted-foreground")} max-w-3xl mx-auto`}>
                  {content.textContent.subtitle}
                </p>
              )}
            </div>
          )}

          {/* Infinite Moving Cards */}
          <div className="relative">
            <InfiniteMovingCards
              items={testimonials}
              direction="left"
              speed={content.animation?.speed || 'normal'}
              pauseOnHover={content.animation?.pauseOnHover !== false}
              className="py-8"
            />
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Testimonial4;
export type { Testimonial4Content };
export { DEFAULT_CONTENT as Testimonial4DefaultContent };
export { Testimonial4Schema }; 