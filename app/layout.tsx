import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/components/react-query-provider';
import { CartProvider } from '@/lib/cart-context';
import { GoogleAnalytics } from '@/components/google-analytics';
import Script from 'next/script';
import PixelTracker from '@/components/PixelTracker';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://shilpini.com',
  ),
  title: 'Shilpini - Authentic Punjabi Ethnic Wear',
  description:
    "Discover Shilpini's exclusive collection of premium Punjabi suits and authentic ethnic wear. Shop handcrafted designs featuring intricate embroidery, vibrant colors, and timeless elegance perfect for weddings, parties, and every special occasion.",
  keywords: [
    'Punjabi suits',
    'Ethnic wear',
    'Indian fashion',
    'Shilpini',
    'Handcrafted suits',
    'Party wear',
    'Wedding outfits',
  ],
  openGraph: {
    title: 'Shilpini - Authentic Punjabi Ethnic Wear',
    description:
      "Discover Shilpini's exclusive collection of premium Punjabi suits and authentic ethnic wear. Shop handcrafted designs featuring intricate embroidery, vibrant colors, and timeless elegance.",
    type: 'website',
    locale: 'en_US',
    siteName: 'Shilpini',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shilpini - Authentic Punjabi Ethnic Wear',
    description:
      "Discover Shilpini's exclusive collection of premium Punjabi suits and authentic ethnic wear.",
  },
  verification: {
    google: 'GsIAObyBqSPT3_FLdX4FDgWFbhIkE22TLAs9HwYfF9M',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <GoogleAnalytics />
        <Script
          id="facebook-pixel"
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
              fbq('init', '889801470746571', { test_event_code: 'TEST94275' });
              fbq('track', 'PageView');
            `,
          }}
        />
        <Suspense fallback={null}>
          <PixelTracker />
        </Suspense>
        <ReactQueryProvider>
          <CartProvider>
            {children}
            <Toaster position="top-center" richColors />
          </CartProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
