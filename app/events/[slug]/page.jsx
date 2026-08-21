import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'UTC' }).format(new Date(value));
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from('events').select('*').eq('slug', slug).eq('status','published').maybeSingle();
  if (!event) notFound();

  const end = event.ends_at || event.starts_at;
  const isPast = end && new Date(end).getTime() < Date.now();
  const location = [event.venue, event.location].filter(Boolean).join(' · ');

  return <main>
    <section className="event-detail-hero">
      {event.featured_image_url && <img className="event-detail-bg" src={event.featured_image_url} alt="" aria-hidden="true" />}
      <div className="event-detail-overlay"></div>
      <div className="container event-detail-content">
        <div className="crumb"><Link href="/">Home</Link> / <Link href="/events">Events</Link> / {event.title}</div>
        <span className="kicker">{isPast ? 'Past event' : 'Upcoming event'}</span>
        <h1>{event.title}</h1>
        {event.summary && <p className="lead">{event.summary}</p>}
      </div>
    </section>

    <section className="section"><div className="container event-detail-layout">
      <article className="event-detail-main reveal">
        {event.featured_image_url && <img className="event-detail-image" src={event.featured_image_url} alt={event.title} />}
        <span className="kicker">About this event</span>
        <h2>{event.title}</h2>
        {event.description ? <div className="event-description">{event.description.split(/\n+/).map((paragraph,index) => <p key={index}>{paragraph}</p>)}</div> : <p>Further information about this event will be shared by GPDO.</p>}
      </article>
      <aside className="event-info-card reveal">
        <span className={`event-public-badge ${isPast ? 'past' : 'upcoming'}`}>{isPast ? 'Past event' : 'Upcoming'}</span>
        <div><small>Date & time</small><strong>{formatDate(event.starts_at)}</strong>{event.ends_at && <span>to {formatDate(event.ends_at)}</span>}</div>
        {location && <div><small>Venue / location</small><strong>{location}</strong></div>}
        {event.contact_text && <div><small>Contact</small><strong>{event.contact_text}</strong></div>}
        {!isPast && event.registration_url && <a className="btn btn-primary" href={event.registration_url} target="_blank" rel="noopener">Register / Learn more ↗</a>}
        <Link className="event-back-link" href="/events">← All events</Link>
      </aside>
    </div></section>
  </main>;
}
