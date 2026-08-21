'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const blankForm = { title:'', summary:'', description:'', focus_area:'', location:'', start_date:'', end_date:'', partners:'', status:'upcoming', is_featured:false, is_published:false, featured_image_path:'', featured_image_url:'' };
const slugify = (value='') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || `program-${Date.now()}`;
const safeFileName = (name='') => name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/-+/g,'-');
const messageFor = (error) => error?.message || 'Something went wrong. Please try again.';
const splitPartners = (value='') => value.split(/[,\n]/).map(v=>v.trim()).filter(Boolean);

export default function ProgramsManager({ adminRole }) {
  const supabase = useMemo(() => createClient(), []);
  const [programs,setPrograms] = useState([]);
  const [media,setMedia] = useState([]);
  const [form,setForm] = useState(blankForm);
  const [file,setFile] = useState(null);
  const [busy,setBusy] = useState(true);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');

  const flash=(text,isError=false)=>{ if(isError){setError(text);setNotice('')}else{setNotice(text);setError('')} window.setTimeout(()=>{setNotice('');setError('')},5000); };
  const loadData=useCallback(async()=>{
    setBusy(true);
    const [p,m]=await Promise.all([
      supabase.from('programs').select('*').order('created_at',{ascending:false}),
      supabase.from('media').select('id,title,public_url,file_path,is_published').eq('is_published',true).order('sort_order').order('created_at',{ascending:false})
    ]);
    const firstError=p.error||m.error; if(firstError) flash(messageFor(firstError),true);
    setPrograms(p.data||[]); setMedia(m.data||[]); setBusy(false);
  },[supabase]);
  useEffect(()=>{loadData()},[loadData]);

  async function uploadProgramImage(selectedFile){
    if(!selectedFile) return {path:'',url:''};
    if(!selectedFile.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if(selectedFile.size>10*1024*1024) throw new Error('Programme image must be 10 MB or smaller.');
    const folder=new Date().toISOString().slice(0,7);
    const unique=crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path=`programs/${folder}/${unique}-${safeFileName(selectedFile.name)}`;
    const {error:uploadError}=await supabase.storage.from('media').upload(path,selectedFile,{cacheControl:'3600',upsert:false});
    if(uploadError) throw uploadError;
    const {data}=supabase.storage.from('media').getPublicUrl(path);
    return {path,url:data.publicUrl};
  }

  function chooseMedia(id){
    const item=media.find(m=>m.id===id);
    if(!item) return setForm(v=>({...v,featured_image_path:'',featured_image_url:''}));
    setFile(null); const picker=document.getElementById('gpdo-program-image'); if(picker) picker.value='';
    setForm(v=>({...v,featured_image_path:item.file_path,featured_image_url:item.public_url}));
  }

  async function createProgram(e){
    e.preventDefault();
    if(!form.title.trim()) return flash('Enter a programme or project title.',true);
    setSaving(true); let uploaded=null;
    try{
      let imagePath=form.featured_image_path, imageUrl=form.featured_image_url;
      if(file){ uploaded=await uploadProgramImage(file); imagePath=uploaded.path; imageUrl=uploaded.url; }
      const baseSlug=slugify(form.title); const existing=new Set(programs.map(p=>p.slug)); const slug=existing.has(baseSlug)?`${baseSlug}-${Date.now().toString().slice(-6)}`:baseSlug;
      const payload={
        title:form.title.trim(), slug, summary:form.summary.trim()||null, description:form.description.trim()||null,
        focus_area:form.focus_area.trim()||null, featured_image_path:imagePath||null, featured_image_url:imageUrl||null,
        location:form.location.trim()||null, start_date:form.start_date||null, end_date:form.end_date||null,
        partner_names:splitPartners(form.partners), status:form.status, is_featured:form.is_featured, is_published:form.is_published,
        published_at:form.is_published?new Date().toISOString():null
      };
      const {error:insertError}=await supabase.from('programs').insert(payload); if(insertError) throw insertError;
      setForm(blankForm); setFile(null); const picker=document.getElementById('gpdo-program-image'); if(picker) picker.value='';
      flash('Programme created successfully.'); await loadData();
    }catch(e2){ if(uploaded?.path) await supabase.storage.from('media').remove([uploaded.path]); flash(messageFor(e2),true); }
    finally{setSaving(false)}
  }

  async function saveProgram(id,values){
    const current=programs.find(p=>p.id===id);
    const payload={...values,partner_names:splitPartners(values.partners),published_at:values.is_published?(current?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
    delete payload.partners;
    const {error:updateError}=await supabase.from('programs').update(payload).eq('id',id);
    if(updateError) return flash(messageFor(updateError),true);
    flash('Programme saved.'); await loadData();
  }

  async function replaceImage(program,selectedFile){
    try{
      const uploaded=await uploadProgramImage(selectedFile); const oldPath=program.featured_image_path;
      const {error:updateError}=await supabase.from('programs').update({featured_image_path:uploaded.path,featured_image_url:uploaded.url,updated_at:new Date().toISOString()}).eq('id',program.id);
      if(updateError){await supabase.storage.from('media').remove([uploaded.path]);throw updateError;}
      if(oldPath?.startsWith('programs/')) await supabase.storage.from('media').remove([oldPath]);
      flash('Programme image updated.'); await loadData();
    }catch(e){flash(messageFor(e),true)}
  }

  async function deleteProgram(program){
    if(!window.confirm(`Delete “${program.title}”?`)) return;
    const {error:deleteError}=await supabase.from('programs').delete().eq('id',program.id); if(deleteError) return flash(messageFor(deleteError),true);
    if(program.featured_image_path?.startsWith('programs/')) await supabase.storage.from('media').remove([program.featured_image_path]);
    flash('Programme deleted.'); await loadData();
  }

  const counts=useMemo(()=>({
    upcoming:programs.filter(p=>p.status==='upcoming').length,
    ongoing:programs.filter(p=>p.status==='ongoing').length,
    completed:programs.filter(p=>p.status==='completed').length,
    published:programs.filter(p=>p.is_published).length
  }),[programs]);

  return <div className="program-manager">
    {(notice||error)&&<div className={error?'media-alert error':'media-alert success'}>{error||notice}</div>}
    <div className="program-stats"><div><span>All programmes</span><strong>{programs.length}</strong></div><div><span>Upcoming</span><strong>{counts.upcoming}</strong></div><div><span>Ongoing</span><strong>{counts.ongoing}</strong></div><div><span>Completed</span><strong>{counts.completed}</strong></div><div><span>Published</span><strong>{counts.published}</strong></div></div>

    <section className="media-panel"><div className="media-panel-heading"><div><span className="admin-eyebrow">Create Programme</span><h2>Add a programme or project</h2><p>Build the project record now and publish it when the information is ready for the public.</p></div><span className="media-role-badge">{adminRole}</span></div>
      <form className="program-create-form" onSubmit={createProgram}>
        <label>Programme title<input value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} placeholder="e.g. Girls in STEM Initiative" /></label>
        <label>Focus area<input value={form.focus_area} onChange={e=>setForm(v=>({...v,focus_area:e.target.value}))} placeholder="Education, Health, Climate..." /></label>
        <label className="program-full">Short summary<input value={form.summary} onChange={e=>setForm(v=>({...v,summary:e.target.value}))} placeholder="One sentence for programme cards" /></label>
        <label className="program-full">Full description<textarea rows="6" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} placeholder="Objectives, beneficiaries, activities, intended results and relevant background." /></label>
        <label>Location<input value={form.location} onChange={e=>setForm(v=>({...v,location:e.target.value}))} placeholder="Community / Region / Country" /></label>
        <label>Partners<input value={form.partners} onChange={e=>setForm(v=>({...v,partners:e.target.value}))} placeholder="Separate partners with commas" /></label>
        <label>Start date<input type="date" value={form.start_date} onChange={e=>setForm(v=>({...v,start_date:e.target.value}))} /></label>
        <label>End date<input type="date" value={form.end_date} onChange={e=>setForm(v=>({...v,end_date:e.target.value}))} /></label>
        <label>Status<select value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value}))}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
        <div className="program-checks"><label className="media-check"><input type="checkbox" checked={form.is_published} onChange={e=>setForm(v=>({...v,is_published:e.target.checked}))} /> Publish publicly</label><label className="media-check"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm(v=>({...v,is_featured:e.target.checked}))} /> Feature programme</label></div>
        <label>Choose from Media Library<select value="" onChange={e=>chooseMedia(e.target.value)}><option value="">Select an existing image…</option>{media.map(item=><option key={item.id} value={item.id}>{item.title||'Untitled image'}</option>)}</select></label>
        <label>Or upload programme image<input id="gpdo-program-image" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} /></label>
        {(form.featured_image_url||file)&&<div className="program-image-preview program-full">{form.featured_image_url&&!file?<img src={form.featured_image_url} alt="Selected programme"/>:<div><strong>{file?.name}</strong><span>Image will upload when the programme is created.</span></div>}</div>}
        <div className="program-full"><button className="admin-primary-btn" type="submit" disabled={saving}>{saving?'Saving programme…':'Create programme'}</button></div>
      </form>
    </section>

    <section className="media-panel"><div className="media-panel-heading"><div><span className="admin-eyebrow">Programme Library</span><h2>{programs.length} programme{programs.length===1?'':'s'}</h2><p>Only published, non-archived programmes are visible on the public website.</p></div><button className="admin-secondary-btn" type="button" onClick={loadData}>Refresh</button></div>
      {busy?<div className="media-empty">Loading programmes…</div>:programs.length===0?<div className="media-empty"><strong>No managed programmes yet.</strong><span>The four permanent GPDO focus areas remain visible on the public site until you add real projects here.</span></div>:<div className="program-admin-list">{programs.map(program=><ProgramEditor key={program.id} program={program} media={media} onSave={saveProgram} onDelete={deleteProgram} onReplaceImage={replaceImage}/>)}</div>}
    </section>
  </div>;
}

