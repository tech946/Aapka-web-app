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
import './footer.css';

const stats = [
  { icon: Plane, value: '26+', label: 'Tour Completed' },
  { icon: Clock4, value: '12+', label: 'Travel Experience' },
  { icon: Smile, value: '20+', label: 'Happy Traveler' },
  { icon: CreditCard, value: '98%', label: 'Retention Rate' },
];

const topDestinations = [
  '4 Night 5 Days Dubai Summer Holiday Package',
  '3 Nights 4 Days Dubai Holiday Package',
  '4 Night 5 Days Dubai City Tour Package',
  '4 Night 5 Days Dubai Safari Tour Package',
];

const popularSearch = [
  'Dubai Trio Tour Package',
  'Evening Desert Safari With BBQ Dinner (Private Upto 6 Pax)',
  'Dubai Airport Drop off',
  'Dubai City Tour',
  'Dubai Airport Pickup All Terminals',
  'Chrysler Limousine Ride',
  'Global Village',
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

export default function Footer() {
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
              <p>+971 565798798</p>
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
              <p>+971 565798798</p>
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
                  src='/aapka-tourism-logo.png'
                  alt='Aapka Tourism'
                  width={80}
                  height={100}
                />
              </div>
            </div>

            <address>
              Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al
              Mankhool, Bur Dubai, UAE. India Office: 1522 B, Hemkunt Chambers
              89, Nehru Place, Delhi 110019
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
              <h4>Holiday Package</h4>
              <ul>
                {topDestinations.map(item => (
                  <li key={item}>
                    <a href='#'>{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className='footer_links_column'>
              <h4>Top Tours</h4>
              <ul>
                {popularSearch.map(item => (
                  <li key={item}>
                    <a href='#'>{item}</a>
                  </li>
                ))}
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
          <p>Copyright ©2025 Egens Lab | All Right Reserved.</p>
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
