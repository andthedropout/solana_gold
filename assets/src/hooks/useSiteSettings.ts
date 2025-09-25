import { useState, useEffect } from 'react';

interface SiteSettings {
  // Company Information
  company_name: string;
  company_logo: string;
  company_logo_light: string;
  company_logo_dark: string;
  favicon: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  
  // Header Configuration
  header_type: 'floating' | 'clean' | 'professional' | 'sidebar';
  header_show_logo: boolean;
  header_show_company_name: boolean;
  header_show_dark_mode_toggle: boolean;
  header_show_login: boolean;
  header_show_signup: boolean;
  header_background_transparent: boolean;
  header_is_sticky: boolean;
  header_logo_alt: string;
  
  // Footer Configuration
  footer_show_footer: boolean;
  footer_show_top_section: boolean;
  footer_show_bottom_section: boolean;
  footer_show_logo: boolean;
  footer_show_tagline: boolean;
  footer_show_navigation: boolean;
  
  // Social Media
  social_facebook: string;
  social_twitter: string;
  social_instagram: string;
  social_linkedin: string;
  social_youtube: string;
}

const defaultSettings: SiteSettings = {
  // Company Information
  company_name: 'Your Company Name',
  company_logo: '/static/images/logo.png',
  company_logo_light: '',
  company_logo_dark: '',
  favicon: '',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  
  // Header Configuration
  header_type: 'professional',
  header_show_logo: true,
  header_show_company_name: false,
  header_show_dark_mode_toggle: true,
  header_show_login: true,
  header_show_signup: false,
  header_background_transparent: false,
  header_is_sticky: true,
  header_logo_alt: 'Logo',
  
  // Footer Configuration
  footer_show_footer: true,
  footer_show_top_section: false,
  footer_show_bottom_section: true,
  footer_show_logo: true,
  footer_show_tagline: true,
  footer_show_navigation: true,
  
  // Social Media
  social_facebook: '',
  social_twitter: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/public/');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          setSettings(defaultSettings);
        }
      } catch (err) {
        setError('Failed to load site settings');
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}; 