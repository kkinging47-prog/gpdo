'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const PRIMARY_ADMIN = 'info@gpdo.org';

export default function LoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState(PRIMARY_ADMIN);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function passwordLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    const normalized = email.trim().toLowerCase();

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized, password }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error || 'Sign-in failed. Please check your details and try again.');
        setLoading(false);
        return;
      }

      window.location.assign('/admin');
    } catch {
      setError('The GPDO website could not complete the sign-in request. Please try again.');
      setLoading(false);
    }
  }

  async function sendPasswordSetupLink() {
    const normalized = email.trim().toLowerCase();
    setError('');
    setNotice('');

    if (normalized !== PRIMARY_ADMIN) {
      setError('Password setup from this screen is currently restricted to the primary GPDO administrator.');
      return;
    }

    setSendingLink(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/admin/update-password`;
    const { error: linkError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (linkError) setError(linkError.message || 'Could not send the password setup email.');
    else setNotice('A secure password setup link has been sent to info@gpdo.org. Open that email and follow the link to choose your password.');
    setSendingLink(false);
  }

  return <form className="admin-login-form" onSubmit={passwordLogin}>
    <label htmlFor="admin-email">Approved CMS email</label>
    <input
      id="admin-email"
      type="email"
      value={email}
      onChange={e => setEmail(e.target.value)}
      required
      autoComplete="email"
      placeholder="name@example.org"
      spellCheck="false"
      autoCapitalize="none"
    />

    <label htmlFor="admin-password">Password</label>
    <input
      id="admin-password"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={e => setPassword(e.target.value)}
      required
      autoComplete="current-password"
      placeholder="Enter your admin password"
      spellCheck="false"
      autoCapitalize="none"
    />

    <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', fontWeight: 600 }}>
      <input
        type="checkbox"
        checked={showPassword}
        onChange={e => setShowPassword(e.target.checked)}
        style={{ width: '1.1rem', height: '1.1rem' }}
      />
      Show password
    </label>

    <button className="admin-primary-btn" type="submit" disabled={loading || sendingLink}>
      {loading ? 'Signing in…' : 'Sign in'}
    </button>

    <button className="admin-secondary-btn" type="button" onClick={sendPasswordSetupLink} disabled={loading || sendingLink}>
      {sendingLink ? 'Sending secure link…' : 'Set or reset password by email'}
    </button>

    {notice && <p className="admin-success">{notice}</p>}
    {error && <p className="admin-error">{error}</p>}
    <p className="admin-help">First time here or forgot the password? Use “Set or reset password by email”. Access remains restricted to approved GPDO administrators and editors.</p>
  </form>;
}
