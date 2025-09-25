import React, { useMemo } from 'react';
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

const ClientSchema = z.object({
  name: z.string().default("New Client"),
  logo: z.object({
    url: z.string(),
    alt: z.string()
  }).optional(),
  url: z.string().default("")
});

const ClientList1Schema = z.object({
  textContent: z.object({
    title: z.string(),
    titleColor: z.enum(TEXT_COLOR_OPTIONS)
  }),
  clients: z.array(ClientSchema).min(1, "At least one client is required"),
  sectionPadding: createResponsivePaddingSchema()
});

type ClientList1Content = z.infer<typeof ClientList1Schema>;

const DEFAULT_CONTENT: ClientList1Content = {
  textContent: {
    title: "Our Clients",
    titleColor: "foreground"
  },
  clients: [
    { name: "Apple Inc.", url: "https://apple.com" },
    { name: "Microsoft Corporation", url: "https://microsoft.com" },
    { name: "Google LLC", url: "https://google.com" },
    { name: "Amazon Web Services", url: "https://aws.amazon.com" },
    { name: "Meta Platforms", url: "https://meta.com" },
    { name: "Netflix", url: "https://netflix.com" },
    { name: "Tesla Motors", url: "https://tesla.com" },
    { name: "Salesforce", url: "https://salesforce.com" },
    { name: "Adobe Systems", url: "https://adobe.com" },
    { name: "Spotify", url: "https://spotify.com" },
    { name: "Uber Technologies", url: "https://uber.com" },
    { name: "Airbnb", url: "https://airbnb.com" },
    { name: "Dropbox", url: "https://dropbox.com" },
    { name: "Slack Technologies", url: "https://slack.com" },
    { name: "Zoom Video", url: "https://zoom.us" },
    { name: "PayPal Holdings", url: "https://paypal.com" },
    { name: "Square Inc.", url: "https://squareup.com" },
    { name: "Shopify", url: "https://shopify.com" },
    { name: "Atlassian", url: "https://atlassian.com" },
    { name: "DocuSign", url: "https://docusign.com" },
    { name: "Twilio", url: "https://twilio.com" },
    { name: "Stripe", url: "https://stripe.com" },
    { name: "GitHub", url: "https://github.com" },
    { name: "GitLab", url: "https://gitlab.com" }
  ],
  sectionPadding: DEFAULT_RESPONSIVE_PADDING
};

interface ClientList1Props {
  sectionId: string;
}

const ClientList1: React.FC<ClientList1Props> = ({ sectionId }) => {
  const { content, loading, error } = useSectionContent(sectionId, DEFAULT_CONTENT);
  
  const normalizedPadding = normalizePadding(content.sectionPadding);
  const paddingCSS = generateResponsivePaddingCSS(normalizedPadding, 'clientlist1-responsive-padding');

  // Group clients by first letter and sort
  const groupedClients = useMemo(() => {
    const sorted = [...(content.clients || [])].sort((a, b) => 
      a.name.toUpperCase().localeCompare(b.name.toUpperCase())
    );
    
    const grouped: Record<string, typeof sorted> = {};
    
    sorted.forEach(client => {
      const firstChar = client.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(client);
    });
    
    return grouped;
  }, [content.clients]);

  // Get available letters for navigation
  const availableLetters = useMemo(() => {
    const letters = Object.keys(groupedClients).sort((a, b) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });
    return letters;
  }, [groupedClients]);

  const handleLetterClick = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const offset = 120; // Account for sticky header
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <SectionWrapper loading={loading} error={error}>
      <style>{paddingCSS.css}</style>
      <section 
        className={`w-full ${paddingCSS.className} ${paddingCSS.fullScreenClasses}`}
        style={paddingCSS.styles}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          {content.textContent?.title && (
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold ${getTextColorClass(content.textContent?.titleColor || "foreground")}`}>
                {content.textContent.title}
              </h2>
            </div>
          )}

          {/* Alphabet Navigation */}
          <div className="flex flex-wrap justify-center mb-8 border-y border-border py-2 sticky top-20 bg-background/95 backdrop-blur-sm z-10">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter)}
                className="px-2 py-1 text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Client Groups */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-8">
              {availableLetters.map((letter) => (
                <div key={letter} id={`letter-${letter}`} className="scroll-mt-28">
                  {/* Letter Header */}
                  <div className="flex items-center mb-3">
                    <div className="text-xl font-bold text-primary w-8 h-8 flex items-center justify-center">
                      {letter}
                    </div>
                    <div className="h-px bg-primary/20 flex-grow ml-2"></div>
                  </div>
                  
                  {/* Clients List */}
                  <ul className="space-y-2 ml-8">
                    {groupedClients[letter]?.map((client, index) => (
                      <li 
                        key={`${letter}-${index}`}
                        className="text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {client.url ? (
                          <a 
                            href={client.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer hover:underline flex items-center gap-2"
                          >
                            {client.logo?.url && (
                              <img 
                                src={client.logo.url} 
                                alt={client.logo.alt || client.name}
                                className="h-4 w-4 object-contain flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span>{client.name}</span>
                          </a>
                        ) : (
                          <div className="cursor-default flex items-center gap-2">
                            {client.logo?.url && (
                              <img 
                                src={client.logo.url} 
                                alt={client.logo.alt || client.name}
                                className="h-4 w-4 object-contain flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span>{client.name}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SectionWrapper>
  );
};

export default ClientList1;
export type { ClientList1Content };
export { DEFAULT_CONTENT as ClientList1DefaultContent };
export { ClientList1Schema }; 