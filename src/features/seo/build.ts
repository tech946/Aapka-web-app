import { CONTACT, SOCIALS } from '@/components/site/site-config';
import { SITE_URL, blockNode, compact, type JsonObject, type JsonValue } from '@/features/blog/structured-data/build';
import type { SchemaBlock } from '@/features/blog/structured-data/schema';

const LOGO_PATH = '/brand/aapka-sun-mark.png';

export function buildPageJsonLd(blocks: SchemaBlock[], path: string): JsonValue[] {
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  const nodes: JsonValue[] = [];
  const documents: JsonValue[] = [];

  for (const block of blocks) {
    if (block.type === 'custom') {
      try {
        documents.push(JSON.parse(block.json) as JsonValue);
      } catch {
        continue;
      }
    } else {
      nodes.push(blockNode(block, url));
    }
  }

  const graph = nodes.length ? compact({ '@context': 'https://schema.org', '@graph': nodes }) : undefined;
  return [graph, ...documents].filter((d): d is JsonValue => d !== undefined);
}

export function buildSiteJsonLd(): JsonValue {
  const agency: JsonObject = {
    '@type': 'TravelAgency',
    '@id': `${SITE_URL}/#organization`,
    name: 'Aapka Tourism',
    url: SITE_URL,
    logo: `${SITE_URL}${LOGO_PATH}`,
    image: `${SITE_URL}${LOGO_PATH}`,
    email: CONTACT.email,
    telephone: CONTACT.uaePhone.replace(/\s+/g, ''),
    areaServed: ['United Arab Emirates', 'Oman'],
    sameAs: SOCIALS.filter((s) => s.id !== 'whatsapp').map((s) => s.href),
    address: [
      {
        '@type': 'PostalAddress',
        streetAddress: 'Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool',
        addressLocality: 'Bur Dubai, Dubai',
        addressCountry: 'AE',
      },
      {
        '@type': 'PostalAddress',
        streetAddress: '1522 B, Hemkunt Chambers 89, Nehru Place',
        addressLocality: 'New Delhi',
        postalCode: '110019',
        addressCountry: 'IN',
      },
    ],
    contactPoint: [
      { '@type': 'ContactPoint', telephone: CONTACT.uaePhone.replace(/\s+/g, ''), contactType: 'customer service', areaServed: 'AE' },
      { '@type': 'ContactPoint', telephone: CONTACT.indiaPhone.replace(/\s+/g, ''), contactType: 'customer service', areaServed: 'IN' },
    ],
  };
  const website: JsonObject = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Aapka Tourism',
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
  return compact({ '@context': 'https://schema.org', '@graph': [agency, website] }) as JsonValue;
}
