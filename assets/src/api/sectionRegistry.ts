interface SectionMeta {
  name: string;
  description: string;
}

export const SECTION_DESCRIPTIONS: Record<string, SectionMeta> = {
  "Hero1": {
    name: "Classic Hero Section",
    description: "A centered hero section with large heading, subtitle, and two call-to-action buttons. Perfect for landing pages and main site introductions."
  },
  "Hero2": {
    name: "Animated Text Hero",
    description: "A centered hero with animated rotating words, top navigation button, and description text. Features smooth word transitions every 2 seconds with spring animations. Great for dynamic product showcases."
  },
  "Hero3": {
    name: "Split Layout Hero",
    description: "A two-column hero layout with badge, title, subtitle, description on the left and dashboard mockup of a web page visual on the right. Includes floating decorative elements and gradient backgrounds. Perfect for SaaS and tech products."
  },
  "Hero4": {
    name: "Features Showcase Hero",
    description: "A centered hero section with title, subtitle, description, and three feature cards below with icons. Features gradient backgrounds, decorative elements, and hover effects on feature cards. Great for highlighting key product benefits."
  },
  "Hero5": {
    name: "Stats & Metrics Hero",
    description: "A centered hero with badge, title, subtitle, description, and four colorful statistics cards showcasing metrics like user counts, uptime, integrations. Perfect for demonstrating business success and credibility."
  },
  "Hero6": {
    name: "Benefits List Hero",
    description: "A split layout hero with text content on one side and product image on the other. Features a checkmark benefits list, floating elements, and configurable image position (left or right). Ideal for product launches and feature highlights."
  },
  "Hero7": {
    name: "Mobile App Hero",
    description: "A split layout hero featuring product content alongside a realistic phone mockup frame with customizable image inside. Includes large heading with colored subtext, description, and two CTAs. Configurable image position (left/right). Perfect for mobile app launches and product showcases."
  },
  "Hero8": {
    name: "Local Business Hero",
    description: "A centered hero designed for local service businesses with trust-building elements. Features heading, description, primary CTA, and social proof section with customer avatars, star ratings, and review count. Ideal for local services, contractors, and community-focused businesses."
  },
  "Hero9": {
    name: "Community Trust Hero",
    description: "A centered hero with circular gradient rings background, badge, customizable icon, title, description, CTA, and trust text. Features a large hero image with configurable height. Includes subtle animations and community-focused design. Perfect for local businesses and service providers building trust."
  },
  "Hero10": {
    name: "Social Proof Hero",
    description: "A split layout hero with heading, description, and two CTAs alongside a hero image. Features comprehensive social proof section with 5 customer avatars, star ratings, and review count display. Configurable image position (left/right). Perfect for businesses wanting to showcase customer satisfaction and build trust."
  },
  "Hero11": {
    name: "Card-Centered Hero",
    description: "A split layout featuring an elevated card design with badge, heading, description, and two CTAs alongside a large hero image with customizable height. The card has border, shadow, and premium styling. Configurable image position (left/right). Ideal for professional services and premium offerings."
  },
  "Feature1": {
    name: "Asymmetric Feature Grid",
    description: "A sophisticated 4-feature layout with asymmetric card arrangement in 2 rows. Features larger cards on opposite corners (60/40 width split) creating visual interest. Each card includes title, description, and customizable image with adjustable height. Perfect for showcasing diverse services or key product features with visual emphasis."
  },
  "Feature2": {
    name: "Feature Cards with Benefits List",
    description: "A comprehensive feature section with centered title/subtitle, checkmark benefits list, and configurable grid of feature cards (1-4 per row). Each card displays icon, title, description, and image. Includes primary CTA button and supports up to 12 features. Ideal for product overviews and service showcases."
  },
  "Feature3": {
    name: "Alternating Feature Showcase",
    description: "A detailed feature section with alternating left/right layout pattern. Each feature includes large image, title, description, bullet point list, and individual CTA button. Features automatically alternate image/content positioning for visual rhythm. Perfect for in-depth feature explanations and product deep-dives."
  },
  "Feature4": {
    name: "Simple Feature Grid",
    description: "A clean and minimal feature section with title, description, primary CTA, and 2-column grid of feature cards. Each card has aspect-ratio image and content area with title and description. Supports up to 8 features with unique IDs. Perfect for straightforward feature presentations and clean product showcases."
  },
  "Pricing1": {
    name: "Multi-Plan Pricing Table",
    description: "A comprehensive pricing section supporting up to 3 plans with flexible pricing types (one-time, subscription, custom quote). Features optional monthly/yearly toggle, plan highlighting, feature lists with checkmarks, and individual CTAs per plan. Supports mixed pricing models for diverse service offerings. Perfect for agencies and service businesses."
  },
  "Pricing2": {
    name: "Single Plan Spotlight",
    description: "A focused single-plan pricing section with large price display, organized feature groups separated by dividers, and prominent CTA button. Features currency symbol, price suffix, and grouped feature lists with checkmark icons. Ideal for SaaS products and subscription services with one main offering."
  },
  "Pricing3": {
    name: "Two-Tier Comparison",
    description: "A side-by-side comparison of exactly 2 pricing plans with monthly/yearly billing toggle. Features plan inheritance text ('Everything in X, plus:'), card-based layout, and individual CTAs. Perfect for freemium models, starter/pro tiers, and simple subscription comparisons. Ideal for growing SaaS businesses."
  },
  "Testimonial1": {
    name: "Single Quote Testimonial",
    description: "Clean, centered testimonial with large quote text, author avatar, name, and role. Simple and elegant design focusing on one powerful testimonial. Perfect for homepage heroes or standalone social proof sections."
  },
  "Testimonial2": {
    name: "Featured & Grid Testimonials",
    description: "Two-tier testimonial layout with large featured testimonial (quote, author info, accompanying image) and grid of smaller testimonial cards below (up to 6). Combines detailed social proof with broader customer validation. Ideal for comprehensive testimonial showcases."
  },
  "Testimonial3": {
    name: "Carousel Testimonials",
    description: "Interactive testimonial carousel with star ratings, large author avatars, and navigation dots. Each slide features full testimonial with quote, author details, and 5-star rating system. Supports 1-10 testimonials with smooth navigation. Perfect for extensive customer feedback display."
  },
  "Testimonial4": {
    name: "Infinite Scrolling Testimonials",
    description: "Dynamic testimonial section with title, subtitle, and continuously scrolling testimonial cards. Configurable animation speed (fast/normal/slow) and pause-on-hover functionality. Supports 3-10 testimonials in smooth infinite scroll. Great for modern, engaging testimonial displays."
  },
  "Gallery1": {
    name: "Portfolio Carousel",
    description: "Horizontal scrolling portfolio showcase with title, demo link, and navigation arrows. Each item displays project image, title, summary, and clickable links. Features responsive breakpoints and smooth carousel navigation. Perfect for showcasing work portfolios and case studies."
  },
  "Gallery2": {
    name: "Case Study Carousel",
    description: "Case study carousel with title, description, and overlay-style cards. Each card features background image with gradient overlay, title, description, and links. Includes navigation arrows and pagination dots. Ideal for detailed case study presentations and client work showcases."
  },
  "Gallery3": {
    name: "Interactive Grid Gallery",
    description: "Dynamic masonry-style gallery with title, description, and interactive grid layout. Items support different sizes (small/medium/large) with hover effects and click interactions. Uses advanced layout grid component for engaging presentations. Perfect for creative portfolios and image showcases."
  },
  "Gallery4": {
    name: "Parallax Scroll Gallery",
    description: "Immersive parallax scrolling gallery with title, description, and multi-column parallax effect. Supports 3-24 images arranged in columns that move at different speeds during scroll. Creates dynamic, engaging visual experience. Great for artistic presentations and visual storytelling."
  },
  "Gallery5": {
    name: "Simple Grid Gallery",
    description: "Clean image grid with title, description, and configurable layout (1-6 columns). Each image includes optional caption and hover zoom effect. Responsive grid with customizable cards per row. Perfect for straightforward image galleries and photo collections."
  },
  "CTA1": {
    name: "Feature-Focused CTA",
    description: "Split layout CTA with title, description, primary button on the left, and checkmark feature list on the right. Features muted background card styling and side-by-side responsive layout. Perfect for highlighting key benefits while driving action."
  },
  "CTA2": {
    name: "Centered Dual CTA",
    description: "Centered CTA section with heading, description, and two action buttons (primary and secondary). Features accent background and full-width responsive design with clear visual hierarchy. Ideal for offering multiple engagement choices like 'Start Trial' and 'View Demo'."
  },
  "Faq1": {
    name: "Numbered FAQ Accordion",
    description: "Professional FAQ section with numbered questions in accordion format. Features title, subtitle, and expandable Q&A cards with numbered prefixes. Clean card-based styling with smooth open/close animations. Perfect for business and service websites."
  },
  "Faq2": {
    name: "Community-Style FAQ",
    description: "Friendly FAQ section with casual, community-focused tone and local business styling. Features rounded cards with dot indicators and backdrop blur effects. Includes conversational content for local services and neighborhood businesses. Great for building trust and approachability."
  },
  "ClientList1": {
    name: "Alphabetical Client Directory",
    description: "Comprehensive client list organized alphabetically with sticky navigation bar. Features automatic letter grouping, smooth scrolling navigation, and clickable client links. Multi-column responsive layout with letter headers and dividers. Perfect for showcasing extensive client portfolios and building credibility."
  },
  "Testimonial5": {
    name: "Animated Cards Stack",
    description: "Premium testimonial section with animated 3D card stack effect. Features multiple animation styles (stack/spread/carousel), auto-play with configurable speed, navigation controls, and dot indicators. Cards include quote icon, testimonial text, and author info with optional avatar. Perfect for impactful social proof with modern, engaging animations."
  },
  "ClientList2": {
    name: "Brand Logo Marquee",
    description: "Continuous scrolling brand marquee with customizable logos and names. Features configurable scroll speed (slow/normal/fast), direction (left/right), pause on hover, and single or dual-row layouts. Supports 4-20 clients with optional logos, links, and size options. Perfect for showcasing partnerships, client logos, and building trust through brand association."
  },
  "Timeline1": {
    name: "Animated Timeline",
    description: "Vertical timeline with scroll-triggered animations and gradient progress indicator. Features customizable entries with titles, dates, descriptions, highlight lists, icons, and optional images. Supports 2-10 timeline events with sticky headers and smooth parallax effects. Perfect for company history, project milestones, roadmaps, or process visualization."
  }
};

export type { SectionMeta }; 