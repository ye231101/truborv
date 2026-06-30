import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { buildViewProWidgetUrl } from '@/lib/constants';
import { ViewProWidgetProvider } from '@/components/view-pro-widget-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Centurion by Entegra Coach | La Mesa RV',
  description:
    'The Entegra Centurion Super C on the Freightliner Cascadia chassis. Browse inventory, get your best price, and connect with a real Centurion specialist.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

const widgetUrl = buildViewProWidgetUrl();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{ backgroundColor: '#ffffff', color: '#171717' }}
        className={`${inter.variable} flex min-h-screen flex-col bg-white font-sans text-neutral-900 antialiased`}
      >
        <ViewProWidgetProvider>
          <Suspense>
            <main className="flex-1">{children}</main>

            <Script src={widgetUrl} strategy="afterInteractive" />

            <Analytics />
            <Toaster position="top-center" toastOptions={{ duration: 4500 }} />
          </Suspense>
        </ViewProWidgetProvider>
      </body>
    </html>
  );
}
