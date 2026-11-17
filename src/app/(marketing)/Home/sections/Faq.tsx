'use client';

import { useMemo, useState } from 'react';
import {
  Info,
  Building2,
  CreditCard,
  Plane,
  CalendarX2,
  Headset,
} from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All FAQs', Icon: Info },
  { id: 'about', label: 'About Us', Icon: Building2 },
  { id: 'booking', label: 'Booking & Payments', Icon: CreditCard },
  { id: 'travel', label: 'Travel & Packages', Icon: Plane },
  { id: 'cancellation', label: 'Cancellation Policy', Icon: CalendarX2 },
  { id: 'contact', label: 'Contact & Support', Icon: Headset },
];

const FAQS = [
  {
    id: '1',
    category: 'about',
    question: 'What is Aapka Tourism and what services do you offer?',
    answer:
      'Aapka Tourism is a travel agency specializing in Dubai and India tour packages. We offer customizable itineraries, group tours, honeymoon packages, and corporate travel solutions with end-to-end support.',
  },
  {
    id: '2',
    category: 'about',
    question: 'How many years of experience do you have in the travel industry?',
    answer:
      'We have over a decade of experience in organizing memorable travel experiences. Our team includes certified guides and travel experts dedicated to making your journey unforgettable.',
  },
  {
    id: '3',
    category: 'booking',
    question: 'How do I book a tour package?',
    answer:
      'You can book through our website by selecting a package, choosing your dates, and completing the payment. You can also call or WhatsApp us for personal assistance with your booking.',
  },
  {
    id: '4',
    category: 'booking',
    question: 'What payment methods do you accept?',
    answer:
      'We accept credit/debit cards, UPI, net banking, and bank transfers. For international bookings, we also accept major payment gateways. EMI options are available on selected packages.',
  },
  {
    id: '5',
    category: 'travel',
    question: 'What is included in the tour package?',
    answer:
      'Our packages typically include accommodation, breakfast, transportation, sightseeing as per itinerary, and the services of an experienced guide. Inclusions vary by package—please check the specific package details.',
  },
  {
    id: '6',
    category: 'travel',
    question: 'Do you offer visa assistance for Dubai and other destinations?',
    answer:
      'Yes, we provide visa assistance for Dubai, UAE, and other destinations. Our team will guide you through the documentation process and help with visa applications.',
  },
  {
    id: '7',
    category: 'cancellation',
    question: 'What is your cancellation policy?',
    answer:
      'Cancellation terms vary by package and timing. Generally, cancellations made 30+ days before departure may receive a partial refund. Please refer to the cancellation policy on your booking confirmation.',
  },
  {
    id: '8',
    category: 'cancellation',
    question: 'Can I reschedule my tour dates?',
    answer:
      'Yes, subject to availability and any applicable rescheduling fees. Please contact us as early as possible to discuss your options.',
  },
  {
    id: '9',
    category: 'contact',
    question: 'How can I reach your support team?',
    answer:
      'You can reach us via WhatsApp, phone, or email. Our support team is available during business hours to assist with bookings, queries, and travel assistance.',
  },
  {
    id: '10',
    category: 'contact',
    question: 'Do you provide 24/7 support during the trip?',
    answer:
      'Yes, we provide round-the-clock support during your trip. You will receive a dedicated contact number for emergencies and day-to-day assistance.',
  },
];

const PREVIEW = 5;

export default function Faq() {
  const [tab, setTab] = useState('all');
  const [openId, setOpenId] = useState<string | number | null>(FAQS[0].id);
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(
    () => (tab === 'all' ? FAQS : FAQS.filter((item) => item.category === tab)),
    [tab],
  );
  const visible = tab === 'all' && !showAll ? items.slice(0, PREVIEW) : items;
  const canToggle = tab === 'all' && items.length > PREVIEW;

  function onTab(id: string) {
    setTab(id);
    setShowAll(false);
    const next = id === 'all' ? FAQS : FAQS.filter((item) => item.category === id);
    setOpenId(next[0]?.id || null);
  }

  function onToggle(id: string | number) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <>
<div className="faq_section rn__section__gapTop">
  <div className="container">
    <div className="row">
      <div className="col-inner narrow">
        <div className="main_heading"><div><h2>Frequently asked questions</h2></div></div>
        <div className="inner__gapTop">
          <ul className="nav nav-pills faq_tabs ui-tabs" role="tablist">
            {TABS.map(({ id, label, Icon }) => (
              <li className="nav-item" key={id}>
                <button
                  type="button"
                  role="tab"
                  className={'nav-link ui-tabs__tab' + (tab === id ? ' active' : '')}
                  aria-selected={tab === id}
                  onClick={() => onTab(id)}
                >
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>

          <div className="accordion" key={tab}>
            {visible.map((item) => {
              const open = openId === item.id;
              return (
                <div className={'accordion-item' + (open ? ' active' : '')} key={item.id}>
                  <h3 className="accordion-header">
                    <button type="button" aria-expanded={open} onClick={() => onToggle(item.id)}>
                      {item.question}
                    </button>
                  </h3>
                  <div className={'accordion-collapse' + (open ? ' show' : '')}>
                    <div className="accordion-body">{item.answer}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {canToggle && (
            <div className="loadmore_faq">
              <button
                type="button"
                className="btn btn_primary mx-auto"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? 'Show Less' : 'Show More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
    </>
  );
}
