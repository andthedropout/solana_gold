import React from 'react';
import { NAVIGATION_CONFIG } from '../../../../../GLOBALSETTINGS';
import { useStaticSiteSettings } from '@/hooks/useStaticSiteSettings';
import { FloatingHeader } from './FloatingHeader';
import { CleanHeader } from './CleanHeader';
import { ProfessionalHeader } from './ProfessionalHeader';
import { Link } from 'react-router-dom';
import { Home, User, Settings } from 'lucide-react';
import { DarkModeToggle } from '../../dark-mode-toggle';
import { useAuth } from '../../../hooks/useAuth';

interface HeaderSelectorProps {
  className?: string;
}

export const HeaderSelector: React.FC<HeaderSelectorProps> = ({ className }) => {
  const { isAuthenticated, user } = useAuth();
  const { settings } = useStaticSiteSettings();
  
  switch (settings.header_type) {
    case 'floating':
      return <FloatingHeader className={className} />;
    case 'clean':
      return <CleanHeader />;
    case 'professional':
      return <ProfessionalHeader />;
    case 'sidebar':
      return (
        <div className={`fixed left-0 top-0 h-full w-64 border-r border-border flex flex-col ${
          settings.header_background_transparent 
            ? 'bg-background/20 backdrop-blur-md' 
            : 'bg-card'
        } z-50`}>
          {/* Logo Section */}
          {settings.header_show_logo && (
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src={settings.company_logo}
                  alt={settings.header_logo_alt}
                  className={`w-auto ${settings.header_show_company_name ? 'h-8' : 'h-12'}`}
                />
                {settings.header_show_company_name && (
                  <span className="text-sm font-semibold tracking-tighter">
                    {settings.company_name}
                  </span>
                )}
              </Link>
              {/* Dark Mode Toggle */}
              {settings.header_show_dark_mode_toggle && (
                <DarkModeToggle />
              )}
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="flex-1 p-4 space-y-2">
            {NAVIGATION_CONFIG.navItems.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          {/* Bottom Section - Auth Only */}
          {(settings.header_show_login || settings.header_show_signup) && (
            <div className="p-4 border-t border-border space-y-2">
              {/* Auth Buttons */}
              {settings.header_show_login && (
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
              {settings.header_show_signup && (
                <Link
                  to="/signup"
                  className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              )}
            </div>
          )}
        </div>
      );
    default:
      return <FloatingHeader className={className} />;
  }
};

export default HeaderSelector; 