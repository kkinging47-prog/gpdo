'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `album-${Date.now()}`;
const titleFromFile = (name = '') => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
const safeFileName = (name = '') => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
const messageFor = (error) => error?.message || 'Something went wrong. Please try again.';

export default function MediaGalleryManager({ adminRole }) {
  const supabase = useMemo(() => createClient(), []);
  const [media, setMedia] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [albumItems, setAlbumItems] = useState([]);
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('Community Outreach');
  const [publishNow, setPublishNow] = useState(true);
  const [albumForm, setAlbumForm] = useState({ title: '', description: '', is_published: true });

  const flash = (text, isError = false) => {
    if (isError) { setError(text); setNotice(''); }
    else { setNotice(text); setError(''); }
    window.setTimeout(() => { setNotice(''); setError(''); }, 5000);
  };

  const loadData = useCallback(async () => {
    setBusy(true);
    const [mediaResult, albumsResult, itemsResult] = await Promise.all([
      supabase.from('media').select('*').order('sort_order').order('created_at', { ascending: false }),
      supabase.from('gallery_albums').select('*').order('sort_order').order('created_at'),
      supabase.from('gallery_album_items').select('*').order('sort_order'),
    ]);
    const firstError = mediaResult.error || albumsResult.error || itemsResult.error;
    if (firstError) flash(messageFor(firstError), true);
    setMedia(mediaResult.data || []);
    setAlbums(albumsResult.data || []);
    setAlbumItems(itemsResult.data || []);
    setBusy(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function uploadSelected() {
    if (!files.length) return flash('Choose at least one image first.', true);
    setUploading(true);
    setError(''); setNotice('');
    let completed = 0;
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10 MB.`);
        const folder = new Date().toISOString().slice(0, 10);
        const unique = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = `gallery/${folder}/${unique}-${safeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        const title = titleFromFile(file.name);
        const { error: insertError } = await supabase.from('media').insert({
          title,
          alt_text: title,
          file_path: path,
          public_url: urlData.publicUrl,
          mime_type: file.type,
          file_size: file.size,
          category: uploadCategory || null,
          is_published: publishNow,
          is_featured: false,
          sort_order: 0,
        });
        if (insertError) {
          await supabase.storage.from('media').remove([path]);
          throw insertError;
        }
        completed += 1;
      }
      setFiles([]);
      const picker = document.getElementById('gpdo-media-upload');
      if (picker) picker.value = '';
      flash(`${completed} image${completed === 1 ? '' : 's'} uploaded successfully.`);
      await loadData();
    } catch (e) {
      flash(messageFor(e), true);
    } finally {
      setUploading(false);
    }
  }

  async function saveMedia(id, values) {
    const { error: updateError } = await supabase.from('media').update({ ...values, updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) return flash(messageFor(updateError), true);
    flash('Media details saved.');
    await loadData();
  }

  async function deleteMedia(item) {
    if (!window.confirm(`Delete “${item.title || 'this image'}” from the media library?`)) return;
    const { error: itemError } = await supabase.from('gallery_album_items').delete().eq('media_id', item.id);
    if (itemError) return flash(messageFor(itemError), true);
    const { error: rowError } = await supabase.from('media').delete().eq('id', item.id);
    if (rowError) return flash(messageFor(rowError), true);
    if (item.file_path && !item.public_url?.startsWith('/assets/')) await supabase.storage.from('media').remove([item.file_path]);
    flash('Image deleted.');
    await loadData();
  }

  async function createAlbum(e) {
    e.preventDefault();
    if (!albumForm.title.trim()) return flash('Enter an album title.', true);
    const { error: albumError } = await supabase.from('gallery_albums').insert({
      title: albumForm.title.trim(),
      slug: slugify(albumForm.title),
      description: albumForm.description.trim() || null,
      is_published: albumForm.is_published,
      sort_order: (albums.length + 1) * 10,
    });
    if (albumError) return flash(messageFor(albumError), true);
    setAlbumForm({ title: '', description: '', is_published: true });
    flash('Album created.');
    await loadData();
  }

  async function saveAlbum(id, values) {
    const payload = { ...values, slug: slugify(values.title), updated_at: new Date().toISOString() };
    const { error: albumError } = await supabase.from('gallery_albums').update(payload).eq('id', id);
    if (albumError) return flash(messageFor(albumError), true);
    flash('Album saved.');
    await loadData();
  }

  async function deleteAlbum(album) {
    if (!window.confirm(`Delete the album “${album.title}”? The photos will remain in the media library.`)) return;
    await supabase.from('gallery_album_items').delete().eq('album_id', album.id);
    const { error: albumError } = await supabase.from('gallery_albums').delete().eq('id', album.id);
    if (albumError) return flash(messageFor(albumError), true);
    flash('Album deleted.');
    await loadData();
  }

  async function addToAlbum(mediaItem, albumId) {
    if (!albumId) return;
    const existing = albumItems.filter((i) => i.album_id === albumId);
    if (existing.some((i) => i.media_id === mediaItem.id)) return flash('That image is already in this album.', true);
    const nextOrder = existing.length ? Math.max(...existing.map((i) => i.sort_order || 0)) + 10 : 10;
    const { error: addError } = await supabase.from('gallery_album_items').insert({ album_id: albumId, media_id: mediaItem.id, sort_order: nextOrder });
    if (addError) return flash(messageFor(addError), true);
    const album = albums.find((a) => a.id === albumId);
    if (album && !album.cover_image_url) {
      await supabase.from('gallery_albums').update({ cover_image_url: mediaItem.public_url, cover_image_path: mediaItem.file_path }).eq('id', albumId);
    }
    flash('Image added to album.');
    await loadData();
  }

  async function removeFromAlbum(albumId, mediaId) {
    const { error: removeError } = await supabase.from('gallery_album_items').delete().eq('album_id', albumId).eq('media_id', mediaId);
    if (removeError) return flash(messageFor(removeError), true);
    flash('Image removed from album.');
    await loadData();
  }

  async function moveAlbumItem(albumId, mediaId, direction) {
    const list = albumItems.filter((i) => i.album_id === albumId).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const index = list.findIndex((i) => i.media_id === mediaId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    for (let i = 0; i < reordered.length; i += 1) {
      const { error: orderError } = await supabase.from('gallery_album_items').update({ sort_order: (i + 1) * 10 }).eq('album_id', albumId).eq('media_id', reordered[i].media_id);
      if (orderError) return flash(messageFor(orderError), true);
    }
    await loadData();
  }

  async function setAlbumCover(albumId, mediaItem) {
    const { error: coverError } = await supabase.from('gallery_albums').update({ cover_image_url: mediaItem.public_url, cover_image_path: mediaItem.file_path, updated_at: new Date().toISOString() }).eq('id', albumId);
    if (coverError) return flash(messageFor(coverError), true);
    flash('Album cover updated.');
    await loadData();
  }

  const mediaById = useMemo(() => new Map(media.map((item) => [item.id, item])), [media]);

  return <div className="media-manager">
    {(notice || error) && <div className={error ? 'media-alert error' : 'media-alert success'}>{error || notice}</div>}

    <section className="media-panel media-upload-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Upload</span><h2>Add photographs</h2><p>JPG, PNG, WebP, GIF or AVIF. Maximum 10 MB per image.</p></div><span className="media-role-badge">{adminRole}</span></div>
      <div className="media-upload-grid">
        <label className="media-dropzone" htmlFor="gpdo-media-upload"><strong>{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Choose one or more photographs'}</strong><span>Tap here to browse your phone or computer</span><input id="gpdo-media-upload" type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
        <div className="media-upload-options">
          <label>Category<input value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} placeholder="e.g. Health Outreach" /></label>
          <label className="media-check"><input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} /> Publish immediately</label>
          <button className="admin-primary-btn" type="button" disabled={uploading || !files.length} onClick={uploadSelected}>{uploading ? 'Uploading…' : 'Upload photographs'}</button>
        </div>
      </div>
    </section>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Media Library</span><h2>{media.length} image{media.length === 1 ? '' : 's'}</h2><p>Edit captions, publishing status and album placement.</p></div><button className="admin-secondary-btn" type="button" onClick={loadData}>Refresh</button></div>
      {busy ? <div className="media-empty">Loading media library…</div> : media.length === 0 ? <div className="media-empty"><strong>Your Supabase media library is empty.</strong><span>The existing website photos will remain visible until you upload your first managed image.</span></div> : <div className="media-library-grid">{media.map((item) => <MediaCard key={item.id} item={item} albums={albums} onSave={saveMedia} onDelete={deleteMedia} onAdd={addToAlbum} />)}</div>}
    </section>

    <section className="media-panel">
      <div className="media-panel-heading"><div><span className="admin-eyebrow">Gallery Albums</span><h2>Organize published stories</h2><p>Create albums and control the order in which photographs appear.</p></div></div>
      <form className="album-create" onSubmit={createAlbum}>
        <label>Album title<input value={albumForm.title} onChange={(e) => setAlbumForm((v) => ({ ...v, title: e.target.value }))} placeholder="e.g. Community Outreach 2026" /></label>
        <label>Description<input value={albumForm.description} onChange={(e) => setAlbumForm((v) => ({ ...v, description: e.target.value }))} placeholder="Short public description" /></label>
        <label className="media-check"><input type="checkbox" checked={albumForm.is_published} onChange={(e) => setAlbumForm((v) => ({ ...v, is_published: e.target.checked }))} /> Publish album</label>
        <button className="admin-primary-btn" type="submit">Create album</button>
      </form>
      {albums.length === 0 ? <div className="media-empty"><strong>No albums yet.</strong><span>Create an album above, then add images to it from the Media Library.</span></div> : <div className="album-list">{albums.map((album) => <AlbumCard key={album.id} album={album} items={albumItems.filter((i) => i.album_id === album.id).sort((a,b) => (a.sort_order||0)-(b.sort_order||0))} mediaById={mediaById} onSave={saveAlbum} onDelete={deleteAlbum} onRemove={removeFromAlbum} onMove={moveAlbumItem} onCover={setAlbumCover} />)}</div>}
    </section>
  </div>;
}

function MediaCard({ item, albums, onSave, onDelete, onAdd }) {
  const [draft, setDraft] = useState({ title: item.title || '', caption: item.caption || '', alt_text: item.alt_text || '', category: item.category || '', is_featured: !!item.is_featured, is_published: !!item.is_published, sort_order: item.sort_order || 0 });
  const [albumId, setAlbumId] = useState('');
  useEffect(() => setDraft({ title: item.title || '', caption: item.caption || '', alt_text: item.alt_text || '', category: item.category || '', is_featured: !!item.is_featured, is_published: !!item.is_published, sort_order: item.sort_order || 0 }), [item]);
  return <article className="media-card">
    <div className="media-card-image"><img src={item.public_url} alt={item.alt_text || item.title || 'GPDO media'} /><span className={item.is_published ? 'published' : 'draft'}>{item.is_published ? 'Published' : 'Draft'}</span></div>
    <div className="media-card-form">
      <label>Title<input value={draft.title} onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))} /></label>
      <label>Caption<textarea value={draft.caption} onChange={(e) => setDraft((v) => ({ ...v, caption: e.target.value }))} rows="2" /></label>
      <label>Alt text<input value={draft.alt_text} onChange={(e) => setDraft((v) => ({ ...v, alt_text: e.target.value }))} placeholder="Describe the image for accessibility" /></label>
      <div className="media-form-row"><label>Category<input value={draft.category} onChange={(e) => setDraft((v) => ({ ...v, category: e.target.value }))} /></label><label>Order<input type="number" value={draft.sort_order} onChange={(e) => setDraft((v) => ({ ...v, sort_order: Number(e.target.value) }))} /></label></div>
      <div className="media-toggle-row"><label className="media-check"><input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft((v) => ({ ...v, is_published: e.target.checked }))} /> Published</label><label className="media-check"><input type="checkbox" checked={draft.is_featured} onChange={(e) => setDraft((v) => ({ ...v, is_featured: e.target.checked }))} /> Featured / wide</label></div>
      <div className="media-card-actions"><button type="button" className="admin-primary-btn" onClick={() => onSave(item.id, draft)}>Save</button><button type="button" className="media-danger-btn" onClick={() => onDelete(item)}>Delete</button></div>
      {albums.length > 0 && <div className="media-album-add"><select value={albumId} onChange={(e) => setAlbumId(e.target.value)}><option value="">Choose album…</option>{albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select><button type="button" className="admin-secondary-btn" onClick={() => { if (albumId) onAdd(item, albumId); setAlbumId(''); }}>Add</button></div>}
    </div>
  </article>;
}

