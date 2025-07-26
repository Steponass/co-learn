'use client';

import { usePathname } from 'next/navigation';
import { useSubtitle } from '@/contexts/SubtitleContext';
import { useEffect } from 'react';

export function usePageSubtitle() {
  const pathname = usePathname();
  const { subtitle, setSubtitle } = useSubtitle();
  
  useEffect(() => {

    if (pathname.startsWith('/session/')) {
      return; // Don't set any default subtitle for session pages
    }
    
    // Route-based default subtitles
    const routeSubtitles: Record<string, string | undefined> = {
      '/': undefined,
      '/dashboard': 'Dashboard',
      '/login': undefined,
    };
    
    const defaultSubtitle = routeSubtitles[pathname];
    console.log('[usePageSubtitle] Setting subtitle for', pathname, ':', defaultSubtitle);
    setSubtitle(defaultSubtitle);
    
  }, [pathname, setSubtitle]);
  
  return { subtitle, setSubtitle };
}