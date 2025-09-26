"use client";

import React from "react";
import { MenuIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";

import { Button } from "../../ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../../ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../ui/sheet";
import { DarkModeToggle } from "../../dark-mode-toggle";
import { NAVIGATION_CONFIG } from "../../../../../GLOBALSETTINGS";
import { useStaticSiteSettings } from '@/hooks/useStaticSiteSettings';
import { useAuth } from "../../../hooks/useAuth";
import { useNavigation } from "../../../hooks/useNavigation";
import { useTheme } from "../../theme-provider";

const ProfessionalHeader = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { items: navigationItems, rightButtons } = useNavigation(user, isAuthenticated);
  const { settings } = useStaticSiteSettings();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use light logo on dark background, dark logo on light background
    return isDark ? '/static/images/logo-light.png' : '/static/images/logo-dark.png';
  }, [theme]);

  const handleButtonClick = (button: typeof rightButtons[0]) => {
    if (button.action === 'auth') {
      logout();
    }
  };

  return (
    <section className={`py-4 ${
      settings.header_background_transparent 
        ? 'bg-background/20 backdrop-blur-md' 
        : 'bg-background'
    } ${settings.header_is_sticky ? 
      'sticky top-0 z-50 border-b border-border' : ''}`}>
      <div className="container">
        <nav className="flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center">
            {settings.header_show_logo && (
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <img
              src={logoSrc}
                  className={cn(
                    "transition-all duration-200",
                    settings.header_show_company_name ? "max-h-8" : "max-h-12"
                  )}
              alt={settings.header_logo_alt}
            />
                {settings.header_show_company_name && (
            <span className="text-lg font-semibold tracking-tighter">
                    {settings.company_name}
            </span>
                )}
          </Link>
            )}
          </div>

          {/* Center: Navigation Menu */}
          <div className="flex-1 flex justify-center">
          <NavigationMenu className="hidden lg:block">
              <NavigationMenuList className="flex items-center">
                {navigationItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink asChild>
                    <Link
                        to={item.href}
                      className={navigationMenuTriggerStyle()}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 lg:flex">
              {rightButtons.map((button, index) => (
                button.action === 'auth' ? (
                  <Button key={index} variant="outline" size="sm" onClick={() => handleButtonClick(button)}>
                    {button.name}
                </Button>
                ) : (
                  <Button key={index} asChild variant={button.name === 'Sign Up' ? 'default' : 'outline'}>
                    <Link to={button.href}>{button.name}</Link>
                </Button>
                )
              ))}
              {settings.header_show_dark_mode_toggle && (
                <DarkModeToggle />
              )}
          </div>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-screen overflow-auto">
              <div className="flex flex-col h-full">
                {/* Header Section with Logo */}
                <div className="flex items-center justify-center py-6 border-b">
                  {settings.header_show_logo && (
                    <Link to="/" className="flex items-center gap-3">
                      <img
                        src={logoSrc}
                        className={cn(
                          "transition-all duration-200",
                          settings.header_show_company_name ? "max-h-10" : "max-h-14"
                        )}
                        alt={settings.header_logo_alt}
                      />
                      {settings.header_show_company_name && (
                        <span className="text-xl font-semibold tracking-tight">
                          {settings.company_name}
                        </span>
                      )}
                    </Link>
                  )}
                </div>

                {/* User Info Section */}
                {isAuthenticated && user && (
                  <div className="py-4 px-6 bg-muted/30 border-b">
                    <div className="text-center">
                      <p className="text-sm font-medium">Welcome back!</p>
                      <p className="text-lg font-semibold text-primary">{user.username}</p>
                      {user.is_site_manager && (
                        <p className="text-xs text-muted-foreground mt-1">Site Administrator</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex-1 py-6 px-6">
                  <div className="flex flex-col gap-4">
                    {navigationItems.map((item, index) => (
                      <Link 
                        key={index} 
                        to={item.href} 
                        className="py-3 px-4 text-center font-medium text-lg rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Action Buttons Section */}
                <div className="py-6 px-6 border-t">
                  <div className="flex flex-col gap-3">
                    {rightButtons.map((button, index) => (
                      button.action === 'auth' ? (
                        <Button 
                          key={index} 
                          variant="outline" 
                          size="lg"
                          className="w-full"
                          onClick={() => handleButtonClick(button)}
                        >
                          {button.name}
                        </Button>
                      ) : (
                        <Button 
                          key={index} 
                          asChild 
                          variant={button.name === 'Sign Up' ? 'default' : 'outline'}
                          size="lg"
                          className="w-full"
                        >
                          <Link to={button.href}>{button.name}</Link>
                        </Button>
                      )
                    ))}
                  </div>
                </div>

                {/* Controls Section */}
                {settings.header_show_dark_mode_toggle && (
                  <div className="py-4 px-6 border-t bg-muted/20">
                    <div className="flex flex-row items-center justify-center gap-6">
                      {settings.header_show_dark_mode_toggle && (
                        <DarkModeToggle />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </nav>
      </div>
    </section>
  );
};

export { ProfessionalHeader };
export default ProfessionalHeader; 