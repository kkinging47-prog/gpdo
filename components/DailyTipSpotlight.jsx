import Link from 'next/link';

export default function DailyTipSpotlight({tip}){
  if(!tip) return null;
  return <section className="section-sm daily-tip-section"><div className="container"><div className={`daily-tip-card${tip.image_url?' has-image':''}`}>
    {tip.image_url&&<div className="daily-tip-image"><img src={tip.image_url} alt={tip.title||tip.category||'GPDO daily tip'} /></div>}
    <div className="daily-tip-copy"><span className="kicker">Daily Tip · {tip.category||'Community Development'}</span><h2>{tip.title||'A practical idea for today'}</h2><p>{tip.tip}</p><div className="daily-tip-meta">{tip.display_date&&<span>{new Date(`${tip.display_date}T00:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</span>}<Link href="/tips">Browse daily tips →</Link></div></div>
  </div></div></section>;
}
