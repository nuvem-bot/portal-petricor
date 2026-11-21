'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import './show.css';

// Contraste: escolhe texto claro ou escuro sobre uma cor
function onColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#141414' : '#F7F4EE';
}

export default function Show({ base, brand, client, date, pres, display, body, logo, mockups, canDecide }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const [idx, setIdx] = useState(0);
  const [play, setPlay] = useState(0);
  const [c1, c2, c3, c4] = pres.palette;
  const bg = c1.hex, fg = onColor(c1.hex);
  const pillars = pres.pillars.filter((x) => x.t || x.d);
  const slides = ['capa', pres.concept && 'conceito', 'marca', 'paleta', 'tipografia', mockups.length && 'aplicacoes', 'fim'].filter(Boolean);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const els = [...root.current.querySelectorAll('.slide')];
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = els.indexOf(e.target);
      setIdx(i);
      if (e.target.dataset.s === 'marca') setPlay((n) => n + 1);
    }), { root: root.current, threshold: 0.55 });
    els.forEach((s) => io.observe(s));
    const key = (e) => {
      const h = root.current.clientHeight;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); root.current.scrollBy({ top: h, behavior: 'smooth' }); }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); root.current.scrollBy({ top: -h, behavior: 'smooth' }); }
    };
    window.addEventListener('keydown', key);
    return () => { io.disconnect(); window.removeEventListener('keydown', key); document.documentElement.style.overflow = ''; };
  }, []);

  // Linhas animadas da capa, nas cores da paleta
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const cx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf, t = 0;
    const size = () => { cv.width = cv.clientWidth * devicePixelRatio; cv.height = cv.clientHeight * devicePixelRatio; };
    size(); window.addEventListener('resize', size);
    const frame = () => {
      const w = cv.width, h = cv.height; cx.clearRect(0, 0, w, h);
      for (let k = 0; k < 7; k++) {
        cx.beginPath();
        const y0 = h * 0.25 + k * h * 0.11, amp = h * 0.05 * (1 + k * 0.15);
        for (let x = 0; x <= w; x += 8) {
          const y = y0 + Math.sin((x / w) * Math.PI * 2.6 + t * 0.6 + k * 0.7) * amp + Math.sin((x / w) * Math.PI * 6 + t * 0.3) * amp * 0.25;
          x ? cx.lineTo(x, y) : cx.moveTo(x, y);
        }
        cx.globalAlpha = 0.18 + k * 0.06;
        cx.strokeStyle = k % 3 === 0 ? c3.hex : fg;
        cx.lineWidth = 1.4 * devicePixelRatio; cx.stroke();
      }
      t += 0.016; if (!reduce) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, [c3.hex, fg]);

  const D = { fontFamily: `"${display}", Georgia, serif` };
  const cur = slides[idx];
  const light = cur === 'marca';

  return (
    <div className="show" ref={root} style={{ background: bg, color: fg, fontFamily: `"${body}", system-ui, sans-serif`, '--fg': fg, '--c3': c3.hex }}>
      <Link href={`${base}/proposta`} className="show-close" style={light ? { color: bg, borderColor: bg } : undefined}>Fechar ✕</Link>
      <div className="show-count" style={light ? { color: bg } : undefined}>{String(idx + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</div>

      <section className="slide s-cover" data-s="capa">
        <div className="sin">
          <div className="slab up">Petricor apresenta · {date}</div>
          <h1 className="up" style={{ ...D, animationDelay: '.15s' }}>{brand}</h1>
          {pres.title && <p className="lead up" style={{ ...D, animationDelay: '.3s', color: c3.hex }}>{pres.title}</p>}
          <div className="meta up" style={{ animationDelay: '.45s' }}><span className="slab">Identidade visual</span><span className="slab">Para {client}</span><span className="slab">Role para baixo ↓</span></div>
        </div>
        <canvas ref={canvas} className="waves" aria-hidden="true" />
      </section>

      {pres.concept && (
        <section className="slide" data-s="conceito">
          <div className="sin">
            <div className="slab">Conceito</div>
            <p className="big" style={D}>{pres.concept}</p>
            {pillars.length > 0 && (
              <div className="cols">{pillars.map((pl, i) => <p key={i}><b style={D}>{pl.t}</b>{pl.d}</p>)}</div>
            )}
          </div>
        </section>
      )}

      <section className="slide s-logo" data-s="marca" style={{ background: c2.hex, color: c1.hex }}>
        <div className="sin" style={{ textAlign: 'center' }}>
          <div className="slab">Marca</div>
          <div className={`lock ${play ? 'go' : ''}`} key={play}>
            {logo ? <img src={logo} alt={`Logo ${brand}`} /> : <span className="wm" style={D}>{brand}</span>}
          </div>
          <button type="button" className="replay" onClick={() => setPlay((n) => n + 1)}>↻ ver de novo</button>
        </div>
      </section>

      <section className="slide s-pal" data-s="paleta">
        <div className="sw-grid">
          {pres.palette.map((c, i) => (
            <div className="sw" key={i} style={{ background: c.hex, color: onColor(c.hex) }}>
              {i === 0 && <span className="slab">Paleta</span>}
              <b style={D}>{c.name || `Cor ${i + 1}`}</b>
              <code>{c.hex.toUpperCase()}</code>
              {c.note && <small>{c.note}</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="slide" data-s="tipografia">
        <div className="sin">
          <div className="slab">Tipografia</div>
          <div className="spec">
            <div className="aa" style={D}>A<i style={{ color: c3.hex }}>a</i></div>
            <div>
              <div className="glyphs" style={D}>Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br />ã é ç ô 0123456789</div>
              <p className="pair">Títulos em {display}. Textos em {body}.{pres.typeNote ? ` ${pres.typeNote}` : ''}</p>
            </div>
          </div>
        </div>
      </section>

      {mockups.length > 0 && (
        <section className="slide" data-s="aplicacoes" style={{ background: c4.hex, color: onColor(c4.hex) }}>
          <div className="sin">
            <div className="slab">Aplicações</div>
            <div className={`apps n${Math.min(mockups.length, 5)}`}>
              {mockups.map((m, i) => (
                <figure key={i}><img src={m.src} alt={m.label} loading="lazy" /><figcaption>{m.label}</figcaption></figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="slide" data-s="fim">
        <div className="sin">
          <div className="slab">E aí?</div>
          <h2 className="end" style={D}>{pres.closing}</h2>
          <div className="end-row">
            {canDecide
              ? <><Link className="b1" href={`${base}/proposta`} style={{ background: fg, color: bg }}>Quero aprovar</Link><Link className="b2" href={`${base}/proposta`}>Quero pedir ajustes</Link></>
              : <Link className="b2" href={`${base}/proposta`}>Voltar ao projeto</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
