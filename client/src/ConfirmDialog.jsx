// ConfirmDialog.jsx — Custom confirm dialogs replacing browser native confirm()
// Usage:
//   import { useConfirm } from "./ConfirmDialog";
//   const confirm = useConfirm();
//   if (await confirm({ title:"Delete?", message:"Cannot be undone.", danger:true })) { ... }

import { useState, useCallback, useRef, useEffect, createContext, useContext } from "react";

const F = "'DM Sans',-apple-system,sans-serif";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogs, setDialogs] = useState([]);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialogs(prev => [...prev, { id: Date.now() + Math.random(), ...opts, resolve }]);
    });
  }, []);

  // Bridge for non-hook callers (legacy confirm() replacements)
  useEffect(() => {
    window.__confirm = confirm;
    return () => { delete window.__confirm; };
  }, [confirm]);

  const close = (id, result) => {
    setDialogs(prev => {
      const d = prev.find(x => x.id === id);
      if (d) d.resolve(result);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialogs.map(d => <ConfirmModal key={d.id} dialog={d} onClose={r => close(d.id, r)} />)}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

function ConfirmModal({ dialog, onClose }) {
  const { title, message, confirmLabel, cancelLabel, danger = false } = dialog;
  const confirmRef = useRef(null);

  useEffect(() => {
    // Small delay so animation plays before focus
    const t = setTimeout(() => confirmRef.current?.focus(), 60);
    const handler = (e) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", handler);
    return () => { clearTimeout(t); window.removeEventListener("keydown", handler); };
  }, []);

  const accent  = "#4361EE";
  const red     = "#EF4444";
  const btnColor = danger ? red : accent;

  return (
    <>
      <div onClick={() => onClose(false)} style={{
        position:"fixed", inset:0,
        background:"rgba(15,23,41,0.5)",
        backdropFilter:"blur(3px)",
        zIndex:9998,
        animation:"cfFadeIn .15s ease",
      }}/>

      <div role="alertdialog" aria-modal="true" style={{
        position:"fixed", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        zIndex:9999,
        background:"white",
        borderRadius:20,
        boxShadow:"0 32px 64px rgba(15,23,41,0.24), 0 4px 16px rgba(15,23,41,0.08)",
        width:"100%", maxWidth:400,
        padding:"28px 28px 24px",
        fontFamily:F,
        animation:"cfSlideIn .2s cubic-bezier(0.34,1.4,0.64,1)",
      }}>
        {/* Icon badge */}
        <div style={{
          width:46, height:46, borderRadius:14,
          background: danger ? "#FEF2F2" : "#EEF2FF",
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:18,
        }}>
          {danger ? (
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          ) : (
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={12} cy={12} r={10}/>
              <line x1={12} y1={8} x2={12} y2={12}/>
              <line x1={12} y1={16} x2={12.01} y2={16}/>
            </svg>
          )}
        </div>

        <h2 style={{ margin:"0 0 8px", fontSize:17, fontWeight:700, color:"#0F1729",
          fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"-0.3px" }}>
          {title || "Are you sure?"}
        </h2>

        {message && (
          <p style={{ margin:"0 0 24px", fontSize:14, color:"#4B5563", lineHeight:1.65 }}>
            {message}
          </p>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={() => onClose(false)} style={{
            padding:"10px 22px", borderRadius:10,
            border:"1.5px solid #E5E7EB", background:"white",
            color:"#374151", fontSize:14, fontWeight:600,
            fontFamily:F, cursor:"pointer", transition:"all .15s",
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background="#F9FAFB"; e.currentTarget.style.borderColor="#D1D5DB"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="white"; e.currentTarget.style.borderColor="#E5E7EB"; }}>
            {cancelLabel || "Cancel"}
          </button>

          <button ref={confirmRef} onClick={() => onClose(true)} style={{
            padding:"10px 22px", borderRadius:10, border:"none",
            background: btnColor, color:"white",
            fontSize:14, fontWeight:600, fontFamily:F, cursor:"pointer",
            transition:"all .15s",
            boxShadow:`0 2px 8px ${btnColor}40`,
          }}
            onMouseEnter={e=>{ e.currentTarget.style.opacity="0.88"; e.currentTarget.style.transform="translateY(-1px)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="none"; }}>
            {confirmLabel || (danger ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cfFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes cfSlideIn { from{opacity:0;transform:translate(-50%,-46%) scale(0.95)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
      `}</style>
    </>
  );
}
