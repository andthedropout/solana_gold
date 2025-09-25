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

const PricingPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  monthlyPrice: z.string(),
  yearlyPrice: z.string(),
  features: z.array(z.string()),
  cta: createButtonSchema(),
  showInheritanceText: z.boolean().default(false),
  inheritanceText: z.string().optional()
});

const Pricing3Schema = z.object({
  textContent: z.object({
    title: z.string(),
    description: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  billingToggle: z.object({
    showToggle: z.boolean().default(true),
    monthlyLabel: z.string().default("Monthly"),
    yearlyLabel: z.string().default("Yearly")
  }),
  plans: z.array(PricingPlanSchema).length(2, "Exactly 2 plans are required"),
  sectionPadding: createResponsivePaddingSchema()
});

type Pricing3Content = z.infer<typeof Pricing3Schema>;

const DEFAULT_CONTENT: Pricing3Content = {
  textContent: {
    title: "Choose Your Plan",
    description: "Select the perfect plan for your needs with flexible monthly or yearly billing",
    textColor: "foreground"
  },
  billingToggle: {
    showToggle: true,
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly"
  },
  plans: [
    {
      name: "Starter",
      description: "Perfect for individuals and small projects",
      monthlyPrice: "$19",
      yearlyPrice: "$179",
      features: [
        "Up to 5 team members",
        "Basic components library", 
        "Community support",
        "1GB storage space",
        "Standard features"
      ],
      cta: {
        visible: true,
        text: "Get Started",
        url: "/signup",
        variant: "outline",
        size: "lg",
        icon: "arrow-right",
        iconPosition: "right"
      },
      showInheritanceText: false
    },
    {
      name: "Professional",
      description: "Best for growing teams and businesses",
      monthlyPrice: "$49", 
      yearlyPrice: "$359",
      features: [
        "Unlimited team members",
        "Advanced components",
        "Priority support",
        "Unlimited storage",
        "Advanced analytics",
        "Custom integrations"
      ],
      cta: {
        visible: true,
        text: "Upgrade to Pro",
        url: "/upgrade",
        variant: "default",
        size: "lg",
        icon: "arrow-right",
        iconPosition: "right"
      },
      showInheritanceText: true,
      inheritanceText: "Everything in Starter, plus:"
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Pricing3Props {
  sectionId: string;
}

const Pricing3: React.FC<Pricing3Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  const [isYearly, setIsYearly] = useState(false);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'pricing3-responsive-padding');

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
              <p className="text-muted-foreground lg:text-xl">
                {content.textContent.description}
              </p>
            )}
            
            {content.billingToggle?.showToggle && (
              <div className="flex items-center gap-3 text-lg">
                <span className={getTextColorClass(content.textContent?.textColor || "foreground")}>
                  {content.billingToggle?.monthlyLabel || "Monthly"}
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={() => setIsYearly(!isYearly)}
                />
                <span className={getTextColorClass(content.textContent?.textColor || "foreground")}>
                  {content.billingToggle?.yearlyLabel || "Yearly"}
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {content.plans.map((plan, index) => (
                <Card
                  key={index}
                  className="flex flex-col justify-between text-left bg-card"
                >
                  <CardHeader>
                    <CardTitle>
                      <p>{plan.name}</p>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="flex items-end">
                      <span className="text-4xl font-semibold">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-2xl font-semibold text-muted-foreground">
                        {isYearly ? "/yr" : "/mo"}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Separator className="mb-6" />
                    {plan.showInheritanceText && plan.inheritanceText && (
                      <p className="mb-3 font-semibold">
                        {plan.inheritanceText}
                      </p>
                    )}
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
                    {(plan.cta.visible !== false) && (
                      <ButtonWithIcon cta={plan.cta} className="w-full" />
                    )}
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

export default Pricing3;
export type { Pricing3Content };
export { DEFAULT_CONTENT as Pricing3DefaultContent };
export { Pricing3Schema }; 