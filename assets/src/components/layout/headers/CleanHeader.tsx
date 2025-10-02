import React from "react";
import { Book, Menu, Sunset, Trees, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../../lib/utils";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Button } from "../../ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface CleanHeaderProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
}

const CleanHeader = (props: CleanHeaderProps) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { items: navigationItems, leftButtons, rightButtons } = useNavigation(user, isAuthenticated);
  const { settings } = useStaticSiteSettings();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Use theme-specific logos from database if available
    if (isDark && settings.company_logo_dark) {
      return settings.company_logo_dark; // Light colored logo for dark background
    } else if (!isDark && settings.company_logo_light) {
      return settings.company_logo_light; // Dark colored logo for light background
    }
    
    // Fallback to general company logo
    return settings.company_logo;
  }, [theme, settings.company_logo_light, settings.company_logo_dark, settings.company_logo]);
  
  const logo = props.logo || {
    url: "/",
    src: logoSrc,
    alt: settings.header_logo_alt,
    title: settings.company_name,
  };
  
  const menu = navigationItems.map(item => ({
    title: item.name,
    url: item.href,
  }));

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
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            {/* Logo */}
            {settings.header_show_logo && (
            <Link to={logo.url} className="flex items-center gap-2">
                <img
                  src={logo.src}
                  className={cn(
                    "transition-all duration-200",
                    settings.header_show_company_name ? "max-h-8" : "max-h-12"
                  )}
                  alt={logo.alt}
                />
                {settings.header_show_company_name && (
              <span className="text-lg font-semibold tracking-tighter">
                    {settings.company_name}
              </span>
                )}
            </Link>
            )}
            {/* Admin Links */}
            {leftButtons.length > 0 && (
              <div className="flex items-center gap-2">
                {leftButtons.map((button, index) => (
                  <Button key={index} asChild variant="outline" size="sm">
                    <Link to={button.href}>{button.name}</Link>
                  </Button>
                ))}
              </div>
            )}
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rightButtons.map((button, index) => (
              button.action === 'auth' ? (
                <Button key={index} variant="outline" size="sm" onClick={() => handleButtonClick(button)}>
                  {button.name}
                </Button>
              ) : (
                <Button key={index} asChild variant={button.name === 'Sign Up' ? 'default' : 'outline'} size="sm">
                  <Link to={button.href}>{button.name}</Link>
                </Button>
              )
            ))}
            {settings.header_show_dark_mode_toggle && (
              <DarkModeToggle />
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            {/* Logo */}
            {settings.header_show_logo && (
            <Link to={logo.url} className="flex items-center gap-2">
                <img 
                  src={logo.src} 
                  className={cn(
                    "transition-all duration-200",
                    settings.header_show_company_name ? "max-h-8" : "max-h-12"
                  )} 
                  alt={logo.alt} 
                />
                {settings.header_show_company_name && (
                  <span className="text-lg font-semibold tracking-tighter">
                    {settings.company_name}
                  </span>
                )}
            </Link>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <div className="relative">
                  {/* Controls below and to the left of X button */}
                  {settings.header_show_dark_mode_toggle && (
                    <div className="absolute top-12 right-2 flex items-center gap-2">
                      <DarkModeToggle />
                    </div>
                  )}
                  
                  <SheetHeader>
                    <SheetTitle>
                      {settings.header_show_logo && (
                      <Link to={logo.url} className="flex items-center gap-2">
                          <img 
                            src={logo.src} 
                            className={cn(
                              "transition-all duration-200",
                              settings.header_show_company_name ? "max-h-8" : "max-h-12"
                            )} 
                            alt={logo.alt} 
                          />
                          {settings.header_show_company_name && (
                            <span className="text-lg font-semibold tracking-tighter">
                              {settings.company_name}
                            </span>
                          )}
                      </Link>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                </div>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="flex w-full flex-col gap-4"
                  >
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>

                    <div className="flex flex-col gap-3">
                    {rightButtons.map((button, index) => (
                      button.action === 'auth' ? (
                        <Button key={index} variant="outline" onClick={() => handleButtonClick(button)}>
                          {button.name}
                      </Button>
                      ) : (
                        <Button key={index} asChild variant={button.name === 'Sign Up' ? 'default' : 'outline'}>
                          <Link to={button.href}>{button.name}</Link>
                      </Button>
                      )
                    ))}
                    {isAuthenticated && user && (
                      <div className="text-sm text-muted-foreground">
                        Welcome, {user.username}
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items && item.items.length > 0) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
            {item.items.map((subItem) => (
              <SubMenuLink key={subItem.title} item={subItem} />
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink asChild>
        <Link
          to={item.url}
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
        >
          {item.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items && item.items.length > 0) {
    return (
      <AccordionItem key={item.title} value={item.title}>
        <AccordionTrigger className="text-base">{item.title}</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-2">
            {item.items.map((subItem) => (
              <Link
                key={subItem.title}
                to={subItem.url}
                className="flex items-center gap-3 rounded-md p-3 hover:bg-accent"
              >
                {subItem.icon}
                <div>
                  <div className="font-medium">{subItem.title}</div>
                  {subItem.description && (
                    <div className="text-sm text-muted-foreground">
                      {subItem.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem key={item.title} value={item.title}>
      <Link
        to={item.url}
        className="flex h-9 items-center justify-start text-base font-medium"
      >
        {item.title}
      </Link>
    </AccordionItem>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        to={item.url}
        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      >
        <div className="flex items-center gap-2">
          {item.icon}
          <div className="text-sm font-medium leading-none">{item.title}</div>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </Link>
    </NavigationMenuLink>
  );
};

export { CleanHeader };
export default CleanHeader; 