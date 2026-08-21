import Link from 'next/link';

function eventDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'UTC' }).format(new Date(value));
}

export default function EventCard({ event, past = false }) {
  const location = [event.venue, event.location].filter(Boolean).join(' · ');
  return <article className={`public-event-card${event.is_featured ? ' featured' : ''}`}>
    <Link className="public-event-image" href={`/events/${event.slug}`}>
      {event.featured_image_url ? <img src={event.featured_image_url} alt={event.title} /> : <div className="public-event-placeholder"><span>GPDO</span><strong>Event</strong></div>}
      <span className="public-event-date">{past ? 'Past event' : eventDate(event.starts_at)}</span>
    </Link>
    <div className="public-event-body">
      {event.is_featured && <span className="public-event-featured">Featured event</span>}
      <h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
      {location && <p className="public-event-location">⌖ {location}</p>}
      {event.summary && <p>{event.summary}</p>}
      <Link className="public-event-link" href={`/events/${event.slug}`}>{past ? 'View event record' : 'View event details'} →</Link>
    </div>
  </article>;
}
