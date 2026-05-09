/**
 * RichTextEditor.jsx
 * Lightweight WYSIWYG editor — no external dependencies.
 * Uses contentEditable + execCommand for formatting.
 * Stores and emits HTML strings.
 */

import { useRef, useEffect, useCallback, useState } from "react";

/* ─── Toolbar button definitions ─────────────────────────────────────────── */
const FORMATS = [
  { cmd:"bold",                icon:"B",    title:"Bold (⌘B)",          style:{fontWeight:800} },
  { cmd:"italic",              icon:"I",    title:"Italic (⌘I)",        style:{fontStyle:"italic"} },
  { cmd:"underline",           icon:"U",    title:"Underline (⌘U)",     style:{textDecoration:"underline"} },
  { cmd:"strikeThrough",       icon:"S̶",    title:"Strikethrough" },
  null,
  { cmd:"insertUnorderedList", icon:"•≡",   title:"Bullet list" },
  { cmd:"insertOrderedList",   icon:"1≡",   title:"Numbered list" },
  null,
  { cmd:"justifyLeft",   title:"Align left",   svgPath:"M3 6h18M3 12h12M3 18h15" },
  { cmd:"justifyCenter", title:"Align centre", svgPath:"M3 6h18M6 12h12M4.5 18h15" },
  null,
  { cmd:"_link",   title:"Insert / edit link", svgPath:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  { cmd:"_unlink", title:"Remove link",         svgPath:"M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.004 5.004 0 0 0-7.07.12l-1.71 1.72M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.004 5.004 0 0 0 7.07-.12l1.71-1.71M8 8l8 8" },
  null,
  { cmd:"_h1", icon:"H1", title:"Heading 1" },
  { cmd:"_h2", icon:"H2", title:"Heading 2" },
  null,
  { cmd:"_image",   title:"Insert image",       svgPath:"M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5z" },
  { cmd:"_video",   title:"Embed video",         svgPath:"M22.54 6.42A2.78 2.78 0 0 0 20.6 4.46C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
  { cmd:"_divider", title:"Horizontal divider",  svgPath:"M3 12h18" },
  { cmd:"_color",   title:"Text colour",         isColor:true },
  null,
  { cmd:"removeFormat", icon:"Tx", title:"Clear formatting" },
];

/* ─── SVG icon ────────────────────────────────────────────────────────────── */
const SvgIcon = ({ path, size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={path}/>
  </svg>
);

/* ─── Toolbar button ──────────────────────────────────────────────────────── */
const Btn = ({ fmt, active, onAction, currentColor }) => (
  <button
    title={fmt.title}
    onMouseDown={e => { e.preventDefault(); onAction(fmt.cmd); }}
    style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:28, height:28, borderRadius:5, border:"none", cursor:"pointer",
      fontFamily:"ui-serif,serif", fontSize:12, fontWeight:fmt.cmd==="bold"?800:600,
      background:active?"#e0e7ff":"transparent", color:active?"#3b5bdb":"#374151",
      transition:"background .1s", padding:0, lineHeight:1, flexShrink:0,
    }}
    onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="#f3f4f6"; }}
    onMouseLeave={e=>{ e.currentTarget.style.background=active?"#e0e7ff":"transparent"; }}
  >
    {fmt.svgPath
      ? <SvgIcon path={fmt.svgPath}/>
      : fmt.isColor
      ? <span style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span style={{fontSize:13,fontWeight:800,color:"#111"}}>A</span>
          <span style={{width:14,height:3,borderRadius:1,background:currentColor||"#e03131"}}/>
        </span>
      : <span style={fmt.style||{}}>{fmt.icon||fmt.cmd}</span>}
  </button>
);

/* ─── Centred modal wrapper ───────────────────────────────────────────────── */
const CentredModal = ({ onClose, children }) => (
  <>
    <div style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,0.3)", backdropFilter:"blur(2px)" }}
      onClick={onClose}/>
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
      <div style={{ pointerEvents:"auto" }}>{children}</div>
    </div>
  </>
);

