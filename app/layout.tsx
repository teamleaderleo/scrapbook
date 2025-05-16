import '@/components/ui/assets/globals.css';
import { inter } from '@/components/ui/assets/fonts';
import { Metadata } from 'next';
import { ServiceWorkerRegistration } from '@/components/ui/service-worker-registration';
import { ReactQueryProvider } from '@/components/query-client-provider';
import { Toaster } from "@/components/ui/components/toaster";

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
    <html lang="en">
      <ReactQueryProvider>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
          {children}
          <Toaster />
        </body>
        <ServiceWorkerRegistration />
      </ReactQueryProvider>
    </html>
  );
}