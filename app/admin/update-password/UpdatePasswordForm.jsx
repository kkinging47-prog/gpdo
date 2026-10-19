'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function UpdatePasswordForm() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 10) return setError('Use at least 10 characters for the admin password.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || 'Could not update the password.');
      setBusy(false);
      return;
    }

    window.location.assign('/admin');
  }

  return <form className="admin-login-form" onSubmit={submit}>
    <label htmlFor="new-admin-password">New password</label>
    <input id="new-admin-password" type={show ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} autoComplete="new-password" placeholder="At least 10 characters" />

    <label htmlFor="confirm-admin-password">Confirm new password</label>
    <input id="confirm-admin-password" type={show ? 'text' : 'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={10} autoComplete="new-password" placeholder="Type the password again" />

    <label style={{ display:'flex', alignItems:'center', gap:'.55rem', cursor:'pointer', fontWeight:600 }}>
      <input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} style={{width:'1.1rem',height:'1.1rem'}} />
      Show password
    </label>

    <button className="admin-primary-btn" type="submit" disabled={busy}>{busy ? 'Saving password…' : 'Save password'}</button>
    {error && <p className="admin-error">{error}</p>}
    <p className="admin-help">After saving, you will be taken into the GPDO Admin dashboard.</p>
  </form>;
}
