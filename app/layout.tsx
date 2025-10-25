import '@/app/globals.css';
import { inter } from '@/components/ui/assets/fonts';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';
import { DeferredScripts } from './deferred-scripts';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: {
    template: '%s | teamleaderleo',
    default: 'teamleaderleo',
  },
  description: 'teamleaderleo.',
  metadataBase: new URL('https://teamleaderleo.com'),
  alternates: {
    canonical: 'https://teamleaderleo.com'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains to speed up third-party resources */}
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </Suspense>
        <DeferredScripts />
      </body>
    </html>
  );
}
