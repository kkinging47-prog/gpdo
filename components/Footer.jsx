'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../lib/supabase/client';

const fallback={
  organization:{name:'Global Passion Development Organization'},
  contact:{primary_phone:'+233256073403',secondary_phone:'+233597365695',whatsapp:'+233256073403',email:'info@gpdo.org'},
  social:{facebook:'Global Passion Development Organization',instagram:'https://www.instagram.com/globalpassiondevelopment/',tiktok:'https://www.tiktok.com/@globalpassiondevelopment'}
};
const tel=(v='')=>v.replace(/[^+\d]/g,'');
const wa=(v='')=>v.replace(/\D/g,'');
const displayPhone=(v='')=>v.replace(/^(\+233)(\d{2})(\d{3})(\d{4})$/,'$1 $2 $3 $4');
const socialHref=(value,type)=>{
  if(!value)return '#';
  if(/^https?:\/\//i.test(value))return value;
  if(type==='facebook')return `https://www.facebook.com/search/top?q=${encodeURIComponent(value)}`;
  return value;
};

export default function Footer() {
  const pathname = usePathname();
  const supabase=useMemo(()=>createClient(),[]);
  const [settings,setSettings]=useState(fallback);
  useEffect(()=>{
    let live=true;
    supabase.from('site_settings').select('key,value').eq('is_public',true).then(({data})=>{
      if(!live||!data)return;
      const mapped=Object.fromEntries(data.map((r)=>[r.key,r.value||{}]));
      setSettings({organization:{...fallback.organization,...(mapped.organization||{})},contact:{...fallback.contact,...(mapped.contact||{})},social:{...fallback.social,...(mapped.social||{})}});
    });
    return()=>{live=false;};
  },[supabase]);
  if (pathname?.startsWith('/admin')) return null;
  const year = new Date().getFullYear();
  const {organization,contact,social}=settings;
  return <footer><div className="container"><div className="footer-grid">
    <div><img className="footer-logo" src="/assets/gpdo-logo.png" alt="GPDO" /><p className="footer-about">Empowering underserved communities through education, gender equity, healthcare, climate action and sustainable development.</p><div className="socials"><a href={socialHref(social.facebook,'facebook')} target="_blank" rel="noopener" aria-label="Facebook">f</a><a href={socialHref(social.instagram,'instagram')} target="_blank" rel="noopener" aria-label="Instagram">◎</a><a href={socialHref(social.tiktok,'tiktok')} target="_blank" rel="noopener" aria-label="TikTok">♪</a></div></div>
    <div className="footer-col"><h4>Organization</h4><Link href="/about">About GPDO</Link><Link href="/programs">Our Work</Link><Link href="/gallery">Gallery</Link><Link href="/events">Events</Link><Link href="/news">News & Stories</Link><Link href="/tips">Daily Tips</Link><Link href="/about#governance">Our Approach</Link></div>
    <div className="footer-col"><h4>Get involved</h4><Link href="/get-involved#partner">Partner with us</Link><Link href="/get-involved#sponsor">Sponsor a programme</Link><Link href="/get-involved#volunteer">Volunteer</Link><Link href="/get-involved#support">Donate / Support</Link></div>
    <div className="footer-col"><h4>Contact</h4>{contact.primary_phone&&<a href={`tel:${tel(contact.primary_phone)}`}>{displayPhone(contact.primary_phone)}</a>}{contact.secondary_phone&&<a href={`tel:${tel(contact.secondary_phone)}`}>{displayPhone(contact.secondary_phone)}</a>}{contact.whatsapp&&<a href={`https://wa.me/${wa(contact.whatsapp)}`} target="_blank" rel="noopener">WhatsApp GPDO</a>}{contact.email&&<a href={`mailto:${contact.email}`}>{contact.email}</a>}<Link href="/contact">Send an enquiry</Link></div>
  </div><div className="footer-bottom"><span>© {year} {organization.name||'Global Passion Development Organization'}. All rights reserved.</span><span>Company Limited by Guarantee • Companies Act, 2019 (Act 992)</span></div></div></footer>;
}
