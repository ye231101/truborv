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
    'The Entegra Centurion Super C on the Freightliner Cascadia chassis. See it live, talk to our AI specialist, and connect with a real Centurion expert.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
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
        style={{ backgroundColor: '#0a0a0a', color: '#f5f5f5' }}
        className={`${inter.variable} flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-neutral-100 antialiased`}
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
