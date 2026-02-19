'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track PageView when pathname or searchParams change
    const url = window.location.href;
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'PageView', { page: url });
    }
  }, [pathname, searchParams]);

  return null;
}
