import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Heart, ChevronDown, Star } from "lucide-react";


const CONFIG = {
  name: "Jenisha Krish Balakrishnan", // <-- put her name here
  kicker: "a little something for",
  heroSubtitle: "Scroll down slowly. I made you something.",

  introLine:
    "Every love story is beautiful, but I'm a little biased toward ours.",

  moments: [
    {
      title: "How it started",
      text: "A conversation that was supposed to last five minutes. It didn't. Neither of us wanted it to.",
    },
    {
      title: "The first time I knew",
      text: "It wasn't a big moment. It was something small and ordinary that suddenly felt like the best part of my day.",
    },
    {
      title: "The little things",
      text: "Late-night calls, dumb inside jokes, the way you say my name when you're pretending to be annoyed at me.",
    },
    {
      title: "The hard days",
      text: "The ones where you were simply there — no fixing, no fuss, just there. Those mattered more than you know.",
    },
    {
      title: "Right now",
      text: "Still here, still choosing you, still building a small and quiet world made of just us.",
    },
  ],

  reasons: [
    { short: "The way you laugh", long: "Loud, unfiltered, a little too much — and my favorite sound in any room." },
    { short: "How you remember", long: "The tiny things I mention once, in passing, that you somehow never forget." },
    { short: "Your particular chaos", long: "Organized on the outside, delightfully unhinged in the group chat. I love both versions." },
    { short: "The way you show up", long: "For the people you love, on the days it's hard, without being asked twice." },
    { short: "How safe it feels", long: "Talking to you is the only place my brain fully stops running." },
    { short: "You, generally", long: "I could make this list a hundred cards long and still leave things out." },
  ],

  letterOpening: "My dearest Cheescakeeee,",
  letterParagraphs: [
    "I don't say this enough out loud, so I'm saying it here instead, in the one place you can't interrupt me (yet).",
    "You make ordinary days feel like they're worth remembering. That's not a small thing. Most people go their whole lives without someone who does that for them.",
    "I like who I am when I'm with you. Calmer, funnier, a little braver. I don't think that's a coincidence.",
    "So this is just a small, slightly overengineered way of saying: thank you for choosing this, choosing us, again and again.",
  ],
  signature: "Yours, always",

  finaleTitle: "To many more.",
  finaleSubtitle: "Tap the heart.",
  finaleReveal: "I love you. More today than yesterday, and that's saying something.",
};

/* ---------------------------- utilities ---------------------------- */

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const scrollTop = h.scrollTop || document.body.scrollTop;
        const scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
        setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

/*
 * Postcard reveal: instead of a one-shot fade-up, each registered element
 * gets a continuously-updated CSS variable (--p, 0→1) that tracks its own
 * position in the viewport as you scroll. The CSS then reads --p to drive
 * a 3D "flap opening" tilt, a focus-pull blur, and a light-catch shimmer —
 * so the motion is scrubbed directly by the scrollbar, not just triggered
 * once and left alone. Pass an optional pixel offset to `register` to
 * stagger a group of elements (e.g. cards in the same row) against the
 * same scroll distance.
 */
