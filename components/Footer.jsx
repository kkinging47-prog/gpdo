import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return <footer><div className="container"><div className="footer-grid">
    <div><img className="footer-logo" src="/assets/gpdo-logo.png" alt="GPDO" /><p className="footer-about">Empowering underserved communities through education, gender equity, healthcare, climate action and sustainable development.</p><div className="socials"><a href="#" aria-label="Facebook">f</a><a href="https://www.instagram.com/globalpassiondevelopment/" target="_blank" rel="noopener" aria-label="Instagram">◎</a><a href="https://www.tiktok.com/@globalpassiondevelopment" target="_blank" rel="noopener" aria-label="TikTok">♪</a></div></div>
    <div className="footer-col"><h4>Organization</h4><Link href="/about">About GPDO</Link><Link href="/programs">Our Work</Link><Link href="/gallery">Gallery</Link><Link href="/about#governance">Our Approach</Link></div>
    <div className="footer-col"><h4>Get involved</h4><Link href="/get-involved#partner">Partner with us</Link><Link href="/get-involved#sponsor">Sponsor a programme</Link><Link href="/get-involved#volunteer">Volunteer</Link><Link href="/get-involved#support">Donate / Support</Link></div>
    <div className="footer-col"><h4>Contact</h4><a href="tel:+233256073403">+233 25 607 3403</a><a href="tel:+233597365695">+233 59 736 5695</a><a href="https://wa.me/233256073403" target="_blank" rel="noopener">WhatsApp GPDO</a><Link href="/contact">Send an enquiry</Link></div>
  </div><div className="footer-bottom"><span>© {year} Global Passion Development Organization. All rights reserved.</span><span>Company Limited by Guarantee • Companies Act, 2019 (Act 992)</span></div></div></footer>;
}
