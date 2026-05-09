/**
 * RichTextEditor.jsx
 * Lightweight WYSIWYG editor — no external dependencies.
 * Uses contentEditable + execCommand for formatting.
 * Stores and emits HTML strings.
 */

import { useRef, useEffect, useCallback, useState } from "react";

/* ─── Toolbar button definitions ─────────────────────────────────────────── */
const FORMATS = [
  { cmd:"bold",            icon:"B",         title:"Bold (⌘B)",      style:{fontWeight:800} },
  { cmd:"italic",          icon:"I",         title:"Italic (⌘I)",    style:{fontStyle:"italic"} },
  { cmd:"underline",       icon:"U",         title:"Underline (⌘U)", style:{textDecoration:"underline"} },
  { cmd:"strikeThrough",   icon:"S̶",         title:"Strikethrough" },
  null, // divider
  { cmd:"insertUnorderedList", icon:"•≡",    title:"Bullet list" },
  { cmd:"insertOrderedList",   icon:"1≡",    title:"Numbered list" },
  null, // divider
  { cmd:"justifyLeft",     icon:"⬛⬛⬛\n■□□\n■□□", title:"Align left",   svgPath:"M3 6h18M3 12h12M3 18h15" },
  { cmd:"justifyCenter",   icon:"center",   title:"Align centre",   svgPath:"M3 6h18M6 12h12M4.5 18h15" },
  null,
  { cmd:"_link",           icon:"link",     title:"Insert / edit link", svgPath:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { cmd:"_unlink",         icon:"unlink",   title:"Remove link",        svgPath:"M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.004 5.004 0 0 0-7.07.12l-1.71 1.72M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.004 5.004 0 0 0 7.07-.12l1.71-1.71M8 8l8 8" },
  null,
  { cmd:"_h1",             icon:"H1",       title:"Heading 1" },
  { cmd:"_h2",             icon:"H2",       title:"Heading 2" },
  null,
  { cmd:"_image",          icon:"image",    title:"Insert image from URL",  svgPath:"M21 15l-5-5L5 21M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 2l3 3-3 3M19 5H9" },
  { cmd:"_video",          icon:"video",    title:"Embed YouTube / Vimeo",  svgPath:"M22.54 6.42A2.78 2.78 0 0 0 20.6 4.46C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
  { cmd:"_divider",        icon:"hr",       title:"Insert horizontal divider", svgPath:"M3 12h18" },
  { cmd:"_color",          icon:"A",        title:"Text colour",  isColor:true },
  null,
  { cmd:"removeFormat",    icon:"Tx",       title:"Clear formatting" },
];

/* ─── Tiny SVG icon ───────────────────────────────────────────────────────── */
const SvgIcon = ({ path, size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
);

/* ─── Toolbar button ──────────────────────────────────────────────────────── */
const Btn = ({ fmt, active, onAction, currentColor }) => {
  const isActive = active;
  return (
    <button
      title={fmt.title}
      onMouseDown={e => { e.preventDefault(); onAction(fmt.cmd); }}
      style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:28, height:28, borderRadius:5, border:"none", cursor:"pointer",
        fontFamily:"ui-serif,serif",
        fontSize: fmt.svgPath ? 11 : (fmt.cmd.startsWith("_h") ? 11 : 12),
        fontWeight: fmt.cmd==="bold" ? 800 : 600,
        background: isActive ? "#e0e7ff" : "transparent",
        color: isActive ? "#3b5bdb" : "#374151",
        transition:"background .1s",
        padding: 0,
        lineHeight:1,
        flexShrink:0,
      }}
      onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="#f3f4f6"; }}
      onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}
    >
      {fmt.svgPath
        ? <SvgIcon path={fmt.svgPath}/>
        : fmt.isColor
        ? <span style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
            <span style={{fontSize:13,fontWeight:800,color:"#111"}}>A</span>
            <span style={{width:14,height:3,borderRadius:1,background:currentColor||"#e03131"}}/>
          </span>
        : fmt.icon}
    </button>
  );
};

/* ─── Link modal ──────────────────────────────────────────────────────────── */
const LinkModal = ({ position, onConfirm, onClose, initialUrl="" }) => {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(), 50); }, []);
  return (
    <div style={{ position:"fixed", top:position.y, left:position.x, zIndex:9999,
      background:"white", border:"1px solid #e5e7eb", borderRadius:10,
      boxShadow:"0 8px 24px rgba(0,0,0,0.12)", padding:"12px 14px", width:280,
      fontFamily:"'Geist',-apple-system,sans-serif" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:6 }}>Insert link</div>
      <input ref={inputRef} value={url} onChange={e=>setUrl(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();onConfirm(url);} if(e.key==="Escape") onClose(); }}
        placeholder="https://example.com"
        style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px", borderRadius:7,
          border:"1.5px solid #d1d5db", fontSize:13, fontFamily:"inherit",
          outline:"none", marginBottom:8 }}/>
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
        <button onClick={onClose}
          style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e5e7eb",
            background:"transparent", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Cancel
        </button>
        <button onClick={()=>onConfirm(url)}
          style={{ padding:"5px 12px", borderRadius:7, border:"none",
            background:"#3b5bdb", color:"white", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Insert
        </button>
      </div>
    </div>
  );
};


