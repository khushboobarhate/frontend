import type { Metadata } from 'next';
import { Noto_Sans_Devanagari, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/context';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['latin'],
  variable: '--font-noto-devanagari',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Setu Moolya | AgriTech Value Chain',
  description:
    'Setu Moolya connects farmers, FPOs, and B2B buyers through transparent pricing, verified sourcing, and secure digital escrow.',
};

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  return (
    <html lang={params.locale ?? 'en'}>
      <body className={`${jakarta.variable} ${devanagari.variable} ${spaceGrotesk.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
