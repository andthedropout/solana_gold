import React, { useMemo } from 'react';

// Import all components statically
import CTA1 from '@/components/sections/ctas/CTA1';
import CTA2 from '@/components/sections/ctas/CTA2';
import Hero1 from '@/components/sections/heros/Hero1';
import Hero2 from '@/components/sections/heros/Hero2';
import Hero3 from '@/components/sections/heros/Hero3';
import Hero4 from '@/components/sections/heros/Hero4';
import Hero5 from '@/components/sections/heros/Hero5';
import Hero6 from '@/components/sections/heros/Hero6';
import Hero7 from '@/components/sections/heros/Hero7';
import Hero8 from '@/components/sections/heros/Hero8';
import Hero9 from '@/components/sections/heros/Hero9';
import Hero10 from '@/components/sections/heros/Hero10';
import Hero11 from '@/components/sections/heros/Hero11';
import Feature1 from '@/components/sections/features/Feature1';
import Feature2 from '@/components/sections/features/Feature2';
import Feature3 from '@/components/sections/features/Feature3';
import Feature4 from '@/components/sections/features/Feature4';
import Feature5 from '@/components/sections/features/Feature5';
import Testimonial1 from '@/components/sections/testimonials/Testimonial1';
import Testimonial2 from '@/components/sections/testimonials/Testimonial2';
import Testimonial3 from '@/components/sections/testimonials/Testimonial3';
import Testimonial4 from '@/components/sections/testimonials/Testimonial4';
import Testimonial5 from '@/components/sections/testimonials/Testimonial5';
import Faq1 from '@/components/sections/faqs/Faq1';
import Faq2 from '@/components/sections/faqs/Faq2';
import Pricing1 from '@/components/sections/pricings/Pricing1';
import Pricing2 from '@/components/sections/pricings/Pricing2';
import Pricing3 from '@/components/sections/pricings/Pricing3';
import Gallery1 from '@/components/sections/gallerys/Gallery1';
import Gallery2 from '@/components/sections/gallerys/Gallery2';
import Gallery3 from '@/components/sections/gallerys/Gallery3';
import Gallery4 from '@/components/sections/gallerys/Gallery4';
import Gallery5 from '@/components/sections/gallerys/Gallery5';
import ClientList1 from '@/components/sections/clientlists/ClientList1';
import ClientList2 from '@/components/sections/clientlists/ClientList2';
import Timeline1 from '@/components/sections/timelines/Timeline1';
import Simple1 from '@/components/sections/simple/Simple1';
import TabbedList1 from '@/components/sections/tabbedlists/TabbedList1';
import Video1 from '@/components/sections/videos/Video1';

// Component mapping
const COMPONENT_MAP = {
  CTA1,
  CTA2,
  Hero1,
  Hero2,
  Hero3,
  Hero4,
  Hero5,
  Hero6,
  Hero7,
  Hero8,
  Hero9,
  Hero10,
  Hero11,
  Feature1,
  Feature2,
  Feature3,
  Feature4,
  Feature5,
  Testimonial1,
  Testimonial2,
  Testimonial3,
  Testimonial4,
  Testimonial5,
  Faq1,
  Faq2,
  Pricing1,
  Pricing2,
  Pricing3,
  Gallery1,
  Gallery2,
  Gallery3,
  Gallery4,
  Gallery5,
  ClientList1,
  ClientList2,
  Timeline1,
  Simple1,
  TabbedList1,
  Video1,
} as const;

interface SectionBackground {
  static_color?: 'background' | 'muted' | 'accent' | 'secondary' | 'primary' | 'card';
  animated_type?: string;
  opacity?: number;
}

interface DynamicComponentProps {
  componentType: string;
  sectionId: string;
  isFirst?: boolean;
  isLast?: boolean;
  background?: SectionBackground;
}

const createDynamicComponent = (componentType: string) => {
  console.log(`🔍 DynamicComponent: Looking up ${componentType}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
  
  // Get component from static mapping
  const Component = COMPONENT_MAP[componentType as keyof typeof COMPONENT_MAP];
  
  if (Component) {
    console.log(`✅ Found component ${componentType} in static mapping`);
    return Component;
  }
  
  console.error(`❌ Component ${componentType} not found in COMPONENT_MAP`);
  console.log(`📋 Available components:`, Object.keys(COMPONENT_MAP));
  
  // Return fallback component
  return ({ sectionId }: DynamicComponentProps) => (
    <div className="w-full py-16 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Component Not Found
        </h2>
        <p className="text-muted-foreground">
          Could not load component "{componentType}"
        </p>
        <div className="mt-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
          <p>Section ID: {sectionId}</p>
          <p>Component Type: {componentType}</p>
          <p>Available: {Object.keys(COMPONENT_MAP).join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  componentType,
  sectionId,
  isFirst,
  isLast,
  background
}) => {
  // Guard against undefined componentType
  if (!componentType) {
    return (
      <div className="w-full py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Missing Component Type
          </h2>
          <p className="text-muted-foreground">
            Section "{sectionId}" has no component_type defined
          </p>
          <div className="mt-4 text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p>Section ID: {sectionId}</p>
            <p>Component Type: {componentType} (undefined)</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the component from static mapping
  const Component = useMemo(() => createDynamicComponent(componentType), [componentType]);

  return <Component sectionId={sectionId} />;
}; 