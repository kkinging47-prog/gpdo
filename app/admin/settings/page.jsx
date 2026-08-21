import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import SettingsManager from './SettingsManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site Settings' };

export default async function SettingsPage(){
  const supabase = await createClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) redirect('/admin/login');
  const { data:admin } = await supabase.from('admin_users').select('email,display_name,role,is_active').eq('email',user.email?.toLowerCase()||'').eq('is_active',true).maybeSingle();
  if(!admin) redirect('/admin');
  const { data:settings } = await supabase.from('site_settings').select('key,value,is_public,description').order('key');
  return <main className="admin-shell"><AdminSidebar/><section className="admin-main">
    <header className="admin-topbar"><div><span className="admin-eyebrow">Step 10 · Site Settings</span><h1>Public organization details</h1><p>Update contact information and social links used across the website.</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
    <SettingsManager initialSettings={settings||[]} adminRole={admin.role}/>
  </section></main>;
}
