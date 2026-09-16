import  { useEffect, useState } from "react";
import { Heart, Sparkles } from "lucide-react";


export default function LoadingScreen({ name = 'my Cheescakeeee', onFinish }) {
  const [phase, setPhase] = useState("closed"); 
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timers = [
      setTimeout(() => setPhase("shake"), 900),
      setTimeout(() => setPhase("open"), 1700),
      setTimeout(() => setPhase("exit"), 3700),
      setTimeout(() => {
        document.body.style.overflow = prevOverflow;
        setGone(true);
        if (onFinish) onFinish();
      }, 3250),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = prevOverflow;
    };
  }, [onFinish]);

  if (gone) return null;

  return (
    <div className={`postcard-loader phase-${phase}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,440;1,9..144,440&family=Jost:wght@300;400;500&display=swap');

        .postcard-loader{
          position:fixed; inset:0; z-index:200;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:clamp(1.2rem,3vh,1.8rem);
          background:radial-gradient(120% 120% at 50% 20%, #241a44 0%, #0f0a1f 70%);
          transition:opacity .65s ease;
          font-family:'Jost', sans-serif;
        }
        .postcard-loader.phase-exit{ opacity:0; pointer-events:none; }

        @media (prefers-reduced-motion: reduce){
          .postcard-loader *{ animation-duration:.001ms !important; transition-duration:.001ms !important; }
        }

        .pc-scene{
          perspective:1400px;
          display:flex; flex-direction:column; align-items:center; gap:1.6rem;
        }

        .pc-card{
          position:relative;
          width:clamp(290px,42vw,250px);
          height:clamp(158px,28vw,168px);
          border-radius:12px;
          box-shadow:0 30px 60px -10px rgba(0,0,0,.5);
          transform:scale(1) rotate(0deg);
          transition:transform .5s ease;
        }
        .postcard-loader.phase-shake .pc-card{ animation:pc-shake .5s ease; }
        @keyframes pc-shake{
          0%,100%{ transform:rotate(0deg); }
          20%{ transform:rotate(-2.5deg); }
          40%{ transform:rotate(2.5deg); }
          60%{ transform:rotate(-1.5deg); }
          80%{ transform:rotate(1.5deg); }
        }

        /* the inside layer — revealed once the front panel opens */
        .pc-inside{
          position:absolute; inset:0; border-radius:12px;
          background:linear-gradient(160deg,#2d2350,#3a2a5c);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:.5rem;
          overflow:hidden;
        }
        .pc-heart{
          color:#ff8fa3;
          opacity:0; transform:scale(1);
          transition:opacity .5s ease .55s, transform .5s cubic-bezier(.3,1.5,.4,1) .55s;
          filter:drop-shadow(0 0 16px rgba(255,143,163,.55));
        }
        .postcard-loader.phase-open .pc-heart,
        .postcard-loader.phase-exit .pc-heart{
          opacity:1; transform:scale(1.5);
        }
        .pc-heart-bob{ display:flex; animation:pc-bob 2s ease-in-out infinite; animation-delay:1s; }
        @keyframes pc-bob{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }

        .pc-spark{
          position:absolute; color:#d7b482; opacity:0;
          transition:opacity .5s ease, transform .5s ease;
        }
        .postcard-loader.phase-open .pc-spark,
        .postcard-loader.phase-exit .pc-spark{ opacity:.9; }
        .pc-spark--1{ top:22%; left:20%; transition-delay:.75s; }
        .pc-spark--2{ top:26%; right:18%; transition-delay:.9s; }
        .pc-spark--3{ bottom:20%; left:30%; transition-delay:1.05s; }

        /* the front panel — folds open like a card, left edge as the spine */
        .pc-front{
          position:absolute; inset:0; border-radius:12px;
          background:
            linear-gradient(160deg,#faf5ec,#f1e6d3);
          transform-origin:left center;
          transform:rotateY(0deg);
          transition:transform 1.05s cubic-bezier(.6,.15,.2,1);
          backface-visibility:hidden;
          -webkit-backface-visibility:hidden;
          box-shadow:inset 0 0 0 1px rgba(36,28,56,.06);
          z-index:2;
        }
        .postcard-loader.phase-open .pc-front,
        .postcard-loader.phase-exit .pc-front{
          transform:rotateY(-165deg);
        }

        .pc-stamp{
          position:absolute; top:12px; right:12px;
          width:50px; height:56px;
          border:2px dashed #d7b482;
          border-radius:3px;
          display:flex; align-items:center; justify-content:center;
          color:#e08a9a;
        }
        .pc-lines{
          position:absolute; left:16px; bottom:38px;
          display:flex; flex-direction:column; gap:6px;
        }
        .pc-lines span{
          display:block; height:1px; background:#cabbaa; border-radius:1px;
        }
        .pc-lines span:nth-child(1){ width:80px; }
        .pc-lines span:nth-child(2){ width:56px; }

        .pc-for{
          position:absolute; left:16px; bottom:14px;
          font-family:'Fraunces', serif; font-style:italic;
          font-size:.85rem; color:#5a5170;
          max-width:75%;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }

        .pc-caption{
          font-size:.82rem; letter-spacing:.02em; color:#b9adda; font-weight:300;
          display:flex; align-items:center; gap:.35rem;
        }
        .pc-dot{
          width:4px; height:4px; border-radius:50%; background:#b9adda;
          animation:pc-dot-pulse 1.2s ease-in-out infinite;
        }
        .pc-dot:nth-child(2){ animation-delay:.15s; }
        .pc-dot:nth-child(3){ animation-delay:.3s; }
        @keyframes pc-dot-pulse{
          0%,100%{ opacity:.25; transform:scale(1); }
          50%{ opacity:1; transform:scale(1.3); }
        }
      `}</style>

      <div className="pc-scene">
        <div className="pc-card">
          <div className="pc-inside">
            <div className="pc-heart pc-heart-bob">
              <Heart size={40} fill="currentColor" strokeWidth={1} />
            </div>
            <Sparkles size={14} className="pc-spark pc-spark--1" />
            <Sparkles size={10} className="pc-spark pc-spark--2" />
            <Sparkles size={12} className="pc-spark pc-spark--3" />
          </div>
          <div className="pc-front">
            <div className="pc-stamp">
              <Heart size={30} fill="currentColor" strokeWidth={1} />
            </div>
            <div className="pc-lines">
              <span />
              <span />
            </div>
            <div className="pc-for">for {name}</div>
          </div>
        </div>
        <p className="pc-caption">
          opening your surprise
          <span className="pc-dot" />
          <span className="pc-dot" />
          <span className="pc-dot" />
        </p>
      </div>
    </div>
  );
}
