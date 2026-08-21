import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import UsersManager from './UsersManager';

export const dynamic='force-dynamic';
export const metadata={title:'User Management'};

export default async function UsersPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect('/admin/login');
  const {data:admin}=await supabase.from('admin_users').select('email,display_name,role,is_active').eq('email',user.email?.toLowerCase()||'').eq('is_active',true).maybeSingle();
  if(!admin) redirect('/admin');
  if(admin.role!=='admin') return <main className="admin-shell"><AdminSidebar/><section className="admin-main"><div className="admin-status-banner"><strong>Administrator access required.</strong><span>Editors can manage public content but cannot change CMS users.</span></div></section></main>;
  const {data:users}=await supabase.from('admin_users').select('email,display_name,role,is_active,created_at,updated_at').order('created_at');
  return <main className="admin-shell"><AdminSidebar/><section className="admin-main">
    <header className="admin-topbar"><div><span className="admin-eyebrow">Step 10 · User Management</span><h1>Administrators & editors</h1><p>Approve who can access the GPDO CMS and control their role.</p></div><form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form></header>
    <UsersManager initialUsers={users||[]} currentEmail={admin.email}/>
  </section></main>;
}
