'use client';

import { usePathname } from 'next/navigation';
import { useSubtitle } from '@/contexts/SubtitleContext';
import { useEffect } from 'react';

export function usePageSubtitle() {
  const pathname = usePathname();
  const { subtitle, setSubtitle } = useSubtitle();
  
  useEffect(() => {
    // Route-based default subtitles
    const routeSubtitles: Record<string, string | undefined> = {
      '/': 'Home',
      '/dashboard': 'Dashboard',
      '/login': undefined,
    };
    
    if (subtitle === undefined) {
      const defaultSubtitle = routeSubtitles[pathname];
      setSubtitle(defaultSubtitle);
    }
  }, [pathname, subtitle, setSubtitle]);
  
  return { subtitle, setSubtitle };
}