function ProgramEditor({program,media,onSave,onDelete,onReplaceImage}){
  const [draft,setDraft]=useState({title:program.title||'',summary:program.summary||'',description:program.description||'',focus_area:program.focus_area||'',location:program.location||'',start_date:program.start_date||'',end_date:program.end_date||'',partners:(program.partner_names||[]).join(', '),status:program.status||'upcoming',is_featured:!!program.is_featured,is_published:!!program.is_published,featured_image_path:program.featured_image_path||'',featured_image_url:program.featured_image_url||''});
  useEffect(()=>setDraft({title:program.title||'',summary:program.summary||'',description:program.description||'',focus_area:program.focus_area||'',location:program.location||'',start_date:program.start_date||'',end_date:program.end_date||'',partners:(program.partner_names||[]).join(', '),status:program.status||'upcoming',is_featured:!!program.is_featured,is_published:!!program.is_published,featured_image_path:program.featured_image_path||'',featured_image_url:program.featured_image_url||''}),[program]);
  function chooseExisting(id){const item=media.find(m=>m.id===id);if(item)setDraft(v=>({...v,featured_image_path:item.file_path,featured_image_url:item.public_url}))}
  return <article className="program-editor"><div className="program-editor-head"><div className="program-editor-image">{draft.featured_image_url?<img src={draft.featured_image_url} alt={draft.title||'Programme'}/>:<span>No image</span>}</div><div><div className="program-badges"><span className={`program-status ${draft.status}`}>{draft.status}</span><span className={draft.is_published?'program-published':'program-draft'}>{draft.is_published?'Published':'Draft'}</span>{draft.is_featured&&<span className="program-featured">Featured</span>}</div><h3>{draft.title||'Untitled programme'}</h3><p>{program.slug}</p></div></div>
    <div className="program-edit-grid"><label>Title<input value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}/></label><label>Focus area<input value={draft.focus_area} onChange={e=>setDraft(v=>({...v,focus_area:e.target.value}))}/></label><label className="program-full">Summary<input value={draft.summary} onChange={e=>setDraft(v=>({...v,summary:e.target.value}))}/></label><label className="program-full">Description<textarea rows="5" value={draft.description} onChange={e=>setDraft(v=>({...v,description:e.target.value}))}/></label><label>Location<input value={draft.location} onChange={e=>setDraft(v=>({...v,location:e.target.value}))}/></label><label>Partners<input value={draft.partners} onChange={e=>setDraft(v=>({...v,partners:e.target.value}))}/></label><label>Start date<input type="date" value={draft.start_date} onChange={e=>setDraft(v=>({...v,start_date:e.target.value}))}/></label><label>End date<input type="date" value={draft.end_date} onChange={e=>setDraft(v=>({...v,end_date:e.target.value}))}/></label><label>Status<select value={draft.status} onChange={e=>setDraft(v=>({...v,status:e.target.value}))}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label><div className="program-checks"><label className="media-check"><input type="checkbox" checked={draft.is_published} onChange={e=>setDraft(v=>({...v,is_published:e.target.checked}))}/> Published</label><label className="media-check"><input type="checkbox" checked={draft.is_featured} onChange={e=>setDraft(v=>({...v,is_featured:e.target.checked}))}/> Featured</label></div><label>Use Media Library<select value="" onChange={e=>chooseExisting(e.target.value)}><option value="">Choose image…</option>{media.map(item=><option key={item.id} value={item.id}>{item.title||'Untitled image'}</option>)}</select></label><label>Replace with upload<input type="file" accept="image/*" onChange={e=>e.target.files?.[0]&&onReplaceImage(program,e.target.files[0])}/></label></div>
    <div className="program-editor-actions"><button className="admin-primary-btn" type="button" onClick={()=>onSave(program.id,draft)}>Save changes</button><button className="media-danger-btn" type="button" onClick={()=>onDelete(program)}>Delete</button></div>
  </article>;
}
