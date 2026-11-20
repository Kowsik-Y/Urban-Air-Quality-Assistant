import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'AirSense — Urban Air Quality & Winter Smog Assistant',
  description:
    'A GenAI-powered assistant helping Indian families and communities navigate severe winter smog with live CPCB/WAQI data and Gemini 2.5 Flash.',
  keywords: [
    'Air Quality',
    'Winter Smog',
    'AQI Delhi',
    'CPCB NAAQS',
    'PM2.5 Exposure',
    'AirSense',
    'Gemini AI',
    'Clean Air Hacks',
  ],
  authors: [{ name: 'AirSense Engineering Team' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
    shortcut: '/icon.svg',
  },
  openGraph: {
    title: 'AirSense — Urban Air Quality & Winter Smog Assistant',
    description: 'Empowering Indian urban households against severe winter smog with live CAAQMS telemetry and GenAI.',
    type: 'website',
    locale: 'en_IN',
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark scroll-smooth ${jakarta.variable}`}>
      <body className={`${jakarta.className} min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {/* Accessible Skip Link for screen readers & keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