/* ─── Shared modal card style ─────────────────────────────────────────────── */
const card = { background:"white", borderRadius:14, boxShadow:"0 20px 60px rgba(0,0,0,0.2)", padding:"20px 22px", fontFamily:"'Geist',-apple-system,sans-serif", minWidth:300 };
const inp  = { width:"100%", boxSizing:"border-box", padding:"8px 11px", borderRadius:8, border:"1.5px solid #d1d5db", fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10, display:"block" };
const btnR = { padding:"7px 16px", borderRadius:8, border:"none", background:"#3b5bdb", color:"white", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" };
const btnL = { padding:"7px 16px", borderRadius:8, border:"1px solid #e5e7eb", background:"transparent", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" };

/* ─── Link modal ──────────────────────────────────────────────────────────── */
const LinkModal = ({ onConfirm, onClose, initialUrl="" }) => {
  const [url, setUrl] = useState(initialUrl);
  const ref = useRef(null);
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(), 50); }, []);
  return (
    <div style={card}>
      <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:12 }}>Insert link</div>
      <input ref={ref} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" style={inp}
        onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();onConfirm(url);} if(e.key==="Escape") onClose(); }}/>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={btnL}>Cancel</button>
        <button onClick={()=>onConfirm(url)} style={btnR}>Insert</button>
      </div>
    </div>
  );
};

/* ─── Image modal ─────────────────────────────────────────────────────────── */
const IMAGE_SIZES = [
  { label:"Small",  value:"25%"  },
  { label:"Medium", value:"50%"  },
  { label:"Large",  value:"75%"  },
  { label:"Full",   value:"100%" },
];

