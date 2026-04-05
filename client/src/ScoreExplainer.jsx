/**
 * client/src/ScoreExplainer.jsx
 * Shared AI score explainability component.
 * Usage: <ScoreExplainer score={82} reasons={[...]} gaps={[...]} label="Match score" />
 * - Hover → compact tooltip with top reasons
 * - Click → full modal breakdown with visual bars
 */
import { useState, useRef, useEffect } from "react";

const F = "var(--t-font,'Plus Jakarta Sans',sans-serif)";
const C = {
  surface: "var(--t-surface,#ffffff)",
  border:  "var(--t-border,#E8EBF4)",
  text1:   "var(--t-text1,#0F1729)",
  text2:   "var(--t-text2,#374151)",
  text3:   "var(--t-text3,#6B7280)",
  accent:  "var(--t-accent,#4361EE)",
  green:   "#0CAF77", greenL: "#F0FDF4",
  amber:   "#F59F00", amberL: "#FFFBEB",
  red:     "#E03131", redL:   "#FFF5F5",
};

const scoreColor  = s => s >= 75 ? C.green  : s >= 50 ? C.amber  : C.red;
const scoreBg     = s => s >= 75 ? C.greenL : s >= 50 ? C.amberL : C.redL;
const scoreLabel  = s => s >= 75 ? "Strong match" : s >= 50 ? "Partial match" : "Weak match";

function CheckIcon({ ok }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={ok ? C.green : C.amber} strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
      <path d={ok ? "M20 6L9 17l-5-5" : "M12 9v4M12 17h.01"} />
    </svg>
  );
}

// ── Tooltip (hover) ───────────────────────────────────────────────────────────
function ScoreTooltip({ score, reasons = [], gaps = [], style = {} }) {
  const col = scoreColor(score);
  const topReasons = reasons.slice(0, 3);
  const topGaps    = gaps.slice(0, 2);
  return (
    <div style={{
      position: "absolute", zIndex: 9999, bottom: "calc(100% + 8px)", left: "50%",
      transform: "translateX(-50%)", width: 240,
      background: C.text1, color: "white", borderRadius: 12,
      padding: "12px 14px", boxShadow: "0 8px 30px rgba(0,0,0,.25)",
      fontFamily: F, pointerEvents: "none",
      ...style,
    }}>
      {/* Arrow */}
      <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",
        width:12,height:6,overflow:"hidden"}}>
        <div style={{width:12,height:12,background:C.text1,transform:"rotate(45deg)",
          transformOrigin:"center",marginTop:-6}}/>
      </div>
      {/* Score line */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.7)"}}>AI Match Score</span>
        <span style={{fontSize:15,fontWeight:900,color:col}}>{score}%</span>
      </div>
      {/* Reasons */}
      {topReasons.map((r,i) => (
        <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginTop:2,flexShrink:0}}>
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span style={{fontSize:11,color:"rgba(255,255,255,.85)",lineHeight:1.4}}>{r}</span>
        </div>
      ))}
      {topGaps.map((g,i) => (
        <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.amber}
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginTop:2,flexShrink:0}}>
            <path d="M12 9v4M12 17h.01"/>
          </svg>
          <span style={{fontSize:11,color:"rgba(255,255,255,.7)",lineHeight:1.4}}>{g}</span>
        </div>
      ))}
      <div style={{marginTop:8,fontSize:10,color:"rgba(255,255,255,.4)",textAlign:"center"}}>Click for full breakdown</div>
    </div>
  );
}

