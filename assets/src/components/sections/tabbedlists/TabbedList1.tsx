import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

const TagSchema = z.object({
  label: z.string(),
  url: z.string().optional()
});

const TabSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  tags: z.array(TagSchema)
});

const TabbedList1Schema = z.object({
  textContent: z.object({
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  tabs: z.array(TabSchema).min(1).max(5),
  styling: z.object({
    tabAlignment: z.enum(['left', 'center', 'right']).default('center'),
    tagSpacing: z.enum(['compact', 'normal', 'loose']).default('normal'),
    tagSize: z.enum(['small', 'medium', 'large']).default('medium'),
    tagAreaWidth: z.enum(['narrow', 'medium', 'wide', 'full']).default('medium')
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type TabbedList1Content = z.infer<typeof TabbedList1Schema>;

const DEFAULT_CONTENT: TabbedList1Content = {
  textContent: {
    textColor: "foreground"
  },
  tabs: [
    {
      name: "Enterprise Platforms",
      url: "#enterprise",
      tags: [
        { label: "Acumatica", url: "#acumatica" },
        { label: "AWS", url: "#aws" },
        { label: "Barracuda", url: "#barracuda" },
        { label: "Boomi", url: "#boomi" },
        { label: "Cisco", url: "#cisco" },
        { label: "Cognizant", url: "#cognizant" },
        { label: "Dynamics 365", url: "#dynamics" },
        { label: "Epic", url: "#epic" },
        { label: "Epicore", url: "#epicore" },
        { label: "Intel", url: "#intel" },
        { label: "Unreal Engine", url: "#unreal" }
      ]
    },
    {
      name: "Frameworks",
      url: "#frameworks",
      tags: [
        { label: "React", url: "#react" },
        { label: "Vue.js", url: "#vue" },
        { label: "Angular", url: "#angular" },
        { label: "Django", url: "#django" },
        { label: "FastAPI", url: "#fastapi" },
        { label: "Next.js", url: "#nextjs" },
        { label: "Express", url: "#express" },
        { label: "Spring Boot", url: "#spring" }
      ]
    }
  ],
  styling: {
    tabAlignment: "center",
    tagSpacing: "normal",
    tagSize: "medium",
    tagAreaWidth: "medium"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface TabbedList1Props {
  sectionId: string;
}

const TabbedList1: React.FC<TabbedList1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [activeTab, setActiveTab] = useState(0);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'tabbedlist1-responsive-padding');

  const getSpacingClass = () => {
    switch (content.styling.tagSpacing) {
      case 'compact': return 'gap-2';
      case 'loose': return 'gap-6';
      default: return 'gap-4';
    }
  };

  const getTabAlignment = () => {
    switch (content.styling.tabAlignment) {
      case 'left': return 'justify-start';
      case 'right': return 'justify-end';
      default: return 'justify-center';
    }
  };

  const getTagSizeClasses = () => {
    switch (content.styling.tagSize) {
      case 'small': return 'px-3 py-1.5 text-sm';
      case 'large': return 'px-5 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const getTagAreaWidth = () => {
    switch (content.styling.tagAreaWidth) {
      case 'narrow': return 'max-w-2xl';
      case 'wide': return 'max-w-5xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-3xl'; // medium
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const tagVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const handleTabClick = (index: number, url?: string) => {
    setActiveTab(index);
    if (url) {
      window.location.href = url;
    }
  };

  const handleTagClick = (url?: string) => {
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
          {/* Tab Headers */}
          <div className={`flex ${getTabAlignment()} mb-8`}>
            {content.tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(index, tab.url)}
                className={`px-6 py-3 text-lg font-medium transition-colors duration-200 border-b-2 ${
                  activeTab === index
                    ? `border-primary ${getTextColorClass('primary')}`
                    : `border-transparent ${getTextColorClass(content.textContent.textColor)} hover:${getTextColorClass('primary')}`
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tag Content */}
          <div className="flex justify-center">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`${getTagAreaWidth()} flex flex-wrap ${getSpacingClass()} justify-center`}
            >
              {content.tabs[activeTab]?.tags.map((tag, tagIndex) => (
                <motion.button
                  key={tagIndex}
                  variants={tagVariants}
                  onClick={() => handleTagClick(tag.url)}
                  className={`${getTagSizeClasses()} rounded-full border-2 transition-all duration-200 ${
                    tag.url ? 'cursor-pointer' : 'cursor-default'
                  } hover:shadow-lg relative overflow-hidden group`}
                  style={{ 
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    backgroundColor: 'transparent'
                  }}
                  whileHover={tag.url ? { 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={tag.url ? { scale: 0.95 } : {}}
                  onMouseEnter={(e) => {
                    if (tag.url) {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--background)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                >
                  <span className="relative z-10">{tag.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default TabbedList1;
export type { TabbedList1Content };
export { DEFAULT_CONTENT as TabbedList1DefaultContent };
export { TabbedList1Schema };