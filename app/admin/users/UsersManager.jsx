'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function UsersManager({initialUsers,currentEmail}){
  const supabase=useMemo(()=>createClient(),[]);
  const [users,setUsers]=useState(initialUsers||[]);
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [role,setRole]=useState('editor');
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);

  const flash=(text,isError=false)=>{if(isError){setError(text);setNotice('');}else{setNotice(text);setError('');}window.setTimeout(()=>{setNotice('');setError('');},5000);};

  async function reload(){
    const {data,error:e}=await supabase.from('admin_users').select('email,display_name,role,is_active,created_at,updated_at').order('created_at');
    if(e)return flash(e.message,true); setUsers(data||[]);
  }

  async function addUser(e){
    e.preventDefault();
    const normalized=email.trim().toLowerCase();
    if(!normalized)return flash('Enter an email address.',true);
    setSaving(true);
    const {error:e2}=await supabase.from('admin_users').insert({email:normalized,display_name:name.trim()||null,role,is_active:true});
    setSaving(false);
    if(e2)return flash(e2.message,true);
    setEmail('');setName('');setRole('editor');flash('User approved. They can now request a secure sign-in link from /admin/login.');await reload();
  }

  async function updateUser(user,changes){
    const {error:e}=await supabase.from('admin_users').update({...changes,updated_at:new Date().toISOString()}).eq('email',user.email);
    if(e)return flash(e.message,true); flash('User updated.');await reload();
  }

  async function removeUser(user){
    if(user.email===currentEmail && !window.confirm('You are removing your own CMS access. Continue?')) return;
    else if(user.email!==currentEmail && !window.confirm(`Remove ${user.email} from GPDO CMS access?`)) return;
    const {error:e}=await supabase.from('admin_users').delete().eq('email',user.email);
    if(e)return flash(e.message,true);flash('User removed from CMS access.');await reload();
  }

  return <div className="users-manager">
    {(notice||error)&&<div className={error?'media-alert error':'media-alert success'}>{error||notice}</div>}
    <section className="media-panel"><div className="media-panel-heading"><div><span className="admin-eyebrow">Approve User</span><h2>Add an administrator or editor</h2><p>Editors manage content. Administrators can also manage users.</p></div></div>
      <form className="user-add-form" onSubmit={addUser}>
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.org" required/></label>
        <label>Display name<input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name"/></label>
        <label>Role<select value={role} onChange={(e)=>setRole(e.target.value)}><option value="editor">Editor</option><option value="admin">Administrator</option></select></label>
        <button className="admin-primary-btn" type="submit" disabled={saving}>{saving?'Adding…':'Approve user'}</button>
      </form>
      <p className="admin-help">Adding a user does not create a password. They visit <strong>/admin/login</strong>, enter the approved email and receive a one-time secure sign-in link.</p>
    </section>

    <section className="media-panel"><div className="media-panel-heading"><div><span className="admin-eyebrow">CMS Access</span><h2>{users.length} approved user{users.length===1?'':'s'}</h2><p>The database prevents removal or demotion of the last active administrator.</p></div><button className="admin-secondary-btn" onClick={reload}>Refresh</button></div>
      <div className="user-list">{users.map((user)=><article className="user-card" key={user.email}>
        <div><span className={`user-state ${user.is_active?'active':'inactive'}`}>{user.is_active?'Active':'Disabled'}</span><h3>{user.display_name||user.email}</h3><p>{user.email}{user.email===currentEmail?' · You':''}</p></div>
        <div className="user-controls">
          <label>Role<select value={user.role} onChange={(e)=>updateUser(user,{role:e.target.value})}><option value="editor">Editor</option><option value="admin">Administrator</option></select></label>
          <label className="media-check"><input type="checkbox" checked={user.is_active} onChange={(e)=>updateUser(user,{is_active:e.target.checked})}/> Active</label>
          <button className="media-danger-btn" type="button" onClick={()=>removeUser(user)}>Remove</button>
        </div>
      </article>)}</div>
    </section>
  </div>;
}
