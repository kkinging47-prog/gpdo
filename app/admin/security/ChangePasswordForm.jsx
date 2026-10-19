'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function ChangePasswordForm({ email }) {
  const supabase = useMemo(() => createClient(), []);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setNotice('');
    setError('');

    if (newPassword.length < 10) return setError('Use at least 10 characters for the new password.');
    if (newPassword !== confirm) return setError('The new passwords do not match.');
    if (currentPassword === newPassword) return setError('Choose a new password that is different from the current password.');

    setBusy(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) {
      setError('The current password is incorrect.');
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message || 'Could not update the password.');
      setBusy(false);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirm('');
    setNotice('Password changed successfully.');
    setBusy(false);
  }

  return <form className="admin-login-form" onSubmit={submit} style={{maxWidth:'620px'}}>
    <label htmlFor="current-password">Current password</label>
    <input id="current-password" type={show?'text':'password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required autoComplete="current-password" />

    <label htmlFor="new-password">New password</label>
    <input id="new-password" type={show?'text':'password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength={10} autoComplete="new-password" />

    <label htmlFor="confirm-new-password">Confirm new password</label>
    <input id="confirm-new-password" type={show?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={10} autoComplete="new-password" />

    <label style={{display:'flex',alignItems:'center',gap:'.55rem',cursor:'pointer',fontWeight:600}}>
      <input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} style={{width:'1.1rem',height:'1.1rem'}} />
      Show passwords
    </label>

    <button className="admin-primary-btn" type="submit" disabled={busy}>{busy?'Updating…':'Change password'}</button>
    {notice && <p className="admin-success">{notice}</p>}
    {error && <p className="admin-error">{error}</p>}
  </form>;
}
