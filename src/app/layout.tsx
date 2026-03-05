import type React from 'react';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import 'antd/dist/reset.css';
import ConditionalHeader from '@/components/marketing/Header/ConditionalHeader';
import ConditionalFooter from '@/components/marketing/Footer/ConditionalFooter';
import ConditionalWhatsAppButton from '@/components/marketing/WhatsAppButton/ConditionalWhatsAppButton';
import GTMPageViewTracker from '@/components/GTMPageViewTracker';
import { CartProvider } from '@/context/CartContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  opticalSizing: true,
});

export const metadata: Metadata = {
  title: 'Aapka Tourism',
  description:
    "With 10 years of experience in the travel industry and deep knowledge of Dubai's culture, attractions, and hidden gems, our expert guides ensure you get the most authentic and memorable experience possible. We don't just show you Dubai - we help you live it.",
  generator: 'aapka-tourism.com',
  other: {
    'google-fonts': 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:wght@300;400;500;600;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link
          href='https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Inter:wght@300;400;500;600;700&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager */}
        <Script
          id='google-tag-manager'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MCPK4VK3');`,
          }}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src='https://www.googletagmanager.com/ns.html?id=GTM-MCPK4VK3'
            height='0'
            width='0'
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <CartProvider>
          <Suspense fallback={null}>
            <GTMPageViewTracker />
          </Suspense>
          <ConditionalHeader />
          <Toaster position='top-right' /> {/* Required */}
          {children}
          <ConditionalFooter />
          <ConditionalWhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
