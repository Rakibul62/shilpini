
import Image from 'next/image';
import Script from 'next/script';

const FacebookPixel = () => {
  return (
    <>
      <Script
        strategy="afterInteractive"
        id="facebook-pixel"
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
fbq('init', process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
fbq('track', 'PageView');
  `,
        }}
      />
      <noscript>
        <Image
          height={1}
          width={1}
          style={{ display: 'none' }}
          alt="facebook-pixel"
          src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
};

export default FacebookPixel;

// Types and helper retained for compatibility
declare global {
  interface Window {
    fbq: (
      option: string,
      event: string,
      data?: Record<string, string | number | string[] | undefined>,
    ) => void;
  }
}

export type PixelEvent =
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
  if (typeof window !== 'undefined') {
    if (window.fbq) {
      window.fbq('track', event, data);
    } else {
      setTimeout(() => {
        if (window.fbq) {
          window.fbq('track', event, data);
        }
      }, 500);
    }
  }
};
