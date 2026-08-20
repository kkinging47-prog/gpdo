'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [['/', 'Home'],['/about', 'About'],['/programs', 'Our Work'],['/gallery', 'Gallery'],['/get-involved', 'Get Involved'],['/contact', 'Contact']];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="container nav">
    <Link className="brand" href="/" aria-label="GPDO home" onClick={() => setOpen(false)}><img src="/assets/gpdo-logo.png" alt="Global Passion Development Organization" /></Link>
    <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Primary navigation">{links.map(([href,label]) => <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setOpen(false)}>{label}</Link>)}<Link className="nav-cta" href="/get-involved#support" onClick={() => setOpen(false)}>Support GPDO</Link></nav>
    <button className="menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(v => !v)}><span></span><span></span><span></span></button>
  </div></header>;
}
