import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import ProgramsManager from './ProgramsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Programs & Projects Manager' };

export default async function ProgramsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: admin } = await supabase.from('admin_users').select('email,display_name,role,is_active').eq('email', user.email?.toLowerCase() || '').eq('is_active', true).maybeSingle();
  if (!admin) redirect('/admin');
  return <main className="admin-shell"><AdminSidebar /><section className="admin-main">
    <header className="admin-topbar"><div><span className="admin-eyebrow">Step 7 · Programs & Projects</span><h1>Manage GPDO programmes.</h1><p>Create upcoming, ongoing and completed projects, then publish them when ready.</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
    <ProgramsManager adminRole={admin.role} />
  </section></main>;
}
