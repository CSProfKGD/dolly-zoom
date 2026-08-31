import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dolly-zoom.csprofkgd.chatgpt.site'),
  title: 'Dolly Zoom — Interactive Camera Demo',
  description: 'See how camera distance and focal length reshape perspective while a subject stays the same size.',
  openGraph: {
    title: 'Dolly Zoom — Interactive Camera Demo',
    description: 'Move the camera, adjust the lens, and reshape perspective in real time.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Dolly Zoom interactive camera demo' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dolly Zoom — Interactive Camera Demo',
    description: 'Move the camera, adjust the lens, and reshape perspective in real time.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
