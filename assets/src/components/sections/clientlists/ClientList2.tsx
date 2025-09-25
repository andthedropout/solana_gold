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
// Import individual icons to avoid Vite bundling issues
import * as SimpleIcons from 'react-icons/si';

// Brand icon mapping for popular companies
const BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Microsoft': SimpleIcons.SiMicrosoft,
  'Google': SimpleIcons.SiGoogle,
  'Amazon': SimpleIcons.SiAmazon,
  'Apple': SimpleIcons.SiApple,
  'Netflix': SimpleIcons.SiNetflix,
  'Spotify': SimpleIcons.SiSpotify,
  'Tesla': SimpleIcons.SiTesla,
  'Adobe': SimpleIcons.SiAdobe,
  'Salesforce': SimpleIcons.SiSalesforce,
  'Meta': SimpleIcons.SiMeta,
  'Uber': SimpleIcons.SiUber,
  'Airbnb': SimpleIcons.SiAirbnb,
  'Slack': SimpleIcons.SiSlack,
  'Shopify': SimpleIcons.SiShopify,
  'Stripe': SimpleIcons.SiStripe,
  'PayPal': SimpleIcons.SiPaypal,
  'Twilio': SimpleIcons.SiTwilio,
  'Zoom': SimpleIcons.SiZoom,
  'Dropbox': SimpleIcons.SiDropbox,
  'Atlassian': SimpleIcons.SiAtlassian,
};

const ClientSchema = z.object({
  name: z.string().default("New Client"),
  logo: z.object({
    url: z.string(),
    alt: z.string()
  }).optional(),
  useIcon: z.boolean().optional().default(true),
  url: z.string().optional()
});

