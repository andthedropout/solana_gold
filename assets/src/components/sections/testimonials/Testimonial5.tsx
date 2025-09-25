import React, { useState, useEffect } from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  createResponsivePaddingSchema, 
  DEFAULT_RESPONSIVE_PADDING, 
  generateResponsivePaddingCSS,
  normalizePadding,
  TEXT_COLOR_OPTIONS,
  getTextColorClass,
  SectionWrapper
} from '@/components/admin/section_settings';

const Testimonial5Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  testimonials: z.array(z.object({
    quote: z.string(),
    name: z.string(),
    title: z.string(),
    company: z.string().optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional()
  })).min(3).max(10),
  animation: z.object({
    autoPlay: z.boolean().default(true),
    autoPlaySpeed: z.number().min(3000).max(10000).default(5000),
    stackEffect: z.enum(['stack', 'spread', 'carousel', 'fan']).default('stack'),
    navigationOrientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
    dotSize: z.enum(['small', 'medium', 'large']).default('medium')
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type Testimonial5Content = z.infer<typeof Testimonial5Schema>;

const DEFAULT_CONTENT: Testimonial5Content = {
  textContent: {
    title: "What Our Clients Say",
    subtitle: "Hear from companies that transformed their business with our platform",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  testimonials: [
    {
      quote: "The platform completely transformed our workflow. We've seen a 40% increase in productivity and our team loves the intuitive interface.",
      name: "Sarah Chen",
      title: "VP of Engineering",
      company: "TechCorp Industries",
      image: {
        url: "",
        alt: "Sarah Chen"
      }
    },
    {
      quote: "Implementation was seamless and the ROI was evident within weeks. This is the solution we've been searching for.",
      name: "Michael Rodriguez",
      title: "Chief Technology Officer",
      company: "Innovation Labs",
      image: {
        url: "",
        alt: "Michael Rodriguez"
      }
    },
    {
      quote: "Outstanding support and continuous innovation. They truly understand our business needs and deliver beyond expectations.",
      name: "Emily Thompson",
      title: "Director of Operations",
      company: "Global Solutions Inc",
      image: {
        url: "",
        alt: "Emily Thompson"
      }
    },
    {
      quote: "The analytics dashboard alone is worth the investment. We make data-driven decisions faster than ever before.",
      name: "David Park",
      title: "CEO",
      company: "DataDrive Systems",
      image: {
        url: "",
        alt: "David Park"
      }
    },
    {
      quote: "Security and reliability are paramount for us, and this platform exceeds our strict requirements.",
      name: "Jennifer Liu",
      title: "Security Director",
      company: "SecureNet Corp",
      image: {
        url: "",
        alt: "Jennifer Liu"
      }
    }
  ],
  animation: {
    autoPlay: true,
    autoPlaySpeed: 5000,
    stackEffect: 'fan',
    navigationOrientation: 'horizontal',
    dotSize: 'medium'
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Testimonial5Props {
  sectionId: string;
}

const Testimonial5: React.FC<Testimonial5Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'testimonial5-responsive-padding');

  const testimonials = content.testimonials?.length ? content.testimonials : DEFAULT_CONTENT.testimonials;

  // Auto-play functionality
  useEffect(() => {
    if (content.animation?.autoPlay && !isHovered) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, content.animation?.autoPlaySpeed || 5000);
      
      return () => clearInterval(interval);
    }
  }, [content.animation?.autoPlay, content.animation?.autoPlaySpeed, isHovered, testimonials.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Get dot size classes based on setting
  const getDotSizeClasses = () => {
    const size = content.animation?.dotSize || 'medium';
    
    switch (size) {
      case 'small':
        return {
          base: 'w-2 h-2',
          active: content.animation?.navigationOrientation === 'vertical' ? 'h-6' : 'w-6',
          gap: 'gap-2'
        };
      case 'large':
        return {
          base: 'w-3.5 h-3.5',
          active: content.animation?.navigationOrientation === 'vertical' ? 'h-10' : 'w-10',
          gap: 'gap-4'
        };
      default: // medium
        return {
          base: 'w-2.5 h-2.5',
          active: content.animation?.navigationOrientation === 'vertical' ? 'h-8' : 'w-8',
          gap: 'gap-3'
        };
    }
  };

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const adjustedDiff = diff < 0 ? diff + testimonials.length : diff;
    
    if (content.animation?.stackEffect === 'stack') {
      // Stack effect - cards behind get smaller and offset
      return {
        scale: adjustedDiff === 0 ? 1 : 1 - (adjustedDiff * 0.05),
        y: adjustedDiff * 20,
        x: 0,
        opacity: adjustedDiff < 3 ? 1 - (adjustedDiff * 0.2) : 0,
        zIndex: testimonials.length - adjustedDiff,
        rotateY: 0
      };
    } else if (content.animation?.stackEffect === 'spread') {
      // Spread effect - cards fan out
      return {
        scale: adjustedDiff === 0 ? 1 : 0.9,
        y: adjustedDiff === 0 ? 0 : 30,
        x: adjustedDiff === 0 ? 0 : (adjustedDiff - 1.5) * 100,
        opacity: adjustedDiff < 4 ? 1 - (adjustedDiff * 0.2) : 0,
        zIndex: testimonials.length - adjustedDiff,
        rotateY: adjustedDiff === 0 ? 0 : (adjustedDiff - 1.5) * 5
      };
    } else if (content.animation?.stackEffect === 'fan') {
      // Fan effect - cards tilt and offset like a deck of cards
      const maxCards = Math.min(testimonials.length, 5); // Show max 5 cards in fan
      if (adjustedDiff >= maxCards) {
        return {
          scale: 0,
          y: 0,
          x: 0,
          opacity: 0,
          zIndex: 0,
          rotateZ: 0
        };
      }
      
      const rotationStep = 3; // Degrees of rotation per card
      const offsetStep = 8; // Pixels of offset per card
      const scaleStep = 0.02; // Scale reduction per card
      
      return {
        scale: 1 - (adjustedDiff * scaleStep),
        y: adjustedDiff * offsetStep,
        x: adjustedDiff * (offsetStep * 0.8),
        opacity: adjustedDiff === 0 ? 1 : 0.9 - (adjustedDiff * 0.15),
        zIndex: testimonials.length - adjustedDiff,
        rotateZ: adjustedDiff * rotationStep
      };
    } else {
      // Carousel effect - cards rotate in 3D
      const angle = (adjustedDiff / testimonials.length) * 360;
      return {
        scale: adjustedDiff === 0 ? 1 : 0.8,
        y: 0,
        x: 0,
        opacity: adjustedDiff === 0 ? 1 : adjustedDiff === 1 || adjustedDiff === testimonials.length - 1 ? 0.5 : 0,
        zIndex: adjustedDiff === 0 ? testimonials.length : testimonials.length - adjustedDiff,
        rotateY: angle > 180 ? angle - 360 : angle
      };
    }
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            {content.textContent?.title && (
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${getTextColorClass(content.textContent.titleColor)}`}>
                {content.textContent.title}
              </h2>
            )}
            {content.textContent?.subtitle && (
              <p className={`text-lg sm:text-xl ${getTextColorClass(content.textContent.subtitleColor)}`}>
                {content.textContent.subtitle}
              </p>
            )}
          </div>

          {/* Cards Stack */}
          <div 
            className="relative h-[400px] sm:h-[450px] lg:h-[500px] max-w-4xl mx-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
              <AnimatePresence mode="sync">
                {testimonials.map((testimonial, index) => {
                  const style = getCardStyle(index);
                  
                  return (
                    <motion.div
                      key={`${sectionId}-testimonial-${index}`}
                      className="absolute w-full max-w-2xl"
                      initial={false}
                      animate={style}
                      transition={{
                        duration: 0.5,
                        ease: [0.32, 0.72, 0, 1]
                      }}
                      style={{
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <div className={`bg-card rounded-2xl p-8 sm:p-10 lg:p-12 border backdrop-blur-sm ${
                        content.animation?.stackEffect === 'fan' && index !== currentIndex
                          ? 'shadow-lg border-border/30' 
                          : 'shadow-xl border-border/50'
                      }`}>
                        {/* Quote Icon */}
                        <Quote className="h-8 w-8 text-primary/20 mb-4" />
                        
                        {/* Quote Text */}
                        <blockquote className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground mb-8 leading-relaxed">
                          "{testimonial.quote}"
                        </blockquote>
                        
                        {/* Author Info */}
                        <div className="flex items-center gap-4">
                          {testimonial.image?.url && (
                            <img
                              src={testimonial.image.url}
                              alt={testimonial.image.alt}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                            />
                          )}
                          {!testimonial.image?.url && (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xl font-bold text-primary">
                                {testimonial.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">
                              {testimonial.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {testimonial.title}
                              {testimonial.company && ` at ${testimonial.company}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            {(() => {
              const dotSizes = getDotSizeClasses();
              
              return content.animation?.navigationOrientation === 'vertical' ? (
                /* Vertical orientation with centered buttons and dots below cards */
                <>
                  {/* Vertical dots on the right side */}
                  <div className={`absolute right-0 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 flex flex-col ${dotSizes.gap} z-10`}>
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`${dotSizes.base} rounded-full transition-all border border-foreground/50 ${
                          index === currentIndex 
                            ? `${dotSizes.active} bg-primary border-primary` 
                            : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Centered navigation buttons below cards */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrev}
                      className="rounded-full bg-background/80 backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      className="rounded-full bg-background/80 backdrop-blur-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                /* Horizontal navigation with buttons and dots */
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 sm:px-8">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrev}
                    className="rounded-full bg-background/80 backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Dots Indicator */}
                  <div className={`flex ${dotSizes.gap}`}>
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`${dotSizes.base} rounded-full transition-all border border-foreground/50 ${
                          index === currentIndex 
                            ? `${dotSizes.active} bg-primary border-primary` 
                            : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    className="rounded-full bg-background/80 backdrop-blur-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Testimonial5;
export type { Testimonial5Content };
export { DEFAULT_CONTENT as Testimonial5DefaultContent };
export { Testimonial5Schema };