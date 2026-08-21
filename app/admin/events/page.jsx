import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import EventsManager from './EventsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events Manager' };

export default async function EventsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('email,display_name,role,is_active')
    .eq('email', user.email?.toLowerCase() || '')
    .eq('is_active', true)
    .maybeSingle();

  if (!admin) redirect('/admin');

  return <main className="admin-shell">
    <AdminSidebar />
    <section className="admin-main">
      <header className="admin-topbar">
        <div><span className="admin-eyebrow">Step 6 · Events</span><h1>Plan, publish and archive events.</h1><p>Create upcoming activities, add flyers and registration links, and let the public site automatically separate upcoming and past events.</p></div>
        <form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form>
      </header>
      <EventsManager adminRole={admin.role} />
    </section>
  </main>;
}
