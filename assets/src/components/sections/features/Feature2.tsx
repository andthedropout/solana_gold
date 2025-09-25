import React from 'react';
import { useSectionContent } from '@/hooks/useSectionContent';
import { z } from 'zod';
import { Check } from 'lucide-react';
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
import {
  Code,
  GitBranch,
  List,
  Play,
  Sparkles,
  WandSparkles,
  Zap,
  Shield,
  Target,
  Users,
  Settings,
  Award
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

const ICON_OPTIONS = [
  { value: 'code', icon: Code, label: 'Code' },
  { value: 'play', icon: Play, label: 'Play' },
  { value: 'git-branch', icon: GitBranch, label: 'Git Branch' },
  { value: 'list', icon: List, label: 'List' },
  { value: 'wand-sparkles', icon: WandSparkles, label: 'Wand Sparkles' },
  { value: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { value: 'zap', icon: Zap, label: 'Lightning' },
  { value: 'shield', icon: Shield, label: 'Shield' },
  { value: 'target', icon: Target, label: 'Target' },
  { value: 'users', icon: Users, label: 'Users' },
  { value: 'settings', icon: Settings, label: 'Settings' },
  { value: 'award', icon: Award, label: 'Award' }
];

const Feature2Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  listItems: z.array(z.string()).max(10),
  primaryCta: createButtonSchema(),
  featuresPerRow: z.number().min(1).max(4).default(3),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.enum(['code', 'play', 'git-branch', 'list', 'wand-sparkles', 'sparkles', 'zap', 'shield', 'target', 'users', 'settings', 'award']),
    image: z.object({
      url: z.string(),
      alt: z.string(),
      height: z.number().min(100).max(300).default(160)
    })
  })).max(12),
  sectionPadding: createResponsivePaddingSchema()
});

type Feature2Content = z.infer<typeof Feature2Schema>;

const DEFAULT_CONTENT: Feature2Content = {
  textContent: {
    title: "Our Core Features",
    subtitle: "Everything you need to succeed, built with precision and designed for growth.",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  listItems: [
    "Easy integration with existing systems",
    "Quick setup and configuration",
    "Scalable architecture for growth",
    "24/7 expert support"
  ],
  primaryCta: {
    visible: true,
    text: "Get Started",
    url: "/signup",
    variant: "default",
    size: "default",
    icon: "arrow-right",
    iconPosition: "right"
  },
  featuresPerRow: 3,
  features: [
    {
      title: "Easy Integration",
      description: "Seamlessly integrate with your existing systems and workflows.",
      icon: "code",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Easy integration",
        height: 160
      }
    },
    {
      title: "Quick Setup",
      description: "Get up and running in minutes with our streamlined setup process.",
      icon: "play",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Quick setup",
        height: 160
      }
    },
    {
      title: "Scalable Architecture",
      description: "Built to grow with your business from startup to enterprise.",
      icon: "git-branch",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Scalable architecture",
        height: 160
      }
    },
    {
      title: "Comprehensive Analytics",
      description: "Track performance and gain insights with detailed reporting.",
      icon: "list",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Comprehensive analytics",
        height: 160
      }
    },
    {
      title: "Smart Automation",
      description: "Automate repetitive tasks and focus on what matters most.",
      icon: "wand-sparkles",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Smart automation",
        height: 160
      }
    },
    {
      title: "Premium Support",
      description: "Get expert help when you need it with our dedicated support team.",
      icon: "sparkles",
      image: {
        url: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "Premium support",
        height: 160
      }
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Feature2Props {
  sectionId: string;
}

const Feature2: React.FC<Feature2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'feature2-responsive-padding');

  const getIcon = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(option => option.value === iconName);
    const IconComponent = iconOption?.icon || Code;
    return <IconComponent className="size-4" strokeWidth={1} />;
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            {content.textContent?.title && (
              <h1 className={`mb-6 text-4xl font-semibold text-pretty lg:text-5xl ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent.title}
              </h1>
            )}
            
            {content.textContent?.subtitle && (
              <p className={`mb-6 text-lg max-w-3xl ${getTextColorClass(content.textContent?.subtitleColor || "muted-foreground")}`}>
                {content.textContent.subtitle}
              </p>
            )}
            
            {(content.listItems || DEFAULT_CONTENT.listItems).length > 0 && (
              <ul className="mb-8 space-y-3 text-left max-w-md">
                {(content.listItems || DEFAULT_CONTENT.listItems).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {(content.primaryCta.visible !== false) && (
              <div className="mb-6">
                <ButtonWithIcon cta={content.primaryCta} />
              </div>
            )}

            <div 
              className="mt-10 flex flex-wrap justify-center items-stretch gap-8"
              style={{
                '--features-per-row': content.featuresPerRow || 3
              } as React.CSSProperties}
            >
              {(content.features || DEFAULT_CONTENT.features).map((feature, index) => (
                <Card 
                  key={index}
                  className="flex-1 flex flex-col"
                  style={{
                    minWidth: `calc((100% - ${((content.featuresPerRow || 3) - 1) * 32}px) / ${content.featuresPerRow || 3})`,
                    maxWidth: `calc((100% - ${((content.featuresPerRow || 3) - 1) * 32}px) / ${content.featuresPerRow || 3})`
                  }}
                >
                  <CardHeader className="pb-1 flex-shrink-0">
                    {getIcon(feature.icon)}
                  </CardHeader>
                  <CardContent className="text-left flex-1 flex flex-col">
                    <h2 className="mb-1 text-lg font-semibold">
                      {feature.title}
                    </h2>
                    <p className="leading-snug text-muted-foreground flex-1">
                      {feature.description}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-end pr-0 pb-0 flex-shrink-0 mt-auto">
                    <img
                      className="w-full rounded-tl-md object-cover object-center"
                      style={{ height: `${feature.image?.height || 160}px` }}
                      src={feature.image?.url || "https://shadcnblocks.com/images/block/placeholder-1.svg"}
                      alt={feature.image?.alt || feature.title}
                    />
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

export default Feature2;
export type { Feature2Content };
export { DEFAULT_CONTENT as Feature2DefaultContent };
export { Feature2Schema }; 