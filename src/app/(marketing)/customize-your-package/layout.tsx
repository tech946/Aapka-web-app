import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customize Your Package | Aapka Tourism',
  description:
    'Select a package, choose travellers (adults, children, infants), and add deals, hotel services & private transfers. Your price updates in real time.',
};

export default function CustomizeYourPackageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