function AlbumCard({ album, items, mediaById, onSave, onDelete, onRemove, onMove, onCover }) {
  const [draft, setDraft] = useState({ title: album.title || '', description: album.description || '', is_published: !!album.is_published, sort_order: album.sort_order || 0 });
  useEffect(() => setDraft({ title: album.title || '', description: album.description || '', is_published: !!album.is_published, sort_order: album.sort_order || 0 }), [album]);
  return <article className="album-card">
    <div className="album-card-head"><div><span className={album.is_published ? 'album-status published' : 'album-status draft'}>{album.is_published ? 'Published album' : 'Draft album'}</span><h3>{album.title}</h3><span className="album-count">{items.length} photograph{items.length === 1 ? '' : 's'}</span></div>{album.cover_image_url && <img src={album.cover_image_url} alt="Album cover" />}</div>
    <div className="album-edit-grid"><label>Title<input value={draft.title} onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))} /></label><label>Display order<input type="number" value={draft.sort_order} onChange={(e) => setDraft((v) => ({ ...v, sort_order: Number(e.target.value) }))} /></label><label className="album-description">Description<textarea rows="2" value={draft.description} onChange={(e) => setDraft((v) => ({ ...v, description: e.target.value }))} /></label><label className="media-check"><input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft((v) => ({ ...v, is_published: e.target.checked }))} /> Published</label></div>
    <div className="album-actions"><button type="button" className="admin-primary-btn" onClick={() => onSave(album.id, draft)}>Save album</button><button type="button" className="media-danger-btn" onClick={() => onDelete(album)}>Delete album</button></div>
    {items.length > 0 && <div className="album-items">{items.map((relation, index) => { const image = mediaById.get(relation.media_id); if (!image) return null; return <div className="album-item" key={relation.media_id}><img src={image.public_url} alt={image.alt_text || image.title || 'Gallery image'} /><div><strong>{image.title || 'Untitled image'}</strong><span>{image.is_published ? 'Published' : 'Draft'}</span></div><div className="album-item-actions"><button type="button" disabled={index === 0} onClick={() => onMove(album.id, image.id, -1)}>↑</button><button type="button" disabled={index === items.length - 1} onClick={() => onMove(album.id, image.id, 1)}>↓</button><button type="button" onClick={() => onCover(album.id, image)}>Cover</button><button type="button" onClick={() => onRemove(album.id, image.id)}>Remove</button></div></div>; })}</div>}
  </article>;
}