const ImageModal = ({ onConfirm, onClose }) => {
  const [url, setUrl]           = useState('');
  const [alt, setAlt]           = useState('');
  const [size, setSize]         = useState("100%");
  const [align, setAlign]       = useState("left");
  const [previewOk, setPreviewOk]       = useState(false);
  const [previewTried, setPreviewTried] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(), 50); }, []);

  const looksLikeImage = url && /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url.trim());
  const canInsert = url && (looksLikeImage || previewOk);
  const fullUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;

  const ALIGNS = [
    { value:"left",   label:"←", title:"Left" },
    { value:"center", label:"↔", title:"Centre" },
    { value:"right",  label:"→", title:"Right" },
  ];

  return (
    <div style={{...card, width:390}}>
      <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:4 }}>Insert image</div>
      <div style={{ fontSize:12, color:"#9ca3af", marginBottom:10 }}>Paste a direct image URL (.jpg, .png, .svg etc.)</div>
      <input ref={ref} value={url} onChange={e=>{ setUrl(e.target.value); setPreviewOk(false); setPreviewTried(false); }}
        placeholder="https://example.com/photo.jpg" style={inp}
        onKeyDown={e=>{ if(e.key==="Enter"&&canInsert){e.preventDefault();onConfirm(fullUrl,alt,size,align);} if(e.key==="Escape") onClose(); }}/>
      <input value={alt} onChange={e=>setAlt(e.target.value)} placeholder="Alt text (optional)" style={{...inp,marginBottom:12}}
        onKeyDown={e=>{ if(e.key==="Enter"&&canInsert){e.preventDefault();onConfirm(fullUrl,alt,size,align);} if(e.key==="Escape") onClose(); }}/>

      {/* Size + align row */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", flexShrink:0 }}>Size</div>
        <div style={{ display:"flex", gap:4, flex:1 }}>
          {IMAGE_SIZES.map(s=>(
            <button key={s.value} type="button" onClick={()=>setSize(s.value)}
              style={{ flex:1, padding:"5px 0", borderRadius:7,
                border:`1.5px solid ${size===s.value?"#3b5bdb":"#e5e7eb"}`,
                background:size===s.value?"#eff6ff":"transparent",
                color:size===s.value?"#3b5bdb":"#374151",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, fontWeight:600, color:"#9ca3af", flexShrink:0 }}>Align</div>
        <div style={{ display:"flex", gap:3 }}>
          {ALIGNS.map(a=>(
            <button key={a.value} type="button" onClick={()=>setAlign(a.value)} title={a.title}
              style={{ width:28, height:28, borderRadius:6,
                border:`1.5px solid ${align===a.value?"#3b5bdb":"#e5e7eb"}`,
                background:align===a.value?"#eff6ff":"transparent",
                color:align===a.value?"#3b5bdb":"#374151",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      {url && (
        <div style={{ marginBottom:12, borderRadius:8, padding:8, minHeight:60, display:"flex",
          alignItems:"center", justifyContent:align==="center"?"center":align==="right"?"flex-end":"flex-start",
          background:"#f9fafb", border:"1px solid #e5e7eb" }}>
          <img src={fullUrl} alt={alt}
            style={{ width:size, maxWidth:"100%", height:"auto", objectFit:"contain", borderRadius:4, display:"block" }}
            onLoad={()=>{ setPreviewOk(true); setPreviewTried(true); }}
            onError={()=>{ setPreviewOk(false); setPreviewTried(true); }}/>
        </div>
      )}
      {url && previewTried && !previewOk && (
        <div style={{ fontSize:12, color:"#ef4444", marginBottom:10, lineHeight:1.5 }}>
          ⚠ Can't load this image. Make sure it's a direct link to an image file. Try right-clicking an image and choosing "Copy image address".
        </div>
      )}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={btnL}>Cancel</button>
        <button onClick={()=>canInsert&&onConfirm(fullUrl,alt,size,align)} disabled={!canInsert}
          style={{...btnR, background:canInsert?"#3b5bdb":"#e5e7eb", color:canInsert?"white":"#9ca3af", cursor:canInsert?"pointer":"default"}}>
          Insert image
        </button>
      </div>
    </div>
  );
};

/* ─── Video modal ─────────────────────────────────────────────────────────── */
const VideoModal = ({ onConfirm, onClose }) => {
  const [url, setUrl] = useState('');
  const ref = useRef(null);
  useEffect(()=>{ setTimeout(()=>ref.current?.focus(), 50); }, []);
  const getEmbed = (raw) => {
    if (!raw) return null;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      // YouTube — any domain (youtube.com, youtu.be, youtube-nocookie.com)
      if (url.hostname.includes('youtube') || url.hostname.includes('youtu.be')) {
        const id = url.searchParams.get('v') || url.pathname.replace(/^\//, '').split('/')[0];
        if (id && id.length > 5) return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      // Vimeo
      if (url.hostname.includes('vimeo')) {
        const id = url.pathname.replace(/^\//, '').split('/')[0];
        if (id) return `https://player.vimeo.com/video/${id}`;
      }
      // Already an embed URL
      if (raw.includes('/embed/') || raw.includes('player.vimeo')) return raw;
    } catch (_) {}
    return null;
  };
  const embed = getEmbed(url);
  return (
    <div style={{...card, width:360}}>
      <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:4 }}>Embed video</div>
      <div style={{ fontSize:12, color:"#9ca3af", marginBottom:12 }}>Paste a YouTube or Vimeo URL</div>
      <input ref={ref} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" style={inp}
        onKeyDown={e=>{ if(e.key==="Enter"&&embed){e.preventDefault();onConfirm(embed);} if(e.key==="Escape") onClose(); }}/>
      {url && !embed && <div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>Not a recognised YouTube or Vimeo URL</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={btnL}>Cancel</button>
        <button onClick={()=>embed&&onConfirm(embed)} disabled={!embed} style={{...btnR, background:embed?"#3b5bdb":"#e5e7eb", color:embed?"white":"#9ca3af", cursor:embed?"pointer":"default"}}>Embed</button>
      </div>
    </div>
  );
};

/* ─── Colour picker ───────────────────────────────────────────────────────── */
const SWATCHES = ["#111827","#e03131","#e67700","#2f9e44","#1971c2","#7048e8","#a61e4d","#495057","#868e96","#f03e3e","#fd7e14","#40c057","#339af0","#9775fa","#f06595","#ced4da"];
const ColorPicker = ({ currentColor, onConfirm, onClose }) => (
  <div style={{...card}}>
    <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:12 }}>Text colour</div>
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", maxWidth:220, marginBottom:12 }}>
      {SWATCHES.map(c=>(
        <button key={c} onMouseDown={e=>{e.preventDefault();onConfirm(c);}}
          style={{ width:24, height:24, borderRadius:"50%", background:c, border:currentColor===c?"3px solid #3b5bdb":"2px solid #e5e7eb", cursor:"pointer", padding:0, flexShrink:0 }}/>
      ))}
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <span style={{ fontSize:12, color:"#6b7280" }}>Custom:</span>
      <input type="color" defaultValue={currentColor||"#111827"} onChange={e=>onConfirm(e.target.value)}
        style={{ width:36, height:26, padding:0, border:"1px solid #e5e7eb", borderRadius:5, cursor:"pointer" }}/>
      <button onClick={onClose} style={{...btnL, marginLeft:"auto", padding:"4px 12px", fontSize:12}}>Close</button>
    </div>
  </div>
);

/* ─── Main editor ─────────────────────────────────────────────────────────── */
export default function RichTextEditor({ value, onChange, placeholder, autoFocus, minHeight=120 }) {
  const editorRef  = useRef(null);
  const savedSel   = useRef(null);
  const [activeFormats, setActiveFormats] = useState({});
  const [linkModal,   setLinkModal]   = useState(null);
  const [imageModal,  setImageModal]  = useState(false);
  const [videoModal,  setVideoModal]  = useState(false);
  const [colorPicker, setColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#111827");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (autoFocus) setTimeout(() => editorRef.current?.focus(), 80);
  }, [autoFocus]);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold:        document.queryCommandState("bold"),
      italic:      document.queryCommandState("italic"),
      underline:   document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
      justifyLeft:   document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
    });
  }, []);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel?.rangeCount) savedSel.current = sel.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    if (!savedSel.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSel.current);
  }, []);

  const execCmd = useCallback((cmd) => {
    editorRef.current?.focus();

    if (cmd === "_link") {
      const sel = window.getSelection();
      const anchor = sel?.anchorNode?.parentElement?.closest("a");
      saveSelection();
      setLinkModal({ initialUrl: anchor?.href || "" });
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
        const block = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
        document.execCommand("formatBlock", false, block?.tagName === tag ? "P" : tag);
      }
      onChange(editorRef.current?.innerHTML || "");
      return;
    }
    if (cmd === "_image")   { saveSelection(); setImageModal(true);  return; }
    if (cmd === "_video")   { saveSelection(); setVideoModal(true);  return; }
    if (cmd === "_color")   { saveSelection(); setColorPicker(true); return; }
    if (cmd === "_divider") {
      restoreSelection();
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, '<hr style="border:none;border-top:2px solid #e5e7eb;margin:12px 0;"><p><br></p>');
      onChange(editorRef.current?.innerHTML || "");
      return;
    }

    restoreSelection();
    document.execCommand(cmd, false, null);
    onChange(editorRef.current?.innerHTML || "");
    updateActiveFormats();
  }, [onChange, saveSelection, restoreSelection, updateActiveFormats]);

  const handleLinkConfirm = useCallback((url) => {
    setLinkModal(null);
    restoreSelection();
    editorRef.current?.focus();
    if (url) {
      const href = url.startsWith("http") ? url : `https://${url}`;
      document.execCommand("createLink", false, href);
      const sel = window.getSelection();
      if (sel?.anchorNode) {
        const a = sel.anchorNode.parentElement?.closest("a");
        if (a) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      }
    }
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleImageConfirm = useCallback((url, alt, size="100%", align="left") => {
    setImageModal(false);
    if (!url) return;
    restoreSelection();
    editorRef.current?.focus();
    const alignStyle = align==="center" ? "display:block;margin:4px auto;" : align==="right" ? "display:block;margin:4px 0 4px auto;" : "display:block;margin:4px 0;";
    document.execCommand("insertHTML", false,
      `<img src="${url}" alt="${alt||''}" style="width:${size};max-width:100%;height:auto;border-radius:6px;${alignStyle}" />`);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleVideoConfirm = useCallback((embedUrl) => {
    setVideoModal(false);
    if (!embedUrl) return;
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("insertHTML", false,
      `<div style="position:relative;padding-bottom:56.25%;height:0;margin:8px 0;border-radius:8px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;inset:0;width:100%;height:100%;border:none;" allowfullscreen loading="lazy"></iframe></div><p><br></p>`);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const handleColorConfirm = useCallback((color) => {
    setCurrentColor(color);
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("foreColor", false, color);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange, restoreSelection]);

  const [selectedImg, setSelectedImg] = useState(null); // { el, rect }
  const imgToolbarRef = useRef(null);

  // Click on an <img> inside the editor → select it and show the toolbar
  const handleEditorClick = useCallback((e) => {
    if (e.target.tagName === "IMG") {
      const el = e.target;
      const rect = el.getBoundingClientRect();
      setSelectedImg({ el, rect });
    } else {
      // Clicked outside an image — dismiss if click wasn't on the img toolbar
      if (!imgToolbarRef.current?.contains(e.target)) {
        setSelectedImg(null);
      }
    }
    updateActiveFormats();
  }, [updateActiveFormats]);

  // Update selected image position on scroll/resize
  useEffect(() => {
    if (!selectedImg) return;
    const update = () => {
      const rect = selectedImg.el.getBoundingClientRect();
      setSelectedImg(s => s ? { ...s, rect } : null);
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [selectedImg]);

  // Apply size/align changes to the selected image
  const applyImageStyle = useCallback((size, align) => {
    if (!selectedImg) return;
    const el = selectedImg.el;
    el.style.width = size;
    el.style.maxWidth = "100%";
    el.style.height = "auto";
    el.style.display = "block";
    if (align === "center") { el.style.marginLeft = "auto"; el.style.marginRight = "auto"; }
    else if (align === "right") { el.style.marginLeft = "auto"; el.style.marginRight = "0"; }
    else { el.style.marginLeft = "0"; el.style.marginRight = "auto"; }
    onChange(editorRef.current?.innerHTML || "");
    // Update rect
    const rect = el.getBoundingClientRect();
    setSelectedImg(s => s ? { ...s, rect } : null);
  }, [selectedImg, onChange]);

  const deleteSelectedImg = useCallback(() => {
    if (!selectedImg) return;
    selectedImg.el.remove();
    setSelectedImg(null);
    onChange(editorRef.current?.innerHTML || "");
  }, [selectedImg, onChange]);

  const handleInput = useCallback(() => {
    onChange(editorRef.current?.innerHTML || "");
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  const handleKeyDown = useCallback((e) => {
    // Delete selected image with Backspace/Delete
    if (selectedImg && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault(); deleteSelectedImg(); return;
    }
    if (selectedImg && e.key === "Escape") { setSelectedImg(null); return; }
    if (e.metaKey || e.ctrlKey) {
      if (e.key==="b") { e.preventDefault(); execCmd("bold"); }
      if (e.key==="i") { e.preventDefault(); execCmd("italic"); }
      if (e.key==="u") { e.preventDefault(); execCmd("underline"); }
      if (e.key==="k") { e.preventDefault(); execCmd("_link"); }
    }
    updateActiveFormats();
  }, [execCmd, updateActiveFormats, selectedImg, deleteSelectedImg]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const isEmpty = !value || value === "" || value === "<br>";

  return (
    <div style={{ position:"relative", fontFamily:"'Geist',-apple-system,sans-serif" }}>
      {/* Toolbar — wraps onto multiple lines when narrow */}
      <div style={{ display:"flex", alignItems:"center", gap:2, flexWrap:"wrap",
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

      {/* Editable area */}
      <div style={{ position:"relative" }}>
        <div ref={editorRef} contentEditable suppressContentEditableWarning
          onInput={handleInput} onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats} onMouseUp={updateActiveFormats}
          onClick={handleEditorClick}
          onPaste={handlePaste} onSelect={updateActiveFormats}
          style={{ minHeight, padding:"10px 12px",
            border:"1.5px solid #d1d5db", borderTop:"none",
            borderRadius:"0 0 10px 10px", outline:"none", fontSize:13, lineHeight:1.7,
            color:"#111827", background:"white", overflowY:"auto",
            fontFamily:"'Geist',-apple-system,sans-serif" }}
        />
        {isEmpty && (
          <div style={{ position:"absolute", top:10, left:14, fontSize:13, color:"#9ca3af", pointerEvents:"none", userSelect:"none" }}>
            {placeholder || "Add rich text…"}
          </div>
        )}
      </div>

      {/* Image selection toolbar */}
      {selectedImg && (() => {
        const { rect } = selectedImg;
        const currentWidth = selectedImg.el.style.width || "100%";
        const ml = selectedImg.el.style.marginLeft;
        const mr = selectedImg.el.style.marginRight;
        const currentAlign = (ml === "auto" && mr === "auto") ? "center" : (ml === "auto") ? "right" : "left";
        return (
          <div ref={imgToolbarRef} style={{
            position:"fixed",
            top: rect.top - 46,
            left: rect.left + rect.width / 2,
            transform:"translateX(-50%)",
            zIndex:9999,
            background:"#1a1a2e",
            borderRadius:10,
            padding:"6px 10px",
            display:"flex",
            alignItems:"center",
            gap:4,
            boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {/* Size pills */}
            {IMAGE_SIZES.map(s=>(
              <button key={s.value} onMouseDown={e=>{ e.preventDefault(); applyImageStyle(s.value, currentAlign); }}
                style={{ padding:"3px 8px", borderRadius:6, border:`1.5px solid ${currentWidth===s.value?"#4361EE":"#ffffff30"}`,
                  background:currentWidth===s.value?"#4361EE":"transparent",
                  color:"white", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {s.label}
              </button>
            ))}
            <div style={{ width:1, height:16, background:"#ffffff30", margin:"0 3px" }}/>
            {/* Align */}
            {[{v:"left",l:"←"},{v:"center",l:"↔"},{v:"right",l:"→"}].map(a=>(
              <button key={a.v} onMouseDown={e=>{ e.preventDefault(); applyImageStyle(currentWidth, a.v); }}
                title={a.v}
                style={{ width:26, height:26, borderRadius:6, border:`1.5px solid ${currentAlign===a.v?"#4361EE":"#ffffff30"}`,
                  background:currentAlign===a.v?"#4361EE":"transparent",
                  color:"white", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {a.l}
              </button>
            ))}
            <div style={{ width:1, height:16, background:"#ffffff30", margin:"0 3px" }}/>
            {/* Delete */}
            <button onMouseDown={e=>{ e.preventDefault(); deleteSelectedImg(); }}
              title="Delete image"
              style={{ width:26, height:26, borderRadius:6, border:"1.5px solid #ef444450",
                background:"transparent", color:"#ef4444", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              ✕
            </button>
          </div>
        );
      })()}

      <style>{`
        [contenteditable] h1 { font-size:1.4em; font-weight:800; margin:.4em 0; }
        [contenteditable] h2 { font-size:1.15em; font-weight:700; margin:.35em 0; }
        [contenteditable] h3 { font-size:1em; font-weight:700; margin:.3em 0; }
        [contenteditable] a  { color:#3b5bdb; text-decoration:underline; }
        [contenteditable] ul { list-style:disc; padding-left:1.4em; margin:.25em 0; }
        [contenteditable] ol { list-style:decimal; padding-left:1.4em; margin:.25em 0; }
        [contenteditable] strong { font-weight:700; }
        [contenteditable] em { font-style:italic; }
        [contenteditable] hr { border:none; border-top:2px solid #e5e7eb; margin:10px 0; }
        [contenteditable] img { max-width:100%; border-radius:6px; cursor:pointer; transition:outline .1s; }
        [contenteditable] img:hover { outline:2px solid #4361EE60; }
      `}</style>

      {linkModal && (
        <CentredModal onClose={()=>setLinkModal(null)}>
          <LinkModal initialUrl={linkModal.initialUrl} onConfirm={handleLinkConfirm} onClose={()=>setLinkModal(null)}/>
        </CentredModal>
      )}
      {imageModal && (
        <CentredModal onClose={()=>setImageModal(false)}>
          <ImageModal onConfirm={handleImageConfirm} onClose={()=>setImageModal(false)}/>
        </CentredModal>
      )}
      {videoModal && (
        <CentredModal onClose={()=>setVideoModal(false)}>
          <VideoModal onConfirm={handleVideoConfirm} onClose={()=>setVideoModal(false)}/>
        </CentredModal>
      )}
      {colorPicker && (
        <CentredModal onClose={()=>setColorPicker(false)}>
          <ColorPicker currentColor={currentColor} onConfirm={handleColorConfirm} onClose={()=>setColorPicker(false)}/>
        </CentredModal>
      )}
    </div>
  );
}
