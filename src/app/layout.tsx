import type React from 'react';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import 'antd/dist/reset.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: 'Proptz',
  description:
    'Proptz is a platform that helps you manage your leads and get more sales.',
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={lato.variable}>
      <body className={lato.className}>
        <Toaster position='top-right' /> {/* Required */}
        {children}
      </body>
    </html>
  );
}
