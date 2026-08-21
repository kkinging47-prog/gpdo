import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

export const dynamic='force-dynamic';

const formatDate=(value)=>value?new Intl.DateTimeFormat('en-GH',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value)):'';

export async function generateMetadata({params}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data}=await supabase.from('articles').select('title,excerpt,featured_image_url').eq('slug',slug).eq('status','published').maybeSingle();
  if(!data) return {title:'News'};
  return {title:data.title,description:data.excerpt||'A news story from Global Passion Development Organization.',openGraph:{title:data.title,description:data.excerpt||undefined,images:data.featured_image_url?[data.featured_image_url]:undefined}};
}

export default async function ArticlePage({params}){
  const {slug}=await params;
  const supabase=await createClient();
  const {data:article}=await supabase.from('articles').select('*').eq('slug',slug).eq('status','published').maybeSingle();
  if(!article) notFound();
  const paragraphs=(article.body||'').split(/\n\s*\n/).map((p)=>p.trim()).filter(Boolean);
  return <main>
    <section className="article-hero"><div className="container article-hero-inner"><div className="crumb"><Link href="/">Home</Link> / <Link href="/news">News</Link> / {article.title}</div><div className="article-meta"><span>{article.category||'GPDO News'}</span><span>{formatDate(article.published_at||article.created_at)}</span>{article.is_featured&&<strong>Featured</strong>}</div><h1>{article.title}</h1>{article.excerpt&&<p className="lead">{article.excerpt}</p>}<div className="article-author">By {article.author_name||'GPDO'}</div></div></section>
    <article className="section article-body-section"><div className="container article-layout">
      <div className="article-main">
        {article.featured_image_url&&<figure className="article-lead-image"><img src={article.featured_image_url} alt={article.title}/></figure>}
        <div className="article-copy">{paragraphs.length?paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>):<p>{article.body}</p>}</div>
        {(article.tags||[]).length>0&&<div className="article-tags"><strong>Topics</strong>{article.tags.map((tag)=><span key={tag}>{tag}</span>)}</div>}
      </div>
      <aside className="article-side"><div><span className="kicker">About GPDO</span><h3>Community-driven development.</h3><p>GPDO works across education, inclusion, healthcare and climate resilience through practical partnerships and community engagement.</p><Link href="/programs">Explore our work →</Link></div><div><span className="kicker">More updates</span><p>Return to the News & Stories page for other published GPDO updates.</p><Link href="/news">View all news →</Link></div></aside>
    </div></article>
    <section className="section-sm"><div className="container cta reveal"><div><span className="kicker" style={{color:'#fff'}}>Partner for impact</span><h2>Interested in the work behind this story?</h2><p>Connect with GPDO to explore collaboration, programme support or community partnership.</p></div><div className="cta-actions"><Link className="btn btn-primary" href="/get-involved">Get involved</Link><Link className="btn btn-light" href="/contact">Contact GPDO</Link></div></div></section>
  </main>;
}
