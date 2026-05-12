/**
 * AITextEditor.jsx — Floating AI text-editing toolbar for Vercentic
 * Appears automatically when text is selected inside a wrapped editable element.
 *
 * USAGE:
 *   import AITextEditor from "./AITextEditor";
 *   <AITextEditor context="email body">
 *     <textarea value={body} onChange={...} />
 *   </AITextEditor>
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";

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
  { id:"improve",    label:"Improve",       icon:"M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    prompt:(t,c)=>`Improve the following ${c||""} text. Make it clearer, more professional and engaging. Return ONLY the improved text:\n\n${t}` },
  { id:"shorten",    label:"Shorten",       icon:"M8 6h13M8 12h9M8 18h5",
    prompt:(t,c)=>`Make the following ${c||""} text more concise. Return ONLY the shortened text:\n\n${t}` },
  { id:"expand",     label:"Expand",        icon:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7",
    prompt:(t,c)=>`Expand the following ${c||""} text with more detail. Return ONLY the expanded text:\n\n${t}` },
  { id:"tone", label:"Tone", icon:"M12 20V10M18 20V4M6 20v-4", isSub:true,
    sub:[
      {id:"professional",label:"Professional",color:T.lav},
      {id:"friendly",label:"Friendly",color:T.sage},
      {id:"formal",label:"Formal",color:T.text2},
      {id:"casual",label:"Casual",color:T.amber},
      {id:"persuasive",label:"Persuasive",color:T.rose},
      {id:"empathetic",label:"Empathetic",color:"#C8A8D8"},
    ],
    prompt:(t,c,sub)=>`Rewrite the following ${c||""} text in a ${sub} tone. Return ONLY the rewritten text:\n\n${t}` },
  { id:"translate", label:"Translate", icon:"M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129", isSub:true,
    sub:[
      {id:"ar",label:"Arabic",color:T.amber},
      {id:"fr",label:"French",color:T.rose},
      {id:"de",label:"German",color:T.text2},
      {id:"es",label:"Spanish",color:T.lav},
      {id:"pt",label:"Portuguese",color:T.sage},
      {id:"zh",label:"Chinese",color:"#C8D87E"},
    ],
    prompt:(t,_,sub)=>{
      const langs={ar:"Arabic",fr:"French",de:"German",es:"Spanish",pt:"Portuguese",zh:"Chinese (Simplified)"};
      return `Translate the following text to ${langs[sub]||sub}. Return ONLY the translated text:\n\n${t}`;
    }},
  { id:"fix",        label:"Fix grammar",   icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    prompt:(t)=>`Fix all grammar, spelling and punctuation in the following text. Return ONLY the corrected text:\n\n${t}` },
  { id:"bullets",    label:"Bullet points", icon:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    prompt:(t,c)=>`Convert the following ${c||""} text into clear bullet points. Return ONLY the bullet points:\n\n${t}` },
  { id:"custom", label:"Custom…", icon:"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", isCustom:true,
    prompt:(t,c,instr)=>`${instr}\n\nApply this to the following ${c||""} text. Return ONLY the result:\n\n${t}` },
];

const Ic = ({ path, size=14, color="currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    <path d={path}/>
  </svg>
);

const SparkMark = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill={T.lav} opacity={0.9}/>
  </svg>
);

const Dots = () => (
  <span style={{display:"inline-flex",gap:3,alignItems:"center"}}>
    {[0,1,2].map(i=>(
      <span key={i} style={{width:4,height:4,borderRadius:"50%",background:T.lav,display:"inline-block",
        animation:`vcBounce 0.9s ease-in-out ${i*0.15}s infinite`}}/>
    ))}
    <style>{`@keyframes vcBounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}`}</style>
  </span>
);

function AIToolbar({ rect, selectedText, context, onApply, onClose }) {
  const [state, setState]         = useState("idle");
  const [activeAction, setActiveAction] = useState(null);
  const [result, setResult]       = useState("");
  const [customText, setCustomText] = useState("");
  const [error, setError]         = useState("");
  const [pos, setPos]             = useState({top:0,left:0});
  const panelRef                  = useRef(null);

  useEffect(() => {
    const GAP=10, W=300;
    let left = rect.left + rect.width/2 - W/2;
    let top  = rect.top - 50 - GAP + window.scrollY;
    left = Math.max(8, Math.min(window.innerWidth - W - 8, left));
    if (top < 8 + window.scrollY) top = rect.bottom + GAP + window.scrollY;
    setPos({top,left});
  },[rect]);

  useEffect(()=>{
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[onClose]);

  const run = useCallback(async (action, sub) => {
    setState("loading"); setActiveAction(action); setResult(""); setError("");
    const instr = action.isCustom ? customText : undefined;
    const prompt = action.prompt(selectedText, context, sub||instr);
    try {
      const res = await fetch("/api/ai/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ messages:[{role:"user",content:prompt}],
          system:"You are a precise writing assistant. Return ONLY the requested text — no preamble, no explanation." })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const text = typeof data.content==="string" ? data.content : (data.content?.[0]?.text??"");
      setResult(text.trim()); setState("result");
    } catch(err) { setError(err.message||"Error"); setState("error"); }
  },[selectedText,context,customText]);

  const BtnBase = ({onClick,children,title,active}) => (
    <button onClick={onClick} title={title}
      style={{display:"flex",alignItems:"center",gap:5,padding:"5px 9px",borderRadius:7,border:"none",
        background:active?"rgba(139,126,200,0.22)":"transparent",
        color:active?T.lav:"rgba(255,255,255,0.6)",cursor:"pointer",fontSize:11,fontFamily:T.F,
        fontWeight:500,whiteSpace:"nowrap",transition:"all .12s"}}
      onMouseEnter={e=>{e.currentTarget.style.background="rgba(139,126,200,0.18)";e.currentTarget.style.color=T.lav;}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?"rgba(139,126,200,0.22)":"transparent";e.currentTarget.style.color=active?T.lav:"rgba(255,255,255,0.6)";}}>
      {children}
    </button>
  );

  // Idle toolbar
  if (state==="idle") return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      animation:"vcFade .12s ease-out"}}>
      <style>{`@keyframes vcFade{from{opacity:0;transform:translateY(4px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:2,padding:"6px 8px",
        background:T.ink,borderRadius:12,
        boxShadow:"0 8px 32px rgba(13,13,15,.22),0 2px 8px rgba(13,13,15,.14)",flexWrap:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px 4px 8px",
          borderRadius:8,background:"rgba(139,126,200,.18)",marginRight:4,cursor:"default"}}>
          <SparkMark size={12}/>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.05em",color:T.lav,fontFamily:T.F,whiteSpace:"nowrap"}}>AI EDIT</span>
        </div>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.1)",margin:"0 2px"}}/>
        {ACTIONS.map(a => {
          if (a.isSub) return (
            <BtnBase key={a.id} onClick={()=>{setActiveAction(a);setState("sub");}} title={a.label}>
              <Ic path={a.icon} size={13}/><span>{a.label}</span>
              <span style={{fontSize:9,opacity:.5}}>▾</span>
            </BtnBase>
          );
          if (a.isCustom) return (
            <BtnBase key={a.id} onClick={()=>setState("custom")} title={a.label}>
              <Ic path={a.icon} size={13}/>
            </BtnBase>
          );
          return (
            <BtnBase key={a.id} onClick={()=>run(a)} title={a.label}>
              <Ic path={a.icon} size={13}/><span>{a.label}</span>
            </BtnBase>
          );
        })}
      </div>
    </div>, document.body
  );

  // Sub-menu (tone / translate)
  if (state==="sub" && activeAction?.isSub) return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      background:T.white,borderRadius:14,boxShadow:"0 12px 40px rgba(13,13,15,.18),0 2px 8px rgba(13,13,15,.08)",
      border:`1.5px solid ${T.border}`,padding:"10px 8px",minWidth:200,
      animation:"vcFade .12s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"2px 8px 10px",
        borderBottom:`1px solid ${T.border}`,marginBottom:6}}>
        <SparkMark size={13}/>
        <span style={{fontSize:11,fontWeight:700,color:T.text2,fontFamily:T.F}}>{activeAction.label}</span>
        <button onClick={()=>{setActiveAction(null);setState("idle");}}
          style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:16,lineHeight:1}}>×</button>
      </div>
      {activeAction.sub.map(opt=>(
        <button key={opt.id} onClick={()=>run(activeAction,opt.id)}
          style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 10px",
            borderRadius:8,border:"none",background:"transparent",cursor:"pointer",fontFamily:T.F,textAlign:"left"}}
          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <span style={{width:8,height:8,borderRadius:"50%",background:opt.color,flexShrink:0}}/>
          <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{opt.label}</span>
        </button>
      ))}
    </div>, document.body
  );

  // Custom prompt
  if (state==="custom") return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      background:T.white,borderRadius:14,boxShadow:"0 12px 40px rgba(13,13,15,.18)",
      border:`1.5px solid ${T.border}`,padding:12,minWidth:300,animation:"vcFade .12s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        <SparkMark size={13}/>
        <span style={{fontSize:12,fontWeight:700,color:T.text2,fontFamily:T.F}}>Custom instruction</span>
        <button onClick={()=>setState("idle")}
          style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:16}}>×</button>
      </div>
      <textarea autoFocus value={customText} onChange={e=>setCustomText(e.target.value)}
        placeholder={"Tell Vercentic what to do with the selected text…\ne.g. \"Make this sound more urgent\" or \"Translate to formal Arabic\""}
        onKeyDown={e=>{if(e.key==="Enter"&&(e.metaKey||e.ctrlKey)){e.preventDefault();const a=ACTIONS.find(x=>x.isCustom);if(a&&customText.trim())run(a);}}}
        rows={3} style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",borderRadius:8,
          border:`1.5px solid ${T.border}`,fontSize:12,fontFamily:T.F,resize:"none",
          color:T.ink,outline:"none",lineHeight:1.6,background:T.bg}}/>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
        <button disabled={!customText.trim()}
          onClick={()=>{const a=ACTIONS.find(x=>x.isCustom);if(a)run(a);}}
          style={{padding:"7px 16px",borderRadius:8,border:"none",
            background:customText.trim()?T.lav:T.border,
            color:customText.trim()?T.white:T.text3,
            fontSize:12,fontWeight:700,cursor:customText.trim()?"pointer":"default",fontFamily:T.F}}>
          Apply ⌘↵
        </button>
      </div>
    </div>, document.body
  );

  // Loading
  if (state==="loading") return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
      background:T.ink,borderRadius:12,boxShadow:"0 8px 32px rgba(13,13,15,.22)"}}>
      <SparkMark size={14}/>
      <span style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:T.F}}>{activeAction?.label||"Working"}…</span>
      <Dots/>
    </div>, document.body
  );

  // Result
  if (state==="result") return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      background:T.white,borderRadius:14,
      boxShadow:"0 12px 40px rgba(13,13,15,.18),0 2px 8px rgba(13,13,15,.08)",
      border:`1.5px solid ${T.border}`,overflow:"hidden",minWidth:320,maxWidth:460,
      animation:"vcFade .12s ease-out"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"10px 12px",
        borderBottom:`1px solid ${T.border}`,background:T.bg}}>
        <SparkMark size={13}/>
        <span style={{fontSize:11,fontWeight:700,color:T.lav,fontFamily:T.F,letterSpacing:"0.04em"}}>
          {activeAction?.label||"Result"}
        </span>
        <button onClick={()=>{setState("idle");setResult("");}}
          style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.text3,fontSize:16}}>×</button>
      </div>
      <div style={{padding:"12px 14px",fontSize:13,lineHeight:1.65,color:T.ink,fontFamily:T.F,
        maxHeight:200,overflowY:"auto",whiteSpace:"pre-wrap"}}>{result}</div>
      <div style={{display:"flex",gap:8,padding:"10px 12px",borderTop:`1px solid ${T.border}`,background:T.bg}}>
        <button onClick={()=>{onApply(result);onClose();}}
          style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:T.lav,color:T.white,
            fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:T.F,
            display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic path="M5 13l4 4L19 7" size={13} color={T.white}/>
          Replace selection
        </button>
        <button onClick={()=>navigator.clipboard?.writeText(result)}
          style={{padding:"8px 12px",borderRadius:8,border:`1.5px solid ${T.border}`,
            background:T.white,color:T.text2,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:T.F,
            display:"flex",alignItems:"center",gap:5}}>
          <Ic path="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" size={13}/>
          Copy
        </button>
        <button onClick={()=>setState("idle")} title="Try again"
          style={{padding:"8px 10px",borderRadius:8,border:`1.5px solid ${T.border}`,
            background:T.white,color:T.text2,fontSize:12,cursor:"pointer"}}>↩</button>
      </div>
    </div>, document.body
  );

  // Error
  return ReactDOM.createPortal(
    <div ref={panelRef} style={{position:"absolute",top:pos.top,left:pos.left,zIndex:9999,
      display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
      background:"#FFF5F5",borderRadius:12,border:"1.5px solid #FCA5A5",
      boxShadow:"0 4px 16px rgba(0,0,0,.08)"}}>
      <span style={{fontSize:13}}>⚠</span>
      <span style={{fontSize:12,color:"#B91C1C",fontFamily:T.F}}>{error}</span>
      <button onClick={()=>setState("idle")}
        style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#B91C1C",fontSize:16}}>×</button>
    </div>, document.body
  );
}

// ─── Main wrapper ─────────────────────────────────────────────────────────────
export default function AITextEditor({ children, context="", onApply, disabled=false }) {
  const [toolbar, setToolbar] = useState(null);
  const wrapperRef            = useRef(null);
  const timer                 = useRef(null);
  // Track the last active textarea so onApply can replace its text
  const activeTextareaRef     = useRef(null);

  // Handle textarea/input elements — window.getSelection() doesn't work for them
  const handleTextareaSelect = useCallback((e) => {
    if (disabled) return;
    const el = e.target;
    if (!el || (el.tagName !== "TEXTAREA" && el.tagName !== "INPUT")) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      if (end <= start + 2) { setToolbar(null); return; }
      const text = el.value.slice(start, end).trim();
      if (text.length < 3) { setToolbar(null); return; }
      // Build a rect from the textarea's bounding box — we can't get exact glyph rect
      // so we use the element rect as anchor (toolbar appears above the textarea)
      const rect = el.getBoundingClientRect();
      activeTextareaRef.current = { el, start, end };
      setToolbar({ rect, text });
    }, 150);
  }, [disabled]);

  // Handle contentEditable (RichTextEditor) — uses window.getSelection()
  const onSel = useCallback(() => {
    if (disabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbar(null); return; }
      const text = sel.toString().trim();
      if (text.length < 3) { setToolbar(null); return; }
      const range = sel.getRangeAt(0);
      const ancestor = range.commonAncestorContainer;
      if (!wrapperRef.current?.contains(ancestor)) { setToolbar(null); return; }
      // Don't fire if focus is on a textarea (handled by handleTextareaSelect)
      if (document.activeElement?.tagName === "TEXTAREA") return;
      activeTextareaRef.current = null;
      setToolbar({ rect: range.getBoundingClientRect(), text });
    }, 220);
  }, [disabled]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Listen on the wrapper for textarea mouseup (works even inside portals)
    wrapper.addEventListener("mouseup", handleTextareaSelect);
    wrapper.addEventListener("keyup",   handleTextareaSelect);
    document.addEventListener("selectionchange", onSel);
    return () => {
      wrapper.removeEventListener("mouseup", handleTextareaSelect);
      wrapper.removeEventListener("keyup",   handleTextareaSelect);
      document.removeEventListener("selectionchange", onSel);
      clearTimeout(timer.current);
    };
  }, [onSel, handleTextareaSelect]);

  const handleApply = useCallback((newText) => {
    // Textarea case — replace using selectionStart/End
    const ta = activeTextareaRef.current;
    if (ta) {
      const { el, start, end } = ta;
      const before = el.value.slice(0, start);
      const after  = el.value.slice(end);
      const next   = before + newText + after;
      // Trigger React's onChange by setting the native value and dispatching input event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, next);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // Restore cursor after the inserted text
      el.selectionStart = el.selectionEnd = start + newText.length;
      activeTextareaRef.current = null;
      onApply?.(next);
      return;
    }
    // contentEditable case — use DOM Selection
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      sel.removeAllRanges();
    }
    onApply?.(newText);
  }, [onApply]);

  return (
    <div ref={wrapperRef} style={{position:"relative"}}>
      {children}
      {toolbar && !disabled && (
        <AIToolbar rect={toolbar.rect} selectedText={toolbar.text}
          context={context} onApply={handleApply} onClose={()=>setToolbar(null)}/>
      )}
    </div>
  );
}
