'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const modules = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Media & Gallery', href: '/admin/media' },
  { label: 'Homepage Slideshow', href: '/admin/slides' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Programs & Projects', href: '/admin/programs' },
  { label: 'Articles & News', step: 'Step 8' },
  { label: 'Daily Tips', step: 'Step 9' },
  { label: 'Site Settings', step: 'Step 10' },
  { label: 'Users', step: 'Step 10' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="admin-sidebar">
    <img src="/assets/gpdo-logo.png" alt="GPDO" className="admin-side-logo" />
    <div className="admin-side-title">Content Manager</div>
    <nav>
      {modules.map((item) => item.href ? (
        <Link key={item.label} href={item.href} className={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) ? 'active' : ''}>{item.label}</Link>
      ) : <span key={item.label} title={item.step}>{item.label}</span>)}
    </nav>
    <Link href="/" className="admin-view-site">View public website ↗</Link>
  </aside>;
}
