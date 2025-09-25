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
import { Separator } from '@/components/ui/separator';
import { Check } from 'lucide-react';

const FeatureGroupSchema = z.array(z.string()).min(1, "At least one feature is required");

const Pricing2Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  pricing: z.object({
    price: z.string(),
    priceSuffix: z.string(),
    currency: z.string()
  }),
  featureGroups: z.array(FeatureGroupSchema).min(1, "At least one feature group is required"),
  cta: createButtonSchema(),
  sectionPadding: createResponsivePaddingSchema()
});

type Pricing2Content = z.infer<typeof Pricing2Schema>;

const DEFAULT_CONTENT: Pricing2Content = {
  textContent: {
    title: "Simple, Transparent Pricing",
    description: "One plan that includes everything you need to get started. No hidden fees, no surprises.",
    textColor: "foreground"
  },
  pricing: {
    price: "29",
    priceSuffix: "/mo",
    currency: "$"
  },
  featureGroups: [
    [
      "Unlimited projects",
      "24/7 support", 
      "Advanced analytics"
    ],
    [
      "Live collaboration",
      "Unlimited storage",
      "30-day money back guarantee"
    ],
    [
      "Unlimited team members",
      "Custom integrations",
      "Priority onboarding"
    ]
  ],
  cta: {
    visible: true,
    text: "Start Free Trial",
    url: "/signup",
    variant: "default",
    size: "lg",
    icon: "arrow-right",
    iconPosition: "right"
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Pricing2Props {
  sectionId: string;
}

const Pricing2: React.FC<Pricing2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'pricing2-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            {content.textContent?.title && (
              <h2 className={`text-4xl font-semibold text-pretty lg:text-6xl ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            )}
            
            {content.textContent?.description && (
              <p className="max-w-md text-muted-foreground lg:text-xl">
                {content.textContent.description}
              </p>
            )}
            
            <div className="mx-auto flex w-full flex-col rounded-lg border bg-card p-6 sm:w-fit sm:min-w-80 max-w-md">
              <div className="flex justify-center">
                {content.pricing?.currency && (
                  <span className="text-lg font-semibold">{content.pricing.currency}</span>
                )}
                <span className="text-6xl font-semibold">{content.pricing?.price}</span>
                {content.pricing?.priceSuffix && (
                  <span className="self-end text-muted-foreground">
                    {content.pricing.priceSuffix}
                  </span>
                )}
              </div>
              
              <div className="my-6">
                {content.featureGroups?.map((featureGroup, idx) => (
                  <div key={idx}>
                    <ul className="flex flex-col gap-3">
                      {featureGroup.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 text-sm font-medium"
                        >
                          {feature} <Check className="inline size-4 shrink-0 text-primary" />
                        </li>
                      ))}
                    </ul>
                    {idx < (content.featureGroups?.length || 0) - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
              
              {(content.cta.visible !== false) && (
                <ButtonWithIcon cta={content.cta} className="w-full" />
              )}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Pricing2;
export type { Pricing2Content };
export { DEFAULT_CONTENT as Pricing2DefaultContent };
export { Pricing2Schema }; 