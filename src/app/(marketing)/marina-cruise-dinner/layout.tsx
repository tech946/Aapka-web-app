import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marina Cruise Dinner | Aapka Tourism',
  description:
    'Book exclusive Marina Cruise Dinner experiences in Dubai. Dhow cruise with buffet dining on Dubai Marina.',
};

export default function MarinaCruiseDinnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
