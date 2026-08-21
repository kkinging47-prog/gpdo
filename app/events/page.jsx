import Link from 'next/link';
import PageHero from '../../components/PageHero';
import EventCard from '../../components/EventCard';
import { createClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Events', description: 'Explore upcoming and past events from Global Passion Development Organization.' };

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('events').select('*').eq('status','published').order('starts_at', { ascending: true });
  const now = Date.now();
  const events = data || [];
  const upcoming = events.filter((event) => {
    const end = event.ends_at || event.starts_at;
    return !end || new Date(end).getTime() >= now;
  });
  const past = events.filter((event) => {
    const end = event.ends_at || event.starts_at;
    return end && new Date(end).getTime() < now;
  }).sort((a,b) => new Date(b.starts_at || 0) - new Date(a.starts_at || 0));

  return <main>
    <PageHero section="Events" title="Gatherings that turn shared purpose into action." lead="Follow upcoming GPDO activities, outreach programmes, community engagements and partnership events." />

    <section className="section"><div className="container">
      <div className="eyebrow-row reveal"><div><span className="kicker">Upcoming events</span><h2>Join us where action is happening.</h2></div><p className="lead">Published events automatically appear here and move into the past-events archive after their end date.</p></div>
      {upcoming.length ? <div className="public-event-grid">{upcoming.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="public-events-empty reveal"><strong>No upcoming events are published yet.</strong><p>New GPDO activities will appear here as soon as they are announced.</p><Link className="btn btn-secondary" href="/contact">Contact GPDO</Link></div>}
    </div></section>

    {past.length > 0 && <section className="section bg-soft"><div className="container">
      <div className="eyebrow-row reveal"><div><span className="kicker">Past events</span><h2>Recent activities and community moments.</h2></div><p>Past published events remain available as a public record of GPDO activity.</p></div>
      <div className="public-event-grid past">{past.map((event) => <EventCard key={event.id} event={event} past />)}</div>
    </div></section>}

    <section className="section-sm"><div className="container cta reveal"><div><span className="kicker" style={{color:'#fff'}}>Collaborate with GPDO</span><h2>Interested in hosting or supporting an event with us?</h2><p>We welcome institutions, companies, development partners and community organizations that want to collaborate around inclusive development.</p></div><div className="cta-actions"><Link className="btn btn-primary" href="/get-involved">Partner with us</Link><Link className="btn btn-light" href="/contact">Contact GPDO</Link></div></div></section>
  </main>;
}
