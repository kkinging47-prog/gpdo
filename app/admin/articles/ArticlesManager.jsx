'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const blankForm = { title:'', excerpt:'', body:'', author_name:'', category:'', tags:'', status:'draft', is_featured:false, featured_image_path:'', featured_image_url:'' };
const slugify = (value='') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || `article-${Date.now()}`;
const safeFileName = (name='') => name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/-+/g,'-');
const messageFor = (error) => error?.message || 'Something went wrong. Please try again.';
const tagArray = (value='') => value.split(',').map((v)=>v.trim()).filter(Boolean);

export default function ArticlesManager({ adminRole, defaultAuthor }) {
  const supabase = useMemo(() => createClient(), []);
  const [articles,setArticles] = useState([]);
  const [media,setMedia] = useState([]);
  const [form,setForm] = useState({...blankForm,author_name:defaultAuthor || 'GPDO'});
  const [file,setFile] = useState(null);
  const [busy,setBusy] = useState(true);
  const [saving,setSaving] = useState(false);
  const [notice,setNotice] = useState('');
  const [error,setError] = useState('');

  const flash = (text,isError=false) => {
    if(isError){setError(text);setNotice('');} else {setNotice(text);setError('');}
    window.setTimeout(()=>{setNotice('');setError('');},5000);
  };

  const loadData = useCallback(async()=>{
    setBusy(true);
    const [articlesResult,mediaResult] = await Promise.all([
      supabase.from('articles').select('*').order('is_featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}),
      supabase.from('media').select('id,title,public_url,file_path,is_published').eq('is_published',true).order('sort_order').order('created_at',{ascending:false})
    ]);
    const firstError = articlesResult.error || mediaResult.error;
    if(firstError) flash(messageFor(firstError),true);
    setArticles(articlesResult.data || []);
    setMedia(mediaResult.data || []);
    setBusy(false);
  },[supabase]);

  useEffect(()=>{loadData();},[loadData]);

  async function uploadImage(selectedFile){
    if(!selectedFile) return {path:'',url:''};
    if(!selectedFile.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if(selectedFile.size > 10*1024*1024) throw new Error('Article image must be 10 MB or smaller.');
    const folder = new Date().toISOString().slice(0,7);
    const unique = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `articles/${folder}/${unique}-${safeFileName(selectedFile.name)}`;
    const {error:uploadError} = await supabase.storage.from('media').upload(path,selectedFile,{cacheControl:'3600',upsert:false});
    if(uploadError) throw uploadError;
    const {data} = supabase.storage.from('media').getPublicUrl(path);
    return {path,url:data.publicUrl};
  }

  function chooseMedia(id){
    const item = media.find((m)=>m.id===id);
    setFile(null);
    const picker=document.getElementById('gpdo-article-image'); if(picker) picker.value='';
    if(!item) return setForm((v)=>({...v,featured_image_path:'',featured_image_url:''}));
    setForm((v)=>({...v,featured_image_path:item.file_path,featured_image_url:item.public_url}));
  }

  async function createArticle(e){
    e.preventDefault();
    if(!form.title.trim()) return flash('Enter an article title.',true);
    if(!form.body.trim()) return flash('Enter the article content.',true);
    setSaving(true);
    let uploaded=null;
    try{
      let imagePath=form.featured_image_path, imageUrl=form.featured_image_url;
      if(file){ uploaded=await uploadImage(file); imagePath=uploaded.path; imageUrl=uploaded.url; }
      const baseSlug=slugify(form.title);
      const existing=new Set(articles.map((a)=>a.slug));
      const slug=existing.has(baseSlug)?`${baseSlug}-${Date.now().toString().slice(-6)}`:baseSlug;
      const now=new Date().toISOString();
      const payload={
        title:form.title.trim(), slug,
        excerpt:form.excerpt.trim()||null,
        body:form.body.trim(),
        featured_image_path:imagePath||null,
        featured_image_url:imageUrl||null,
        author_name:form.author_name.trim()||'GPDO',
        category:form.category.trim()||null,
        tags:tagArray(form.tags),
        status:form.status,
        is_featured:form.is_featured,
        published_at:form.status==='published'?now:null
      };
      const {error:insertError}=await supabase.from('articles').insert(payload);
      if(insertError) throw insertError;
      setForm({...blankForm,author_name:defaultAuthor||'GPDO'});setFile(null);
      const picker=document.getElementById('gpdo-article-image'); if(picker) picker.value='';
      flash('Article created successfully.'); await loadData();
    }catch(e2){ if(uploaded?.path) await supabase.storage.from('media').remove([uploaded.path]); flash(messageFor(e2),true); }
    finally{setSaving(false);}
  }

  async function saveArticle(id,values){
    const current=articles.find((a)=>a.id===id);
    const payload={...values,tags:tagArray(values.tags),published_at:values.status==='published'?(current?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
    const {error:updateError}=await supabase.from('articles').update(payload).eq('id',id);
    if(updateError) return flash(messageFor(updateError),true);
    flash('Article saved.'); await loadData();
  }

  async function replaceImage(article,selectedFile){
    try{
      const uploaded=await uploadImage(selectedFile);
      const oldPath=article.featured_image_path;
      const {error:updateError}=await supabase.from('articles').update({featured_image_path:uploaded.path,featured_image_url:uploaded.url,updated_at:new Date().toISOString()}).eq('id',article.id);
      if(updateError){await supabase.storage.from('media').remove([uploaded.path]);throw updateError;}
      if(oldPath?.startsWith('articles/')) await supabase.storage.from('media').remove([oldPath]);
      flash('Article image updated.'); await loadData();
    }catch(e){flash(messageFor(e),true);}
  }

  async function deleteArticle(article){
    if(!window.confirm(`Delete “${article.title}”?`)) return;
    const {error:deleteError}=await supabase.from('articles').delete().eq('id',article.id);
    if(deleteError) return flash(messageFor(deleteError),true);
    if(article.featured_image_path?.startsWith('articles/')) await supabase.storage.from('media').remove([article.featured_image_path]);
    flash('Article deleted.'); await loadData();
  }

  const counts=useMemo(()=>({published:articles.filter((a)=>a.status==='published').length,drafts:articles.filter((a)=>a.status==='draft').length,featured:articles.filter((a)=>a.is_featured).length}),[articles]);

  return <div className="article-manager">
    {(notice||error)&&<div className={error?'media-alert error':'media-alert success'}>{error||notice}</div>}
    <div className="article-stats"><div><span>All stories</span><strong>{articles.length}</strong></div><div><span>Published</span><strong>{counts.published}</strong></div><div><span>Drafts</span><strong>{counts.drafts}</strong></div><div><span>Featured</span><strong>{counts.featured}</strong></div></div>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Create Story</span><h2>Write a news article</h2><p>Save as a draft or publish immediately when the story is ready.</p></div><span className="media-role-badge">{adminRole}</span></div>
      <form className="article-create-form" onSubmit={createArticle}>
        <label>Headline<input value={form.title} onChange={(e)=>setForm((v)=>({...v,title:e.target.value}))} placeholder="Article headline" /></label>
        <label>Category<input value={form.category} onChange={(e)=>setForm((v)=>({...v,category:e.target.value}))} placeholder="e.g. Community Outreach" /></label>
        <label className="article-full">Short excerpt<textarea rows="2" value={form.excerpt} onChange={(e)=>setForm((v)=>({...v,excerpt:e.target.value}))} placeholder="A short summary for the News page." /></label>
        <label className="article-full">Article body<textarea rows="12" value={form.body} onChange={(e)=>setForm((v)=>({...v,body:e.target.value}))} placeholder="Write the full story here. Paragraph breaks will be preserved." /></label>
        <label>Author<input value={form.author_name} onChange={(e)=>setForm((v)=>({...v,author_name:e.target.value}))} /></label>
        <label>Tags<input value={form.tags} onChange={(e)=>setForm((v)=>({...v,tags:e.target.value}))} placeholder="health, outreach, partnership" /></label>
        <label>Status<select value={form.status} onChange={(e)=>setForm((v)=>({...v,status:e.target.value}))}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        <label className="media-check"><input type="checkbox" checked={form.is_featured} onChange={(e)=>setForm((v)=>({...v,is_featured:e.target.checked}))} /> Feature this story</label>
        <label>Choose from Media Library<select value="" onChange={(e)=>chooseMedia(e.target.value)}><option value="">Select an existing image…</option>{media.map((m)=><option key={m.id} value={m.id}>{m.title||'Untitled image'}</option>)}</select></label>
        <label>Or upload a story image<input id="gpdo-article-image" type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} /></label>
        {(form.featured_image_url||file)&&<div className="article-image-preview article-full">{form.featured_image_url&&!file?<img src={form.featured_image_url} alt="Selected article" />:<div><strong>{file?.name}</strong><span>Image will upload when the article is created.</span></div>}</div>}
        <div className="article-full"><button className="admin-primary-btn" type="submit" disabled={saving}>{saving?'Saving article…':'Create article'}</button></div>
      </form>
    </section>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">News Library</span><h2>{articles.length} stor{articles.length===1?'y':'ies'}</h2><p>Only Published stories are visible on the public website.</p></div><button className="admin-secondary-btn" type="button" onClick={loadData}>Refresh</button></div>
      {busy?<div className="media-empty">Loading articles…</div>:articles.length===0?<div className="media-empty"><strong>No articles yet.</strong><span>Create the first GPDO news story above. Drafts remain private.</span></div>:<div className="article-list">{articles.map((article)=><ArticleEditor key={article.id} article={article} media={media} onSave={saveArticle} onDelete={deleteArticle} onReplaceImage={replaceImage} />)}</div>}
    </section>
  </div>;
}

function ArticleEditor({article,media,onSave,onDelete,onReplaceImage}){
  const [draft,setDraft]=useState({title:article.title||'',excerpt:article.excerpt||'',body:article.body||'',author_name:article.author_name||'',category:article.category||'',tags:(article.tags||[]).join(', '),status:article.status||'draft',is_featured:!!article.is_featured,featured_image_path:article.featured_image_path||'',featured_image_url:article.featured_image_url||''});
  useEffect(()=>setDraft({title:article.title||'',excerpt:article.excerpt||'',body:article.body||'',author_name:article.author_name||'',category:article.category||'',tags:(article.tags||[]).join(', '),status:article.status||'draft',is_featured:!!article.is_featured,featured_image_path:article.featured_image_path||'',featured_image_url:article.featured_image_url||''}),[article]);
  function chooseExisting(id){const item=media.find((m)=>m.id===id);if(item)setDraft((v)=>({...v,featured_image_path:item.file_path,featured_image_url:item.public_url}));}
  return <article className="article-editor">
    <div className="article-editor-head"><div className="article-editor-image">{draft.featured_image_url?<img src={draft.featured_image_url} alt={draft.title||'Article'} />:<span>No image</span>}</div><div><div className="article-badges"><span className={`article-status ${draft.status}`}>{draft.status}</span>{draft.is_featured&&<span className="article-featured">Featured</span>}</div><h3>{draft.title||'Untitled story'}</h3><p>{article.slug}</p></div></div>
    <div className="article-edit-grid">
      <label>Headline<input value={draft.title} onChange={(e)=>setDraft((v)=>({...v,title:e.target.value}))} /></label>
      <label>Category<input value={draft.category} onChange={(e)=>setDraft((v)=>({...v,category:e.target.value}))} /></label>
      <label className="article-full">Excerpt<textarea rows="2" value={draft.excerpt} onChange={(e)=>setDraft((v)=>({...v,excerpt:e.target.value}))} /></label>
      <label className="article-full">Article body<textarea rows="9" value={draft.body} onChange={(e)=>setDraft((v)=>({...v,body:e.target.value}))} /></label>
      <label>Author<input value={draft.author_name} onChange={(e)=>setDraft((v)=>({...v,author_name:e.target.value}))} /></label>
      <label>Tags<input value={draft.tags} onChange={(e)=>setDraft((v)=>({...v,tags:e.target.value}))} /></label>
      <label>Status<select value={draft.status} onChange={(e)=>setDraft((v)=>({...v,status:e.target.value}))}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label className="media-check"><input type="checkbox" checked={draft.is_featured} onChange={(e)=>setDraft((v)=>({...v,is_featured:e.target.checked}))} /> Featured</label>
      <label>Use Media Library<select value="" onChange={(e)=>chooseExisting(e.target.value)}><option value="">Choose image…</option>{media.map((m)=><option key={m.id} value={m.id}>{m.title||'Untitled image'}</option>)}</select></label>
      <label>Replace image<input type="file" accept="image/*" onChange={(e)=>{const selected=e.target.files?.[0];if(selected)onReplaceImage(article,selected);e.target.value='';}} /></label>
    </div>
    <div className="article-actions"><button className="admin-primary-btn" type="button" onClick={()=>onSave(article.id,draft)}>Save changes</button><button className="media-danger-btn" type="button" onClick={()=>onDelete(article)}>Delete article</button>{draft.status==='published'&&<a className="admin-secondary-btn" href={`/news/${article.slug}`} target="_blank" rel="noreferrer">View public story ↗</a>}</div>
  </article>;
}
