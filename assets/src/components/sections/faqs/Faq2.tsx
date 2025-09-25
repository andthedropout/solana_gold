import React from 'react';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from 'lucide-react';

const Faq2Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    textColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).min(1, "At least one FAQ is required"),
  sectionPadding: createResponsivePaddingSchema()
});

type Faq2Content = z.infer<typeof Faq2Schema>;

const DEFAULT_CONTENT: Faq2Content = {
  textContent: {
    title: "Questions? We've Got Answers!",
    subtitle: "Here are some of the most common questions we get from our neighbors and customers.",
    textColor: "foreground"
  },
  faqs: [
    {
      question: "Are you licensed and insured?",
      answer: "Absolutely! We're fully licensed and carry comprehensive insurance coverage. We're happy to provide proof of both before any work begins. Your peace of mind is important to us."
    },
    {
      question: "Do you work weekends or evenings?",
      answer: "We know life doesn't always happen during business hours! We offer flexible scheduling including evenings and weekends. Emergency services are available 24/7 because we understand some things just can't wait."
    },
    {
      question: "How do you handle pricing? Any hidden fees?",
      answer: "We believe in honest, upfront pricing. You'll get a clear written estimate before we start, and we'll always discuss any changes with you first. No surprises, no hidden fees - just fair, transparent pricing."
    },
    {
      question: "What if I'm not happy with the work?",
      answer: "Your satisfaction is our guarantee! If you're not completely happy with our work, we'll make it right. We stand behind everything we do and want you to feel confident choosing us."
    },
    {
      question: "How far do you travel for jobs?",
      answer: "We proudly serve our local community and surrounding areas. Give us a call and we'll let you know if we can help! We love supporting our neighbors and local businesses."
    },
    {
      question: "Can you provide references from other customers?",
      answer: "Of course! We're proud of our work and our customers are happy to share their experiences. We can provide local references so you can hear directly from your neighbors about our service."
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Faq2Props {
  sectionId: string;
}

const Faq2: React.FC<Faq2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'faq2-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto max-w-4xl">
          {content.textContent?.title && (
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
              {content.textContent?.subtitle && (
                <p className={`text-lg md:text-xl ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80 max-w-3xl mx-auto leading-relaxed`}>
                  {content.textContent.subtitle}
                </p>
              )}
            </div>
          )}
          
          <Accordion type="single" collapsible className="w-full space-y-6">
            {content.faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-0 rounded-2xl bg-card/70 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
              >
                <AccordionTrigger className={`text-left font-semibold text-lg px-8 py-6 ${getTextColorClass(content.textContent?.textColor || "foreground")} hover:no-underline group`}>
                  <span className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors flex-shrink-0 mt-1"></div>
                    <span className="leading-relaxed">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className={`px-8 pb-8 pl-15 ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80 leading-relaxed text-base`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default Faq2;
export type { Faq2Content };
export { DEFAULT_CONTENT as Faq2DefaultContent };
export { Faq2Schema }; 