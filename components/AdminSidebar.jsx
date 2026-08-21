'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const modules = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Media & Gallery', href: '/admin/media' },
  { label: 'Homepage Slideshow', href: '/admin/slides' },
  { label: 'Events', href: '/admin/events' },
  { label: 'Programs & Projects', href: '/admin/programs' },
  { label: 'Articles & News', href: '/admin/articles' },
  { label: 'Daily Tips', href: '/admin/tips' },
  { label: 'Site Settings', href: '/admin/settings' },
  { label: 'Users', href: '/admin/users' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return <aside className="admin-sidebar">
    <img src="/assets/gpdo-logo.png" alt="GPDO" className="admin-side-logo" />
    <div className="admin-side-title">Content Manager</div>
    <nav>{modules.map((item)=><Link key={item.label} href={item.href} className={pathname===item.href||(item.href!=='/admin'&&pathname.startsWith(item.href+'/'))?'active':''}>{item.label}</Link>)}</nav>
    <Link href="/" className="admin-view-site">View public website ↗</Link>
  </aside>;
}
