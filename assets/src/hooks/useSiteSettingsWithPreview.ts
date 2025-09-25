import { useCMSPreview } from '@/components/admin/CMSPreviewContext'
import { useCMS } from '@/components/admin/CMSContext'
import { useContext } from 'react'

export const useSiteSettingsWithPreview = () => {
  const { shouldShowPanel } = useCMS()
  
  // Safely access CMSPreview context with fallback
  let getCurrentSettings, isSectionsLoading
  try {
    const context = useCMSPreview()
    getCurrentSettings = context.getCurrentSettings
    isSectionsLoading = context.isSectionsLoading
  } catch (error) {
    // Fallback when context is not available
    getCurrentSettings = () => null
    isSectionsLoading = true
  }
  
  // When CMS panel should be shown, use preview settings
  // Otherwise fall back to getCurrentSettings which will return saved settings
  const settings = getCurrentSettings()
  
  // Provide fallback defaults if settings are null (during loading)
  const settingsWithDefaults = settings ? settings : {
    company_name: 'Loading...',
    company_logo: '/static/images/logo.png',
    company_logo_light: '',
    company_logo_dark: '',
    favicon: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    header_type: 'professional' as const,
    header_show_logo: true,
    header_show_company_name: false,
    header_show_dark_mode_toggle: true,
    header_show_login: true,
    header_show_signup: false,
    header_background_transparent: false,
    header_is_sticky: true,
    header_logo_alt: 'Logo',
    footer_show_footer: true,
    footer_show_top_section: false,
    footer_show_bottom_section: true,
    footer_show_logo: true,
    footer_show_tagline: true,
    footer_show_navigation: true,
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_linkedin: '',
    social_youtube: ''
  }
  
  return {
    settings: settingsWithDefaults,
    loading: isSectionsLoading
  }
} 