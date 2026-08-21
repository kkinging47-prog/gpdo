import PageHero from '../../components/PageHero';
import ContactForm from '../../components/ContactForm';
import { createClient } from '../../lib/supabase/server';

export const dynamic='force-dynamic';
export const metadata={title:'Contact GPDO',description:'Contact GPDO for partnerships, programme sponsorship, volunteering, donations and community development collaboration.'};
const fallback={organization:{name:'Global Passion Development Organization'},contact:{primary_phone:'+233256073403',secondary_phone:'+233597365695',whatsapp:'+233256073403',email:'info@gpdo.org'},social:{facebook:'Global Passion Development Organization',instagram:'https://www.instagram.com/globalpassiondevelopment/',tiktok:'https://www.tiktok.com/@globalpassiondevelopment'}};
const tel=(v='')=>v.replace(/[^+\d]/g,'');
const wa=(v='')=>v.replace(/\D/g,'');
const show=(v='')=>v.replace(/^(\+233)(\d{2})(\d{3})(\d{4})$/,'$1 $2 $3 $4');

export default async function ContactPage(){
  const supabase=await createClient();
  const {data}=await supabase.from('site_settings').select('key,value').eq('is_public',true);
  const mapped=Object.fromEntries((data||[]).map((r)=>[r.key,r.value||{}]));
  const organization={...fallback.organization,...(mapped.organization||{})};
  const contact={...fallback.contact,...(mapped.contact||{})};
  const social={...fallback.social,...(mapped.social||{})};
  return <main><PageHero section="Contact GPDO" title="Let's build something meaningful together." lead="Contact us about partnerships, sponsorship, volunteering, support, community projects or institutional collaboration."/><section className="section"><div className="container contact-grid reveal"><aside className="contact-panel"><span className="kicker" style={{color:'#fff'}}>Reach us</span><h2 style={{fontSize:'clamp(1.8rem,3vw,2.6rem)'}}>{organization.name}</h2><p>For the fastest response, contact GPDO by phone or WhatsApp.</p><div className="contact-item"><span>☎</span><div><strong>Phone</strong>{contact.primary_phone&&<><a href={`tel:${tel(contact.primary_phone)}`}>{show(contact.primary_phone)}</a><br/></>}{contact.secondary_phone&&<a href={`tel:${tel(contact.secondary_phone)}`}>{show(contact.secondary_phone)}</a>}</div></div><div className="contact-item"><span>◉</span><div><strong>WhatsApp</strong>{contact.whatsapp&&<a href={`https://wa.me/${wa(contact.whatsapp)}`} target="_blank" rel="noopener">Chat with GPDO</a>}{contact.email&&<><br/><a href={`mailto:${contact.email}`}>{contact.email}</a></>}</div></div><div className="contact-item"><span>◎</span><div><strong>Social media</strong>{social.facebook&&<><span>Facebook: {social.facebook}</span><br/></>}{social.instagram&&<><a href={social.instagram} target="_blank" rel="noopener">Instagram</a><br/></>}{social.tiktok&&<a href={social.tiktok} target="_blank" rel="noopener">TikTok</a>}</div></div></aside><div className="form-card"><span className="kicker">Send an enquiry</span><h2 style={{fontSize:'clamp(1.8rem,3vw,2.6rem)'}}>Tell us how you&apos;d like to engage.</h2><ContactForm/></div></div></section></main>}
