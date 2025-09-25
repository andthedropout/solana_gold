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

const Simple1Schema = z.object({
  textContent: z.object({
    text: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS),
    textSize: z.enum(['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl']).default('text-lg'),
    textWeight: z.enum(['font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold']).default('font-normal'),
    textAlign: z.enum(['text-left', 'text-center', 'text-right']).default('text-center')
  }),
  display: z.object({
    minHeight: z.number().min(0).max(800).default(100),
    verticalPadding: z.number().min(0).max(200).default(40)
  }),
  cta: createButtonSchema().optional(),
  sectionPadding: createResponsivePaddingSchema()
});

type Simple1Content = z.infer<typeof Simple1Schema>;

const DEFAULT_CONTENT: Simple1Content = {
  textContent: {
    text: "This is a simple text section",
    textColor: "foreground",
    textSize: "text-lg",
    textWeight: "font-normal",
    textAlign: "text-center"
  },
  display: {
    minHeight: 100,
    verticalPadding: 40
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Simple1Props {
  sectionId: string;
}

const Simple1: React.FC<Simple1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'simple1-responsive-padding');

  // Define class mappings to ensure Tailwind includes them in the build
  const sizeClasses = {
    'text-xs': 'text-xs',
    'text-sm': 'text-sm',
    'text-base': 'text-base',
    'text-lg': 'text-lg',
    'text-xl': 'text-xl',
    'text-2xl': 'text-2xl',
    'text-3xl': 'text-3xl',
    'text-4xl': 'text-4xl',
    'text-5xl': 'text-5xl',
    'text-6xl': 'text-6xl'
  };
  
  const weightClasses = {
    'font-light': 'font-light',
    'font-normal': 'font-normal',
    'font-medium': 'font-medium',
    'font-semibold': 'font-semibold',
    'font-bold': 'font-bold',
    'font-extrabold': 'font-extrabold'
  };
  
  const alignClasses = {
    'text-left': 'text-left',
    'text-center': 'text-center',
    'text-right': 'text-right'
  };

  // Get the safe classes from the mappings
  const textSizeClass = sizeClasses[content.textContent.textSize as keyof typeof sizeClasses] || 'text-lg';
  const textWeightClass = weightClasses[content.textContent.textWeight as keyof typeof weightClasses] || 'font-normal';
  const textAlignClass = alignClasses[content.textContent.textAlign as keyof typeof alignClasses] || 'text-center';

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div 
          className="w-full flex items-center justify-center"
          style={{
            minHeight: `${content.display.minHeight}px`,
            paddingTop: `${content.display.verticalPadding}px`,
            paddingBottom: `${content.display.verticalPadding}px`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10 w-full">
            {content.textContent.text && (
              <p className={`${textSizeClass} ${textWeightClass} ${textAlignClass} ${getTextColorClass(content.textContent.textColor)} ${content.cta ? 'mb-6' : ''}`}>
                {content.textContent.text}
              </p>
            )}
            {content.cta && (
              <div className="flex justify-center mt-6">
                <ButtonWithIcon cta={content.cta} />
              </div>
            )}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Simple1;
export type { Simple1Content };
export { DEFAULT_CONTENT as Simple1DefaultContent };
export { Simple1Schema };