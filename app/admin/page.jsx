import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import AdminSidebar from '../../components/AdminSidebar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Dashboard' };

const modules = [
  ['Media & Gallery', 'Upload and organize photographs and albums.', 'Step 4', '/admin/media', true],
  ['Homepage Slideshow', 'Create, reorder and schedule homepage slides.', 'Step 5', null, false],
  ['Events', 'Publish upcoming events and archive past events.', 'Step 6', null, false],
  ['Programs & Projects', 'Manage current, upcoming and completed programmes.', 'Step 7', null, false],
  ['Articles & News', 'Write, edit, publish and feature organization news.', 'Step 8', null, false],
  ['Daily Tips', 'Schedule short daily education, health and development tips.', 'Step 9', null, false],
  ['Site Settings', 'Manage public contact details and site-wide information.', 'Step 10', null, false],
  ['Users', 'Manage administrators and editors.', 'Step 10', null, false],
];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('email,display_name,role,is_active')
    .eq('email', user.email?.toLowerCase() || '')
    .eq('is_active', true)
    .maybeSingle();

  if (!admin) {
    return <main className="admin-auth-shell"><section className="admin-login-card"><span className="admin-eyebrow">Access denied</span><h1>Not authorized</h1><p>This signed-in account is not approved for GPDO administration.</p><form action="/auth/signout" method="post"><button className="admin-primary-btn" type="submit">Sign out</button></form></section></main>;
  }

  return <main className="admin-shell">
    <AdminSidebar />
    <section className="admin-main">
      <header className="admin-topbar"><div><span className="admin-eyebrow">GPDO Administration</span><h1>Welcome to your dashboard.</h1><p>Signed in as {admin.email} · {admin.role}</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
      <div className="admin-status-banner"><strong>Media & Gallery Manager is now enabled.</strong><span>You can upload and publish photographs from Step 4 without editing GitHub.</span></div>
      <div className="admin-module-grid">
        {modules.map(([name,desc,step,href,enabled]) => <article className={`admin-module-card${enabled ? ' enabled' : ''}`} key={name}><span>{step}</span><h2>{name}</h2><p>{desc}</p>{enabled ? <Link className="admin-module-link" href={href}>Open manager →</Link> : <button disabled>Coming later</button>}</article>)}
      </div>
    </section>
  </main>;
}
