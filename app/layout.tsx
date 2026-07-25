import '@/app/globals.css';
import { inter } from '@/components/ui/assets/fonts';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ServiceWorkerCleanup } from './service-worker-cleanup';

export const metadata: Metadata = {
  title: {
    template: '%s | teamleaderleo',
    default: 'teamleaderleo',
  },
  description: 'Personal tools, notes, experiments, and public development activity from Leo Li.',
  metadataBase: new URL('https://teamleaderleo.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            background-color: #ffffff;
            color-scheme: light;
          }

          html.dark {
            background-color: #0e0e16;
            color-scheme: dark;
          }
        `}</style>
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <Analytics />
          <SpeedInsights />
          <ServiceWorkerCleanup />
        </ThemeProvider>
      </body>
    </html>
  );
}