/* ─── Image modal ────────────────────────────────────────────────────────── */
const ImageModal = ({ position, onConfirm, onClose }) => {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const inputRef = useRef(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(), 50); }, []);
  const inp = { width:"100%", boxSizing:"border-box", padding:"7px 10px", borderRadius:7, border:"1.5px solid #d1d5db", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:8 };
  return (
    <div style={{ position:"fixed", top:position.y, left:position.x, zIndex:9999, background:"white", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", padding:"12px 14px", width:300, fontFamily:"'Geist',-apple-system,sans-serif" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8 }}>Insert image</div>
      <input ref={inputRef} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={inp}
        onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();onConfirm(url,alt);} if(e.key==="Escape") onClose(); }}/>
      <input value={alt} onChange={e=>setAlt(e.target.value)} placeholder="Alt text (optional)" style={{...inp,marginBottom:10}}
        onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();onConfirm(url,alt);} if(e.key==="Escape") onClose(); }}/>
      {url && <div style={{marginBottom:10,borderRadius:6,overflow:"hidden",maxHeight:80,display:"flex",justifyContent:"center",background:"#f9fafb"}}><img src={url} alt={alt} style={{maxHeight:80,maxWidth:"100%",objectFit:"contain"}} onError={e=>e.target.style.display="none"}/></div>}
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e5e7eb", background:"transparent", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
        <button onClick={()=>onConfirm(url,alt)} disabled={!url} style={{ padding:"5px 12px", borderRadius:7, border:"none", background:url?"#3b5bdb":"#e5e7eb", color:url?"white":"#9ca3af", fontSize:12, fontWeight:700, cursor:url?"pointer":"default", fontFamily:"inherit" }}>Insert</button>
      </div>
    </div>
  );
};

/* ─── Video modal ────────────────────────────────────────────────────────── */
const VideoModal = ({ position, onConfirm, onClose }) => {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(), 50); }, []);
  const getEmbedUrl = (raw) => {
    if (!raw) return null;
    const ytMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimMatch = raw.match(/vimeo\.com\/(\d+)/);
    if (vimMatch) return `https://player.vimeo.com/video/${vimMatch[1]}`;
    if (raw.includes("embed")) return raw;
    return null;
  };
  const embedUrl = getEmbedUrl(url);
  return (
    <div style={{ position:"fixed", top:position.y, left:position.x, zIndex:9999, background:"white", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", padding:"12px 14px", width:320, fontFamily:"'Geist',-apple-system,sans-serif" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:4 }}>Embed video</div>
      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:8 }}>YouTube or Vimeo URL</div>
      <input ref={inputRef} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width:"100%", boxSizing:"border-box", padding:"7px 10px", borderRadius:7, border:"1.5px solid #d1d5db", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:8 }}
        onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();if(embedUrl)onConfirm(embedUrl);} if(e.key==="Escape") onClose(); }}/>
      {!embedUrl && url && <div style={{fontSize:11,color:"#ef4444",marginBottom:8}}>Not a recognised YouTube or Vimeo URL</div>}
      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"5px 12px", borderRadius:7, border:"1px solid #e5e7eb", background:"transparent", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
        <button onClick={()=>embedUrl&&onConfirm(embedUrl)} disabled={!embedUrl} style={{ padding:"5px 12px", borderRadius:7, border:"none", background:embedUrl?"#3b5bdb":"#e5e7eb", color:embedUrl?"white":"#9ca3af", fontSize:12, fontWeight:700, cursor:embedUrl?"pointer":"default", fontFamily:"inherit" }}>Embed</button>
      </div>
    </div>
  );
};

