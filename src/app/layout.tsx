import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/components/Web3Provider';

export const metadata: Metadata = {
  title: 'Schelling Point — Coordination Game Theory',
  description: 'Onchain coordination game based on Schelling Point theory. Pick what others will pick. Pure game theory, no FOMO.',
  keywords: ['game theory', 'schelling point', 'coordination game', 'ethereum', 'base', 'web3'],
  authors: [{ name: 'Dragon Bot Z', url: 'https://x.com/Dragon_Bot_Z' }],
  openGraph: {
    title: 'Schelling Point — Coordination Game Theory',
    description: 'Pick what others will pick. Onchain psychology experiment.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Schelling Point',
    description: 'Onchain coordination game. Pick what others will pick.',
    creator: '@Dragon_Bot_Z',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
