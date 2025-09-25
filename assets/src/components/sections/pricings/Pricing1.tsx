import React, { useState } from 'react';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { CircleCheck } from 'lucide-react';

const PricingTypeSchema = z.enum(['one-time', 'subscription', 'quote']);

const PricingPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  pricingType: PricingTypeSchema.default('one-time'),
  price: z.string(),
  recurringPrice: z.string().optional(),
  priceLabel: z.string().optional(),
  recurringLabel: z.string().optional(),
  features: z.array(z.string()),
  button: createButtonSchema(),
  highlighted: z.boolean().default(false)
});

const Pricing1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    toggleLabel1: z.string().optional(),
    toggleLabel2: z.string().optional(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  showPricingToggle: z.boolean().default(false),
  plans: z.array(PricingPlanSchema).min(1, "At least one plan is required").max(3, "Maximum 3 plans allowed"),
  sectionPadding: createResponsivePaddingSchema()
});

type Pricing1Content = z.infer<typeof Pricing1Schema>;

const DEFAULT_CONTENT: Pricing1Content = {
  textContent: {
    title: "Our Services & Pricing",
    subtitle: "Professional solutions tailored to your needs. Transparent pricing with no hidden fees.",
    toggleLabel1: "One-time",
    toggleLabel2: "Monthly",
    textColor: "foreground"
  },
  showPricingToggle: false,
  plans: [
    {
      name: "Website Design",
      description: "Complete website solution",
      pricingType: "one-time",
      price: "$2,499",
      priceLabel: "Starting at",
      features: [
        "Custom responsive design",
        "Up to 5 pages",
        "SEO optimization",
        "Mobile-friendly",
        "2 rounds of revisions",
        "30 days support"
      ],
      button: {
        visible: true,
        text: "Get Quote",
        url: "/contact",
        variant: "outline",
        size: "lg",
        icon: "arrow-right",
        iconPosition: "right"
      },
      highlighted: false
    },
    {
      name: "Digital Marketing",
      description: "Complete marketing package",
      pricingType: "subscription",
      price: "$499",
      recurringPrice: "$799",
      priceLabel: "per month",
      recurringLabel: "per month",
      features: [
        "Social media management",
        "Google Ads campaign",
        "Content creation",
        "Monthly analytics report",
        "24/7 monitoring",
        "Dedicated account manager"
      ],
      button: {
        visible: true,
        text: "Start Campaign",
        url: "/signup",
        variant: "default",
        size: "lg",
        icon: "arrow-right",
        iconPosition: "right"
      },
      highlighted: true
    },
    {
      name: "Consulting",
      description: "Strategic business consulting",
      pricingType: "quote",
      price: "Custom",
      priceLabel: "Quote",
      features: [
        "Business strategy planning",
        "Process optimization",
        "Team training",
        "Implementation support",
        "Ongoing guidance",
        "Custom solutions"
      ],
      button: {
        visible: true,
        text: "Schedule Call",
        url: "/contact",
        variant: "outline",
        size: "lg",
        icon: "phone",
        iconPosition: "right"
      },
      highlighted: false
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Pricing1Props {
  sectionId: string;
}

const Pricing1: React.FC<Pricing1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [useRecurringPrices, setUseRecurringPrices] = useState(false);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'pricing1-responsive-padding');

  const hasSubscriptionPlans = content.plans.some(plan => 
    plan.pricingType === 'subscription' && plan.recurringPrice
  );

  const shouldShowToggle = content.showPricingToggle && hasSubscriptionPlans;

  const getPriceDisplay = (plan: any) => {
    if (plan.pricingType === 'quote') {
      return {
        price: plan.price,
        label: plan.priceLabel || ''
      };
    }
    
    if (plan.pricingType === 'subscription' && useRecurringPrices && plan.recurringPrice) {
      return {
        price: plan.recurringPrice,
        label: plan.recurringLabel || '/mo'
      };
    }
    
    return {
      price: plan.price,
      label: plan.priceLabel || (plan.pricingType === 'subscription' ? '/mo' : '')
    };
  };

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
            
            {content.textContent?.subtitle && (
              <p className="text-muted-foreground lg:text-xl">
                {content.textContent.subtitle}
              </p>
            )}
            
            {shouldShowToggle && (
              <div className="flex items-center gap-3 text-lg">
                <span className={getTextColorClass(content.textContent?.textColor || "foreground")}>
                  {content.textContent?.toggleLabel1 || "Standard"}
                </span>
                <Switch
                  checked={useRecurringPrices}
                  onCheckedChange={() => setUseRecurringPrices(!useRecurringPrices)}
                />
                <span className={getTextColorClass(content.textContent?.textColor || "foreground")}>
                  {content.textContent?.toggleLabel2 || "Premium"}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {content.plans.map((plan, index) => {
                const priceDisplay = getPriceDisplay(plan);
                
                return (
                  <Card
                    key={index}
                    className={`flex flex-col justify-between text-left ${
                      plan.highlighted ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <CardTitle>
                        <div className="flex items-center justify-between">
                          <p>{plan.name}</p>
                          {plan.highlighted && (
                            <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                              Popular
                            </span>
                          )}
                        </div>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                      <div className="flex items-end gap-1">
                        {priceDisplay.label && priceDisplay.label !== priceDisplay.price && (
                          <span className="text-sm text-muted-foreground mb-1">
                            {priceDisplay.label}
                          </span>
                        )}
                        <span className="text-4xl font-semibold">
                          {priceDisplay.price}
                        </span>
                        {priceDisplay.label && priceDisplay.label.startsWith('/') && (
                          <span className="text-2xl font-semibold text-muted-foreground">
                            {priceDisplay.label}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <Separator className="mb-6" />
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CircleCheck className="size-4 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter className="mt-auto">
                      {(plan.button.visible !== false) && (
                        <ButtonWithIcon cta={plan.button} className="w-full" />
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Pricing1;
export type { Pricing1Content };
export { DEFAULT_CONTENT as Pricing1DefaultContent };
export { Pricing1Schema }; 