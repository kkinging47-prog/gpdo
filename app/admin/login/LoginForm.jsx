'use client';

import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function passwordLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
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

    <button className="admin-primary-btn" type="submit" disabled={loading}>
      {loading ? 'Signing in…' : 'Sign in'}
    </button>

    {error && <p className="admin-error">{error}</p>}
    <p className="admin-help">Access is restricted to active GPDO administrators and editors approved in the CMS.</p>
  </form>;
}