function usePostcardReveal() {
  const els = useRef(new Set());
  const active = useRef(new Set());
  const rafId = useRef(null);

  const register = useCallback((el, offset = 0) => {
    if (!el) return;
    el.dataset.revealOffset = String(offset);
    if (!el.style.getPropertyValue("--p")) el.style.setProperty("--p", "0");
    els.current.add(el);
  }, []);

  useEffect(() => {
    const vh = () => window.innerHeight || document.documentElement.clientHeight;

    const compute = (el) => {
      const offset = parseFloat(el.dataset.revealOffset || "0");
      const rect = el.getBoundingClientRect();
      const viewport = vh();
      const start = viewport * 0.92 - offset;
      const end = viewport * 0.48 - offset;
      const span = start - end || 1;
      let p = (start - rect.top) / span;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      el.style.setProperty("--p", p.toFixed(4));
    };

    const onScroll = () => {
      if (rafId.current) return;
      rafId.current = requestAnimationFrame(() => {
        active.current.forEach(compute);
        rafId.current = null;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            active.current.add(entry.target);
            compute(entry.target);
          } else {
            active.current.delete(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "25% 0px 25% 0px" }
    );

    els.current.forEach((el) => observer.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return register;
}

/* Theme (dark/light) tracker based on which section is dominant on screen */
function useSectionTheme() {
  const [theme, setTheme] = useState("dark");
  const map = useRef(new Map());
  const register = useCallback((el, t) => {
    if (el) map.current.set(el, t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;
        let bestRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = entry.target;
          }
        });
        if (best && map.current.has(best)) {
          setTheme(map.current.get(best));
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    map.current.forEach((_, el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return [theme, register];
}

/* Gentle cursor-follow glow, hero only — one deliberate bit of "alive" motion */
function useCursorGlow(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--gx", `${x}%`);
      el.style.setProperty("--gy", `${y}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [ref]);
}

/* -------------------------- pixel art sprites -------------------------- */
/* Tiny 8-bit style sprites, drawn with a single element's box-shadow list
   (one "on" pixel per shadow) so dozens of them cost almost nothing. */

const PIXEL_HEART = [
  "01100110",
  "11111111",
  "11111111",
  "11111111",
  "01111110",
  "00111100",
  "00011000",
];

const PIXEL_STAR = [
  "00100",
  "00100",
  "11111",
  "01110",
  "10101",
];

function pixelShadow(matrix, size, color) {
  const shadows = [];
  matrix.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "1") shadows.push(`${x * size}px ${y * size}px 0 0 ${color}`);
    }
  });
  return shadows.join(",");
}

function usePixelShadow(matrix, size, color) {
  return useMemo(() => pixelShadow(matrix, size, color), [matrix, size, color]);
}

function PixelHeart({ size = 3, color = "#ff9baa", style, className = "" }) {
  const shadow = usePixelShadow(PIXEL_HEART, size, color);
  return (
    <span
      aria-hidden="true"
      className={`pixel-sprite ${className}`}
      style={{ width: size, height: size, boxShadow: shadow, ...style }}
    />
  );
}

function PixelStar({ size = 3, color = "#d7b482", style, className = "" }) {
  const shadow = usePixelShadow(PIXEL_STAR, size, color);
  return (
    <span
      aria-hidden="true"
      className={`pixel-sprite ${className}`}
      style={{ width: size, height: size, boxShadow: shadow, ...style }}
    />
  );
}

/* Ambient drifting pixel-art field, layered with the aurora/starfield */
function PixelField({ visible, progress }) {
  const sprites = useMemo(() => {
    const palette = ["#ff9baa", "#d7b482", "#a68bfa", "#eab3bd"];
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      kind: i % 3 === 0 ? "heart" : "star",
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 2 + Math.round(Math.random() * 2),
      color: palette[i % palette.length],
      duration: 5 + Math.random() * 6,
      delay: Math.random() * 5,
      depth: i % 2 === 0 ? 0.4 : 0.9,
      opacity: 0.35 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="pixel-field" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true">
      {sprites.map((s) => (
        <div
          key={s.id}
          className="pixel-item"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: s.opacity,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            transform: `translateY(${(progress - 50) * 0.18 * s.depth}px)`,
          }}
        >
          {s.kind === "heart" ? (
            <PixelHeart size={s.size} color={s.color} />
          ) : (
            <PixelStar size={s.size} color={s.color} />
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------- background layers -------------------------- */

function Aurora({ visible }) {
  return (
    <div className="aurora" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true">
      <span className="aurora__blob aurora__blob--a" />
      <span className="aurora__blob aurora__blob--b" />
      <span className="aurora__blob aurora__blob--c" />
    </div>
  );
}

function Starfield({ visible }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 130 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.6,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2.5,
      })),
    []
  );

  return (
    <div className="starfield" style={{ opacity: visible ? 1 : 0 }} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------- sub components -------------------------- */

function TimelineMoment({ moment, index, register }) {
  const align = index % 2 === 0 ? "left" : "right";
  return (
    <div
      className={`moment moment--${align} reveal`}
      ref={(el) => register(el, (index % 2) * 40)}
    >
      <div className="moment__dot" />
      <div className="moment__card">
        <span className="moment__num">{String(index + 1).padStart(2, "0")}</span>
        <h3>{moment.title}</h3>
        <p>{moment.text}</p>
      </div>
    </div>
  );
}

/*
 * ReasonCard — the flip card.
 * IMPORTANT: the scroll-reveal class/ref lives on a plain WRAPPER div whose
 * className never changes across renders. The flip state (`is-flipped`)
 * lives only on the inner button. Previously both were combined in one
 * className string on the same node the IntersectionObserver was mutating
 * imperatively (`classList.add("in-view")`); clicking the card changed
 * React state, which made React recompute and overwrite that node's whole
 * className on the next render — wiping out the manually-added reveal
 * class and snapping the card back to its hidden/offscreen state (the
 * "disappearing" glitch). Splitting them onto two nodes fixes it, and the
 * new reveal mechanism no longer mutates classes at all — it only writes a
 * CSS variable, so nothing React renders can ever clobber it.
 */
function ReasonCard({ reason, index, register }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="reason-reveal reveal"
      ref={(el) => register(el, (index % 3) * 45)}
    >
      <PixelStar size={2} color="#d7b482" className="reason-reveal__pip" />
      <button
        type="button"
        className={`reason ${flipped ? "is-flipped" : ""}`}
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={reason.short}
      >
        <div className="reason__inner">
          <div className="reason__face reason__front">
            <Star size={16} strokeWidth={1.5} />
            <span>{reason.short}</span>
          </div>
          <div className="reason__face reason__back">
            <span>{reason.long}</span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ------------------------------- app ------------------------------- */

export default function App() {
  const progress = useScrollProgress();
  const register = usePostcardReveal();
  const [theme, registerTheme] = useSectionTheme();
  const heroRef = useRef(null);
  useCursorGlow(heroRef);

  const [letterInView, setLetterInView] = useState(false);
  const letterContentRef = useRef(null);
  const letterSectionRef = useRef(null);
  const [typed, setTyped] = useState("");
  const [paraVisible, setParaVisible] = useState(false);

  useEffect(() => {
    const el = letterContentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLetterInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!letterInView) return;
    const full = CONFIG.letterOpening.replace("{name}", CONFIG.name);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(interval);
        setTimeout(() => setParaVisible(true), 220);
      }
    }, 42);
    return () => clearInterval(interval);
  }, [letterInView]);

  const [particles, setParticles] = useState([]);
  const [finaleRevealed, setFinaleRevealed] = useState(false);
  const burst = () => {
    setFinaleRevealed(true);
    const batch = Array.from({ length: 22 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 80;
      return {
        id: `${Date.now()}-${i}`,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        delay: Math.random() * 0.15,
        heart: Math.random() > 0.45,
      };
    });
    setParticles((p) => [...p, ...batch]);
    setTimeout(() => {
      setParticles((p) => p.filter((pt) => !batch.includes(pt)));
    }, 1300);
  };

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,440;0,9..144,560;1,9..144,440&family=Jost:wght@300;400;500;600&display=swap');

        :root{
          --night-deep:#0f0a1f;
          --night-mid:#231a42;
          --night-soft:#2d2350;
          --rose:#eab3bd;
          --coral:#ff9baa;
          --violet:#a68bfa;
          --gold:#d7b482;
          --cream:#faf5ec;
          --ink:#241c38;
          --ink-soft:#5a5170;
        }

        *{box-sizing:border-box;}
        html,body{margin:0;padding:0; overflow-x:hidden;}
        .page{
          font-family:'Jost', sans-serif;
          font-weight:400;
          color:var(--cream);
          background:var(--night-deep);
          overflow-x:hidden;
          position:relative;
          width:100%;
        }
        .page :focus-visible{ outline:2px solid var(--gold); outline-offset:3px; }
        @media (prefers-reduced-motion: reduce){
          .page *{ animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; }
          .reveal, .reveal::before, .reveal::after{ opacity:1 !important; transform:none !important; filter:none !important; }
        }

        h1,h2,h3{ font-family:'Fraunces', serif; font-weight:560; margin:0; letter-spacing:-0.01em; }
        p{ line-height:1.65; color:inherit; margin:0; }

        .progress{
          position:fixed; top:0; left:0; height:2px; z-index:60;
          background:linear-gradient(90deg,var(--gold),var(--coral));
          transition:width .08s linear;
        }

        /* grain texture, subtle, over everything */
        .grain{
          position:fixed; inset:0; z-index:40; pointer-events:none;
          opacity:.05; mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .starfield{ position:fixed; inset:0; z-index:0; pointer-events:none; transition:opacity 1.1s ease; }
        .star{ position:absolute; border-radius:50%; background:var(--cream); animation:twinkle ease-in-out infinite; }
        @keyframes twinkle{ 0%,100%{ opacity:.15; } 50%{ opacity:1; } }

        .aurora{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; transition:opacity 1.1s ease; }
        .aurora__blob{ position:absolute; border-radius:50%; filter:blur(70px); mix-blend-mode:screen; opacity:.35; }
        .aurora__blob--a{ width:42vw; height:42vw; background:var(--coral); top:-10%; left:-8%; animation:driftA 22s ease-in-out infinite; }
        .aurora__blob--b{ width:38vw; height:38vw; background:var(--violet); bottom:-12%; right:-6%; animation:driftB 26s ease-in-out infinite; }
        .aurora__blob--c{ width:30vw; height:30vw; background:var(--gold); top:35%; left:55%; animation:driftC 30s ease-in-out infinite; opacity:.22; }
        @keyframes driftA{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(6vw,8vh); } }
        @keyframes driftB{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(-5vw,-6vh); } }
        @keyframes driftC{ 0%,100%{ transform:translate(0,0) scale(1); } 50%{ transform:translate(-4vw,5vh) scale(1.12); } }

        /* pixel-art ambient field */
        .pixel-field{ position:fixed; inset:0; z-index:0; pointer-events:none; transition:opacity 1.1s ease; }
        .pixel-item{ position:absolute; animation:pixelFloat ease-in-out infinite; image-rendering:pixelated; }
        .pixel-sprite{ position:relative; display:block; image-rendering:pixelated; }
        @keyframes pixelFloat{
          0%,100%{ transform:translateY(0) rotate(0deg); }
          50%{ transform:translateY(-16px) rotate(8deg); }
        }

        section{ position:relative; z-index:1; padding:clamp(64px,14vh,120px) clamp(20px,6vw,64px); }

        /* ---------------- hero ---------------- */
        .hero{
          min-height:100svh;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          text-align:center; padding-top:0; padding-bottom:0;
          --gx:50%; --gy:40%;
        }
        .hero::before{
          content:""; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(420px circle at var(--gx) var(--gy), rgba(234,179,189,.14), transparent 60%);
          transition:background .1s ease;
        }
        .hero__pixels{ position:absolute; inset:0; pointer-events:none; }
        .hero__pixels span{ position:absolute; }
        .hero__kicker{
          font-style:italic; font-weight:300;
          font-size:clamp(0.9rem,1.6vw,1.1rem);
          color:var(--rose); margin-bottom:0.6rem;
          opacity:0; animation:fadeUp 1s ease forwards .2s;
        }
        .hero__name{
          font-size:clamp(2.6rem,11vw,7.5rem); line-height:1;
          background:linear-gradient(120deg,var(--cream),var(--gold) 55%,var(--coral));
          -webkit-background-clip:text; background-clip:text; color:transparent;
          opacity:0; animation:fadeUp 1.1s ease forwards .5s;
          word-break:break-word;
        }
        .hero__subtitle{
          margin-top:1.4rem; font-size:clamp(0.9rem,1.4vw,1.1rem);
          color:#cfc7e6; font-weight:300;
          opacity:0; animation:fadeUp 1s ease forwards .9s;
          padding:0 1rem;
        }
        @keyframes fadeUp{ from{ opacity:0; transform:translateY(22px); } to{ opacity:1; transform:translateY(0); } }
        .hero__cue{
          position:absolute; bottom:5vh; left:50%; transform:translateX(-50%);
          display:flex; flex-direction:column; align-items:center; gap:6px;
          color:#a99fc9; opacity:0; animation:fadeUp .8s ease forwards 1.6s;
        }
        .hero__cue span{ font-size:.78rem; letter-spacing:.03em; }
        .hero__cue svg{ animation:bob 1.8s ease-in-out infinite; }
        @keyframes bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(8px); } }

        /* ---------------- postcard reveal ---------------- */
        /*
          --p (0 → 1) is written directly by JS as the element crosses the
          viewport, scrubbed by scroll position rather than fired once.
          It drives three things together: a 3D flap tilting open from the
          bottom edge, a focus-pull (blurred → sharp), and a diagonal
          light-catch that peaks exactly halfway through the motion —
          like a postcard tipping into the light as it opens.
        */
        .reveal{
          --p: 0;
          position:relative;
          opacity: var(--p);
          transform-origin: 50% 100%;
          transform:
            perspective(900px)
            rotateX(calc((1 - var(--p)) * -46deg))
            translateY(calc((1 - var(--p)) * 46px))
            scale(calc(0.94 + var(--p) * 0.06));
          filter: blur(calc((1 - var(--p)) * 5px));
        }
        .reveal::before{
          content:"";
          position:absolute; left:6%; right:6%; top:50%; height:1px;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
          opacity: calc((1 - var(--p)) * 0.75);
          transform: scaleX(calc(1 - var(--p) * 0.35));
          pointer-events:none;
        }
        .reveal::after{
          content:"";
          position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(115deg, transparent 35%, rgba(255,255,255,.4) 48%, transparent 62%);
          background-size:260% 260%;
          background-position: calc(150% - var(--p) * 150%) calc(150% - var(--p) * 150%);
          opacity: calc(var(--p) * (1 - var(--p)) * 4);
          mix-blend-mode: overlay;
        }

        /* ---------------- intro line ---------------- */
        .intro{ text-align:center; max-width:640px; margin:0 auto; }
        .intro p{
          font-family:'Fraunces', serif; font-size:clamp(1.3rem,3.4vw,2.1rem);
          font-weight:440; font-style:italic; color:var(--rose);
        }

        /* ---------------- timeline ---------------- */
        .timeline{ max-width:760px; margin:0 auto; position:relative; }
        .timeline::before{
          content:""; position:absolute; top:0; bottom:0; left:50%;
          width:1px; background:linear-gradient(var(--night-soft),var(--gold),var(--night-soft));
          transform:translateX(-50%); opacity:.5;
        }
        .timeline__heading{ text-align:center; margin-bottom:3.5rem; font-size:clamp(1.6rem,4vw,2.6rem); }
        .moment{ position:relative; width:50%; padding:1.4rem clamp(1rem,2.4vw,2.4rem); margin-bottom:1.8rem; }
        .moment--left{ left:0; text-align:right; }
        .moment--right{ left:50%; text-align:left; }
        .moment__dot{ position:absolute; top:1.9rem; width:9px; height:9px; border-radius:50%; background:var(--gold); box-shadow:0 0 0 4px rgba(215,180,130,.18); }
        .moment--left .moment__dot{ right:-4.5px; }
        .moment--right .moment__dot{ left:-4.5px; }
        .moment__num{
          display:block; font-family:'Fraunces', serif; font-style:italic; font-weight:400;
          font-size:.85rem; color:var(--gold); opacity:.8; margin-bottom:.25rem;
        }
        .moment__card h3{ font-size:clamp(1rem,2vw,1.3rem); margin-bottom:.5rem; color:var(--cream); }
        .moment__card p{ font-size:.94rem; color:#cabee6; }
        @media (max-width:720px){
          .timeline::before{ left:14px; }
          .moment{ width:100%; left:0 !important; text-align:left !important; padding-left:2.6rem; padding-right:0; }
          .moment--left .moment__dot, .moment--right .moment__dot{ left:9.5px; right:auto; }
        }

        /* ---------------- constellation / reasons ---------------- */
        .constellation{ max-width:920px; margin:0 auto; text-align:center; }
        .constellation__heading{ font-size:clamp(1.6rem,4vw,2.6rem); margin-bottom:.7rem; }
        .constellation__sub{ color:#b9adda; font-weight:300; margin-bottom:2.6rem; font-size:.92rem; }
        .reasons{ display:grid; grid-template-columns:repeat(3,1fr); gap:clamp(.6rem,2vw,1rem); }
        @media (max-width:680px){ .reasons{ grid-template-columns:repeat(2,1fr); } }
        @media (max-width:380px){ .reasons{ grid-template-columns:1fr; } .reason-reveal{ aspect-ratio:auto !important; min-height:96px; } }

        .reason-reveal{ aspect-ratio:1/1; }
        .reason-reveal__pip{
          position:absolute; top:-6px; right:-4px; z-index:2; pointer-events:none;
          opacity: calc(var(--p) * (1 - var(--p)) * 4 + var(--p) * 0.3);
        }
        .reason{
          border:none; background:transparent; cursor:pointer; padding:0;
          perspective:1000px; -webkit-perspective:1000px;
          width:100%; height:100%; font-family:inherit; color:inherit;
          -webkit-tap-highlight-color:transparent; touch-action:manipulation;
        }
        .reason__inner{
          position:relative; width:100%; height:100%;
          transform-style:preserve-3d; -webkit-transform-style:preserve-3d;
          transition:transform .6s cubic-bezier(.3,.7,.3,1);
          border-radius:16px;
        }
        .reason.is-flipped .reason__inner{ transform:rotateY(180deg); }
        .reason__face{
          position:absolute; inset:0;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:.6rem; padding:1rem; border-radius:16px;
          backface-visibility:hidden; -webkit-backface-visibility:hidden;
          -moz-backface-visibility:hidden;
          border:1px solid rgba(215,180,130,.25);
        }
        .reason__front{ background:linear-gradient(160deg,var(--night-soft),var(--night-mid)); font-size:.84rem; font-weight:500; }
        .reason__front svg{ color:var(--gold); }
        .reason__back{
          background:linear-gradient(160deg,var(--rose),var(--gold)); color:var(--ink);
          transform:rotateY(180deg); -webkit-transform:rotateY(180deg);
          font-size:.8rem; font-weight:400; line-height:1.42;
        }
        .reason:hover .reason__inner{ transform:translateY(-4px); }
        .reason.is-flipped:hover .reason__inner{ transform:rotateY(180deg) translateY(-4px); }

        /* ---------------- letter ---------------- */
        .letter-wrap{ background:var(--cream); color:var(--ink); }
        .letter{ max-width:600px; margin:0 auto; position:relative; }
        .letter::before{
          content:""; position:absolute; left:-24px; top:-10px; bottom:-10px; width:2px;
          background:repeating-linear-gradient(var(--rose) 0 8px, transparent 8px 16px);
          opacity:.5;
        }
        @media (max-width:600px){ .letter::before{ display:none; } }
        .letter__opening{
          font-family:'Fraunces', serif; font-size:clamp(1.45rem,4.4vw,2.3rem);
          font-weight:440; font-style:italic; min-height:2.6em; color:var(--ink);
        }
        .letter__opening .cursor{
          display:inline-block; width:2px; height:1em; background:var(--ink);
          margin-left:2px; vertical-align:-0.15em; animation:blink 1s step-end infinite;
        }
        @keyframes blink{ 50%{ opacity:0; } }
        .letter p.body{
          margin-top:1.3rem; font-size:1rem; color:var(--ink-soft);
          opacity:0; transform:translateY(14px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .letter p.body.show{ opacity:1; transform:translateY(0); }
        .letter__sign{
          margin-top:2rem; font-family:'Fraunces', serif; font-style:italic; font-size:1.15rem; color:var(--ink);
          opacity:0; transform:translateY(14px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .letter__sign.show{ opacity:1; transform:translateY(0); }

        /* ---------------- finale ---------------- */
        .finale{ min-height:100svh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
        .finale h2{ font-size:clamp(1.9rem,5vw,3rem); margin-bottom:.6rem; }
        .finale__sub{ color:#cabee6; font-weight:300; margin-bottom:2.4rem; }
        .finale__btn{
          position:relative; background:none; border:none; cursor:pointer;
          width:96px; height:96px; display:flex; align-items:center; justify-content:center;
          color:var(--rose); -webkit-tap-highlight-color:transparent;
        }
        .finale__btn svg{ width:52px; height:52px; transition:transform .25s ease; filter:drop-shadow(0 0 14px rgba(234,179,189,.5)); }
        .finale__btn:hover svg{ transform:scale(1.12); }
        .finale__btn:active svg{ transform:scale(.92); }
        .finale__btn.is-pulsing svg{ animation:heartbeat 1.4s ease-in-out infinite; }
        @keyframes heartbeat{ 0%,100%{ transform:scale(1); } 15%{ transform:scale(1.14); } 30%{ transform:scale(1); } 45%{ transform:scale(1.1); } }
        .particle{ position:absolute; top:50%; left:50%; pointer-events:none; animation:burstMove .9s cubic-bezier(.2,.7,.3,1) forwards; }
        .particle .pixel-sprite{ position:absolute; top:0; left:0; }
        @keyframes burstMove{ to{ transform:translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3); opacity:0; } }
        .finale__reveal{
          margin-top:2.2rem; max-width:min(480px,86vw);
          font-family:'Fraunces', serif; font-style:italic; font-size:clamp(1.1rem,2.6vw,1.5rem); color:var(--cream);
          opacity:0; transform:translateY(14px); transition:opacity .8s ease, transform .8s ease;
        }
        .finale__reveal.show{ opacity:1; transform:translateY(0); }

        footer{ text-align:center; padding:2.6rem 1rem 3.5rem; color:#8a80a8; font-size:.78rem; font-weight:300; }
      `}</style>

      <div className="progress" style={{ width: `${progress}%` }} />
      <Aurora visible={theme === "dark"} />
      <Starfield visible={theme === "dark"} />
      <PixelField visible={theme === "dark"} progress={progress} />
      <div className="grain" />

      {/* HERO */}
      <section className="hero" ref={(el) => { heroRef.current = el; registerTheme(el, "dark"); }} data-theme="dark">
        <div className="hero__pixels" aria-hidden="true">
          <span style={{ top: "18%", left: "12%" }}><PixelHeart size={3} color="#ff9baa" /></span>
          <span style={{ top: "70%", left: "84%" }}><PixelStar size={3} color="#d7b482" /></span>
          <span style={{ top: "80%", left: "16%" }}><PixelStar size={2} color="#a68bfa" /></span>
          <span style={{ top: "22%", left: "82%" }}><PixelHeart size={2} color="#eab3bd" /></span>
        </div>
        <div className="hero__kicker">{CONFIG.kicker}</div>
        <h1 className="hero__name">{CONFIG.name}</h1>
        <p className="hero__subtitle">{CONFIG.heroSubtitle}</p>
        <div className="hero__cue">
          <span>keep scrolling</span>
          <ChevronDown size={18} strokeWidth={1.5} />
        </div>
      </section>

      {/* INTRO */}
      <section data-theme="dark" ref={(el) => registerTheme(el, "dark")}>
        <div className="intro reveal" ref={(el) => register(el)}>
          <p>{CONFIG.introLine}</p>
        </div>
      </section>

      {/* TIMELINE */}
      <section data-theme="dark" ref={(el) => registerTheme(el, "dark")}>
        <div className="timeline">
          <h2 className="timeline__heading reveal" ref={(el) => register(el)}>Our story so far</h2>
          {CONFIG.moments.map((m, i) => (
            <TimelineMoment key={m.title} moment={m} index={i} register={register} />
          ))}
        </div>
      </section>

      {/* CONSTELLATION */}
      <section data-theme="dark" ref={(el) => registerTheme(el, "dark")}>
        <div className="constellation">
          <h2 className="constellation__heading reveal" ref={(el) => register(el)}>A few reasons, out of many</h2>
          <p className="constellation__sub reveal" ref={(el) => register(el, 20)}>Tap each card</p>
          <div className="reasons">
            {CONFIG.reasons.map((r, i) => (
              <ReasonCard key={r.short} reason={r} index={i} register={register} />
            ))}
          </div>
        </div>
      </section>

      {/* LETTER */}
      <section
        className="letter-wrap"
        data-theme="light"
        ref={(el) => { registerTheme(el, "light"); letterSectionRef.current = el; }}
      >
        <div className="letter" ref={letterContentRef}>
          <div className="letter__opening">
            {typed}
            {typed.length < CONFIG.letterOpening.replace("{name}", CONFIG.name).length && (
              <span className="cursor" />
            )}
          </div>
          {CONFIG.letterParagraphs.map((p, i) => (
            <p key={i} className={`body ${paraVisible ? "show" : ""}`} style={{ transitionDelay: `${i * 0.16}s` }}>
              {p}
            </p>
          ))}
          <p className={`letter__sign ${paraVisible ? "show" : ""}`} style={{ transitionDelay: `${CONFIG.letterParagraphs.length * 0.16}s` }}>
            {CONFIG.signature}
          </p>
        </div>
      </section>

      {/* FINALE */}
      <section className="finale" data-theme="dark" ref={(el) => registerTheme(el, "dark")}>
        <h2 className="reveal" ref={(el) => register(el)}>{CONFIG.finaleTitle}</h2>
        <p className="finale__sub reveal" ref={(el) => register(el, 20)}>{CONFIG.finaleSubtitle}</p>
        <button
          type="button"
          className={`finale__btn ${!finaleRevealed ? "is-pulsing" : ""}`}
          onClick={burst}
          aria-label="Reveal the last surprise"
        >
          <Heart fill="currentColor" strokeWidth={1} />
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{ "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, animationDelay: `${p.delay}s` }}
            >
              {p.heart ? (
                <PixelHeart size={2.5} color="#eab3bd" />
              ) : (
                <PixelStar size={2.5} color="#d7b482" />
              )}
            </span>
          ))}
        </button>
        <p className={`finale__reveal ${finaleRevealed ? "show" : ""}`}>{CONFIG.finaleReveal}</p>
      </section>

      <footer>made with a little too much care, just for you</footer>
    </div>
  );
}
