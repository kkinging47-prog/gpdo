import LoginForm from './LoginForm';

export const metadata = { title: 'Admin Login' };

export default function AdminLoginPage() {
  return <main className="admin-auth-shell">
    <section className="admin-login-card">
      <img src="/assets/gpdo-logo.png" alt="GPDO" className="admin-login-logo" />
      <span className="admin-eyebrow">Secure administration</span>
      <h1>GPDO Admin</h1>
      <p>Sign in to manage website content, media, events, programmes, articles and daily tips.</p>
      <LoginForm />
      <a href="/" className="admin-back-link">← Back to GPDO website</a>
    </section>
  </main>;
}
