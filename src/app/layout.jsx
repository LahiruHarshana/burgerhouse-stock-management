import './globals.css';
import { Inter, Noto_Sans_Sinhala } from 'next/font/google';
import HtmlLang from '@/components/HtmlLang';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sinhala',
  display: 'swap',
});

export const metadata = {
  title: 'Burger House Stock',
  description: 'Stock management',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#124734' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${notoSinhala.variable} font-sans font-normal antialiased`}>
        <HtmlLang locale="en" />
        {children}
      </body>
    </html>
  );
}