const ClientList2Schema = z.object({
  textContent: z.object({
    title: z.string(),
    subtitle: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS),
    subtitleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  clients: z.array(ClientSchema).max(20),
  animation: z.object({
    speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
    direction: z.enum(['left', 'right']).default('left'),
    pauseOnHover: z.boolean().default(true),
    rows: z.number().min(1).max(2).default(1),
    oppositeDirections: z.boolean().default(false),
    rowSpacing: z.enum(['none', 'small', 'medium', 'large', 'xl']).default('medium')
  }),
  display: z.object({
    showLogos: z.boolean().default(true),
    showNames: z.boolean().default(true),
    logoSize: z.enum(['small', 'medium', 'large', 'xl', '2xl']).default('medium'),
    logoFit: z.enum(['contain', 'cover', 'fill']).default('contain'),
    logoBackground: z.boolean().default(false),
    logoAspectRatio: z.enum(['auto', 'square', 'wide']).default('auto')
  }),
  sectionPadding: createResponsivePaddingSchema()
});

type ClientList2Content = z.infer<typeof ClientList2Schema>;

const DEFAULT_CONTENT: ClientList2Content = {
  textContent: {
    title: "Trusted by Industry Leaders",
    subtitle: "Join thousands of companies that rely on our platform",
    titleColor: "foreground",
    subtitleColor: "muted-foreground"
  },
  clients: [
    { 
      name: "Microsoft", 
      url: "https://microsoft.com",
      useIcon: true
    },
    { 
      name: "Google", 
      url: "https://google.com",
      useIcon: true
    },
    { 
      name: "Amazon", 
      url: "https://amazon.com",
      useIcon: true
    },
    { 
      name: "Apple", 
      url: "https://apple.com",
      useIcon: true
    },
    { 
      name: "Netflix", 
      url: "https://netflix.com",
      useIcon: true
    },
    { 
      name: "Spotify", 
      url: "https://spotify.com",
      useIcon: true
    },
    { 
      name: "Tesla", 
      url: "https://tesla.com",
      useIcon: true
    },
    { 
      name: "Adobe", 
      url: "https://adobe.com",
      useIcon: true
    },
    { 
      name: "Salesforce", 
      url: "https://salesforce.com",
      useIcon: true
    },
    { 
      name: "Meta", 
      url: "https://meta.com",
      useIcon: true
    },
    { 
      name: "Slack", 
      url: "https://slack.com",
      useIcon: true
    },
    { 
      name: "Shopify", 
      url: "https://shopify.com",
      useIcon: true
    }
  ],
  animation: {
    speed: 'normal',
    direction: 'left',
    pauseOnHover: true,
    rows: 1,
    oppositeDirections: false,
    rowSpacing: 'medium'
  },
  display: {
    showLogos: true,
    showNames: true,
    logoSize: 'medium',
    logoFit: 'contain',
    logoBackground: false,
    logoAspectRatio: 'auto'
  },
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface ClientList2Props {
  sectionId: string;
}

const ClientList2: React.FC<ClientList2Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  // Debug logging for logo issues
  React.useEffect(() => {
    console.log(`🔍 ClientList2 Debug - Section ID: ${sectionId}`);
    console.log('Content clients:', content.clients);
    content.clients?.forEach((client, index) => {
      if (client.logo?.url) {
        console.log(`Client ${index} (${client.name}) has logo:`, client.logo.url);
      } else {
        console.log(`Client ${index} (${client.name}) has no logo`);
      }
    });
  }, [sectionId, content.clients]);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'clientlist2-responsive-padding');

  // Use saved clients exactly as they are - no defaults, no requirements
  const clients = content.clients || [];

  // Calculate animation duration based on speed
  const getDuration = () => {
    switch (content.animation?.speed) {
      case 'slow': return '60s';
      case 'fast': return '20s';
      default: return '40s';
    }
  };


  // Get gap size based on logo size - responsive for mobile
  const getGapSize = () => {
    // Return CSS variable that changes based on screen size
    switch (content.display?.logoSize) {
      case 'small': return 'var(--client-gap-small)';
      case 'large': return 'var(--client-gap-large)';
      case 'xl': return 'var(--client-gap-xl)';
      case '2xl': return 'var(--client-gap-2xl)';
      default: return 'var(--client-gap-medium)';
    }
  };

  // Get row spacing based on setting
  const getRowSpacing = () => {
    switch (content.animation?.rowSpacing) {
      case 'none': return '';
      case 'small': return 'mb-2';
      case 'large': return 'mb-8';
      case 'xl': return 'mb-12';
      default: return 'mb-4'; // medium
    }
  };

  const renderClientItem = (client: typeof clients[0], index: number) => {
    // Check if we should use a brand icon
    const BrandIcon = client.useIcon !== false && BRAND_ICONS[client.name];
    
    const ClientContent = (
      <div className={`flex items-center justify-center ${
        content.display?.logoSize === '2xl' ? 'min-w-[140px] sm:min-w-[280px]' :
        content.display?.logoSize === 'xl' ? 'min-w-[120px] sm:min-w-[240px]' :
        content.display?.logoSize === 'large' ? 'min-w-[100px] sm:min-w-[200px]' : 
        content.display?.logoSize === 'small' ? 'min-w-[60px] sm:min-w-[120px]' : 'min-w-[80px] sm:min-w-[150px]'
      }`}>
        {content.display?.showLogos && (
          <>
            {client.logo?.url ? (
              <div className={`flex items-center justify-center ${
                content.display?.logoBackground ? 'bg-muted/20 rounded-md p-1 sm:p-2' : ''
              } ${
                content.display?.logoSize === '2xl' ? 'w-20 h-10 sm:w-40 sm:h-20' :
                content.display?.logoSize === 'xl' ? 'w-16 h-8 sm:w-[120px] sm:h-16' :
                content.display?.logoSize === 'large' ? 'w-12 h-6 sm:w-24 sm:h-12' :
                content.display?.logoSize === 'small' ? 'w-8 h-4 sm:w-12 sm:h-6' : 'w-10 h-5 sm:w-16 sm:h-8'
              }`}>
                <img 
                  src={client.logo.url} 
                  alt={client.logo.alt || client.name}
                  className={`max-w-full max-h-full object-${content.display?.logoFit || 'contain'}`}
                  style={{ display: 'block' }}
                  onLoad={() => {
                    console.log(`✅ Logo loaded successfully: ${client.name} - ${client.logo?.url}`);
                  }}
                  onError={(e) => {
                    console.error(`❌ Logo failed to load: ${client.name} - ${client.logo?.url}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : BrandIcon ? (
              <div className={`flex items-center justify-center ${
                content.display?.logoBackground ? 'bg-muted/20 rounded-md p-1 sm:p-2' : ''
              } ${
                content.display?.logoSize === '2xl' ? 'w-20 h-10 sm:w-40 sm:h-20' :
                content.display?.logoSize === 'xl' ? 'w-16 h-8 sm:w-[120px] sm:h-16' :
                content.display?.logoSize === 'large' ? 'w-12 h-6 sm:w-24 sm:h-12' :
                content.display?.logoSize === 'small' ? 'w-8 h-4 sm:w-12 sm:h-6' : 'w-10 h-5 sm:w-16 sm:h-8'
              }`}>
                <BrandIcon className={`w-full h-full opacity-80`} />
              </div>
            ) : (
              <div className={`flex items-center justify-center bg-muted rounded-md ${
                content.display?.logoSize === '2xl' ? 'w-20 h-10 sm:w-40 sm:h-20' :
                content.display?.logoSize === 'xl' ? 'w-16 h-8 sm:w-[120px] sm:h-16' :
                content.display?.logoSize === 'large' ? 'w-12 h-6 sm:w-24 sm:h-12' :
                content.display?.logoSize === 'small' ? 'w-8 h-4 sm:w-12 sm:h-6' : 'w-10 h-5 sm:w-16 sm:h-8'
              }`}>
                <span className="text-xs font-bold text-muted-foreground">
                  {client.name.slice(0, 3).toUpperCase()}
                </span>
              </div>
            )}
          </>
        )}
        {content.display?.showNames && (
          <p className={`font-semibold opacity-80 whitespace-nowrap ml-3 ${
            content.display?.logoSize === '2xl' ? 'text-2xl' :
            content.display?.logoSize === 'xl' ? 'text-xl' :
            content.display?.logoSize === 'large' ? 'text-lg' : 
            content.display?.logoSize === 'small' ? 'text-sm' : 'text-base'
          }`}>
            {client.name}
          </p>
        )}
      </div>
    );

    if (client.url) {
      return (
        <a 
          key={`${sectionId}-client-${index}`}
          href={client.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-70 transition-opacity"
        >
          {ClientContent}
        </a>
      );
    }
    
    return (
      <div key={`${sectionId}-client-${index}`}>
        {ClientContent}
      </div>
    );
  };

  const renderScrollRow = (rowIndex: number) => {
    // If no clients, don't render anything
    if (clients.length === 0) {
      return null;
    }

    // Determine direction for this specific row
    let rowDirection = content.animation?.direction || 'left';
    if (content.animation?.oppositeDirections && content.animation?.rows === 2 && rowIndex === 1) {
      rowDirection = rowDirection === 'left' ? 'right' : 'left';
    }
    
    const animationClass = rowDirection === 'right' ? 'animate-marquee-reverse' : 'animate-marquee';
    const duration = getDuration();
    const gap = getGapSize();
    
    // Split clients between rows if rows > 1
    const rowClients = content.animation?.rows === 2 
      ? (rowIndex === 0 ? clients.filter((_, i) => i % 2 === 0) : clients.filter((_, i) => i % 2 === 1))
      : clients;

    // If we have very few clients, duplicate them for smooth scrolling
    // But only if animation is desired (more than 1 client)
    const displayClients = clients.length === 1 
      ? [clients[0]] // Single client - no animation needed
      : clients.length < 4 
        ? [...rowClients, ...rowClients, ...rowClients, ...rowClients] // Duplicate for smooth scroll
        : rowClients;

    // For a single client, don't animate
    const shouldAnimate = clients.length > 1;
    
    // Apply row spacing to first row when there are 2 rows
    const rowSpacingClass = content.animation?.rows === 2 && rowIndex === 0 ? getRowSpacing() : '';

    return (
      <div 
        key={`row-${rowIndex}`}
        className={`group flex overflow-hidden py-3 flex-row max-w-full ${rowSpacingClass} ${
          shouldAnimate ? '[mask-image:linear-gradient(to_right,_rgba(0,_0,_0,_0),rgba(0,_0,_0,_1)_10%,rgba(0,_0,_0,_1)_90%,rgba(0,_0,_0,_0))]' : 'justify-center'
        } ${
          content.animation?.pauseOnHover && shouldAnimate ? 'hover:[&>*]:animation-play-state-paused' : ''
        }`}
        style={{
          '--gap': gap,
          '--duration': duration,
          gap: gap
        } as React.CSSProperties}
      >
        {shouldAnimate ? (
          /* Render multiple sets for seamless looping */
          Array(3).fill(0).map((_, setIndex) => (
            <div
              className={`flex shrink-0 justify-around ${animationClass} flex-row`}
              key={`set-${setIndex}`}
              style={{
                gap: gap,
                animationDuration: duration
              }}
            >
              {displayClients.map((client, index) => renderClientItem(client, index))}
            </div>
          ))
        ) : (
          /* Single client - no animation */
          <div className="flex justify-center">
            {displayClients.map((client, index) => renderClientItem(client, index))}
          </div>
        )}
      </div>
    );
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <style>{`
        :root {
          --client-gap-small: 1.5rem;
          --client-gap-medium: 2rem;
          --client-gap-large: 2.5rem;
          --client-gap-xl: 3rem;
          --client-gap-2xl: 3.5rem;
        }
        
        @media (min-width: 640px) {
          :root {
            --client-gap-small: 3rem;
            --client-gap-medium: 4rem;
            --client-gap-large: 5rem;
            --client-gap-xl: 6rem;
            --client-gap-2xl: 7rem;
          }
        }
        
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% - var(--gap)));
          }
        }
        
        @keyframes marquee-reverse {
          from {
            transform: translateX(calc(-100% - var(--gap)));
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
        
        .animate-marquee-reverse {
          animation: marquee-reverse var(--duration) linear infinite;
        }
        
        .animation-play-state-paused {
          animation-play-state: paused !important;
        }
      `}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          {(content.textContent?.title || content.textContent?.subtitle) && (
            <div className="text-center mb-8 sm:mb-12">
              {content.textContent?.title && (
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 ${getTextColorClass(content.textContent.titleColor)}`}>
                  {content.textContent.title}
                </h2>
              )}
              {content.textContent?.subtitle && (
                <p className={`text-base sm:text-lg ${getTextColorClass(content.textContent.subtitleColor)}`}>
                  {content.textContent.subtitle}
                </p>
              )}
            </div>
          )}

          {/* Brand Scroller */}
          <div className="w-full">
            {content.animation?.rows === 2 ? (
              <>
                {renderScrollRow(0)}
                {renderScrollRow(1)}
              </>
            ) : (
              renderScrollRow(0)
            )}
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default ClientList2;
export type { ClientList2Content };
export { DEFAULT_CONTENT as ClientList2DefaultContent };
export { ClientList2Schema };