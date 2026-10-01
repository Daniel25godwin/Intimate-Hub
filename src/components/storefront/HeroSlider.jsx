import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { BRAND } from "../../config/brand";

export default function HeroSlider() {
  const slides = BRAND.hero || [];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const go = (n) => setI((n + slides.length) % slides.length);

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="hero-wrap">
      <div
        className="slider"
        role="region" aria-roledescription="carousel" aria-label="Featured banners"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - (touchX.current ?? 0);
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
          setPaused(false);
        }}
      >
        {slides.map((s, idx) => {
          const cta = s.to?.startsWith("#")
            ? <a className="btn" href={s.to} tabIndex={idx === i ? 0 : -1}>{s.cta}<ArrowRight size={20} /></a>
            : <Link className="btn" to={s.to || "/shop"} tabIndex={idx === i ? 0 : -1}>{s.cta}<ArrowRight size={20} /></Link>;
          return (
            <div
              key={idx} className={`slide ${idx === i ? "on" : ""} ${s.image ? "has-img" : ""} ${s.layout === "top" ? "top" : ""}`}
              style={{ background: s.image ? `url(${s.image}) right center/cover no-repeat, ${s.bg}` : s.bg }}
              aria-hidden={idx !== i}
            >
              <div className="slide-in">
                <div className="slide-eyebrow">{BRAND.name}</div>
                <h2>{s.title}{s.accent && <em>{s.accent}</em>}</h2>
                <p>{s.text}</p>
                {cta}
              </div>
            </div>
          );
        })}
        {slides.length > 1 && (
          <>
            <button className="sl-arrow left" onClick={() => go(i - 1)} aria-label="Previous banner"><ChevronLeft size={22} /></button>
            <button className="sl-arrow right" onClick={() => go(i + 1)} aria-label="Next banner"><ChevronRight size={22} /></button>
            <div className="sl-dots">
              {slides.map((_, idx) => (
                <button key={idx} className={idx === i ? "on" : ""} onClick={() => go(idx)} aria-label={`Banner ${idx + 1}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
