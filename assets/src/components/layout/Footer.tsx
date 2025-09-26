import React from "react";
import { Link } from "react-router-dom";
import { NAVIGATION_CONFIG } from "../../../../GLOBALSETTINGS";
import { useStaticSiteSettings } from '@/hooks/useStaticSiteSettings';
import { useTheme } from "../theme-provider";

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer = (props: FooterProps) => {
  const { settings, loading } = useStaticSiteSettings();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use light logo on dark background, dark logo on light background
    return isDark ? '/static/images/logo-light.png' : '/static/images/logo-dark.png';
  }, [theme]);
  
  const logo = props.logo || {
    src: logoSrc,
    alt: settings.header_logo_alt,
    title: settings.company_name,
    url: "/",
  };
  
  const tagline = props.tagline || "Building the future, together.";
  
  const menuItems = props.menuItems || [
    {
      title: "Navigation",
      links: NAVIGATION_CONFIG.navItems.map((item: { name: string; link: string }) => ({
        text: item.name,
        url: item.link
      })),
    },
  ];
  
  const copyright = props.copyright || `© 2024 ${settings.company_name}. All rights reserved.`;
  
  const bottomLinks = props.bottomLinks || [
    { text: "Terms of Service", url: "/terms" },
    { text: "Privacy Policy", url: "/privacy" },
    { text: "Cookies", url: "/cookies" },
  ];
  // Don't render footer if showFooter is false
  if (!settings.footer_show_footer) {
    return null;
  }

  return (
    <section className={`border-t border-border bg-background ${
      settings.footer_show_top_section ? 'py-16' : 'py-8'
    }`}>
      <div className="container">
        <footer>
          {/* Top Section - Company Info & Navigation */}
          {settings.footer_show_top_section && (
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-16">
              {/* Logo and Tagline Section */}
              <div className="mb-8 md:mb-0">
                {settings.footer_show_logo && (
                  <div className="flex items-center gap-1">
                    <Link to={logo.url}>
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        title={logo.title}
                        className="h-8"
                      />
                    </Link>
                    <p className="text-xl font-semibold">{logo.title}</p>
                  </div>
                )}
                {settings.footer_show_tagline && (
                  <p className="mt-4 font-bold">{tagline}</p>
                )}
              </div>
              
              {/* Navigation Sections */}
              {settings.footer_show_navigation && menuItems.map((section, sectionIdx) => (
                <div key={sectionIdx}>
                  <h3 className="mb-4 font-bold">{section.title}</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    {section.links.map((link, linkIdx) => (
                      <li
                        key={linkIdx}
                        className="font-medium hover:text-primary"
                      >
                        <Link to={link.url}>{link.text}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          
          {/* Bottom Section - Copyright & Links */}
          {settings.footer_show_bottom_section && (
            <div className={`flex flex-col justify-center gap-4 text-sm font-medium text-muted-foreground md:flex-row md:items-center ${
              settings.footer_show_top_section 
                ? 'mt-16 border-t pt-8' 
                : 'mt-0'
            }`}>
              <p className="text-center">{copyright}</p>
              <ul className="flex gap-4">
                {/* {bottomLinks.map((link, linkIdx) => (
                  <li key={linkIdx} className="underline hover:text-primary">
                    <Link to={link.url}>{link.text}</Link>
                  </li>
                ))} */}
              </ul>
            </div>
          )}
        </footer>
      </div>
    </section>
  );
};

export { Footer };
export default Footer;
