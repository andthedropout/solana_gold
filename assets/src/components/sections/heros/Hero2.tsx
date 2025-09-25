import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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

const Hero2Schema = z.object({
  textContent: z.object({
    mainHeadline: z.string(),
    animatedWords: z.array(z.string()).min(1, "At least one animated word is required"),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  topButton: createButtonSchema(),
  primaryCta: createButtonSchema(),
  secondaryCta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Hero2Content = z.infer<typeof Hero2Schema>;

const DEFAULT_CONTENT: Hero2Content = {
  textContent: {
    mainHeadline: "This is something",
    animatedWords: ["amazing", "new", "wonderful", "beautiful", "smart"],
    description: "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
    textColor: "foreground"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING,
  topButton: {
    visible: true,
    text: "Read our launch article",
    url: "/blog",
    variant: "secondary",
    size: "sm",
    icon: "arrow-right",
    iconPosition: "right"
  },
  primaryCta: {
    visible: true,
    text: "Sign up here",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  secondaryCta: {
    visible: true,
    text: "Jump on a call", 
    url: "/contact",
    variant: "outline",
    size: "lg",
    icon: "phone",
    iconPosition: "right"
  },
};

interface Hero2Props {
  sectionId: string;
}

const Hero2: React.FC<Hero2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const [titleNumber, setTitleNumber] = useState(0);
  
  // Handle animatedWords - could be array or comma-separated string
  const getAnimatedWords = () => {
    const words = content.textContent?.animatedWords;
    if (Array.isArray(words)) {
      return words;
    }
    if (typeof words === 'string' && words.trim()) {
      return words.split(',').map(word => word.trim()).filter(word => word.length > 0);
    }
    return DEFAULT_CONTENT.textContent.animatedWords;
  };
  
  const animatedWords = getAnimatedWords();
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === animatedWords.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, animatedWords]);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'hero2-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto">
          <div className="flex gap-8 items-center justify-center flex-col">
            
            {/* Top Button */}
            {(content.topButton.visible !== false) && (
              <div>
                <ButtonWithIcon cta={content.topButton} />
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex gap-4 flex-col">
              <h1 className={`text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                <span>{content.textContent?.mainHeadline || DEFAULT_CONTENT.textContent.mainHeadline}</span>
                <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                  &nbsp;
                  {animatedWords.map((word, index) => (
                    <motion.span
                      key={index}
                      className="absolute font-semibold"
                      initial={{ opacity: 0, y: "-100" }}
                      transition={{ type: "spring", stiffness: 50 }}
                      animate={
                        titleNumber === index
                          ? {
                              y: 0,
                              opacity: 1,
                            }
                          : {
                              y: titleNumber > index ? -150 : 150,
                              opacity: 0,
                            }
                      }
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              </h1>

              <p className={`text-lg md:text-xl leading-relaxed tracking-tight max-w-2xl text-center opacity-80 break-words ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent?.description || DEFAULT_CONTENT.textContent.description}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {(content.secondaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.secondaryCta} />
              )}
              {(content.primaryCta.visible !== false) && (
                <ButtonWithIcon cta={content.primaryCta} />
              )}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Hero2;
export type { Hero2Content };
export { DEFAULT_CONTENT as Hero2DefaultContent };
export { Hero2Schema }; 