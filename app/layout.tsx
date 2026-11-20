import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
