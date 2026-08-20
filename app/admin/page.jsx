import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin Dashboard' };

const modules = [
  ['Media & Gallery', 'Upload and organize photographs and albums.', 'Step 4'],
  ['Homepage Slideshow', 'Create, reorder and schedule homepage slides.', 'Step 5'],
  ['Events', 'Publish upcoming events and archive past events.', 'Step 6'],
  ['Programs & Projects', 'Manage current, upcoming and completed programmes.', 'Step 7'],
  ['Articles & News', 'Write, edit, publish and feature organization news.', 'Step 8'],
  ['Daily Tips', 'Schedule short daily education, health and development tips.', 'Step 9'],
  ['Site Settings', 'Manage public contact details and site-wide information.', 'Step 10'],
  ['Users', 'Manage administrators and editors.', 'Step 10'],
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
    <aside className="admin-sidebar">
      <img src="/assets/gpdo-logo.png" alt="GPDO" className="admin-side-logo" />
      <div className="admin-side-title">Content Manager</div>
      <nav>
        <a className="active" href="/admin">Dashboard</a>
        {modules.map(([name]) => <span key={name}>{name}</span>)}
      </nav>
      <a href="/" className="admin-view-site">View public website ↗</a>
    </aside>
    <section className="admin-main">
      <header className="admin-topbar"><div><span className="admin-eyebrow">GPDO Administration</span><h1>Welcome to your dashboard.</h1><p>Signed in as {admin.email} · {admin.role}</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
      <div className="admin-status-banner"><strong>Secure admin login is active.</strong><span>The content management modules will be enabled step by step from Media & Gallery onward.</span></div>
      <div className="admin-module-grid">
        {modules.map(([name,desc,step]) => <article className="admin-module-card" key={name}><span>{step}</span><h2>{name}</h2><p>{desc}</p><button disabled>Coming next</button></article>)}
      </div>
    </section>
  </main>;
}
