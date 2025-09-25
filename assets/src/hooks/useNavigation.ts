import { useState, useEffect } from 'react';
import { NAVIGATION_CONFIG } from '../../../GLOBALSETTINGS';

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
  rightButtons: NavigationButton[];
}

export const useNavigation = (user: User | null, isAuthenticated: boolean): NavigationData => {
  const [navigationData, setNavigationData] = useState<NavigationData>({
    items: [],
    rightButtons: isAuthenticated
      ? [{ name: 'Logout', href: '/logout', action: 'auth' as const }]
      : [
          { name: 'Login', href: '/login', action: 'route' as const },
          { name: 'Sign Up', href: '/register', action: 'route' as const }
        ]
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

      if (isAuthenticated && user?.is_site_manager) {
        navigationItems.push({
          name: 'Site Admin',
          href: '/dashboard',
          action: 'route'
        });
      }

      setNavigationData({
        items: navigationItems,
        rightButtons: isAuthenticated
          ? [{ name: 'Logout', href: '/logout', action: 'auth' as const }]
          : [
              { name: 'Login', href: '/login', action: 'route' as const },
              { name: 'Sign Up', href: '/register', action: 'route' as const }
            ]
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
  }, [user, isAuthenticated, refreshKey]);

  return navigationData;
}; 