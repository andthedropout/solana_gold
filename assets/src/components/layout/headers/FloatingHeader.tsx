"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "../../../lib/utils";
import { DarkModeToggle } from "../../dark-mode-toggle";
import { NAVIGATION_CONFIG } from "../../../../../GLOBALSETTINGS";
import { useStaticSiteSettings } from '@/hooks/useStaticSiteSettings';
import { useAuth } from "../../../hooks/useAuth";
import { useNavigation } from "../../../hooks/useNavigation";
import { useTheme } from "../../theme-provider";

export const FloatingHeader = ({
  className,
}: {
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const { isAuthenticated, user, logout } = useAuth();
  const { items: navigationItems, leftButtons, rightButtons } = useNavigation(user, isAuthenticated);
  const { settings } = useStaticSiteSettings();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use light logo on dark background, dark logo on light background
    return isDark ? '/static/images/logo-light.png' : '/static/images/logo-dark.png';
  }, [theme]);

  // Set to true by default so navbar is always visible
  const [visible, setVisible] = useState(true);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true); // Always visible at top
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(settings.header_is_sticky); // Only hide if not sticky
        }
      }
    }
  });

  const handleButtonClick = (button: typeof rightButtons[0]) => {
    if (button.action === 'auth') {
      logout();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: 0, // Start at 0 instead of -100
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-primary/20 rounded-full shadow-md z-[5000] pr-2 pl-4 py-2 items-center justify-center space-x-4",
          settings.header_background_transparent 
            ? "bg-background/20 backdrop-blur-md border-white/20" 
            : "bg-card",
          className
        )}
      >
        {/* Logo */}
        {settings.header_show_logo && (
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoSrc}
              alt={settings.header_logo_alt}
              className={cn(
                "w-auto transition-all duration-200",
                settings.header_show_company_name ? "h-8" : "h-12"
              )}
            />
            {settings.header_show_company_name && (
              <span className="text-sm font-semibold tracking-tighter">
                {settings.company_name}
              </span>
            )}
          </Link>
        )}

        {/* Divider - only show if logo is visible */}
        {settings.header_show_logo && (
          <div className="h-6 w-px bg-border"></div>
        )}

        {/* Admin Links */}
        {leftButtons.map((button, index) => (
          <Link key={`admin-${index}`} to={button.href}>
            <button className="border text-sm font-medium relative border-primary/20 bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors">
              <span>{button.name}</span>
            </button>
          </Link>
        ))}

        {/* Divider - only show if admin links exist */}
        {leftButtons.length > 0 && (
          <div className="h-6 w-px bg-border"></div>
        )}

        {/* Navigation Items */}
        {navigationItems.map((navItem: any, idx: number) => (
          <Link
            key={`link=${idx}`}
            to={navItem.href}
            className={cn(
              "relative text-foreground items-center flex space-x-1 hover:text-primary transition-colors"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm">{navItem.name}</span>
          </Link>
        ))}
        
        {/* Auth Buttons */}
        {rightButtons.map((button, index) => (
          button.action === 'auth' ? (
            <button
              key={index}
              onClick={() => handleButtonClick(button)}
              className="border text-sm font-medium relative border-primary/20 bg-secondary text-secondary-foreground px-4 py-2 rounded-full hover:bg-secondary/90 transition-colors"
            >
              <span>{button.name}</span>
              <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-accent to-transparent h-px" />
            </button>
          ) : (
            <Link key={index} to={button.href}>
              <button className={cn(
                "border text-sm font-medium relative border-primary/20 px-4 py-2 rounded-full transition-colors",
                button.name === 'Sign Up'
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}>
                <span>{button.name}</span>
              <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-accent to-transparent h-px" />
            </button>
          </Link>
          )
        ))}
        
        {/* Dark Mode Toggle */}
        {settings.header_show_dark_mode_toggle && (
          <div className="mx-1">
            <DarkModeToggle />
          </div>
        )}
        
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingHeader; 