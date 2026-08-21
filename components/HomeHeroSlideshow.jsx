'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function HomeHeroSlideshow({ slides }) {
  const safeSlides = useMemo(() => (slides || []).filter((slide) => slide?.image_url || slide?.image_path), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (safeSlides.length < 2 || paused) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % safeSlides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [safeSlides.length, paused]);

  useEffect(() => {
    if (activeIndex >= safeSlides.length) setActiveIndex(0);
  }, [activeIndex, safeSlides.length]);

  if (!safeSlides.length) return null;

  const active = safeSlides[activeIndex] || safeSlides[0];
  const previous = () => setActiveIndex((index) => (index - 1 + safeSlides.length) % safeSlides.length);
  const next = () => setActiveIndex((index) => (index + 1) % safeSlides.length);

  return <section className="hero hero-slideshow" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="GPDO featured stories">
    <div className="hero-slide-layers" aria-hidden="true">
      {safeSlides.map((slide, index) => {
        const strength = clamp(Number(slide.overlay_strength ?? 0.55), 0, 1);
        const dark = clamp(strength + 0.35, 0.45, 0.98);
        const mid = clamp(strength + 0.18, 0.3, 0.92);
        const light = clamp(strength - 0.24, 0.12, 0.72);
        const image = slide.image_url || slide.image_path;
        return <div key={slide.id || `${image}-${index}`} className={`hero-slide-layer${index === activeIndex ? ' active' : ''}`} style={{ backgroundImage: `linear-gradient(90deg,rgba(5,24,46,${dark}) 0%,rgba(5,24,46,${mid}) 48%,rgba(5,24,46,${light}) 100%),url("${image}")` }} />;
      })}
    </div>

    <div className="container hero-content hero-slide-content" aria-live="polite">
      <span className="kicker">Global Passion Development Organization</span>
      <h1>{active.title}</h1>
      {active.subtitle && <p className="lead">{active.subtitle}</p>}
      {(active.button_text || active.secondary_button_text) && <div className="hero-actions">
        {active.button_text && active.button_url && <Link className="btn btn-primary" href={active.button_url}>{active.button_text} <span>→</span></Link>}
        {active.secondary_button_text && active.secondary_button_url && <Link className="btn btn-outline" href={active.secondary_button_url}>{active.secondary_button_text}</Link>}
      </div>}
      <div className="hero-trust"><div><strong>Founded in 2024</strong><span>Built to bridge persistent development gaps through community-led action.</span></div><div><strong>Non-profit structure</strong><span>Company Limited by Guarantee under the Companies Act, 2019 (Act 992).</span></div><div><strong>Integrated approach</strong><span>Education, health, inclusion and climate action designed to reinforce one another.</span></div></div>
    </div>

    {safeSlides.length > 1 && <div className="hero-slide-controls container">
      <div className="hero-slide-arrows">
        <button type="button" onClick={previous} aria-label="Previous slide">←</button>
        <button type="button" onClick={next} aria-label="Next slide">→</button>
      </div>
      <div className="hero-slide-dots" role="tablist" aria-label="Choose a featured slide">
        {safeSlides.map((slide, index) => <button key={slide.id || index} type="button" className={index === activeIndex ? 'active' : ''} aria-label={`Show slide ${index + 1}`} aria-selected={index === activeIndex} role="tab" onClick={() => setActiveIndex(index)} />)}
      </div>
    </div>}
  </section>;
}
