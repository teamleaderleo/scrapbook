import '@/components/ui/global.css';
import { inter } from '@/components/ui/fonts';
import { Metadata } from 'next';
 
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
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
