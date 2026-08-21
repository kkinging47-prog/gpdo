import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import AdminSidebar from '../../../components/AdminSidebar';
import ArticlesManager from './ArticlesManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Articles & News Manager' };

export default async function ArticlesAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: admin } = await supabase.from('admin_users').select('email,display_name,role,is_active').eq('email', user.email?.toLowerCase() || '').eq('is_active', true).maybeSingle();
  if (!admin) redirect('/admin');

  return <main className="admin-shell">
    <AdminSidebar />
    <section className="admin-main">
      <header className="admin-topbar">
        <div><span className="admin-eyebrow">Step 8 · Articles & News</span><h1>Publish GPDO stories and updates.</h1><p>Create drafts, feature important stories and publish organization news without editing GitHub.</p></div>
        <form action="/auth/signout" method="post"><button className="admin-secondary-btn" type="submit">Sign out</button></form>
      </header>
      <ArticlesManager adminRole={admin.role} defaultAuthor={admin.display_name || 'GPDO'} />
    </section>
  </main>;
}
