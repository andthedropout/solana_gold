import React, { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const CaseStudyItemSchema = z.object({
  title: z.string().default("New Case Study"),
  description: z.string().default("Brief description of this case study and its key insights."),
  url: z.string().default("/case-studies/new-study"),
  image: z.string().default("https://shadcnblocks.com/images/block/placeholder-1.svg")
});

const Gallery2Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    descriptionColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  items: z.array(CaseStudyItemSchema).min(1, "At least one case study is required"),
  navigation: z.object({
    showNavigation: z.boolean().default(true),
    showPagination: z.boolean().default(true)
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Gallery2Content = z.infer<typeof Gallery2Schema>;

const DEFAULT_CONTENT: Gallery2Content = {
  textContent: {
    title: "Case Studies",
    description: "Discover how leading companies and clients leverage our solutions to build exceptional digital experiences. These case studies showcase real-world applications and success stories.",
    titleColor: "foreground",
    descriptionColor: "muted-foreground"
  },
  items: [
    {
      title: "E-commerce Transformation: 300% Revenue Growth",
      description: "How we helped a retail client modernize their online presence and achieve unprecedented growth through strategic design and technology implementation.",
      url: "/case-studies/ecommerce-transformation",
      image: "https://shadcnblocks.com/images/block/placeholder-1.svg"
    },
    {
      title: "Healthcare Platform: Streamlining Patient Care",
      description: "Building a comprehensive healthcare management system that improved patient outcomes and reduced administrative overhead by 60%.",
      url: "/case-studies/healthcare-platform",
      image: "https://shadcnblocks.com/images/block/placeholder-2.svg"
    },
    {
      title: "FinTech Innovation: Mobile Banking Revolution",
      description: "Creating a secure, user-friendly mobile banking application that serves over 1 million users with biometric authentication and real-time transactions.",
      url: "/case-studies/fintech-innovation",
      image: "https://shadcnblocks.com/images/block/placeholder-3.svg"
    },
    {
      title: "Education Platform: Learning Reimagined",
      description: "Developing an interactive educational platform that connects students and teachers through video conferencing, assignments, and progress tracking.",
      url: "/case-studies/education-platform",
      image: "https://shadcnblocks.com/images/block/placeholder-4.svg"
    },
    {
      title: "Real Estate Portal: Property Search Redefined",
      description: "Building an advanced property search platform with virtual tours, mortgage calculations, and AI-powered recommendations.",
      url: "/case-studies/real-estate-portal",
      image: "https://shadcnblocks.com/images/block/placeholder-5.svg"
    }
  ],
  navigation: {
    showNavigation: true,
    showPagination: true
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Gallery2Props {
  sectionId: string;
}

const Gallery2: React.FC<Gallery2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'gallery2-responsive-padding');

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
            <div className="flex flex-col gap-4">
              {content.textContent?.title && (
                <h2 className={`text-3xl font-medium md:text-4xl lg:text-5xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                  {content.textContent.title}
                </h2>
              )}
              {content.textContent?.description && (
                <p className={`max-w-lg ${getTextColorClass(content.textContent?.descriptionColor || "muted-foreground")}`}>
                  {content.textContent.description}
                </p>
              )}
            </div>
            {content.navigation?.showNavigation && (
              <div className="hidden shrink-0 gap-2 md:flex">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    carouselApi?.scrollPrev();
                  }}
                  disabled={!canScrollPrev}
                  className="disabled:pointer-events-auto"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    carouselApi?.scrollNext();
                  }}
                  disabled={!canScrollNext}
                  className="disabled:pointer-events-auto"
                >
                  <ArrowRight className="size-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="w-full">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              breakpoints: {
                "(max-width: 768px)": {
                  dragFree: true,
                },
              },
            }}
          >
            <CarouselContent className="ml-0 2xl:mr-[max(0rem,calc(50vw-700px))] 2xl:ml-[max(8rem,calc(50vw-700px))]">
              {content.items?.map((item, index) => (
                <CarouselItem
                  key={index}
                  className="max-w-[320px] pl-[20px] lg:max-w-[360px]"
                >
                  <a href={item.url} className="group rounded-xl">
                    <div className="group relative h-full min-h-[27rem] max-w-full overflow-hidden rounded-xl md:aspect-5/4 lg:aspect-16/9">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 h-full bg-[linear-gradient(transparent_20%,var(--primary)_100%)] mix-blend-multiply" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-primary-foreground md:p-8">
                        <div className="mb-2 pt-4 text-xl font-semibold md:mb-3 md:pt-4 lg:pt-4">
                          {item.title}
                        </div>
                        <div className="mb-8 line-clamp-2 md:mb-12 lg:mb-9">
                          {item.description}
                        </div>
                        <div className="flex items-center text-sm">
                          Read more{" "}
                          <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          {content.navigation?.showPagination && (
            <div className="mt-8 flex justify-center gap-2">
              {content.items?.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentSlide === index ? "bg-primary" : "bg-primary/20"
                  }`}
                  onClick={() => carouselApi?.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Gallery2;
export type { Gallery2Content };
export { DEFAULT_CONTENT as Gallery2DefaultContent };
export { Gallery2Schema }; 