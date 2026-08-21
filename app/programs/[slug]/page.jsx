import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic='force-dynamic';

const formatDate=(value)=>value?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${value}T00:00:00`)):'';
const labelStatus=(value='')=>value.charAt(0).toUpperCase()+value.slice(1);

export async function generateMetadata({params}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data}=await supabase.from('programs').select('title,summary').eq('slug',slug).eq('is_published',true).neq('status','archived').maybeSingle();
  if(!data) return {title:'Programme'};
  return {title:data.title,description:data.summary||`Learn about ${data.title}, a GPDO programme.`};
}

export default async function ProgramDetailPage({params}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data:program}=await supabase.from('programs').select('*').eq('slug',slug).eq('is_published',true).neq('status','archived').maybeSingle();
  if(!program) notFound();
  const dateText=program.start_date?`${formatDate(program.start_date)}${program.end_date?` – ${formatDate(program.end_date)}`:''}`:'';
  return <main>
    <section className="program-detail-hero"><div className="container"><div className="crumb"><Link href="/">Home</Link> / <Link href="/programs">Our Work</Link> / {program.title}</div><span className="kicker" style={{color:'#dcece7'}}>{program.focus_area||'GPDO Programme'} · {labelStatus(program.status)}</span><h1>{program.title}</h1>{program.summary&&<p className="lead">{program.summary}</p>}</div></section>
    <section className="section"><div className="container program-detail-layout"><article><div className="program-detail-cover">{program.featured_image_url&&<img src={program.featured_image_url} alt={program.title}/>}</div><div className="program-detail-body">{program.description?<p>{program.description}</p>:<p>More information about this programme will be published as implementation details are confirmed.</p>}</div></article><aside className="program-facts"><h3>Programme at a glance</h3><div className="program-fact"><span>Status</span><strong>{labelStatus(program.status)}</strong></div>{program.focus_area&&<div className="program-fact"><span>Focus area</span><strong>{program.focus_area}</strong></div>}{program.location&&<div className="program-fact"><span>Location</span><strong>{program.location}</strong></div>}{dateText&&<div className="program-fact"><span>Period</span><strong>{dateText}</strong></div>}{program.partner_names?.length>0&&<div className="program-fact"><span>Partners</span><div className="program-partners">{program.partner_names.map(name=><span key={name}>{name}</span>)}</div></div>}<div style={{marginTop:20}}><Link className="btn btn-secondary" href="/contact">Discuss partnership</Link></div></aside></div></section>
    <section className="section-sm"><div className="container cta"><div><span className="kicker" style={{color:'#fff'}}>Support meaningful impact</span><h2>Interested in this programme or a related community initiative?</h2><p>GPDO welcomes institutional, corporate and community partnerships that can strengthen reach and sustainability.</p></div><div className="cta-actions"><Link className="btn btn-primary" href="/get-involved">Get involved</Link><Link className="btn btn-light" href="/programs">Back to our work</Link></div></div></section>
  </main>;
}
