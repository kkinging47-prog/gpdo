import Link from 'next/link';
import PageHero from '../../components/PageHero';
import { createClient } from '../../lib/supabase/server';
import './gallery.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gallery', description: 'Explore GPDO community outreach, partnership and engagement activities through our photo gallery.' };

const fallbackItems = [
  { public_url: '/assets/IMG-20260617-WA0026.jpg', title: 'Community outreach & partnership', caption: 'Partners, volunteers and community members coming together around practical support.', is_featured: true },
  { public_url: '/assets/IMG-20260617-WA0014.jpg', title: 'Partnership in action', caption: 'Practical support made possible through collaboration and shared purpose.', is_featured: false },
  { public_url: '/assets/IMG-20260617-WA0022.jpg', title: 'People behind the mission', caption: 'A team committed to service, integrity and community-driven development.', is_featured: false },
  { public_url: '/assets/IMG-20260617-WA0018.jpg', title: 'Shared community moments', caption: 'Development is strongest when communities are active participants in the work.', is_featured: true },
];

function PhotoGrid({ items }) {
  return <div className="gallery-grid">{items.map((item, index) => <figure className={`gallery-card${item.is_featured ? ' wide' : ''} reveal`} key={item.id || `${item.public_url}-${index}`}><img src={item.public_url} alt={item.alt_text || item.title || 'GPDO community activity'} /><figcaption className="gallery-caption"><strong>{item.title || 'GPDO in action'}</strong>{item.category && <small>{item.category}</small>}<span>{item.caption || 'A moment from GPDO community engagement and development work.'}</span></figcaption></figure>)}</div>;
}

export default async function GalleryPage() {
  const supabase = await createClient();
  const [mediaResult, albumsResult, itemsResult] = await Promise.all([
    supabase.from('media').select('id,title,caption,alt_text,public_url,category,is_featured,sort_order,created_at').eq('is_published', true).order('sort_order').order('created_at', { ascending: false }),
    supabase.from('gallery_albums').select('id,title,slug,description,cover_image_url,sort_order').eq('is_published', true).order('sort_order'),
    supabase.from('gallery_album_items').select('album_id,media_id,sort_order').order('sort_order'),
  ]);

  const managedMedia = (mediaResult.data || []).filter((item) => item.public_url);
  const albums = albumsResult.data || [];
  const albumItems = itemsResult.data || [];
  const mediaById = new Map(managedMedia.map((item) => [item.id, item]));
  const assigned = new Set();
  const albumSections = albums.map((album) => {
    const photos = albumItems.filter((item) => item.album_id === album.id).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)).map((item) => mediaById.get(item.media_id)).filter(Boolean);
    photos.forEach((photo) => assigned.add(photo.id));
    return { ...album, photos };
  }).filter((album) => album.photos.length > 0);
  const unassigned = managedMedia.filter((item) => !assigned.has(item.id));
  const hasManagedContent = managedMedia.length > 0;

  return <main>
    <PageHero className="gallery-hero" section="Gallery" title="People, partnership and community in action." lead="A visual record of community engagement, outreach, support and the people who make our mission possible." />
    <section className="section"><div className="container">
      <div className="gallery-intro reveal"><span className="kicker">Photo gallery</span><h2>Moments from our community work.</h2><p className="lead">These photographs reflect GPDO&apos;s commitment to meeting communities with dignity, practical support and collaborative action.</p></div>

      {!hasManagedContent && <><PhotoGrid items={fallbackItems} /><div className="gallery-note reveal"><strong>Our managed gallery is being prepared.</strong> These current GPDO photographs will remain visible while new albums are added through the administration dashboard.</div></>}

      {hasManagedContent && <>
        {albumSections.length > 0 && <nav className="gallery-album-nav reveal" aria-label="Gallery albums">{albumSections.map((album) => <a key={album.id} href={`#${album.slug}`}>{album.title}</a>)}</nav>}
        {albumSections.map((album) => <section className="gallery-album-section" id={album.slug} key={album.id}><div className="gallery-album-heading reveal"><span className="kicker">Gallery album</span><h2>{album.title}</h2>{album.description && <p className="lead">{album.description}</p>}</div><PhotoGrid items={album.photos} /></section>)}
        {unassigned.length > 0 && <section className="gallery-album-section"><div className="gallery-album-heading reveal"><span className="kicker">Latest photographs</span><h2>More moments from GPDO.</h2></div><PhotoGrid items={unassigned} /></section>}
      </>}
    </div></section>
    <section className="section-sm"><div className="container cta reveal"><div><span className="kicker" style={{color:'#fff'}}>Partner for impact</span><h2>Help us create more stories of lasting community change.</h2><p>We welcome partnerships with institutions, companies, development agencies, community organizations, volunteers and individuals.</p></div><div className="cta-actions"><Link className="btn btn-primary" href="/get-involved">Get involved</Link><Link className="btn btn-light" href="/contact">Contact GPDO</Link></div></div></section>
  </main>;
}
