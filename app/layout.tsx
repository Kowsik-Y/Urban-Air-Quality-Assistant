import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AirSense — Urban Air Quality & Winter Smog Assistant',
  description:
    'A GenAI-powered assistant helping Indian families and communities navigate severe winter smog with live CPCB/WAQI data and Gemini 1.5 Flash.',
  keywords: ['Air Quality', 'Smog', 'AQI', 'Delhi Smog', 'Winter Pollution', 'Gemini AI', 'CPCB'],
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
