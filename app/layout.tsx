import '@/components/ui/global.css';
import { inter } from '@/components/ui/fonts';
import { Metadata } from 'next';
import { ServiceWorkerRegistration } from '@/components/ui/service-worker-registration';
import { ReactQueryProvider } from '@/components/query-client-provider';
 
export const metadata: Metadata = {
  title: {
    template: '%s | Setzen',
    default: 'Setzen',
  },
  description: 'Setzen.',
  metadataBase: new URL('https://setzen.vercel.app/'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ReactQueryProvider>
        <body className={`${inter.className} antialiased`}>{children}</body>
        <ServiceWorkerRegistration />
      </ReactQueryProvider>
    </html>
  );
}
