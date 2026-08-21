import Link from 'next/link';
import PageHero from '../../components/PageHero';
import { createClient } from '../../lib/supabase/server';

export const dynamic='force-dynamic';
export const metadata={title:'News & Stories',description:'Read updates, stories and news from Global Passion Development Organization.'};

const formatDate=(value)=>value?new Intl.DateTimeFormat('en-GH',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value)):'';

export default async function NewsPage(){
  const supabase=await createClient();
  const {data}=await supabase.from('articles').select('*').eq('status','published').order('is_featured',{ascending:false}).order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
  const articles=data||[];
  const featured=articles.find((a)=>a.is_featured)||articles[0];
  const rest=featured?articles.filter((a)=>a.id!==featured.id):[];
  return <main>
    <PageHero section="News & Stories" title="Updates from GPDO’s work, partnerships and communities." lead="Follow organization news, programme stories, learning and community engagement updates from Global Passion Development Organization."/>
    <section className="section"><div className="container">
      {articles.length===0?<div className="news-empty reveal"><span className="kicker">Newsroom</span><h2>Stories will appear here when they are published.</h2><p>GPDO has not published a news article through the new content system yet. Please check back for verified updates from our work.</p></div>:<>
        {featured&&<article className="news-feature reveal">{featured.featured_image_url?<Link href={`/news/${featured.slug}`} className="news-feature-image"><img src={featured.featured_image_url} alt={featured.title}/></Link>:<div className="news-feature-image news-image-placeholder">GPDO</div>}<div className="news-feature-copy"><div className="news-meta"><span>{featured.category||'GPDO News'}</span><span>{formatDate(featured.published_at||featured.created_at)}</span></div><h2>{featured.title}</h2><p className="lead">{featured.excerpt||'Read the latest story from GPDO.'}</p><div className="news-byline">{featured.author_name&&<span>By {featured.author_name}</span>}{featured.is_featured&&<strong>Featured story</strong>}</div><Link className="btn btn-secondary" href={`/news/${featured.slug}`}>Read full story →</Link></div></article>}
        {rest.length>0&&<div className="news-grid">{rest.map((article)=><article className="news-card reveal" key={article.id}><Link href={`/news/${article.slug}`} className="news-card-image">{article.featured_image_url?<img src={article.featured_image_url} alt={article.title}/>:<div className="news-image-placeholder">GPDO</div>}</Link><div className="news-card-copy"><div className="news-meta"><span>{article.category||'GPDO News'}</span><span>{formatDate(article.published_at||article.created_at)}</span></div><h3><Link href={`/news/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt||'Read this update from GPDO.'}</p><div className="news-card-footer"><span>{article.author_name||'GPDO'}</span><Link href={`/news/${article.slug}`}>Read more →</Link></div></div></article>)}</div>}
      </>}
    </div></section>
    <section className="section-sm"><div className="container cta reveal"><div><span className="kicker" style={{color:'#fff'}}>Stay connected</span><h2>Follow GPDO’s work as it develops.</h2><p>Explore our programmes, events and community engagement, or contact us about a partnership.</p></div><div className="cta-actions"><Link className="btn btn-primary" href="/programs">Our work</Link><Link className="btn btn-light" href="/contact">Contact GPDO</Link></div></div></section>
  </main>;
}
