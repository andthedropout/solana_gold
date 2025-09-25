import React, { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const GalleryItemSchema = z.object({
  title: z.string().default("New Project"),
  summary: z.string().default("Brief description of your project and its key features."),
  url: z.string().default("/projects/new-project"),
  image: z.string().default("https://shadcnblocks.com/images/block/placeholder-1.svg")
});

const Gallery1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  demoLink: z.object({
    showDemo: z.boolean().default(true),
    demoText: z.string().default("Book a demo"),
    demoUrl: z.string().default("#")
  }),
  items: z.array(GalleryItemSchema).min(1, "At least one gallery item is required"),
  navigation: z.object({
    showNavigation: z.boolean().default(true)
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Gallery1Content = z.infer<typeof Gallery1Schema>;

const DEFAULT_CONTENT: Gallery1Content = {
  textContent: {
    title: "Our Portfolio",
    textColor: "foreground"
  },
  demoLink: {
    showDemo: true,
    demoText: "View all projects",
    demoUrl: "/portfolio"
  },
  items: [
    {
      title: "E-commerce Platform",
      summary: "Complete online shopping solution with advanced payment processing and inventory management.",
      url: "/projects/ecommerce",
      image: "https://shadcnblocks.com/images/block/placeholder-1.svg"
    },
    {
      title: "Mobile Banking App",
      summary: "Secure and user-friendly banking application with biometric authentication and real-time transactions.",
      url: "/projects/banking",
      image: "https://shadcnblocks.com/images/block/placeholder-2.svg"
    },
    {
      title: "Healthcare Management System",
      summary: "Comprehensive medical records platform with appointment scheduling and telemedicine capabilities.",
      url: "/projects/healthcare",
      image: "https://shadcnblocks.com/images/block/placeholder-3.svg"
    },
    {
      title: "Learning Management Platform",
      summary: "Interactive educational platform with video conferencing, assignments, and progress tracking.",
      url: "/projects/education",
      image: "https://shadcnblocks.com/images/block/placeholder-4.svg"
    },
    {
      title: "Real Estate Portal",
      summary: "Advanced property search platform with virtual tours and mortgage calculation tools.",
      url: "/projects/realestate",
      image: "https://shadcnblocks.com/images/block/placeholder-5.svg"
    }
  ],
  navigation: {
    showNavigation: true
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Gallery1Props {
  sectionId: string;
}

const Gallery1: React.FC<Gallery1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'gallery1-responsive-padding');

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
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
          <div className="mb-8 flex flex-col justify-between md:mb-14 md:flex-row md:items-end lg:mb-16">
            <div>
              {content.textContent?.title && (
                <h2 className={`mb-3 text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                  {content.textContent.title}
                </h2>
              )}
              {content.demoLink?.showDemo && content.demoLink?.demoText && content.demoLink?.demoUrl && (
                <a
                  href={content.demoLink.demoUrl}
                  className="group flex items-center gap-1 text-sm font-medium md:text-base lg:text-lg"
                >
                  {content.demoLink.demoText}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
              )}
            </div>
            {content.navigation?.showNavigation && (
              <div className="mt-8 flex shrink-0 items-center justify-start gap-2">
                <Button
                  size="icon"
                  variant="outline"
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
                  variant="outline"
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
            className="relative left-[-1rem]"
          >
            <CarouselContent className="-mr-4 ml-8 2xl:mr-[max(0rem,calc(50vw-700px-1rem))] 2xl:ml-[max(8rem,calc(50vw-700px+1rem))]">
              {content.items?.map((item, index) => (
                <CarouselItem key={index} className="pl-4 md:max-w-[452px]">
                  <a
                    href={item.url}
                    className="group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex aspect-3/2 overflow-clip rounded-xl">
                        <div className="flex-1">
                          <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 line-clamp-3 pt-4 text-lg font-medium break-words md:mb-3 md:pt-4 md:text-xl lg:pt-4 lg:text-2xl">
                      {item.title}
                    </div>
                    <div className="mb-8 line-clamp-2 text-sm text-muted-foreground md:mb-12 md:text-base lg:mb-9">
                      {item.summary}
                    </div>
                    <div className="flex items-center text-sm">
                      Read more{" "}
                      <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Gallery1;
export type { Gallery1Content };
export { DEFAULT_CONTENT as Gallery1DefaultContent };
export { Gallery1Schema }; 