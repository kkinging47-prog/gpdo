'use client';

import { useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const defaults={
  organization:{name:'Global Passion Development Organization',short_name:'GPDO',founded:2024},
  contact:{primary_phone:'+233256073403',secondary_phone:'+233597365695',whatsapp:'+233256073403',email:'info@gpdo.org'},
  social:{facebook:'Global Passion Development Organization',instagram:'https://www.instagram.com/globalpassiondevelopment/',tiktok:'https://www.tiktok.com/@globalpassiondevelopment'}
};

export default function SettingsManager({initialSettings,adminRole}){
  const supabase=useMemo(()=>createClient(),[]);
  const rows=Object.fromEntries((initialSettings||[]).map((r)=>[r.key,r]));
  const [organization,setOrganization]=useState({...defaults.organization,...(rows.organization?.value||{})});
  const [contact,setContact]=useState({...defaults.contact,...(rows.contact?.value||{})});
  const [social,setSocial]=useState({...defaults.social,...(rows.social?.value||{})});
  const [saving,setSaving]=useState('');
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');

  async function save(key,value,description){
    setSaving(key);setNotice('');setError('');
    const {error:e}=await supabase.from('site_settings').upsert({key,value,is_public:true,description,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(e)setError(e.message);else setNotice(`${key[0].toUpperCase()+key.slice(1)} settings saved.`);
    setSaving('');
  }

  return <div className="settings-manager">
    {(notice||error)&&<div className={error?'media-alert error':'media-alert success'}>{error||notice}</div>}
    <div className="settings-note"><strong>Changes here are website-wide.</strong><span>Phone numbers and social links update the public contact areas without editing code. Role: {adminRole}.</span></div>

    <section className="media-panel settings-card"><div className="media-panel-heading"><div><span className="admin-eyebrow">Organization</span><h2>Identity details</h2><p>Core public organization information.</p></div></div>
      <div className="settings-grid">
        <label>Organization name<input value={organization.name||''} onChange={(e)=>setOrganization(v=>({...v,name:e.target.value}))}/></label>
        <label>Short name<input value={organization.short_name||''} onChange={(e)=>setOrganization(v=>({...v,short_name:e.target.value}))}/></label>
        <label>Founded<input type="number" value={organization.founded||''} onChange={(e)=>setOrganization(v=>({...v,founded:Number(e.target.value)||''}))}/></label>
      </div>
      <button className="admin-primary-btn" onClick={()=>save('organization',organization,'Core organization details')} disabled={saving==='organization'}>{saving==='organization'?'Saving…':'Save organization details'}</button>
    </section>

    <section className="media-panel settings-card"><div className="media-panel-heading"><div><span className="admin-eyebrow">Contact</span><h2>Phone, WhatsApp and email</h2><p>Use international format for phone numbers, for example +233…</p></div></div>
      <div className="settings-grid">
        <label>Primary phone<input value={contact.primary_phone||''} onChange={(e)=>setContact(v=>({...v,primary_phone:e.target.value}))}/></label>
        <label>Secondary phone<input value={contact.secondary_phone||''} onChange={(e)=>setContact(v=>({...v,secondary_phone:e.target.value}))}/></label>
        <label>WhatsApp<input value={contact.whatsapp||''} onChange={(e)=>setContact(v=>({...v,whatsapp:e.target.value}))}/></label>
        <label>Public email<input type="email" value={contact.email||''} onChange={(e)=>setContact(v=>({...v,email:e.target.value}))}/></label>
      </div>
      <button className="admin-primary-btn" onClick={()=>save('contact',contact,'Public contact details')} disabled={saving==='contact'}>{saving==='contact'?'Saving…':'Save contact details'}</button>
    </section>

    <section className="media-panel settings-card"><div className="media-panel-heading"><div><span className="admin-eyebrow">Social Media</span><h2>Public social links</h2><p>Paste full profile links where possible.</p></div></div>
      <div className="settings-grid">
        <label>Facebook<input value={social.facebook||''} onChange={(e)=>setSocial(v=>({...v,facebook:e.target.value}))}/></label>
        <label>Instagram URL<input value={social.instagram||''} onChange={(e)=>setSocial(v=>({...v,instagram:e.target.value}))}/></label>
        <label>TikTok URL<input value={social.tiktok||''} onChange={(e)=>setSocial(v=>({...v,tiktok:e.target.value}))}/></label>
      </div>
      <button className="admin-primary-btn" onClick={()=>save('social',social,'Public social links')} disabled={saving==='social'}>{saving==='social'?'Saving…':'Save social links'}</button>
    </section>
  </div>;
}
