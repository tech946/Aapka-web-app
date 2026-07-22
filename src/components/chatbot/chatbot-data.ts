import type { ChatNode } from './types';

export const CHATBOT_GREETING =
  'Hi! Welcome to Aapka Tourism 👋 How can I help you today?';

export const WHATSAPP_URL =
  'https://api.whatsapp.com/send/?phone=971567809460&text=Hi,%20I%20need%20help%20with%20Aapka%20Tourism.%20Please%20assist%20me.&type=phone_number&app_absent=0';

export const CONTACT = {
  whatsappUae: '+971 567809460',
  phoneUae: '+971567809460',
  phoneIndia: '+917042857575',
  email: 'info@aapkatourism.com',
  uaeOffice:
    'Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool, Bur Dubai, UAE',
  indiaOffice: '1522 B, Hemkunt Chambers 89, Nehru Place, Delhi 110019',
};

export const CHAT_NODES: Record<string, ChatNode> = {
  // ── Start: max 3 pills ────────────────────────────────────
  start: {
    id: 'start',
    options: [
      { label: 'Tour packages', nextId: 'tours-menu' },
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: 'Contact us', nextId: 'contact-menu' },
    ],
  },

  // ── Tours ───────────────────────────────────────────────────
  'tours-menu': {
    id: 'tours-menu',
    prompt: 'What would you like to know about our tours?',
    options: [
      { label: 'What tours do you offer?', nextId: 'tours-offerings' },
      { label: 'Marina cruise dinner', nextId: 'tours-marina' },
      { label: 'Customize my trip', nextId: 'tours-customize' },
    ],
  },
  'tours-offerings': {
    id: 'tours-offerings',
    answer:
      'We offer Dubai & Abu Dhabi holiday packages, desert safari, city tours, marina cruise dinner, honeymoon packages, group tours, and limited-time deals.',
    options: [
      { label: 'Limited time deals', nextId: 'tours-deals' },
      { label: "What's included?", nextId: 'tours-inclusions' },
      { label: 'Submit an enquiry', nextId: 'tours-enquiry' },
    ],
    links: [{ label: 'Browse tours', href: '/category/uae-tours' }],
  },
  'tours-marina': {
    id: 'tours-marina',
    answer:
      'Our Marina Cruise Dinner includes an evening dhow cruise with dinner and scenic Dubai Marina views. View packages, pick dates, and book on our website.',
    options: [
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: "What's included?", nextId: 'tours-inclusions' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'View marina cruises', href: '/marina-cruise-dinner' }],
  },
  'tours-deals': {
    id: 'tours-deals',
    answer:
      'Check our Limited Time Deals for special offers on Dubai packages. Deals update regularly — book early for the best price.',
    options: [
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: 'Payment methods', nextId: 'booking-payments' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'View deals', href: '/limited-time-deals' }],
  },
  'tours-inclusions': {
    id: 'tours-inclusions',
    answer:
      'Packages typically include accommodation, breakfast, transport, sightseeing per itinerary, and a guide. Inclusions vary — check each package page before booking.',
    options: [
      { label: 'Customize my trip', nextId: 'tours-customize' },
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: 'Browse tours', nextId: 'tours-offerings' },
    ],
  },
  'tours-customize': {
    id: 'tours-customize',
    answer:
      'Use Customize Your Package to set dates, hotel, activities, and budget. Or submit a travel enquiry and our team will prepare a quote.',
    options: [
      { label: 'Submit an enquiry', nextId: 'tours-enquiry' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'How do I book?', nextId: 'booking-how' },
    ],
    links: [{ label: 'Customize package', href: '/customize-your-package' }],
  },
  'tours-enquiry': {
    id: 'tours-enquiry',
    answer:
      'Fill in our Travel Enquiry with your dates, travelers, hotel preference, visa needs, and budget. We will get back with a personalized package.',
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Call or email', nextId: 'contact-details' },
    ],
    links: [{ label: 'Open enquiry form', href: '/travel-enquiry' }],
  },

  // ── Booking ─────────────────────────────────────────────────
  'booking-menu': {
    id: 'booking-menu',
    prompt: 'What do you need help with for booking?',
    options: [
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: 'Payment methods', nextId: 'booking-payments' },
      { label: 'Advance payment', nextId: 'booking-advance' },
    ],
  },
  'booking-how': {
    id: 'booking-how',
    answer:
      'Select a package on our website, choose dates, and pay at checkout. You can also call or WhatsApp us for personal booking help.',
    options: [
      { label: 'Payment methods', nextId: 'booking-payments' },
      { label: 'Tour packages', nextId: 'tours-offerings' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [
      { label: 'View packages', href: '/category/uae-tours' },
      { label: 'Go to cart', href: '/cart' },
    ],
  },
  'booking-payments': {
    id: 'booking-payments',
    answer:
      'We accept credit/debit cards, UPI, net banking, bank transfers, and major payment gateways. Visa, Mastercard, and G Pay are accepted.',
    options: [
      { label: 'EMI available?', nextId: 'booking-emi' },
      { label: 'How do I book?', nextId: 'booking-how' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'booking-advance': {
    id: 'booking-advance',
    answer:
      'Packages and tours need a minimum advance payment to confirm. Booking is confirmed only after payment and an official Booking Confirmation is issued.',
    options: [
      { label: 'Cancellation policy', nextId: 'cancel-holiday' },
      { label: 'Payment methods', nextId: 'booking-payments' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'booking-emi': {
    id: 'booking-emi',
    answer:
      'EMI is available on selected packages. Check the package page or contact us on WhatsApp for eligibility and plans.',
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Payment methods', nextId: 'booking-payments' },
    ],
  },

  // ── Cancellation ────────────────────────────────────────────
  'cancellation-menu': {
    id: 'cancellation-menu',
    prompt: 'What cancellation info do you need?',
    options: [
      { label: 'Holiday packages', nextId: 'cancel-holiday' },
      { label: 'Safari & city tours', nextId: 'cancel-tours' },
      { label: 'Refund timeline', nextId: 'cancel-refund' },
    ],
    links: [{ label: 'Full policy', href: '/cancellation-policy' }],
  },
  'cancel-holiday': {
    id: 'cancel-holiday',
    answer:
      'Dubai Holiday Packages:\n• 15+ days before: 75% refund\n• 7–14 days: 50% refund\n• 3–6 days: 25% refund\n• Within 48 hours: No refund',
    options: [
      { label: 'Can I reschedule?', nextId: 'cancel-reschedule' },
      { label: 'Refund process', nextId: 'cancel-refund' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'cancel-tours': {
    id: 'cancel-tours',
    answer:
      'Desert Safari / City Tours:\n• 24+ hours before: 50% refund\n• Within 24 hours: No refund',
    options: [
      { label: 'Holiday packages', nextId: 'cancel-holiday' },
      { label: 'Refund process', nextId: 'cancel-refund' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'cancel-reschedule': {
    id: 'cancel-reschedule',
    answer:
      'Yes, subject to availability and fees. Submit rescheduling requests at least 48 hours in advance. Contact us early to discuss options.',
    options: [
      { label: 'Refund process', nextId: 'cancel-refund' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'cancel-refund': {
    id: 'cancel-refund',
    answer:
      'Submit refund requests via WhatsApp, email, or our contact form. Approved refunds go to the original payment method in 7–14 business days.',
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Call or email', nextId: 'contact-details' },
    ],
    links: [{ label: 'Cancellation policy', href: '/cancellation-policy' }],
  },

  // ── About & Visa (via More topics) ──────────────────────────
  'more-topics': {
    id: 'more-topics',
    prompt: 'What else can I help with?',
    options: [
      { label: 'About us', nextId: 'about-what' },
      { label: 'Visa assistance', nextId: 'visa-dubai' },
      { label: 'Cancellations', nextId: 'cancellation-menu' },
    ],
  },
  'about-what': {
    id: 'about-what',
    answer:
      'Aapka Tourism specializes in Dubai and India tour packages — customizable itineraries, group tours, honeymoon packages, and corporate travel with end-to-end support.',
    options: [
      { label: 'Our experience', nextId: 'about-experience' },
      { label: 'Office locations', nextId: 'about-offices' },
      { label: 'Tour packages', nextId: 'tours-menu' },
    ],
    links: [{ label: 'About us page', href: '/About' }],
  },
  'about-experience': {
    id: 'about-experience',
    answer:
      'We have 12+ years of experience with certified guides and travel experts dedicated to memorable journeys.',
    options: [
      { label: 'Tour packages', nextId: 'tours-menu' },
      { label: 'Contact us', nextId: 'contact-menu' },
    ],
  },
  'about-offices': {
    id: 'about-offices',
    answer: `UAE: ${CONTACT.uaeOffice}\n\nIndia: ${CONTACT.indiaOffice}`,
    options: [
      { label: 'Call or email', nextId: 'contact-details' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'Contact page', href: '/contact' }],
  },
  'visa-dubai': {
    id: 'visa-dubai',
    answer:
      'We provide visa assistance for Dubai, UAE, and other destinations — documentation guidance and application support.',
    options: [
      { label: 'Apply for Oman visa', nextId: 'visa-oman' },
      { label: 'Submit an enquiry', nextId: 'tours-enquiry' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
  },
  'visa-oman': {
    id: 'visa-oman',
    answer:
      'Apply for an Oman visa on our website with your passport and travel details. Our team will process your request.',
    options: [
      { label: 'Oman transport', nextId: 'visa-oman-transport' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'Apply for Oman visa', href: '/visas/apply-for-oman-visa' }],
  },
  'visa-oman-transport': {
    id: 'visa-oman-transport',
    answer:
      'We offer Oman transport services for travelers. Visit our page for routes, pricing, and booking.',
    options: [
      { label: 'Apply for Oman visa', nextId: 'visa-oman' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'Oman transport', href: '/oman-transport' }],
  },

  // ── Contact ─────────────────────────────────────────────────
  'contact-menu': {
    id: 'contact-menu',
    prompt: 'How would you like to reach us?',
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Call or email', nextId: 'contact-details' },
      { label: 'Other topics', nextId: 'more-topics' },
    ],
  },
  'contact-whatsapp': {
    id: 'contact-whatsapp',
    answer: `WhatsApp us at ${CONTACT.whatsappUae}. Tap below to start a chat for bookings, packages, visas, or cancellations.`,
    options: [
      { label: 'Call or email', nextId: 'contact-details' },
      { label: 'Office locations', nextId: 'about-offices' },
    ],
    links: [{ label: 'Open WhatsApp', href: WHATSAPP_URL, external: true }],
  },
  'contact-details': {
    id: 'contact-details',
    answer: `WhatsApp: ${CONTACT.whatsappUae}\nUAE: ${CONTACT.phoneUae}\nIndia: ${CONTACT.phoneIndia}\nEmail: ${CONTACT.email}`,
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Office locations', nextId: 'about-offices' },
    ],
    links: [
      { label: 'Contact page', href: '/contact' },
      { label: 'Email us', href: `mailto:${CONTACT.email}`, external: true },
    ],
  },
  'contact-form': {
    id: 'contact-form',
    answer:
      'Submit your query on our Contact page or use the Travel Enquiry form for a detailed trip request.',
    options: [
      { label: 'Travel enquiry', nextId: 'tours-enquiry' },
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
    ],
    links: [{ label: 'Contact form', href: '/contact' }],
  },
  'contact-trip-support': {
    id: 'contact-trip-support',
    answer:
      'We provide 24/7 support during your trip with a dedicated contact number for emergencies and daily assistance.',
    options: [
      { label: 'WhatsApp us', nextId: 'contact-whatsapp' },
      { label: 'Call or email', nextId: 'contact-details' },
    ],
  },
};

export const INITIAL_NODE_ID = 'start';
