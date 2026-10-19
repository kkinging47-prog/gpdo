import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import ChangePasswordForm from './ChangePasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Password & Security' };

export default async function SecurityPage() {
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
        <div><span className="admin-eyebrow">Account Security</span><h1>Password & Security</h1><p>Change the password used to sign in as {admin.email}.</p></div>
        <form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form>
      </header>
      <section className="media-panel">
        <div className="media-panel-heading"><div><span className="admin-eyebrow">Change password</span><h2>Update your admin password</h2><p>For security, confirm your current password before choosing a new one.</p></div></div>
        <ChangePasswordForm email={admin.email} />
      </section>
    </section>
  </main>;
}
