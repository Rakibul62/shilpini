'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: (
      option: string,
      event: string,
      data?: Record<string, string | number | string[] | undefined>,
    ) => void;
  }
}

export const FacebookPixel = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Track PageView on route change
    if (typeof window.fbq !== 'undefined') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return (
    <div>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '756389740518410');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=756389740518410&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </div>
  );
};

// Start of Selection
type PixelEvent =
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe';

export const trackPixel = (
  event: PixelEvent,
  data?: Record<string, string | number | string[] | undefined>,
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
  }
};
