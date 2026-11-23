import type React from 'react';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { DM_Sans } from 'next/font/google';
// Desert Ember tokens (opt-in via .desert-ember).
import '../../design-system/tokens.css';
import './globals.css';
import SiteToaster from '@/components/site/toast/SiteToaster';
import { PageJsonLd, applyPageSeo } from '@/features/seo/server';
import 'antd/dist/reset.css';
import ConditionalHeader from '@/components/marketing/Header/ConditionalHeader';
import ConditionalFooter from '@/components/marketing/Footer/ConditionalFooter';
import { QueryProvider } from '@/providers/QueryProvider';
import ScrollReset from '@/components/site/ScrollReset';
import GTMPageViewTracker from '@/components/GTMPageViewTracker';
import { BookingProvider } from '@/context/BookingContext';
import SignupPopup from '@/components/site/signup/SignupPopup';
import SmoothScroll from '@/components/site/SmoothScroll';
import RouteProgress from '@/components/site/RouteProgress';
import PostHogTracker from '@/components/site/PostHogTracker';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const BASE_METADATA: Metadata = {
  title: 'Aapka Tourism',
  description:
    "With 10 years of experience in the travel industry and deep knowledge of Dubai's culture, attractions, and hidden gems, our expert guides ensure you get the most authentic and memorable experience possible. We don't just show you Dubai - we help you live it.",
  generator: 'aapka-tourism.com',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(BASE_METADATA);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className={dmSans.variable}>
      <head>
        <PageJsonLd placement='head' />
      </head>
      <body className={dmSans.className}>
        <PageJsonLd placement='body-start' />
        {/* Google Tag Manager */}
        <Script
          id='google-tag-manager'
          strategy='afterInteractive'
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
        <QueryProvider>
          <BookingProvider>
          <Suspense fallback={null}>
            <GTMPageViewTracker />
            <RouteProgress />
          </Suspense>
          <ScrollReset />
          <PostHogTracker />
          <SmoothScroll />
          <ConditionalHeader />
          <SiteToaster />
          {children}
          <ConditionalFooter />
          <SignupPopup />
        </BookingProvider>
        </QueryProvider>
        <PageJsonLd placement='body-end' />
      </body>
    </html>
  );
}
