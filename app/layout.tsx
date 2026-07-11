import '@/app/globals.css';
import { inter } from '@/components/ui/assets/fonts';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { DeferredScripts } from './deferred-scripts';

const themeInitScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const theme =
        savedTheme === 'light' || savedTheme === 'dark'
          ? savedTheme
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';

      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    } catch {}
  })();
`;

export const metadata: Metadata = {
  title: {
    template: '%s | teamleaderleo',
    default: 'teamleaderleo',
  },
  description: 'teamleaderleo.',
  metadataBase: new URL('https://teamleaderleo.com'),
  alternates: {
    canonical: 'https://teamleaderleo.com',
  },
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Preconnect to external domains to speed up third-party resources */}
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
        </ThemeProvider>
        <DeferredScripts />
      </body>
    </html>
  );
}
