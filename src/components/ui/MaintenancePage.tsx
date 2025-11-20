'use client';

import { Phone, MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface MaintenancePageProps {
  callNumber?: string;
  whatsappNumber?: string;
}

export default function MaintenancePage({
  callNumber = '+917042857575',
  whatsappNumber = '+971567809460',
}: MaintenancePageProps) {
  const whatsappNumberClean = whatsappNumber.replace(/[^0-9]/g, '');
  const callUrl = `tel:${callNumber}`;
  const whatsappUrl = `https://wa.me/${whatsappNumberClean}`;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-12'>
      <div className='max-w-4xl w-full text-center'>
        {/* Logo */}
        <div className='mb-6 md:mb-8 flex justify-center'>
          <Image
            src='/aapka-tourism-logo.png'
            alt='Aapka Tourism'
            width={120}
            height={150}
            className='object-contain w-20 h-auto md:w-[120px]'
          />
        </div>

        {/* Main Banner */}
        <div className='bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border border-gray-100'>
          <div className='mb-6'>
            <div className='inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold mb-4 md:mb-6'>
              🚧 Under Maintenance
            </div>
            <h1 className='text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-4'>
              We&apos;re Making
              <br />
              <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
                Something Amazing
              </span>
            </h1>
            <p className='text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-2 md:px-0'>
              Our website is currently under maintenance. We&apos;re working
              hard to improve your experience and will be back soon!
            </p>
          </div>

          {/* Contact Section */}
          <div className='mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-200'>
            <p className='text-gray-700 text-base md:text-lg font-semibold mb-4 md:mb-6'>
              Need immediate assistance? Contact us:
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              {/* Call Button */}
              <a
                href={callUrl}
                className='group flex items-center gap-2 md:gap-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto justify-center min-w-[200px] md:min-w-[240px]'
              >
                <Phone
                  size={20}
                  className='md:w-6 md:h-6 group-hover:rotate-12 transition-transform'
                />
                <span>Call Us</span>
                <span className='font-mono text-sm md:text-base'>
                  {callNumber}
                </span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='group flex items-center gap-2 md:gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto justify-center min-w-[200px] md:min-w-[240px]'
              >
                <MessageCircle
                  size={20}
                  className='md:w-6 md:h-6 group-hover:rotate-12 transition-transform'
                />
                <span>WhatsApp</span>
                <span className='font-mono text-sm md:text-base'>
                  {whatsappNumber}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className='text-gray-500 text-sm'>
          Thank you for your patience. We&apos;ll be back soon! ✨
        </p>
      </div>
    </div>
  );
}
