import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import DailyTipsManager from './DailyTipsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Daily Tips Manager' };

export default async function DailyTipsAdminPage(){
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect('/admin/login');
  const { data: admin } = await supabase.from('admin_users').select('email,display_name,role,is_active').eq('email', user.email?.toLowerCase() || '').eq('is_active', true).maybeSingle();
  if(!admin) redirect('/admin');
  return <main className="admin-shell"><AdminSidebar /><section className="admin-main">
    <header className="admin-topbar"><div><span className="admin-eyebrow">Step 9 · Daily Tips</span><h1>Schedule practical daily guidance.</h1><p>Create tips in advance and let the website reveal them on the assigned date.</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
    <DailyTipsManager adminRole={admin.role} />
  </section></main>;
}
