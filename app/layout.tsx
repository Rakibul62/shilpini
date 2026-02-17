import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/components/react-query-provider';
import { CartProvider } from '@/lib/cart-context';
import { GoogleAnalytics } from '@/components/google-analytics';
import { FacebookPixel } from '@/components/facebook-pixel';
import { Toaster } from 'sonner';

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
        <GoogleAnalytics />
        <FacebookPixel />
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
