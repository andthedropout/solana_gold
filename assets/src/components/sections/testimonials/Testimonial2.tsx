import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';

const Testimonial2Schema = z.object({
  featuredTestimonial: z.object({
    quote: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string()
    }),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    quoteColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  testimonials: z.array(z.object({
    quote: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string(),
      avatar: z.object({
        url: z.string(),
        alt: z.string()
      })
    })
  })).max(6),
  sectionPadding: createResponsivePaddingSchema()
});

type Testimonial2Content = z.infer<typeof Testimonial2Schema>;

const DEFAULT_CONTENT: Testimonial2Content = {
  featuredTestimonial: {
    quote: "Working with this team has been absolutely transformational for our business. Their innovative approach and attention to detail exceeded all our expectations.",
    author: {
      name: "Michael Chen",
      role: "CTO, InnovateCorp"
    },
    image: {
      url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
      alt: "Team collaboration"
    },
    quoteColor: "foreground"
  },
  testimonials: [
    {
      quote: "The results speak for themselves. Our productivity increased by 40% within the first month of implementation.",
      author: {
        name: "Sarah Williams",
        role: "Operations Manager",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-1.webp",
          alt: "Sarah Williams"
        }
      }
    },
    {
      quote: "Outstanding support and service. The team was always available to help us navigate any challenges.",
      author: {
        name: "David Rodriguez",
        role: "Project Director",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-1.webp",
          alt: "David Rodriguez"
        }
      }
    },
    {
      quote: "A game-changer for our workflow. The intuitive design made adoption seamless across our entire organization.",
      author: {
        name: "Emily Foster",
        role: "Team Lead",
        avatar: {
          url: "https://shadcnblocks.com/images/block/avatar-1.webp",
          alt: "Emily Foster"
        }
      }
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Testimonial2Props {
  sectionId: string;
}

const Testimonial2: React.FC<Testimonial2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'testimonial2-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="flex flex-col gap-6">
            {/* Featured Testimonial */}
            <div className="grid grid-cols-1 items-stretch gap-x-0 gap-y-4 lg:grid-cols-3 lg:gap-4">
              <img
                src={content.featuredTestimonial?.image?.url || DEFAULT_CONTENT.featuredTestimonial.image.url}
                alt={content.featuredTestimonial?.image?.alt || DEFAULT_CONTENT.featuredTestimonial.image.alt}
                className="h-72 w-full rounded-md object-cover lg:h-auto"
              />
              <Card className="col-span-2 flex items-center justify-center p-6">
                <div className="flex flex-col gap-4">
                  <q className={`text-xl font-medium lg:text-3xl ${getTextColorClass(content.featuredTestimonial?.quoteColor || "foreground")}`}>
                    {content.featuredTestimonial?.quote || DEFAULT_CONTENT.featuredTestimonial.quote}
                  </q>
                  <div className="flex flex-col items-start">
                    <p className="font-medium">
                      {content.featuredTestimonial?.author?.name || DEFAULT_CONTENT.featuredTestimonial.author.name}
                    </p>
                    <p className="text-muted-foreground">
                      {content.featuredTestimonial?.author?.role || DEFAULT_CONTENT.featuredTestimonial.author.role}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {(content.testimonials || DEFAULT_CONTENT.testimonials).map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="px-6 pt-6 leading-7 text-foreground/70">
                    <q>{testimonial.quote}</q>
                  </CardContent>
                  <CardFooter>
                    <div className="flex gap-4 leading-5">
                      <Avatar className="size-9 rounded-full ring-1 ring-input">
                        <AvatarImage
                          src={testimonial.author?.avatar?.url}
                          alt={testimonial.author?.avatar?.alt || testimonial.author?.name}
                        />
                        <AvatarFallback>
                          {testimonial.author?.name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">{testimonial.author?.name}</p>
                        <p className="text-muted-foreground">{testimonial.author?.role}</p>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Testimonial2;
export type { Testimonial2Content };
export { DEFAULT_CONTENT as Testimonial2DefaultContent };
export { Testimonial2Schema }; 