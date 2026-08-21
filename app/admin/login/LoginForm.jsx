'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('globalpassion79@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function passwordLogin(e) {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    const normalized = email.trim().toLowerCase();
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.assign('/admin');
  }

  async function sendMagicLink() {
    setMagicLoading(true); setMessage(''); setError('');
    const normalized = email.trim().toLowerCase();
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (authError) setError(authError.message);
    else setMessage('Secure sign-in link sent. Check the approved email inbox.');
    setMagicLoading(false);
  }

  return <form className="admin-login-form" onSubmit={passwordLogin}>
    <label htmlFor="admin-email">Approved CMS email</label>
    <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.org" />

    <label htmlFor="admin-password">Password</label>
    <input
      id="admin-password"
      type={showPassword ? 'text' : 'password'}
      value={password}
      onChange={e => setPassword(e.target.value)}
      required
      autoComplete="current-password"
      placeholder="Enter your temporary admin password"
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

    <button className="admin-primary-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in with password'}</button>

    <button className="admin-secondary-btn" type="button" onClick={sendMagicLink} disabled={magicLoading}>{magicLoading ? 'Sending link…' : 'Send magic link instead'}</button>

    {message && <p className="admin-success">{message}</p>}
    {error && <p className="admin-error">{error}</p>}
    <p className="admin-help">Access still requires an active GPDO administrator/editor record in the database. Password login is enabled as a temporary fallback while the default Supabase email service is rate-limited.</p>
  </form>;
}
