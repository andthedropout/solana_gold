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

const Faq1Schema = z.object({
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

type Faq1Content = z.infer<typeof Faq1Schema>;

const DEFAULT_CONTENT: Faq1Content = {
  textContent: {
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about our services and processes",
    textColor: "foreground"
  },
  faqs: [
    {
      question: "How long does the process typically take?",
      answer: "Most projects are completed within 2-4 weeks, depending on complexity and scope. We'll provide you with a detailed timeline during our initial consultation."
    },
    {
      question: "What makes your approach different?",
      answer: "We focus on understanding your unique needs and delivering customized solutions. Our team combines industry expertise with innovative thinking to exceed expectations."
    },
    {
      question: "Do you offer ongoing support?",
      answer: "Yes, we provide comprehensive support packages to ensure your continued success. This includes regular check-ins, updates, and priority assistance when needed."
    },
    {
      question: "How do we get started?",
      answer: "Simply reach out to us through our contact form or schedule a consultation. We'll discuss your needs, provide recommendations, and outline the next steps."
    },
    {
      question: "What are your pricing options?",
      answer: "We offer flexible pricing models to suit different budgets and requirements. Contact us for a personalized quote based on your specific needs."
    }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface Faq1Props {
  sectionId: string;
}

const Faq1: React.FC<Faq1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'faq1-responsive-padding');

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto max-w-4xl">
          {content.textContent?.title && (
            <div className="text-center mb-12">
              <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${getTextColorClass(content.textContent?.textColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
              {content.textContent?.subtitle && (
                <p className={`text-lg md:text-xl ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80 max-w-2xl mx-auto`}>
                  {content.textContent.subtitle}
                </p>
              )}
            </div>
          )}
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            {content.faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6 py-2 bg-card"
              >
                <AccordionTrigger className={`text-left font-semibold ${getTextColorClass(content.textContent?.textColor || "foreground")} hover:no-underline`}>
                  <span className="flex items-center gap-3">
                    <span className="text-primary font-bold text-sm">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <span>{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className={`pt-2 pb-4 pl-10 ${getTextColorClass(content.textContent?.textColor || "foreground")} opacity-80 leading-relaxed`}>
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

export default Faq1;
export type { Faq1Content };
export { DEFAULT_CONTENT as Faq1DefaultContent };
export { Faq1Schema }; 