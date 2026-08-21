import PageHero from '../../components/PageHero';
import { createClient } from '../../lib/supabase/server';

export const dynamic='force-dynamic';
export const metadata={title:'Daily Tips',description:'Practical daily guidance from GPDO across education, health, youth, leadership, climate and community development.'};

export default async function TipsPage(){
  const supabase=await createClient();
  const {data}=await supabase.from('daily_tips').select('*').eq('status','published').order('display_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
  const tips=data||[];
  return <main><PageHero section="Daily Tips" title="Small practical actions can build stronger communities." lead="Short, useful guidance from GPDO across education, health, youth development, leadership, climate resilience and community wellbeing." />
    <section className="section"><div className="container">
      {tips.length===0?<div className="tips-empty"><span className="kicker">Coming soon</span><h2>Daily guidance will appear here.</h2><p>GPDO has not published any daily tips yet.</p></div>:<div className="tips-grid">{tips.map((tip,i)=><article className={`public-tip-card${i===0?' featured':''}`} key={tip.id}>{tip.image_url&&<img src={tip.image_url} alt={tip.title||tip.category||'GPDO daily tip'} />}<div className="public-tip-copy"><div className="public-tip-meta"><span>{tip.category||'Community Development'}</span>{tip.display_date&&<time>{new Date(`${tip.display_date}T00:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}</time>}</div><h2>{tip.title||'Daily Tip'}</h2><p>{tip.tip}</p></div></article>)}</div>}
    </div></section>
  </main>;
}
