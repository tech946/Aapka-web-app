'use client';

import {
  Clock4,
  CreditCard,
  Facebook,
  Headset,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Plane,
  Smile,
  Youtube,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import './footer.css';

const stats = [
  { icon: Plane, value: '26+', label: 'Tour Completed' },
  { icon: Clock4, value: '12+', label: 'Travel Experience' },
  { icon: Smile, value: '20+', label: 'Happy Traveler' },
  { icon: CreditCard, value: '98%', label: 'Retention Rate' },
];

const resources = [
  'About Us',
  'Contact Us',
  'Terms and Conditions',
  'Disclaimer',
  'Privacy Policy',
  'Site Map',
  'Refund & Cancellation Policy',
];

interface Package {
  package_id: string;
  package_name: string;
  category_name: string;
}

export default function Footer() {
  const [offerPackages, setOfferPackages] = useState<Package[]>([]);
  const [tours, setTours] = useState<Package[]>([]);

  useEffect(() => {
    const fetchFooterPackages = async () => {
      try {
        // Fetch packages from "Offer Packages" category
        const offerResponse = await fetch(
          '/api/packages?categorySlug=offer-packages&limit=4'
        );
        const offerResult = await offerResponse.json();
        if (offerResult.success && offerResult.data) {
          setOfferPackages(offerResult.data);
        }

        // Fetch packages from "UAE Tours" category
        const toursResponse = await fetch(
          '/api/packages?categorySlug=uae-tours&limit=7'
        );
        const toursResult = await toursResponse.json();
        if (toursResult.success && toursResult.data) {
          setTours(toursResult.data);
        }
      } catch (error) {
        console.error('Error fetching footer packages:', error);
      }
    };

    fetchFooterPackages();
  }, []);

  const getCategorySlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  };

  return (
    <footer className='footer_section'>
      <div className='footer_contact_bar'>
        <div className='footer_contact_inner container'>
          <div className='footer_inquiry'>
            <Headset size={28} />
            <div>
              <span>To More Inquiry</span>
              <p>Don&apos;t hesitate call to Aapka Tourism.</p>
            </div>
          </div>
          <div className='footer_contact_item'>
            <MessageCircle size={22} />
            <div>
              <span>WhatsApp</span>
              <p>AE - +971567809460</p>
              <p>IN - +917042857575</p>
            </div>
          </div>
          <div className='footer_contact_item'>
            <Mail size={22} />
            <div>
              <span>Mail Us</span>
              <p>info@aapkatourism.com</p>
            </div>
          </div>
          <div className='footer_contact_item'>
            <Phone size={22} />
            <div>
              <span>Call Us</span>
              <p>AE - +971567809460</p>
              <p>IN - +917042857575</p>
            </div>
          </div>
        </div>
      </div>

      <div className='footer_main'>
        <div className='footer_main_inner container'>
          <div className='footer_brand'>
            <div className='footer_logo'>
              <div>
                <Image
                  className='mb-2'
                  src='/aapka-tourism-logo-footer.png'
                  alt='Aapka Tourism'
                  width={80}
                  height={100}
                />
              </div>
            </div>

            <address>
              Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al
              Mankhool, Bur Dubai, UAE.
              <br />
              India Office: 1522 B, Hemkunt Chambers 89, Nehru Place, Delhi
              110019
            </address>

            <div className='footer_social'>
              <a
                aria-label='Aapka Tourism on Facebook'
                href='https://www.facebook.com/KamalPandeyVlog'
                target='_blank'
                rel='noreferrer'
              >
                <Facebook size={18} />
              </a>
              <a
                aria-label='Aapka Tourism on Instagram'
                href='https://www.instagram.com/kamalpandeyvlogs/'
                target='_blank'
                rel='noreferrer'
              >
                <Instagram size={18} />
              </a>
              <a
                aria-label='Aapka Tourism on YouTube'
                href='https://www.youtube.com/@KamalPandeyVlog'
                target='_blank'
                rel='noreferrer'
              >
                <Youtube size={18} />
              </a>
              <a aria-label='Aapka Tourism on LinkedIn' href='#'>
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          <div className='footer_links'>
            <div className='footer_links_column'>
              <h4>Offer Packages</h4>
              <ul>
                {offerPackages.length > 0 ? (
                  offerPackages.map(pkg => (
                    <li key={pkg.package_id}>
                      <Link
                        href={`/category/${getCategorySlug(pkg.category_name)}/${pkg.package_id}`}
                      >
                        {pkg.package_name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>
                    <Link href='/category/offer-packages'>
                      View Offer Packages
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            <div className='footer_links_column'>
              <h4>Top Tours</h4>
              <ul>
                {tours.length > 0 ? (
                  tours.map(tour => (
                    <li key={tour.package_id}>
                      <Link
                        href={`/category/${getCategorySlug(tour.category_name)}/${tour.package_id}`}
                      >
                        {tour.package_name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>
                    <Link href='/category/uae-tours'>View Tours</Link>
                  </li>
                )}
              </ul>
            </div>

            <div className='footer_links_column'>
              <h4>Useful Links</h4>
              <ul>
                {resources.map(item => (
                  <li key={item}>
                    <a href='#'>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className='footer_bottom'>
        <div className='footer_bottom_inner container'>
          <p>Copyright ©2025 Aapka Tourism | All Right Reserved.</p>
          <div className='footer_payments'>
            <span>Accepted Payment Methods :</span>
            <ul>
              <li>Visa</li>
              <li>Mastercard</li>
              <li>PayPal</li>
              <li>G Pay</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
