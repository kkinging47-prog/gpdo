import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import UpdatePasswordForm from './UpdatePasswordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Set Admin Password' };

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase
    .from('admin_users')
    .select('email,is_active')
    .eq('email', user.email?.toLowerCase() || '')
    .eq('is_active', true)
    .maybeSingle();

  if (!admin) redirect('/admin/login');

  return <main className="admin-auth-shell">
    <section className="admin-login-card">
      <img src="/assets/gpdo-logo.png" alt="GPDO" className="admin-login-logo" />
      <span className="admin-eyebrow">Secure administration</span>
      <h1>Choose your password</h1>
      <p>Create a strong password for {admin.email}. You will use it for future GPDO Admin sign-ins.</p>
      <UpdatePasswordForm />
    </section>
  </main>;
}
