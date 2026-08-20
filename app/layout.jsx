import './globals.css';
import './admin.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RevealManager from '../components/RevealManager';

export const metadata = {
  title: { default: 'GPDO | Global Passion Development Organization', template: '%s | GPDO' },
  description: 'Global Passion Development Organization empowers underserved communities through education, gender equity, healthcare, climate action and sustainable development.',
  icons: { icon: '/assets/gpdo-logo.png' },
  openGraph: {
    title: 'GPDO | Empowering communities. Creating lasting change.',
    description: 'Integrated, community-driven development for education, health, gender equality and climate resilience.',
    images: ['/assets/og-cover.svg'],
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'NGO', name: 'Global Passion Development Organization', alternateName: 'GPDO', foundingDate: '2024',
    description: 'A non-profit organization committed to empowering marginalized communities through integrated and sustainable development initiatives.',
    telephone: ['+233256073403', '+233597365695'],
    sameAs: ['https://www.instagram.com/globalpassiondevelopment/', 'https://www.tiktok.com/@globalpassiondevelopment']
  };
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}} /><Header /><RevealManager />{children}<Footer /></body></html>;
}