/* ─── Colour picker ──────────────────────────────────────────────────────── */
const TEXT_COLORS = ["#111827","#e03131","#e67700","#2f9e44","#1971c2","#7048e8","#a61e4d","#495057","#868e96"];
const ColorPicker = ({ position, currentColor, onConfirm, onClose }) => (
  <div style={{ position:"fixed", top:position.y, left:position.x, zIndex:9999, background:"white", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", padding:"10px 12px", fontFamily:"'Geist',-apple-system,sans-serif" }}>
    <div style={{ fontSize:11, fontWeight:700, color:"#9ca3af", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>Text colour</div>
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", maxWidth:180 }}>
      {TEXT_COLORS.map(c=>(
        <button key={c} onMouseDown={e=>{e.preventDefault();onConfirm(c);}}
          style={{ width:22, height:22, borderRadius:"50%", background:c, border:currentColor===c?"3px solid #3b5bdb":"2px solid #e5e7eb", cursor:"pointer", flexShrink:0, padding:0 }}/>
      ))}
    </div>
    <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:11,color:"#6b7280"}}>Custom:</span>
      <input type="color" defaultValue={currentColor||"#111827"} onChange={e=>onConfirm(e.target.value)}
        style={{width:32,height:22,padding:0,border:"1px solid #e5e7eb",borderRadius:4,cursor:"pointer"}}/>
    </div>
  </div>
);

/* ─── Main editor component ──────────────────────────────────────────────── */
export default function RichTextEditor({ value, onChange, placeholder, autoFocus, minHeight=120 }) {
  const editorRef  = useRef(null);
  const savedSel   = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [linkModal,  setLinkModal]  = useState(null);
  const [imageModal, setImageModal] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [colorPicker,setColorPicker]= useState(null);
  const [currentColor, setCurrentColor] = useState("#111827");

  /* Sync external value on mount only */
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line

  /* Auto-focus */
  useEffect(() => {
    if (autoFocus) setTimeout(()=>editorRef.current?.focus(), 50);
  }, [autoFocus]);

  /* Track active formats for toolbar state */
  const updateActiveFormats = useCallback(() => {
    const f = {};
    ["bold","italic","underline","strikeThrough",
     "insertUnorderedList","insertOrderedList",
     "justifyLeft","justifyCenter"].forEach(cmd => {
      try { f[cmd] = document.queryCommandState(cmd); } catch {}
    });
    setActiveFormats(f);
  }, []);

  /* Save selection before toolbar button click (mousedown) */
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSel.current = sel.getRangeAt(0).cloneRange();
  }, []);

  /* Restore selection after toolbar button click */
  const restoreSelection = useCallback(() => {
    if (!savedSel.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSel.current);
  }, []);

  /* Execute a format command */
  const execCmd = useCallback((cmd) => {
    editorRef.current?.focus();

    if (cmd === "_link") {
      // Get existing link href if cursor is inside one
      const sel = window.getSelection();
      const anchor = sel?.anchorNode?.parentElement?.closest("a");
      const rect = editorRef.current?.getBoundingClientRect() || { x:200, y:200 };
      saveSelection();
      setLinkModal({ x: rect.left + 8, y: rect.bottom + 8, initialUrl: anchor?.href || "" });
      return;
    }

    if (cmd === "_unlink") {
      restoreSelection();
      document.execCommand("unlink", false, null);
      onChange(editorRef.current?.innerHTML || "");
      return;
    }

    if (cmd === "_h1" || cmd === "_h2") {
      const tag = cmd === "_h1" ? "H1" : "H2";
      restoreSelection();
      const sel = window.getSelection();
      if (sel?.anchorNode) {
        const block = sel.anchorNode.nodeType === 1
          ? sel.anchorNode
          : sel.anchorNode.parentElement;
        if (block?.tagName === tag) {
          document.execCommand("formatBlock", false, "P");
        } else {
          document.execCommand("formatBlock", false, tag);
        }
      }
      onChange(editorRef.current?.innerHTML || "");
      return;
    }

    if (cmd === "_image") {
      const rect = editorRef.current?.getBoundingClientRect() || { left:200, bottom:200 };
      saveSelection();
      setImageModal({ x: rect.left + 8, y: rect.bottom + 8 });
      return;
    }

    if (cmd === "_video") {
      const rect = editorRef.current?.getBoundingClientRect() || { left:200, bottom:200 };
      saveSelection();
      setVideoModal({ x: rect.left + 8, y: rect.bottom + 8 });
      return;
    }

    if (cmd === "_divider") {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, '<hr style="border:none;border-top:2px solid #e5e7eb;margin:12px 0;"><p><br></p>');
      onChange(editorRef.current?.innerHTML || "");
      return;
    }

    if (cmd === "_color") {
      const rect = editorRef.current?.getBoundingClientRect() || { left:200, bottom:200 };
      saveSelection();
      setColorPicker({ x: rect.left + 8, y: rect.bottom + 8 });
      return;
    }

    restoreSelection();
    document.execCommand(cmd, false, null);
    onChange(editorRef.current?.innerHTML || "");
    updateActiveFormats();
  }, [onChange, saveSelection, restoreSelection, updateActiveFormats]);

  /* Confirm link insert */
  const handleLinkConfirm = useCallback((url) => {
    setLinkModal(null);
    restoreSelection();
    editorRef.current?.focus();
    if (url) {
      const href = url.startsWith("http") ? url : `https://${url}`;
      document.execCommand("createLink", false, href);
      // Make link open in new tab
      const sel = window.getSelection();
      if (sel?.anchorNode) {
        const a = sel.anchorNode.parentElement?.closest("a");
        if (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      }
    }
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleImageConfirm = useCallback((url, alt) => {
    setImageModal(null);
    if (!url) return;
    restoreSelection();
    editorRef.current?.focus();
    const src = url.startsWith("http") ? url : `https://${url}`;
    document.execCommand("insertHTML", false,
      `<img src="${src}" alt="${alt||''}" style="max-width:100%;border-radius:6px;margin:4px 0;" />`);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleVideoConfirm = useCallback((embedUrl) => {
    setVideoModal(null);
    if (!embedUrl) return;
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("insertHTML", false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:8px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy"></iframe></div><p><br></p>`);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleColorConfirm = useCallback((color) => {
    setColorPicker(null);
    setCurrentColor(color);
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("foreColor", false, color);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleInput = useCallback(() => {
    onChange(editorRef.current?.innerHTML || "");
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  const handleKeyDown = useCallback((e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key==="b") { e.preventDefault(); execCmd("bold"); }
      if (e.key==="i") { e.preventDefault(); execCmd("italic"); }
      if (e.key==="u") { e.preventDefault(); execCmd("underline"); }
      if (e.key==="k") { e.preventDefault(); execCmd("_link"); }
    }
    updateActiveFormats();
  }, [execCmd, updateActiveFormats]);

  /* Paste as plain text to avoid bringing in external formatting */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const isEmpty = !value || value === "" || value === "<br>";

  return (
    <div style={{ position:"relative", fontFamily:"'Geist',-apple-system,sans-serif" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:2, flexWrap:"nowrap", overflowX:"auto",
        padding:"6px 8px", borderRadius:"10px 10px 0 0",
        border:"1.5px solid #d1d5db", borderBottom:"1px solid #e5e7eb",
        background:"#f9fafb" }}>
        {FORMATS.map((fmt, i) =>
          fmt === null
            ? <div key={i} style={{ width:1, height:18, background:"#e5e7eb", margin:"0 2px", flexShrink:0 }}/>
            : <Btn key={fmt.cmd} fmt={fmt} active={!!activeFormats[fmt.cmd]}
                onAction={execCmd} currentColor={currentColor}/>
        )}
      </div>

      {/* Editable area — wrapper is position:relative so placeholder is scoped here */}
      <div style={{ position:"relative" }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          onSelect={updateActiveFormats}
          style={{
            minHeight, padding:"10px 12px",
            border:"1.5px solid #d1d5db", borderTop:"none",
            borderRadius:"0 0 10px 10px",
            outline:"none", fontSize:13, lineHeight:1.7,
            color:"#111827", background:"white",
            overflowY:"auto",
            fontFamily:"'Geist',-apple-system,sans-serif",
          }}
        />
        {/* Placeholder — scoped to editable wrapper, not entire component */}
        {isEmpty && (
          <div style={{ position:"absolute", top:10, left:14,
            fontSize:13, color:"#9ca3af", pointerEvents:"none", userSelect:"none" }}>
            {placeholder || "Add rich text…"}
          </div>
        )}
      </div>

      {/* Inline styles for rendered content */}
      <style>{`
        [contenteditable] h1 { font-size:1.4em; font-weight:800; margin:.4em 0; }
        [contenteditable] h2 { font-size:1.15em; font-weight:700; margin:.35em 0; }
        [contenteditable] a  { color:#3b5bdb; text-decoration:underline; }
        [contenteditable] ul { list-style:disc; padding-left:1.4em; margin:.25em 0; }
        [contenteditable] ol { list-style:decimal; padding-left:1.4em; margin:.25em 0; }
        [contenteditable] strong { font-weight:700; }
        [contenteditable] em { font-style:italic; }
      `}</style>

      {/* Link modal */}
      {linkModal && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={()=>setLinkModal(null)}/>
          <LinkModal position={linkModal} initialUrl={linkModal.initialUrl} onConfirm={handleLinkConfirm} onClose={()=>setLinkModal(null)}/>
        </>
      )}
      {/* Image modal */}
      {imageModal && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={()=>setImageModal(null)}/>
          <ImageModal position={imageModal} onConfirm={handleImageConfirm} onClose={()=>setImageModal(null)}/>
        </>
      )}
      {/* Video modal */}
      {videoModal && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={()=>setVideoModal(null)}/>
          <VideoModal position={videoModal} onConfirm={handleVideoConfirm} onClose={()=>setVideoModal(null)}/>
        </>
      )}
      {/* Colour picker */}
      {colorPicker && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:9998 }} onClick={()=>setColorPicker(null)}/>
          <ColorPicker position={colorPicker} currentColor={currentColor} onConfirm={handleColorConfirm} onClose={()=>setColorPicker(null)}/>
        </>
      )}
    </div>
  );
}
