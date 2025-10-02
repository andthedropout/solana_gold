import { useState, useEffect } from 'react';
import { NAVIGATION_CONFIG } from '../../../GLOBALSETTINGS';
import { useStaticSiteSettings } from './useStaticSiteSettings';

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  is_staff: boolean;
  is_site_manager: boolean;
}

interface NavigationItem {
  name: string;
  href: string;
  action: 'route';
}

interface NavigationButton {
  name: string;
  href: string;
  action: 'route' | 'auth';
}

interface NavigationData {
  items: NavigationItem[];
  leftButtons: NavigationButton[];
  rightButtons: NavigationButton[];
}

export const useNavigation = (user: User | null, isAuthenticated: boolean): NavigationData => {
  const { settings } = useStaticSiteSettings();

  const getRightButtons = () => {
    if (isAuthenticated) {
      return [{ name: 'Logout', href: '/logout', action: 'auth' as const }];
    }

    const buttons: NavigationButton[] = [];
    if (settings.header_show_login) {
      buttons.push({ name: 'Login', href: '/login', action: 'route' as const });
    }
    if (settings.header_show_signup) {
      buttons.push({ name: 'Sign Up', href: '/register', action: 'route' as const });
    }
    return buttons;
  };

  const [navigationData, setNavigationData] = useState<NavigationData>({
    items: [],
    leftButtons: [],
    rightButtons: getRightButtons()
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const loadNavigation = async () => {
      const navigationItems: NavigationItem[] = NAVIGATION_CONFIG.navItems.map(item => ({
        name: item.name,
        href: item.link,
        action: 'route' as const
      }));

      try {
        const response = await fetch('/api/v1/pages/header/');
        if (response.ok) {
          const pages = await response.json();
          const pageItems = pages.map((page: any) => ({
            name: page.title,
            href: `/${page.slug}/`,
            action: 'route' as const
          }));
          navigationItems.push(...pageItems);
        }
      } catch (error) {
        console.warn('Failed to fetch navigation pages:', error);
      }

      // Admin links go in leftButtons, not main navigation
      const leftButtons: NavigationButton[] = [];
      if (isAuthenticated && user?.is_site_manager) {
        leftButtons.push({
          name: 'Home',
          href: '/',
          action: 'route'
        });
        leftButtons.push({
          name: 'Exchange Admin',
          href: '/exchange-admin',
          action: 'route'
        });
      }

      setNavigationData({
        items: navigationItems,
        leftButtons,
        rightButtons: getRightButtons()
      });
    };

  useEffect(() => {
    loadNavigation();

    // Listen for navigation refresh events
    const handleNavigationRefresh = () => {
      loadNavigation();
    };

    window.addEventListener('refreshNavigation', handleNavigationRefresh);

    return () => {
      window.removeEventListener('refreshNavigation', handleNavigationRefresh);
    };
  }, [user, isAuthenticated, refreshKey, settings.header_show_login, settings.header_show_signup]);

  return navigationData;
}; 