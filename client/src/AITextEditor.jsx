/**
 * AITextEditor.jsx — Floating AI text-editing toolbar for Vercentic
 * Appears when text is selected inside a wrapped editable element.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import api from "./apiClient.js";

const T = {
  ink:    "#0D0D0F",
  lav:    "#8B7EC8",
  rose:   "#C87E8B",
  sage:   "#7EC8B8",
  amber:  "#C8A87E",
  white:  "#FFFFFF",
  bg:     "#F8F7FF",
  border: "#E8E4F4",
  text2:  "#4A4A5A",
  text3:  "#8A8A9A",
  F:      "'Geist','Inter',sans-serif",
};

const ACTIONS = [
  { id:"improve",  label:"Improve",       icon:"M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    prompt:(t,c)=>`Improve the following ${c||""} text. Make it clearer, more professional and engaging. Return ONLY the improved text with no explanation:\n\n${t}` },
  { id:"shorten",  label:"Shorten",       icon:"M8 6h13M8 12h9M8 18h5",
    prompt:(t,c)=>`Make the following ${c||""} text more concise without losing key meaning. Return ONLY the shortened text:\n\n${t}` },
  { id:"expand",   label:"Expand",        icon:"M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
    prompt:(t,c)=>`Expand the following ${c||""} text with more detail and context. Return ONLY the expanded text:\n\n${t}` },
  { id:"tone",     label:"Tone",          icon:"M12 20V10M18 20V4M6 20v-4", isSub:true,
    sub:[
      {id:"professional", label:"Professional", color:T.lav},
      {id:"friendly",     label:"Friendly",     color:T.sage},
      {id:"formal",       label:"Formal",       color:T.text2},
      {id:"casual",       label:"Casual",       color:T.amber},
      {id:"persuasive",   label:"Persuasive",   color:T.rose},
      {id:"empathetic",   label:"Empathetic",   color:"#C8A8D8"},
    ],
    prompt:(t,c,sub)=>`Rewrite the following ${c||""} text in a ${sub} tone. Return ONLY the rewritten text:\n\n${t}` },
  { id:"translate", label:"Translate",    icon:"M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129", isSub:true,
    sub:[
      {id:"ar", label:"Arabic",     color:T.amber},
      {id:"fr", label:"French",     color:T.rose},
      {id:"de", label:"German",     color:T.text2},
      {id:"es", label:"Spanish",    color:T.lav},
      {id:"pt", label:"Portuguese", color:T.sage},
      {id:"zh", label:"Chinese",    color:"#8BB87E"},
    ],
    prompt:(t,_,sub)=>{
      const langs={ar:"Arabic",fr:"French",de:"German",es:"Spanish",pt:"Portuguese",zh:"Chinese (Simplified)"};
      return `Translate the following text to ${langs[sub]||sub}. Return ONLY the translated text:\n\n${t}`;
    }},
  { id:"fix",      label:"Fix grammar",   icon:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    prompt:(t)=>`Fix all grammar, spelling and punctuation errors in the following text. Return ONLY the corrected text:\n\n${t}` },
  { id:"bullets",  label:"Bullets",       icon:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    prompt:(t,c)=>`Convert the following ${c||""} text into clear, concise bullet points. Return ONLY the bullet points:\n\n${t}` },
  { id:"custom",   label:"Custom…",       icon:"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", isCustom:true,
    prompt:(t,c,instr)=>`${instr}\n\nApply this instruction to the following ${c||""} text. Return ONLY the result:\n\n${t}` },
];

const Ic = ({ path, size=13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}>
    <path d={path}/>
  </svg>
);

const Spark = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill={T.lav}>
    <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6L12 2z"/>
  </svg>
);

const Dots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center",marginLeft:4}}>
    {[0,1,2].map(i=>(
      <span key={i} style={{
        width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,.7)",
        display:"inline-block",
        animation:`vcDot .9s ease-in-out ${i*.2}s infinite`,
      }}/>
    ))}
    <style>{`@keyframes vcDot{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
  </span>
);

// ── Toolbar rendered into document.body via portal ─────────────────────────
function AIToolbar({ anchor, selectedText, context, onApply, onClose }) {
  const [phase, setPhase]       = useState("idle"); // idle|sub|custom|loading|result|error
  const [activeAct, setActiveAct] = useState(null);
  const [result, setResult]     = useState("");
  const [customTxt, setCustomTxt] = useState("");
  const [errMsg, setErrMsg]     = useState("");
  const ref                     = useRef(null);

  // ── Position: fixed, viewport-relative ────────────────────────────────
  // anchor = { x, y, width, height } in viewport coords
  const TOOLBAR_W = 520;
  const GAP       = 8;
  let left = anchor.x + anchor.width / 2 - TOOLBAR_W / 2;
  left     = Math.max(8, Math.min(window.innerWidth - TOOLBAR_W - 8, left));
  let top  = anchor.y - 44 - GAP;
  if (top < 8) top = anchor.y + anchor.height + GAP;

  // Close on outside mousedown
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    // slight delay so the click that opened this doesn't immediately close it
    const t = setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [onClose]);

  const run = useCallback(async (action, sub) => {
    setPhase("loading"); setActiveAct(action); setResult(""); setErrMsg("");
    const instr = action.isCustom ? customTxt : undefined;
    const prompt = action.prompt(selectedText, context, sub || instr);
    try {
      const data = await api.post("/ai/chat", {
        messages: [{ role:"user", content: prompt }],
        system: "You are a precise writing assistant. Return ONLY the rewritten text — no preamble, no explanation, no markdown, no surrounding quotes.",
      });
      const text = typeof data.content === "string"
        ? data.content
        : (data.content?.[0]?.text ?? "");
      if (!text) throw new Error("Empty response from AI");
      setResult(text.trim());
      setPhase("result");
    } catch(e) {
      setErrMsg(e.message || "Something went wrong");
      setPhase("error");
    }
  }, [selectedText, context, customTxt]);

  // ── Shared button styles ────────────────────────────────────────────────
  const actionBtn = (onClick, children, key) => (
    <button key={key} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{
        display:"flex",alignItems:"center",gap:5,padding:"5px 9px",
        borderRadius:7,border:"none",background:"transparent",
        color:"rgba(255,255,255,.65)",cursor:"pointer",
        fontSize:11,fontFamily:T.F,fontWeight:500,whiteSpace:"nowrap",
        transition:"background .1s,color .1s",
      }}
      onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,126,200,.22)";e.currentTarget.style.color=T.lav;}}
      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.65)";}}>
      {children}
    </button>
  );

  const wrapStyle = {
    position:"fixed", top, left, zIndex:99999,
    fontFamily:T.F,
    animation:"vcIn .12s ease-out",
  };

  // ── IDLE — main action bar ─────────────────────────────────────────────
  if (phase === "idle") return ReactDOM.createPortal(
    <div ref={ref} style={wrapStyle}>
      <style>{`@keyframes vcIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        display:"flex",alignItems:"center",gap:1,
        background:T.ink,borderRadius:11,padding:"5px 7px",
        boxShadow:"0 8px 30px rgba(0,0,0,.28),0 2px 8px rgba(0,0,0,.18)",
        overflowX:"auto", maxWidth:"100vw",
      }}>
        {/* Badge */}
        <div style={{
          display:"flex",alignItems:"center",gap:5,
          padding:"4px 9px",borderRadius:7,
          background:"rgba(139,126,200,.2)",marginRight:3,flexShrink:0,
        }}>
          <Spark/><span style={{fontSize:10,fontWeight:700,letterSpacing:".05em",color:T.lav}}>AI EDIT</span>
        </div>
        <div style={{width:1,height:18,background:"rgba(255,255,255,.12)",margin:"0 3px",flexShrink:0}}/>
        {ACTIONS.map(a => {
          if (a.isSub) return actionBtn(
            () => { setActiveAct(a); setPhase("sub"); },
            <><Ic path={a.icon}/><span>{a.label}</span><span style={{fontSize:9,opacity:.5,marginLeft:1}}>▾</span></>,
            a.id
          );
          if (a.isCustom) return actionBtn(
            () => setPhase("custom"),
            <><Ic path={a.icon}/><span>{a.label}</span></>,
            a.id
          );
          return actionBtn(
            () => run(a),
            <><Ic path={a.icon}/><span>{a.label}</span></>,
            a.id
          );
        })}
      </div>
    </div>, document.body
  );

  // ── SUB-MENU (Tone / Translate) ─────────────────────────────────────────
  if (phase === "sub" && activeAct?.isSub) return ReactDOM.createPortal(
    <div ref={ref} style={{...wrapStyle,minWidth:190}}>
      <div style={{background:T.white,borderRadius:12,padding:"8px 6px",
        boxShadow:"0 12px 40px rgba(0,0,0,.18)",border:`1.5px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px 10px",
          borderBottom:`1px solid ${T.border}`,marginBottom:4}}>
          <Spark/>
          <span style={{fontSize:12,fontWeight:700,color:T.text2}}>{activeAct.label}</span>
          <button onMouseDown={e=>{e.preventDefault();setPhase("idle");setActiveAct(null);}}
            style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",
              color:T.text3,fontSize:18,lineHeight:1,padding:"0 2px"}}>×</button>
        </div>
        {activeAct.sub.map(opt => (
          <button key={opt.id}
            onMouseDown={e=>{e.preventDefault();e.stopPropagation();run(activeAct,opt.id);}}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",
              padding:"8px 10px",borderRadius:8,border:"none",
              background:"transparent",cursor:"pointer",textAlign:"left"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.bg}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{width:9,height:9,borderRadius:"50%",background:opt.color,flexShrink:0}}/>
            <span style={{fontSize:13,fontWeight:500,color:T.ink,fontFamily:T.F}}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>, document.body
  );

  // ── CUSTOM PROMPT ──────────────────────────────────────────────────────
  if (phase === "custom") return ReactDOM.createPortal(
    <div ref={ref} style={{...wrapStyle,minWidth:300}}>
      <div style={{background:T.white,borderRadius:12,padding:12,
        boxShadow:"0 12px 40px rgba(0,0,0,.18)",border:`1.5px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
          <Spark/><span style={{fontSize:12,fontWeight:700,color:T.text2}}>Custom instruction</span>
          <button onMouseDown={e=>{e.preventDefault();setPhase("idle");}}
            style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:18}}>×</button>
        </div>
        <textarea autoFocus value={customTxt} onChange={e=>setCustomTxt(e.target.value)}
          placeholder={"e.g. \"Rewrite in Arabic\" or \"Make this more formal\""}
          onKeyDown={e=>{
            if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){
              e.preventDefault();
              const a=ACTIONS.find(x=>x.isCustom);
              if(a&&customTxt.trim()) run(a);
            }
          }}
          rows={3} style={{
            width:"100%",boxSizing:"border-box",padding:"8px 10px",
            borderRadius:8,border:`1.5px solid ${T.border}`,
            fontSize:12,fontFamily:T.F,resize:"none",
            color:T.ink,outline:"none",lineHeight:1.6,background:T.bg,
          }}/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8,gap:8}}>
          <button onMouseDown={e=>{e.preventDefault();setPhase("idle");}}
            style={{padding:"7px 14px",borderRadius:8,border:`1.5px solid ${T.border}`,
              background:"transparent",color:T.text2,fontSize:12,cursor:"pointer",fontFamily:T.F}}>
            Cancel
          </button>
          <button disabled={!customTxt.trim()}
            onMouseDown={e=>{
              e.preventDefault();
              const a=ACTIONS.find(x=>x.isCustom);
              if(a&&customTxt.trim()) run(a);
            }}
            style={{padding:"7px 16px",borderRadius:8,border:"none",
              background:customTxt.trim()?T.lav:"#e4e4e7",
              color:customTxt.trim()?T.white:"#a1a1aa",
              fontSize:12,fontWeight:700,
              cursor:customTxt.trim()?"pointer":"default",fontFamily:T.F}}>
            Apply ⌘↵
          </button>
        </div>
      </div>
    </div>, document.body
  );

  // ── LOADING ────────────────────────────────────────────────────────────
  if (phase === "loading") return ReactDOM.createPortal(
    <div ref={ref} style={wrapStyle}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",
        background:T.ink,borderRadius:11,
        boxShadow:"0 8px 30px rgba(0,0,0,.28)"}}>
        <Spark/>
        <span style={{fontSize:12,color:"rgba(255,255,255,.7)",fontFamily:T.F}}>
          {activeAct?.label || "Working"}…
        </span>
        <Dots/>
      </div>
    </div>, document.body
  );

  // ── RESULT ─────────────────────────────────────────────────────────────
  if (phase === "result") return ReactDOM.createPortal(
    <div ref={ref} style={{...wrapStyle,minWidth:320,maxWidth:500}}>
      <div style={{background:T.white,borderRadius:12,overflow:"hidden",
        boxShadow:"0 12px 40px rgba(0,0,0,.18)",border:`1.5px solid ${T.border}`}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 12px",
          borderBottom:`1px solid ${T.border}`,background:T.bg}}>
          <Spark/>
          <span style={{fontSize:11,fontWeight:700,color:T.lav,letterSpacing:".04em"}}>
            {activeAct?.label}
          </span>
          <button onMouseDown={e=>{e.preventDefault();setPhase("idle");setResult("");}}
            style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:18}}>×</button>
        </div>
        {/* Text */}
        <div style={{padding:"12px 14px",fontSize:13,lineHeight:1.65,color:T.ink,
          fontFamily:T.F,maxHeight:200,overflowY:"auto",whiteSpace:"pre-wrap"}}>
          {result}
        </div>
        {/* Actions */}
        <div style={{display:"flex",gap:8,padding:"10px 12px",
          borderTop:`1px solid ${T.border}`,background:T.bg}}>
          <button
            onMouseDown={e=>{e.preventDefault();onApply(result);onClose();}}
            style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",
              background:T.lav,color:T.white,fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:T.F,
              display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            ✓ Replace selection
          </button>
          <button
            onMouseDown={e=>{e.preventDefault();navigator.clipboard?.writeText(result);}}
            style={{padding:"8px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,
              background:T.white,color:T.text2,fontSize:12,fontWeight:600,
              cursor:"pointer",fontFamily:T.F}}>
            Copy
          </button>
          <button
            onMouseDown={e=>{e.preventDefault();setPhase("idle");setResult("");}}
            title="Try again"
            style={{padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.border}`,
              background:T.white,color:T.text2,fontSize:12,cursor:"pointer"}}>↩
          </button>
        </div>
      </div>
    </div>, document.body
  );

  // ── ERROR ──────────────────────────────────────────────────────────────
  return ReactDOM.createPortal(
    <div ref={ref} style={wrapStyle}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
        background:"#FFF5F5",borderRadius:11,border:"1.5px solid #FCA5A5",
        boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
        <span>⚠️</span>
        <span style={{fontSize:12,color:"#B91C1C",fontFamily:T.F}}>{errMsg}</span>
        <button onMouseDown={e=>{e.preventDefault();setPhase("idle");}}
          style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#B91C1C",fontSize:18}}>×</button>
      </div>
    </div>, document.body
  );
}

// ── Main wrapper component ─────────────────────────────────────────────────
export default function AITextEditor({ children, context="", onApply, disabled=false }) {
  const [toolbar, setToolbar]     = useState(null); // null | { anchor, text }
  const wrapperRef                = useRef(null);
  const debounce                  = useRef(null);
  const activeTA                  = useRef(null); // { el, start, end } for textarea replace

  // ── Textarea selection (mouseup / keyup on the element) ───────────────
  const onTextareaEvent = useCallback((e) => {
    if (disabled) return;
    const el = e.target;
    if (!el || el.tagName !== "TEXTAREA") return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const start = el.selectionStart ?? 0;
      const end   = el.selectionEnd   ?? 0;
      if (end - start < 3) { setToolbar(null); return; }
      const text = el.value.slice(start, end).trim();
      if (!text) { setToolbar(null); return; }
      const r = el.getBoundingClientRect();
      activeTA.current = { el, start, end };
      // anchor = viewport rect of the element (toolbar appears above it)
      setToolbar({ anchor: { x:r.left, y:r.top, width:r.width, height:r.height }, text });
    }, 150);
  }, [disabled]);

  // ── contentEditable selection (selectionchange event) ─────────────────
  const onSelChange = useCallback(() => {
    if (disabled) return;
    // If a textarea is active, its handler takes over
    if (document.activeElement?.tagName === "TEXTAREA") return;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbar(null); return; }
      const text = sel.toString().trim();
      if (text.length < 3) { setToolbar(null); return; }
      const range = sel.getRangeAt(0);
      if (!wrapperRef.current?.contains(range.commonAncestorContainer)) {
        setToolbar(null); return;
      }
      const r = range.getBoundingClientRect();
      activeTA.current = null;
      setToolbar({ anchor: { x:r.left, y:r.top, width:r.width, height:r.height }, text });
    }, 200);
  }, [disabled]);

  useEffect(() => {
    const w = wrapperRef.current;
    if (!w) return;
    w.addEventListener("mouseup", onTextareaEvent);
    w.addEventListener("keyup",   onTextareaEvent);
    document.addEventListener("selectionchange", onSelChange);
    return () => {
      w.removeEventListener("mouseup", onTextareaEvent);
      w.removeEventListener("keyup",   onTextareaEvent);
      document.removeEventListener("selectionchange", onSelChange);
      clearTimeout(debounce.current);
    };
  }, [onTextareaEvent, onSelChange]);

  // ── Apply result back into the field ──────────────────────────────────
  const handleApply = useCallback((newText) => {
    const ta = activeTA.current;
    if (ta) {
      // Textarea: use native value setter to trigger React's synthetic onChange
      const { el, start, end } = ta;
      const next = el.value.slice(0, start) + newText + el.value.slice(end);
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      if (setter) {
        setter.call(el, next);
        el.dispatchEvent(new Event("input", { bubbles:true }));
      }
      el.selectionStart = el.selectionEnd = start + newText.length;
      el.focus();
      activeTA.current = null;
      onApply?.(next);
      return;
    }
    // contentEditable: splice via DOM Selection
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      sel.removeAllRanges();
    }
    onApply?.(newText);
  }, [onApply]);

  return (
    <div ref={wrapperRef} style={{ position:"relative" }}>
      {children}
      {toolbar && !disabled && (
        <AIToolbar
          anchor={toolbar.anchor}
          selectedText={toolbar.text}
          context={context}
          onApply={handleApply}
          onClose={() => { setToolbar(null); activeTA.current = null; }}
        />
      )}
    </div>
  );
}
