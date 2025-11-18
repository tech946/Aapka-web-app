import type React from 'react';
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import 'antd/dist/reset.css';
import ConditionalHeader from '@/components/marketing/Header/ConditionalHeader';
import ConditionalFooter from '@/components/marketing/Footer/ConditionalFooter';
import WhatsAppButton from '@/components/marketing/WhatsAppButton/WhatsAppButton';
import { CartProvider } from '@/context/CartContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Aapka Tourism',
  description:
    "With 10 years of experience in the travel industry and deep knowledge of Dubai's culture, attractions, and hidden gems, our expert guides ensure you get the most authentic and memorable experience possible. We don't just show you Dubai - we help you live it.",
  generator: 'aapka-tourism.com',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={poppins.variable}>
      <body className={poppins.className}>
        <CartProvider>
          <ConditionalHeader />
          <Toaster position='top-right' /> {/* Required */}
          {children}
          <ConditionalFooter />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
