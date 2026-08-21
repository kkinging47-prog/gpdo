'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('info@gpdo.org');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    const normalized = email.trim().toLowerCase();
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        shouldCreateUser: true,
      },
    });
    if (authError) setError(authError.message);
    else setMessage(`A secure sign-in link has been sent to ${normalized}. Only email addresses approved in GPDO User Management can enter the CMS.`);
    setLoading(false);
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label htmlFor="admin-email">Approved GPDO email</label>
    <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
    <button className="admin-primary-btn" type="submit" disabled={loading}>{loading ? 'Sending secure link…' : 'Send secure sign-in link'}</button>
    {message && <p className="admin-success">{message}</p>}
    {error && <p className="admin-error">{error}</p>}
    <p className="admin-help">No password is stored on this website. Supabase sends a one-time secure login link, and the database checks that the email is an active approved administrator or editor before CMS access is granted.</p>
  </form>;
}
