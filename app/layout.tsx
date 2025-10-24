import '@/app/globals.css';
import { inter } from '@/components/ui/assets/fonts';
import { Metadata } from 'next';
import { ReactQueryProvider } from '@/components/query-client-provider';
import { Toaster } from "@/components/ui/components/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import dynamic from 'next/dynamic';

// Defer non-critical components to after initial paint
const Analytics = dynamic(() => import("@vercel/analytics/next").then(mod => ({ default: mod.Analytics })), { ssr: false });
const SpeedInsights = dynamic(() => import('@vercel/speed-insights/next').then(mod => ({ default: mod.SpeedInsights })), { ssr: false });
const ServiceWorkerRegistration = dynamic(() => import('@/components/ui/service-worker-registration').then(mod => ({ default: mod.ServiceWorkerRegistration })), { ssr: false });

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
      <body 
        className={`${inter.className} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            {children}
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
        
        {/* These load after the page paints */}
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}