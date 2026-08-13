'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquareText } from 'lucide-react';
import './enquiry-button.css';

const ENQUIRY_PATH = '/travel-enquiry';

/**
 * Fixed vertical tab pinned to the right edge, mid-screen.
 *
 * Sits at the vertical centre so it never collides with the WhatsApp bubble in
 * the bottom-right corner. Hidden on the enquiry page itself and on the
 * dashboard/auth areas, which are not part of the marketing site.
 */
export default function EnquiryButton() {
  const pathname = usePathname();

  const isHidden =
    !pathname ||
    pathname.startsWith(ENQUIRY_PATH) ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/influencer') ||
    pathname.startsWith('/agent');

  if (isHidden) return null;

  return (
    <Link
      href={ENQUIRY_PATH}
      className='enquiry-tab'
      aria-label='Submit your enquiry'
    >
      <span className='enquiry-tab-inner'>
        <MessageSquareText size={15} className='enquiry-tab-icon' aria-hidden />
        <span className='enquiry-tab-label'>Submit your enquiry</span>
      </span>
    </Link>
  );
}
