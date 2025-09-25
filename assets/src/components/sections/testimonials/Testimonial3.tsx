import React, { useEffect, useState } from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';

const Testimonial3Schema = z.object({
  testimonials: z.array(z.object({
    id: z.string(),
    quote: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string(),
      avatar: z.object({
        url: z.string(),
        alt: z.string()
      })
    }),
    rating: z.number().min(1).max(5).default(5)
  })).min(1).max(10),
  textContent: z.object({
    quoteColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Testimonial3Content = z.infer<typeof Testimonial3Schema>;

const DEFAULT_CONTENT: Testimonial3Content = {
  testimonials: [
    {
      id: "testimonial-1",
      quote: "This solution has completely transformed how we operate. The attention to detail and customer service is unmatched in the industry.",
      author: {
        name: "Jennifer Martinez",
        role: "CEO, TechFlow Solutions",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-1.webp",
          alt: "Jennifer Martinez"
        }
      },
      rating: 5
    },
    {
      id: "testimonial-2", 
      quote: "Incredible results in just a few weeks. The team's expertise and dedication made all the difference for our project success.",
      author: {
        name: "Robert Kim",
        role: "Product Manager, InnovateLabs",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-2.webp",
          alt: "Robert Kim"
        }
      },
      rating: 5
    },
    {
      id: "testimonial-3",
      quote: "Outstanding quality and professionalism. I would recommend their services to anyone looking for exceptional results.",
      author: {
        name: "Lisa Thompson",
        role: "Director of Operations, GrowthCorp",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-3.webp",
          alt: "Lisa Thompson"
        }
      },
      rating: 5
    }
  ],
  textContent: {
    quoteColor: "foreground"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Testimonial3Props {
  sectionId: string;
}

const Testimonial3: React.FC<Testimonial3Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'testimonial3-responsive-padding');

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateCurrent = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", updateCurrent);
    return () => {
      api.off("select", updateCurrent);
    };
  }, [api]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index}
        className={`size-5 ${index < rating ? 'fill-primary stroke-none' : 'fill-muted stroke-muted-foreground'}`}
      />
    ));
  };

  const testimonials = content.testimonials || DEFAULT_CONTENT.testimonials;

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <Carousel setApi={setApi}>
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id}>
                <div className="container flex flex-col items-center text-center">
                  <p className={`mb-8 max-w-4xl font-medium md:px-8 lg:text-3xl ${getTextColorClass(content.textContent?.quoteColor || "foreground")}`}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <Avatar className="mb-2 size-12 md:size-24">
                    <AvatarImage 
                      src={testimonial.author?.avatar?.url} 
                      alt={testimonial.author?.avatar?.alt || testimonial.author?.name}
                    />
                    <AvatarFallback>
                      {testimonial.author?.name?.charAt(0) || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="mb-1 text-sm font-medium md:text-lg">
                    {testimonial.author?.name}
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground md:text-lg">
                    {testimonial.author?.role}
                  </p>
                  <div className="mt-2 flex items-center gap-0.5">
                    {renderStars(testimonial.rating || 5)}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Navigation Dots */}
        {testimonials.length > 1 && (
          <div className="container flex justify-center py-16">
            {testimonials.map((testimonial, index) => (
              <Button
                key={testimonial.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  api?.scrollTo(index);
                }}
              >
                <div
                  className={`size-2.5 rounded-full ${index === current ? "bg-primary" : "bg-input"}`}
                />
              </Button>
            ))}
          </div>
        )}
      </section>
    </SectionWrapper>
  );
};

export default Testimonial3;
export type { Testimonial3Content };
export { DEFAULT_CONTENT as Testimonial3DefaultContent };
export { Testimonial3Schema }; 