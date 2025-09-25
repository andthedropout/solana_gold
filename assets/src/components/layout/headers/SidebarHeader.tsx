"use client";

import { cn } from "../../../lib/utils";
import { Link } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { DarkModeToggle } from "../../dark-mode-toggle";
import { Button } from "../../ui/button";
import { NAVIGATION_CONFIG, getNavigationItems } from "../../../../../GLOBALSETTINGS";
import { useSiteSettingsWithPreview } from '@/hooks/useSiteSettingsWithPreview';
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "../../theme-provider";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const SidebarHeader = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const { isAuthenticated, user, logout } = useAuth();
  const { settings } = useSiteSettingsWithPreview();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use light logo on dark background, dark logo on light background
    return isDark ? '/static/images/logo-light.png' : '/static/images/logo-dark.png';
  }, [theme]);
  
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col border-r border-border w-[300px] flex-shrink-0",
        settings?.header_background_transparent 
          ? "bg-background/20 backdrop-blur-md" 
          : "bg-card",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-2 mb-6">
        {settings.header_show_logo && (
          <Link to="/" className="flex items-center gap-2 hover:opacity-80">
            <img
              src={logoSrc}
              alt={settings.header_logo_alt}
              className={cn(
                "transition-all duration-200",
                settings.header_show_company_name ? "h-8" : "h-12"
              )}
            />
            {settings.header_show_company_name && (
              <motion.span
                animate={{
                  display: animate ? (open ? "inline-block" : "none") : "inline-block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-lg font-semibold tracking-tighter whitespace-pre"
              >
                {settings.company_name}
              </motion.span>
            )}
          </Link>
        )}
      </div>

      {/* Dark Mode Toggle */}
      {settings.header_show_dark_mode_toggle && (
        <div className="mb-4 flex justify-center">
          <DarkModeToggle />
        </div>
      )}

      {/* Navigation Content */}
      <div className="flex-1">
      {children}
      </div>

      {/* Auth Buttons Footer */}
      <div className="mt-auto space-y-2">
        {isAuthenticated ? (
          <motion.div
            animate={{
              display: animate ? (open ? "block" : "none") : "block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
          >
            <Button variant="outline" className="w-full" onClick={logout}>
              Logout
            </Button>
          </motion.div>
        ) : (
          <>
            {settings.header_show_login && (
              <motion.div
                animate={{
                  display: animate ? (open ? "block" : "none") : "block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
              >
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">Sign in</Link>
                </Button>
              </motion.div>
            )}
            {settings.header_show_signup && (
              <motion.div
                animate={{
                  display: animate ? (open ? "block" : "none") : "block",
                  opacity: animate ? (open ? 1 : 0) : 1,
                }}
              >
                <Button asChild className="w-full">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const { isAuthenticated, user, logout } = useAuth();
  const { settings } = useSiteSettingsWithPreview();
  const { theme } = useTheme();
  
  // Determine which logo to use based on current theme
  const logoSrc = React.useMemo(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    // Use light logo on dark background, dark logo on light background
    return isDark ? '/static/images/logo-light.png' : '/static/images/logo-dark.png';
  }, [theme]);
  
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between border-b border-border w-full",
          settings.header_background_transparent 
            ? "bg-background/20 backdrop-blur-md" 
            : "bg-card"
        )}
        {...props}
      >
        {/* Mobile Logo */}
        {settings.header_show_logo && (
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoSrc}
              alt={settings.header_logo_alt}
              className="h-8"
            />
            {settings.header_show_company_name && (
              <span className="text-lg font-semibold tracking-tighter">
                {settings.company_name}
              </span>
            )}
          </Link>
        )}

        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-foreground cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-foreground cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>

              {/* Mobile Logo */}
              {settings.header_show_logo && (
                <Link to="/" className="flex items-center gap-2 mb-6">
                  <img
                    src={settings.company_logo}
                    alt={settings.header_logo_alt}
                    className="h-8"
                  />
                  {settings.header_show_company_name && (
                    <span className="text-lg font-semibold tracking-tighter">
                      {settings.company_name}
                    </span>
                  )}
                </Link>
              )}

              {/* Dark Mode Toggle */}
              {settings.header_show_dark_mode_toggle && (
                <div className="mb-4 flex justify-center">
                  <DarkModeToggle />
                </div>
              )}

              {children}

              {/* Mobile Auth Buttons */}
              <div className="space-y-2 mt-auto">
                {isAuthenticated ? (
                  <Button variant="outline" className="w-full" onClick={logout}>
                    Logout
                  </Button>
                ) : (
                  <>
                    {settings.header_show_login && (
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Sign in</Link>
                      </Button>
                    )}
                    {settings.header_show_signup && (
                      <Button asChild className="w-full">
                        <Link to="/signup">Sign up</Link>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 text-foreground hover:text-primary transition-colors",
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export default SidebarHeader; 