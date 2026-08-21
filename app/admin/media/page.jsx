import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import MediaGalleryManager from './MediaGalleryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Media & Gallery Manager' };

export default async function MediaAdminPage() {
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
        <div><span className="admin-eyebrow">Step 4 · Media & Gallery</span><h1>Manage your visual story.</h1><p>Upload, describe, publish and organize GPDO photographs without touching GitHub.</p></div>
        <form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form>
      </header>
      <MediaGalleryManager adminRole={admin.role} />
    </section>
  </main>;
}
