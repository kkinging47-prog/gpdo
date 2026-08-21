import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import SlideshowManager from './SlideshowManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Homepage Slideshow Manager' };

export default async function SlideshowAdminPage() {
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
        <div><span className="admin-eyebrow">Step 5 · Homepage Slideshow</span><h1>Control the first story visitors see.</h1><p>Create, schedule, reorder and publish homepage hero slides from the GPDO dashboard.</p></div>
        <form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form>
      </header>
      <SlideshowManager />
    </section>
  </main>;
}
