import { Inter } from 'next/font/google';
// display: 'swap' to prevent blocking text render
// This shows fallback font immediately while Inter loads
export const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // prevents font from blocking FCP
  preload: true,   // Preload the font file
  fallback: ['system-ui', 'arial'], // Specify fallback fonts
  adjustFontFallback: true, // Minimize layout shift when font loads
});