'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const safeFileName = (name = '') => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
const messageFor = (error) => error?.message || 'Something went wrong. Please try again.';
const toIso = (value) => value ? new Date(value).toISOString() : null;
const toLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const emptyForm = () => ({
  title: '',
  subtitle: '',
  image_path: '',
  image_url: '',
  button_text: 'Partner with GPDO',
  button_url: '/get-involved',
  secondary_button_text: 'Explore our work',
  secondary_button_url: '/programs',
  overlay_strength: 0.55,
  is_active: true,
  starts_at: '',
  ends_at: '',
});

export default function SlideshowManager() {
  const supabase = useMemo(() => createClient(), []);
  const [slides, setSlides] = useState([]);
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [selectedMedia, setSelectedMedia] = useState('');
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const flash = (text, isError = false) => {
    if (isError) { setError(text); setNotice(''); }
    else { setNotice(text); setError(''); }
    window.setTimeout(() => { setNotice(''); setError(''); }, 5000);
  };

  const loadData = useCallback(async () => {
    setBusy(true);
    const [slidesResult, mediaResult] = await Promise.all([
      supabase.from('home_slides').select('*').order('sort_order').order('created_at'),
      supabase.from('media').select('id,title,alt_text,file_path,public_url,is_published,category').order('created_at', { ascending: false }),
    ]);
    const firstError = slidesResult.error || mediaResult.error;
    if (firstError) flash(messageFor(firstError), true);
    setSlides(slidesResult.data || []);
    setMedia(mediaResult.data || []);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  function chooseMedia(mediaId) {
    setSelectedMedia(mediaId);
    const item = media.find((m) => m.id === mediaId);
    if (!item) return;
    setForm((current) => ({ ...current, image_path: item.file_path || '', image_url: item.public_url || '' }));
  }

  async function uploadImage(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return flash('Please choose an image file.', true);
    if (file.size > 10 * 1024 * 1024) return flash('The image must be 10 MB or smaller.', true);
    setUploading(true);
    try {
      const folder = new Date().toISOString().slice(0, 10);
      const unique = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `slides/${folder}/${unique}-${safeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      const { data: mediaRow, error: mediaError } = await supabase.from('media').insert({
        title,
        alt_text: title,
        file_path: path,
        public_url: urlData.publicUrl,
        mime_type: file.type,
        file_size: file.size,
        category: 'Homepage Slideshow',
        is_published: true,
        is_featured: true,
      }).select('id,title,alt_text,file_path,public_url,is_published,category').single();
      if (mediaError) {
        await supabase.storage.from('media').remove([path]);
        throw mediaError;
      }
      setMedia((items) => [mediaRow, ...items]);
      setSelectedMedia(mediaRow.id);
      setForm((current) => ({ ...current, image_path: mediaRow.file_path, image_url: mediaRow.public_url }));
      flash('Slide image uploaded to the Media Library.');
    } catch (e) {
      flash(messageFor(e), true);
    } finally {
      setUploading(false);
    }
  }

  async function createSlide(e) {
    e.preventDefault();
    if (!form.title.trim()) return flash('Enter a slide headline.', true);
    if (!form.image_url && !form.image_path) return flash('Choose or upload a slide image.', true);
    if (form.starts_at && form.ends_at && new Date(form.starts_at) >= new Date(form.ends_at)) return flash('The end date must be after the start date.', true);
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      image_path: form.image_path,
      image_url: form.image_url || null,
      button_text: form.button_text.trim() || null,
      button_url: form.button_url.trim() || null,
      secondary_button_text: form.secondary_button_text.trim() || null,
      secondary_button_url: form.secondary_button_url.trim() || null,
      overlay_strength: Number(form.overlay_strength),
      is_active: form.is_active,
      sort_order: slides.length ? Math.max(...slides.map((s) => s.sort_order || 0)) + 10 : 10,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
    };
    const { error: insertError } = await supabase.from('home_slides').insert(payload);
    setSaving(false);
    if (insertError) return flash(messageFor(insertError), true);
    setForm(emptyForm());
    setSelectedMedia('');
    flash('Homepage slide created.');
    await loadData();
  }

  async function saveSlide(id, values) {
    if (!values.title?.trim()) return flash('A slide headline is required.', true);
    if (!values.image_url && !values.image_path) return flash('A slide image is required.', true);
    if (values.starts_at && values.ends_at && new Date(values.starts_at) >= new Date(values.ends_at)) return flash('The end date must be after the start date.', true);
    const payload = {
      ...values,
      title: values.title.trim(),
      subtitle: values.subtitle?.trim() || null,
      button_text: values.button_text?.trim() || null,
      button_url: values.button_url?.trim() || null,
      secondary_button_text: values.secondary_button_text?.trim() || null,
      secondary_button_url: values.secondary_button_url?.trim() || null,
      overlay_strength: Number(values.overlay_strength),
      starts_at: toIso(values.starts_at),
      ends_at: toIso(values.ends_at),
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase.from('home_slides').update(payload).eq('id', id);
    if (updateError) return flash(messageFor(updateError), true);
    flash('Slide saved.');
    await loadData();
  }

  async function deleteSlide(slide) {
    if (!window.confirm(`Delete the slide “${slide.title}”? The image will remain in the Media Library.`)) return;
    const { error: deleteError } = await supabase.from('home_slides').delete().eq('id', slide.id);
    if (deleteError) return flash(messageFor(deleteError), true);
    flash('Slide deleted.');
    await loadData();
  }

  async function moveSlide(id, direction) {
    const ordered = [...slides].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const index = ordered.findIndex((slide) => slide.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    for (let i = 0; i < ordered.length; i += 1) {
      const { error: orderError } = await supabase.from('home_slides').update({ sort_order: (i + 1) * 10 }).eq('id', ordered[i].id);
      if (orderError) return flash(messageFor(orderError), true);
    }
    await loadData();
  }

  return <div className="slides-manager">
    {(notice || error) && <div className={error ? 'media-alert error' : 'media-alert success'}>{error || notice}</div>}

    <section className="slides-panel">
      <div className="slides-panel-head"><div><span className="admin-eyebrow">Create slide</span><h2>Add a homepage story</h2><p>Use an existing Media Library image or upload a new one.</p></div></div>
      <form className="slide-create-form" onSubmit={createSlide}>
        <div className="slide-image-picker">
          <label>Choose from Media Library<select value={selectedMedia} onChange={(e) => chooseMedia(e.target.value)}><option value="">Select an image…</option>{media.map((item) => <option key={item.id} value={item.id}>{item.title || item.file_path}{item.is_published ? '' : ' (draft)'}</option>)}</select></label>
          <label className="slide-upload-button">{uploading ? 'Uploading…' : 'Upload a new image'}<input type="file" accept="image/*" disabled={uploading} onChange={(e) => uploadImage(e.target.files?.[0])} /></label>
          {(form.image_url || form.image_path) && <img className="slide-create-preview" src={form.image_url || form.image_path} alt="Selected slide preview" />}
        </div>
        <div className="slide-fields">
          <label>Headline<input value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="Empowering communities. Creating lasting change." /></label>
          <label>Supporting text<textarea rows="3" value={form.subtitle} onChange={(e) => setForm((v) => ({ ...v, subtitle: e.target.value }))} placeholder="A short message shown beneath the headline." /></label>
          <div className="slide-two-col"><label>Primary button text<input value={form.button_text} onChange={(e) => setForm((v) => ({ ...v, button_text: e.target.value }))} /></label><label>Primary button link<input value={form.button_url} onChange={(e) => setForm((v) => ({ ...v, button_url: e.target.value }))} /></label></div>
          <div className="slide-two-col"><label>Second button text<input value={form.secondary_button_text} onChange={(e) => setForm((v) => ({ ...v, secondary_button_text: e.target.value }))} /></label><label>Second button link<input value={form.secondary_button_url} onChange={(e) => setForm((v) => ({ ...v, secondary_button_url: e.target.value }))} /></label></div>
          <label>Background darkness <strong>{Math.round(Number(form.overlay_strength) * 100)}%</strong><input type="range" min="0" max="0.9" step="0.05" value={form.overlay_strength} onChange={(e) => setForm((v) => ({ ...v, overlay_strength: e.target.value }))} /></label>
          <div className="slide-two-col"><label>Start showing (optional)<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((v) => ({ ...v, starts_at: e.target.value }))} /></label><label>Stop showing (optional)<input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((v) => ({ ...v, ends_at: e.target.value }))} /></label></div>
          <label className="media-check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((v) => ({ ...v, is_active: e.target.checked }))} /> Active / visible on homepage</label>
          <button className="admin-primary-btn" type="submit" disabled={saving || uploading}>{saving ? 'Creating…' : 'Create slide'}</button>
        </div>
      </form>
    </section>

    <section className="slides-panel">
      <div className="slides-panel-head"><div><span className="admin-eyebrow">Homepage slideshow</span><h2>{slides.length} slide{slides.length === 1 ? '' : 's'}</h2><p>The homepage automatically rotates through active slides every seven seconds.</p></div><button className="admin-secondary-btn" type="button" onClick={loadData}>Refresh</button></div>
      {busy ? <div className="media-empty">Loading slideshow…</div> : slides.length === 0 ? <div className="media-empty"><strong>No managed slides yet.</strong><span>Create the first slide above.</span></div> : <div className="slides-list">{slides.map((slide, index) => <SlideCard key={slide.id} slide={slide} media={media} first={index === 0} last={index === slides.length - 1} onSave={saveSlide} onDelete={deleteSlide} onMove={moveSlide} />)}</div>}
    </section>
  </div>;
}

function SlideCard({ slide, media, first, last, onSave, onDelete, onMove }) {
  const [draft, setDraft] = useState({
    title: slide.title || '', subtitle: slide.subtitle || '', image_path: slide.image_path || '', image_url: slide.image_url || '',
    button_text: slide.button_text || '', button_url: slide.button_url || '', secondary_button_text: slide.secondary_button_text || '', secondary_button_url: slide.secondary_button_url || '',
    overlay_strength: Number(slide.overlay_strength ?? 0.55), is_active: !!slide.is_active, sort_order: slide.sort_order || 0,
    starts_at: toLocalInput(slide.starts_at), ends_at: toLocalInput(slide.ends_at),
  });
  useEffect(() => setDraft({
    title: slide.title || '', subtitle: slide.subtitle || '', image_path: slide.image_path || '', image_url: slide.image_url || '',
    button_text: slide.button_text || '', button_url: slide.button_url || '', secondary_button_text: slide.secondary_button_text || '', secondary_button_url: slide.secondary_button_url || '',
    overlay_strength: Number(slide.overlay_strength ?? 0.55), is_active: !!slide.is_active, sort_order: slide.sort_order || 0,
    starts_at: toLocalInput(slide.starts_at), ends_at: toLocalInput(slide.ends_at),
  }), [slide]);

  function replaceImage(mediaId) {
    const item = media.find((m) => m.id === mediaId);
    if (item) setDraft((v) => ({ ...v, image_path: item.file_path || '', image_url: item.public_url || '' }));
  }

  const now = new Date();
  const scheduled = slide.starts_at && new Date(slide.starts_at) > now;
  const expired = slide.ends_at && new Date(slide.ends_at) < now;
  const status = !slide.is_active ? 'Inactive' : scheduled ? 'Scheduled' : expired ? 'Expired' : 'Live';

  return <article className="slide-card">
    <div className="slide-card-preview"><img src={draft.image_url || draft.image_path} alt="" /><span className={`slide-status ${status.toLowerCase()}`}>{status}</span></div>
    <div className="slide-card-body">
      <div className="slide-order"><button type="button" disabled={first} onClick={() => onMove(slide.id, -1)}>↑ Move up</button><button type="button" disabled={last} onClick={() => onMove(slide.id, 1)}>↓ Move down</button></div>
      <label>Headline<input value={draft.title} onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))} /></label>
      <label>Supporting text<textarea rows="3" value={draft.subtitle} onChange={(e) => setDraft((v) => ({ ...v, subtitle: e.target.value }))} /></label>
      <label>Replace image from Media Library<select defaultValue="" onChange={(e) => replaceImage(e.target.value)}><option value="">Keep current image</option>{media.map((item) => <option key={item.id} value={item.id}>{item.title || item.file_path}</option>)}</select></label>
      <div className="slide-two-col"><label>Primary text<input value={draft.button_text} onChange={(e) => setDraft((v) => ({ ...v, button_text: e.target.value }))} /></label><label>Primary link<input value={draft.button_url} onChange={(e) => setDraft((v) => ({ ...v, button_url: e.target.value }))} /></label></div>
      <div className="slide-two-col"><label>Second text<input value={draft.secondary_button_text} onChange={(e) => setDraft((v) => ({ ...v, secondary_button_text: e.target.value }))} /></label><label>Second link<input value={draft.secondary_button_url} onChange={(e) => setDraft((v) => ({ ...v, secondary_button_url: e.target.value }))} /></label></div>
      <label>Background darkness <strong>{Math.round(Number(draft.overlay_strength) * 100)}%</strong><input type="range" min="0" max="0.9" step="0.05" value={draft.overlay_strength} onChange={(e) => setDraft((v) => ({ ...v, overlay_strength: e.target.value }))} /></label>
      <div className="slide-two-col"><label>Starts<input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft((v) => ({ ...v, starts_at: e.target.value }))} /></label><label>Ends<input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft((v) => ({ ...v, ends_at: e.target.value }))} /></label></div>
      <label className="media-check"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft((v) => ({ ...v, is_active: e.target.checked }))} /> Active</label>
      <div className="slide-card-actions"><button className="admin-primary-btn" type="button" onClick={() => onSave(slide.id, draft)}>Save changes</button><button className="media-danger-btn" type="button" onClick={() => onDelete(slide)}>Delete slide</button></div>
    </div>
  </article>;
}
