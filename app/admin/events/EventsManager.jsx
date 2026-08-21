'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const blankForm = {
  title: '', summary: '', description: '', venue: '', location: '', starts_at: '', ends_at: '',
  registration_url: '', contact_text: '', status: 'draft', is_featured: false,
  featured_image_path: '', featured_image_url: ''
};

const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `event-${Date.now()}`;
const safeFileName = (name = '') => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
const messageFor = (error) => error?.message || 'Something went wrong. Please try again.';
const toLocalInput = (value) => value ? new Date(value).toISOString().slice(0,16) : '';
const toIso = (value) => value ? new Date(value).toISOString() : null;

export default function EventsManager({ adminRole }) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState([]);
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const flash = (text, isError = false) => {
    if (isError) { setError(text); setNotice(''); }
    else { setNotice(text); setError(''); }
    window.setTimeout(() => { setNotice(''); setError(''); }, 5000);
  };

  const loadData = useCallback(async () => {
    setBusy(true);
    const [eventsResult, mediaResult] = await Promise.all([
      supabase.from('events').select('*').order('starts_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }),
      supabase.from('media').select('id,title,public_url,file_path,is_published').eq('is_published', true).order('sort_order').order('created_at', { ascending: false })
    ]);
    const firstError = eventsResult.error || mediaResult.error;
    if (firstError) flash(messageFor(firstError), true);
    setEvents(eventsResult.data || []);
    setMedia(mediaResult.data || []);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function uploadEventImage(selectedFile) {
    if (!selectedFile) return { path: '', url: '' };
    if (!selectedFile.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if (selectedFile.size > 10 * 1024 * 1024) throw new Error('Event image must be 10 MB or smaller.');
    const folder = new Date().toISOString().slice(0,7);
    const unique = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `events/${folder}/${unique}-${safeFileName(selectedFile.name)}`;
    const { error: uploadError } = await supabase.storage.from('media').upload(path, selectedFile, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  function chooseMedia(id) {
    const item = media.find((m) => m.id === id);
    if (!item) return setForm((v) => ({ ...v, featured_image_path: '', featured_image_url: '' }));
    setFile(null);
    const picker = document.getElementById('gpdo-event-image');
    if (picker) picker.value = '';
    setForm((v) => ({ ...v, featured_image_path: item.file_path, featured_image_url: item.public_url }));
  }

  async function createEvent(e) {
    e.preventDefault();
    if (!form.title.trim()) return flash('Enter an event title.', true);
    if (!form.starts_at) return flash('Choose the event start date and time.', true);
    setSaving(true);
    let uploaded = null;
    try {
      let imagePath = form.featured_image_path;
      let imageUrl = form.featured_image_url;
      if (file) {
        uploaded = await uploadEventImage(file);
        imagePath = uploaded.path;
        imageUrl = uploaded.url;
      }
      const baseSlug = slugify(form.title);
      const existingSlugs = new Set(events.map((item) => item.slug));
      const slug = existingSlugs.has(baseSlug) ? `${baseSlug}-${Date.now().toString().slice(-6)}` : baseSlug;
      const payload = {
        title: form.title.trim(), slug,
        summary: form.summary.trim() || null,
        description: form.description.trim() || null,
        featured_image_path: imagePath || null,
        featured_image_url: imageUrl || null,
        venue: form.venue.trim() || null,
        location: form.location.trim() || null,
        starts_at: toIso(form.starts_at),
        ends_at: toIso(form.ends_at),
        registration_url: form.registration_url.trim() || null,
        contact_text: form.contact_text.trim() || null,
        status: form.status,
        is_featured: form.is_featured,
        published_at: form.status === 'published' ? new Date().toISOString() : null
      };
      const { error: insertError } = await supabase.from('events').insert(payload);
      if (insertError) throw insertError;
      setForm(blankForm); setFile(null);
      const picker = document.getElementById('gpdo-event-image');
      if (picker) picker.value = '';
      flash('Event created successfully.');
      await loadData();
    } catch (e2) {
      if (uploaded?.path) await supabase.storage.from('media').remove([uploaded.path]);
      flash(messageFor(e2), true);
    } finally { setSaving(false); }
  }

  async function saveEvent(id, values) {
    const current = events.find((item) => item.id === id);
    const payload = {
      ...values,
      starts_at: toIso(values.starts_at),
      ends_at: toIso(values.ends_at),
      published_at: values.status === 'published' ? (current?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString()
    };
    const { error: updateError } = await supabase.from('events').update(payload).eq('id', id);
    if (updateError) return flash(messageFor(updateError), true);
    flash('Event saved.');
    await loadData();
  }

  async function replaceEventImage(event, selectedFile) {
    try {
      const uploaded = await uploadEventImage(selectedFile);
      const oldPath = event.featured_image_path;
      const { error: updateError } = await supabase.from('events').update({ featured_image_path: uploaded.path, featured_image_url: uploaded.url, updated_at: new Date().toISOString() }).eq('id', event.id);
      if (updateError) {
        await supabase.storage.from('media').remove([uploaded.path]);
        throw updateError;
      }
      if (oldPath?.startsWith('events/')) await supabase.storage.from('media').remove([oldPath]);
      flash('Event image updated.');
      await loadData();
    } catch (e) { flash(messageFor(e), true); }
  }

  async function deleteEvent(event) {
    if (!window.confirm(`Delete “${event.title}”?`)) return;
    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id);
    if (deleteError) return flash(messageFor(deleteError), true);
    if (event.featured_image_path?.startsWith('events/')) await supabase.storage.from('media').remove([event.featured_image_path]);
    flash('Event deleted.');
    await loadData();
  }

  const now = Date.now();
  const counts = useMemo(() => {
    let upcoming = 0, past = 0, drafts = 0;
    for (const event of events) {
      if (event.status === 'draft') drafts += 1;
      const end = event.ends_at || event.starts_at;
      if (end && new Date(end).getTime() < now) past += 1; else upcoming += 1;
    }
    return { upcoming, past, drafts };
  }, [events, now]);

  return <div className="event-manager">
    {(notice || error) && <div className={error ? 'media-alert error' : 'media-alert success'}>{error || notice}</div>}

    <div className="event-stats">
      <div><span>All events</span><strong>{events.length}</strong></div>
      <div><span>Upcoming</span><strong>{counts.upcoming}</strong></div>
      <div><span>Past</span><strong>{counts.past}</strong></div>
      <div><span>Drafts</span><strong>{counts.drafts}</strong></div>
    </div>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Create Event</span><h2>Post a new activity</h2><p>Add the information visitors need, then publish when ready.</p></div><span className="media-role-badge">{adminRole}</span></div>
      <form className="event-create-form" onSubmit={createEvent}>
        <label>Event title<input value={form.title} onChange={(e) => setForm((v) => ({...v,title:e.target.value}))} placeholder="e.g. Community Health Outreach" /></label>
        <label>Short summary<input value={form.summary} onChange={(e) => setForm((v) => ({...v,summary:e.target.value}))} placeholder="One sentence for event cards" /></label>
        <label className="event-full">Full description<textarea rows="5" value={form.description} onChange={(e) => setForm((v) => ({...v,description:e.target.value}))} placeholder="Tell visitors what the event is about, who it is for and what to expect." /></label>
        <label>Start date & time<input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((v) => ({...v,starts_at:e.target.value}))} /></label>
        <label>End date & time<input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((v) => ({...v,ends_at:e.target.value}))} /></label>
        <label>Venue<input value={form.venue} onChange={(e) => setForm((v) => ({...v,venue:e.target.value}))} placeholder="e.g. Community Centre" /></label>
        <label>Location<input value={form.location} onChange={(e) => setForm((v) => ({...v,location:e.target.value}))} placeholder="Town / Region / Country" /></label>
        <label>Registration link<input type="url" value={form.registration_url} onChange={(e) => setForm((v) => ({...v,registration_url:e.target.value}))} placeholder="https://..." /></label>
        <label>Contact information<input value={form.contact_text} onChange={(e) => setForm((v) => ({...v,contact_text:e.target.value}))} placeholder="Phone, email or instructions" /></label>
        <label>Status<select value={form.status} onChange={(e) => setForm((v) => ({...v,status:e.target.value}))}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
        <label className="media-check"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((v) => ({...v,is_featured:e.target.checked}))} /> Feature this event</label>
        <label>Choose from Media Library<select value="" onChange={(e) => chooseMedia(e.target.value)}><option value="">Select an existing image…</option>{media.map((item) => <option key={item.id} value={item.id}>{item.title || 'Untitled image'}</option>)}</select></label>
        <label>Or upload an event image<input id="gpdo-event-image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
        {(form.featured_image_url || file) && <div className="event-image-preview event-full">{form.featured_image_url && !file ? <img src={form.featured_image_url} alt="Selected event" /> : <div><strong>{file?.name}</strong><span>Image will upload when the event is created.</span></div>}</div>}
        <div className="event-full"><button className="admin-primary-btn" type="submit" disabled={saving}>{saving ? 'Saving event…' : 'Create event'}</button></div>
      </form>
    </section>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Event Library</span><h2>{events.length} event{events.length === 1 ? '' : 's'}</h2><p>Past dates are detected automatically; published past events move into the public archive view.</p></div><button className="admin-secondary-btn" type="button" onClick={loadData}>Refresh</button></div>
      {busy ? <div className="media-empty">Loading events…</div> : events.length === 0 ? <div className="media-empty"><strong>No events yet.</strong><span>Create your first event above. Nothing will appear publicly until you choose Published.</span></div> : <div className="event-list">{events.map((event) => <EventEditor key={event.id} event={event} media={media} onSave={saveEvent} onDelete={deleteEvent} onReplaceImage={replaceEventImage} />)}</div>}
    </section>
  </div>;
}

function EventEditor({ event, media, onSave, onDelete, onReplaceImage }) {
  const [draft, setDraft] = useState({
    title:event.title || '', summary:event.summary || '', description:event.description || '', venue:event.venue || '', location:event.location || '',
    starts_at:toLocalInput(event.starts_at), ends_at:toLocalInput(event.ends_at), registration_url:event.registration_url || '', contact_text:event.contact_text || '',
    status:event.status || 'draft', is_featured:!!event.is_featured, featured_image_path:event.featured_image_path || '', featured_image_url:event.featured_image_url || ''
  });
  useEffect(() => setDraft({
    title:event.title || '', summary:event.summary || '', description:event.description || '', venue:event.venue || '', location:event.location || '',
    starts_at:toLocalInput(event.starts_at), ends_at:toLocalInput(event.ends_at), registration_url:event.registration_url || '', contact_text:event.contact_text || '',
    status:event.status || 'draft', is_featured:!!event.is_featured, featured_image_path:event.featured_image_path || '', featured_image_url:event.featured_image_url || ''
  }), [event]);

  const end = event.ends_at || event.starts_at;
  const timing = end && new Date(end).getTime() < Date.now() ? 'Past' : 'Upcoming';
  function chooseExisting(id) {
    const item = media.find((m) => m.id === id);
    if (item) setDraft((v) => ({...v, featured_image_path:item.file_path, featured_image_url:item.public_url}));
  }

  return <article className="event-editor">
    <div className="event-editor-head">
      <div className="event-editor-image">{draft.featured_image_url ? <img src={draft.featured_image_url} alt={draft.title || 'Event'} /> : <span>No image</span>}</div>
      <div><div className="event-badges"><span className={`event-status ${draft.status}`}>{draft.status}</span><span className={`event-timing ${timing.toLowerCase()}`}>{timing}</span>{draft.is_featured && <span className="event-featured">Featured</span>}</div><h3>{draft.title || 'Untitled event'}</h3><p>{event.slug}</p></div>
    </div>
    <div className="event-edit-grid">
      <label>Title<input value={draft.title} onChange={(e) => setDraft((v) => ({...v,title:e.target.value}))} /></label>
      <label>Summary<input value={draft.summary} onChange={(e) => setDraft((v) => ({...v,summary:e.target.value}))} /></label>
      <label className="event-full">Description<textarea rows="4" value={draft.description} onChange={(e) => setDraft((v) => ({...v,description:e.target.value}))} /></label>
      <label>Starts<input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft((v) => ({...v,starts_at:e.target.value}))} /></label>
      <label>Ends<input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft((v) => ({...v,ends_at:e.target.value}))} /></label>
      <label>Venue<input value={draft.venue} onChange={(e) => setDraft((v) => ({...v,venue:e.target.value}))} /></label>
      <label>Location<input value={draft.location} onChange={(e) => setDraft((v) => ({...v,location:e.target.value}))} /></label>
      <label>Registration URL<input type="url" value={draft.registration_url} onChange={(e) => setDraft((v) => ({...v,registration_url:e.target.value}))} /></label>
      <label>Contact<input value={draft.contact_text} onChange={(e) => setDraft((v) => ({...v,contact_text:e.target.value}))} /></label>
      <label>Status<select value={draft.status} onChange={(e) => setDraft((v) => ({...v,status:e.target.value}))}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label>
      <label className="media-check"><input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft((v) => ({...v,is_featured:e.target.checked}))} /> Featured</label>
      <label>Use Media Library<select value="" onChange={(e) => chooseExisting(e.target.value)}><option value="">Choose another image…</option>{media.map((item) => <option key={item.id} value={item.id}>{item.title || 'Untitled image'}</option>)}</select></label>
      <label>Upload replacement<input type="file" accept="image/*" onChange={(e) => { const selected = e.target.files?.[0]; if (selected) onReplaceImage(event, selected); e.target.value=''; }} /></label>
    </div>
    <div className="event-editor-actions"><button className="admin-primary-btn" type="button" onClick={() => onSave(event.id, draft)}>Save event</button><a className="admin-secondary-btn" href={`/events/${event.slug}`} target="_blank" rel="noopener">Preview public page ↗</a><button className="media-danger-btn" type="button" onClick={() => onDelete(event)}>Delete</button></div>
  </article>;
}
