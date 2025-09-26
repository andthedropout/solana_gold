export const useStaticSiteSettings = () => {
  // Static settings that don't depend on CMS
  const settings = {
    company_name: 'Solana Gold',
    company_logo: '/static/images/logo.png',
    company_logo_light: '/static/images/logo-light.png',
    company_logo_dark: '/static/images/logo-dark.png',
    favicon: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    header_type: 'professional' as const,
    header_show_logo: false, // Temporarily disable logo to avoid 404 errors
    header_show_company_name: true,
    header_show_dark_mode_toggle: true,
    header_show_login: false,
    header_show_signup: false,
    header_background_transparent: false,
    header_is_sticky: true,
    header_logo_alt: 'Solana Gold Logo',
    footer_show_footer: true,
    footer_show_top_section: false,
    footer_show_bottom_section: true,
    footer_show_logo: false, // Temporarily disable footer logo too
    footer_show_tagline: true,
    footer_show_navigation: true,
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_linkedin: '',
    social_youtube: ''
  }

  return {
    settings,
    loading: false
  }
}