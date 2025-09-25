import React from 'react';
import { Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

const PricingPlanSchema = z.object({
  name: z.string(),
  badge: z.string(),
  monthlyPrice: z.string(),
  yearlyPrice: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  cta: createButtonSchema(),
  highlighted: z.boolean().default(false)
});

const Pricing1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(), 
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  
  billingToggle: z.object({
    showToggle: z.boolean().default(true),
    monthlyLabel: z.string().default("Monthly"),
    yearlyLabel: z.string().default("Yearly")
  }),
  
  plans: z.array(PricingPlanSchema).min(1, "At least one plan is required"),
  
  sectionPadding: createResponsivePaddingSchema()
});

type Pricing1Content = z.infer<typeof Pricing1Schema>;

interface Pricing1Props {
  sectionId: string;
}

const DEFAULT_CONTENT: Pricing1Content = {
  textContent: {
    title: "Choose Your Plan",
    subtitle: "Select the perfect plan that fits your needs and budget. Upgrade or downgrade at any time.",
    textColor: "foreground"
  },
  
  billingToggle: {
    showToggle: true,
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly"
  },
  
  plans: [
    {
      name: "FREE",
      badge: "FREE",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      description: "Perfect for getting started",
      features: [
        "Up to 5 projects",
        "Basic support",
        "1GB storage",
        "Free updates"
      ],
      cta: {
        visible: true,
        text: "Get Started",
        url: "/signup",
        variant: "outline",
        size: "default",
        icon: "",
        iconPosition: "right"
      },
      highlighted: false
    },
    {
      name: "PRO",
      badge: "MOST POPULAR",
      monthlyPrice: "$29",
      yearlyPrice: "$299",
      description: "Best for growing businesses",
      features: [
        "Everything in FREE",
        "Unlimited projects",
        "Priority support",
        "50GB storage",
        "Advanced analytics"
      ],
      cta: {
        visible: true,
        text: "Start Pro",
        url: "/upgrade",
        variant: "default",
        size: "default",
        icon: "",
        iconPosition: "right"
      },
      highlighted: true
    },
    {
      name: "ENTERPRISE",
      badge: "ENTERPRISE",
      monthlyPrice: "$99",
      yearlyPrice: "$999",
      description: "For large teams and organizations",
      features: [
        "Everything in PRO",
        "Unlimited team members",
        "24/7 phone support",
        "500GB storage",
        "Custom integrations",
        "Advanced security"
      ],
      cta: {
        visible: true,
        text: "Contact Sales",
        url: "/contact",
        variant: "outline",
        size: "default",
        icon: "",
        iconPosition: "right"
      },
      highlighted: false
    }
  ],
  
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

const Pricing1: React.FC<Pricing1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [isYearly, setIsYearly] = React.useState(false);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'pricing1-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {/* Header */}
            {content.textContent?.title && (
              <h2 className={`text-4xl font-bold text-pretty lg:text-6xl ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            )}
            
            <div className="flex flex-col justify-between gap-10 md:flex-row">
              {content.textContent?.subtitle && (
                <p className={`max-w-3xl lg:text-xl ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80`}>
                  {content.textContent.subtitle}
                </p>
              )}
              
              {/* Billing Toggle */}
              {content.billingToggle?.showToggle && (
                <div className="flex h-11 w-fit shrink-0 items-center rounded-md bg-muted p-1 text-lg">
                  <RadioGroup
                    defaultValue="monthly"
                    className="h-full grid-cols-2"
                    onValueChange={(value) => {
                      setIsYearly(value === "yearly");
                    }}
                  >
                    <div className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-background'>
                      <RadioGroupItem
                        value="monthly"
                        id="monthly"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="monthly"
                        className="flex h-full cursor-pointer items-center justify-center px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                      >
                        {content.billingToggle?.monthlyLabel || "Monthly"}
                      </Label>
                    </div>
                    <div className='h-full rounded-md transition-all has-[button[data-state="checked"]]:bg-background'>
                      <RadioGroupItem
                        value="yearly"
                        id="yearly"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="yearly"
                        className="flex h-full cursor-pointer items-center justify-center gap-1 px-7 font-semibold text-muted-foreground peer-data-[state=checked]:text-primary"
                      >
                        {content.billingToggle?.yearlyLabel || "Yearly"}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
            
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(content.plans || DEFAULT_CONTENT.plans).map((plan, index) => (
                <div 
                  key={index}
                  className={`flex flex-col rounded-lg border p-6 text-left relative ${
                    plan.highlighted ? 'bg-muted border-primary shadow-lg' : ''
                  }`}
                >
                  {plan.badge && (
                    <Badge className={`mb-8 block w-fit ${plan.highlighted ? 'bg-primary text-primary-foreground' : ''}`}>
                      {plan.badge}
                    </Badge>
                  )}
                  
                  <span className="text-4xl font-medium">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <p className="text-muted-foreground mb-2">
                    {isYearly ? 'Per year' : 'Per month'}
                  </p>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                  )}
                  
                  <Separator className="my-6" />
                  
                  <div className="flex flex-col justify-between gap-8 flex-1">
                    <ul className="space-y-4 text-muted-foreground">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2">
                          <Check className="size-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.cta.visible !== false && (
                      <div className="mt-auto">
                        <ButtonWithIcon cta={{...plan.cta, className: "w-full"}} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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