// ── Modal (click) ─────────────────────────────────────────────────────────────
function ScoreModal({ score, reasons = [], gaps = [], candidateName, jobName, onClose }) {
  const col = scoreColor(score);
  const bg  = scoreBg(score);
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const factors = [
    ...reasons.map(r => ({ text: r, ok: true })),
    ...gaps.map(g => ({ text: g, ok: false })),
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:10000,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(15,23,41,.5)",backdropFilter:"blur(3px)"}}
      onClick={onClose}>
      <div style={{background:C.surface,borderRadius:20,padding:28,width:460,maxWidth:"95vw",
        boxShadow:"0 24px 60px rgba(0,0,0,.2)",fontFamily:F}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:C.text1,marginBottom:4}}>
              AI Match Explanation
            </div>
            {candidateName && jobName && (
              <div style={{fontSize:12,color:C.text3}}>
                {candidateName} → {jobName}
              </div>
            )}
            {(candidateName && !jobName) && (
              <div style={{fontSize:12,color:C.text3}}>{candidateName}</div>
            )}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",
            padding:4,color:C.text3,fontSize:18,lineHeight:1}}>×</button>
        </div>

        {/* Score gauge */}
        <div style={{display:"flex",alignItems:"center",gap:20,padding:"16px 20px",
          borderRadius:14,background:bg,border:`1.5px solid ${col}30`,marginBottom:20}}>
          {/* Circle */}
          <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke={`${col}20`} strokeWidth="7"/>
              <circle cx="36" cy="36" r="30" fill="none" stroke={col} strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${score * 1.885} 188.5`}
                strokeDashoffset="47.1"
                transform="rotate(-90 36 36)"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:18,fontWeight:900,color:col,lineHeight:1}}>{score}</span>
              <span style={{fontSize:9,color:col,fontWeight:700}}>%</span>
            </div>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:col,marginBottom:4}}>{scoreLabel(score)}</div>
            <div style={{fontSize:12,color:C.text2,lineHeight:1.5}}>
              {reasons.length} positive signal{reasons.length !== 1 ? "s" : ""}
              {gaps.length > 0 ? ` · ${gaps.length} gap${gaps.length !== 1 ? "s" : ""} identified` : ""}
            </div>
            {/* Score bar */}
            <div style={{marginTop:8,height:6,width:200,borderRadius:99,background:`${col}20`,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${score}%`,background:col,borderRadius:99,
                transition:"width .6s ease"}}/>
            </div>
          </div>
        </div>

        {/* Factor list */}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:280,overflowY:"auto"}}>
          {reasons.length > 0 && (
            <div style={{fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",
              letterSpacing:".06em",marginBottom:4}}>✓ Positive signals</div>
          )}
          {reasons.map((r,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              padding:"9px 12px",borderRadius:9,background:C.greenL,
              border:`1px solid ${C.green}25`}}>
              <CheckIcon ok={true}/>
              <span style={{fontSize:13,color:C.text2,lineHeight:1.5}}>{r}</span>
            </div>
          ))}
          {gaps.length > 0 && (
            <div style={{fontSize:11,fontWeight:700,color:C.amber,textTransform:"uppercase",
              letterSpacing:".06em",marginTop:4,marginBottom:4}}>⚠ Gaps & considerations</div>
          )}
          {gaps.map((g,i) => (
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",
              padding:"9px 12px",borderRadius:9,background:C.amberL,
              border:`1px solid ${C.amber}25`}}>
              <CheckIcon ok={false}/>
              <span style={{fontSize:13,color:C.text2,lineHeight:1.5}}>{g}</span>
            </div>
          ))}
          {factors.length === 0 && (
            <div style={{padding:"20px 12px",textAlign:"center",color:C.text3,fontSize:13}}>
              No detailed explanation available for this score.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{marginTop:20,padding:"10px 14px",borderRadius:9,background:`${C.accent}08`,
          border:`1px solid ${C.accent}20`,fontSize:11,color:C.text3,lineHeight:1.6}}>
          Scores are computed from skills overlap, title matching, location, experience and profile completeness.
          They are a guide only — always apply your own judgement.
        </div>
      </div>
    </div>
  );
}

// ── Main ScoreExplainer — score ring with hover tooltip + click modal ─────────
export default function ScoreExplainer({
  score,
  reasons = [],
  gaps = [],
  candidateName,
  jobName,
  size = 44,      // ring diameter
  fontSize = 12,  // score font size inside ring
}) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref = useRef(null);
  const col = scoreColor(score);
  const hasDetail = reasons.length > 0 || gaps.length > 0;

  if (score == null) return null;

  return (
    <>
      <div
        ref={ref}
        style={{ position: "relative", display: "inline-flex", cursor: hasDetail ? "pointer" : "default" }}
        onMouseEnter={() => hasDetail && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={e => { if (!hasDetail) return; e.stopPropagation(); setOpen(true); setHovered(false); }}
        title={hasDetail ? "Click for full score breakdown" : undefined}
      >
        {/* Score ring */}
        <div style={{
          width: size, height: size, borderRadius: "50%",
          border: `3px solid ${col}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", background: `${col}10`,
          transition: "transform .15s, box-shadow .15s",
          ...(hovered ? { transform: "scale(1.1)", boxShadow: `0 0 0 3px ${col}25` } : {}),
        }}>
          <span style={{ fontSize, fontWeight: 800, color: col, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 8, color: col, opacity: 0.7 }}>%</span>
        </div>

        {/* Hover tooltip */}
        {hovered && hasDetail && (
          <ScoreTooltip score={score} reasons={reasons} gaps={gaps} />
        )}
      </div>

      {/* Click modal */}
      {open && (
        <ScoreModal
          score={score}
          reasons={reasons}
          gaps={gaps}
          candidateName={candidateName}
          jobName={jobName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Also export a compact inline badge version for lists/tables
export function ScoreBadge({ score, reasons = [], gaps = [], size = "sm" }) {
  const [open, setOpen] = useState(false);
  const col = scoreColor(score);
  const hasDetail = reasons.length > 0 || gaps.length > 0;
  const pad  = size === "sm" ? "3px 10px" : "5px 14px";
  const fz   = size === "sm" ? 11 : 13;

  if (score == null) return null;
  return (
    <>
      <span
        onClick={e => { if (!hasDetail) return; e.stopPropagation(); setOpen(true); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: pad, borderRadius: 99, fontSize: fz, fontWeight: 700,
          background: `${col}15`, color: col, border: `1px solid ${col}30`,
          cursor: hasDetail ? "pointer" : "default",
          transition: "opacity .1s",
        }}
        onMouseEnter={e => { if (hasDetail) e.currentTarget.style.opacity = ".75"; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        title={hasDetail ? "Click to see score breakdown" : undefined}
      >
        {score}% match
        {hasDetail && <span style={{ fontSize: fz - 1, opacity: 0.6 }}>ⓘ</span>}
      </span>
      {open && (
        <ScoreModal score={score} reasons={reasons} gaps={gaps} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
