// client/src/RecentHistory.jsx
import { useState, useRef, useEffect } from "react";

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function EntryRow({ entry, onNavigate, onPin, isPinned, showTime = false, compact = false }) {
  const [hovered, setHovered] = useState(false);
  const color = entry.objectColor || "var(--t-accent, #4361EE)";
  const initials = (entry.label || "?").replace(/^…$/, "?").slice(0, 1).toUpperCase();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate(entry)}
      style={{
        display: "flex", alignItems: "center", gap: compact ? 7 : 9,
        padding: compact ? "5px 8px" : "6px 10px",
        borderRadius: 8, cursor: "pointer",
        background: hovered ? `${color}12` : "transparent",
        transition: "background 0.12s",
      }}
    >
      <div style={{
        width: compact ? 22 : 26, height: compact ? 22 : 26, borderRadius: 6, flexShrink: 0,
        background: `${color}22`, border: `1.5px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 9 : 10, fontWeight: 800, color,
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: compact ? 11 : 12, fontWeight: 600, color: "var(--t-text1)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3,
        }}>{entry.label}</div>
        {!compact && (
          <div style={{
            fontSize: 10, color: "var(--t-text3)", lineHeight: 1.2, marginTop: 1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {entry.objectName}{entry.subtitle ? ` · ${entry.subtitle}` : ""}
            {showTime ? ` · ${timeAgo(entry.ts)}` : ""}
          </div>
        )}
      </div>
      {hovered && onPin && (
        <button
          onClick={e => { e.stopPropagation(); onPin(entry); }}
          title={isPinned ? "Unpin" : "Pin"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 3px", borderRadius: 4, lineHeight: 1,
            color: isPinned ? color : "var(--t-text3)", fontSize: 12,
          }}
        >
          {isPinned ? "★" : "☆"}
        </button>
      )}
    </div>
  );
}

// ── Sidebar recent section ──────────────────────────────────────────────────
export function SidebarRecent({ history, pinned, onNavigate, onPin, isPinned }) {
  const [expanded, setExpanded] = useState(true);
  const recent = history.slice(0, 5);
  const hasPinned = pinned.length > 0;
  const hasRecent = recent.length > 0;

  if (!hasRecent && !hasPinned) return null;

  return (
    <div style={{ padding: "0 8px", marginBottom: 8 }}>
      {hasPinned && (
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: "var(--t-text3)", letterSpacing: "0.06em",
            textTransform: "uppercase", paddingLeft: 10, marginBottom: 3,
          }}>Pinned</div>
          {pinned.map((e, i) => (
            <EntryRow key={i} entry={e} onNavigate={onNavigate}
              onPin={onPin} isPinned={isPinned(e)} compact />
          ))}
        </div>
      )}
      {hasRecent && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: "flex", alignItems: "center", width: "100%",
              gap: 5, padding: "3px 10px", background: "none", border: "none",
              cursor: "pointer", fontSize: 9, fontWeight: 700, color: "var(--t-text3)",
              letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "inherit",
            }}
          >
            <span style={{ flex: 1, textAlign: "left" }}>Recent</span>
            <span style={{ fontSize: 10 }}>{expanded ? "▾" : "▸"}</span>
          </button>
          {expanded && recent.map((e, i) => (
            <EntryRow key={i} entry={e} onNavigate={onNavigate}
              onPin={onPin} isPinned={isPinned(e)} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Top bar history dropdown ────────────────────────────────────────────────
export function HistoryDropdown({ history, pinned, onNavigate, onPin, isPinned, onClear }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("recent");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = tab === "pinned" ? pinned : history;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="History"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "6px 10px", borderRadius: 8, border: "none",
          background: open ? "var(--t-accent-light, #eef1ff)" : "transparent",
          color: open ? "var(--t-accent, #4361EE)" : "var(--t-text3)",
          cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
          transition: "all 0.12s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        {history.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700 }}>{history.length}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 280, background: "var(--t-surface, white)", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid var(--t-border)",
          zIndex: 1000, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", padding: "10px 12px 6px",
            borderBottom: "1px solid var(--t-border)",
          }}>
            <div style={{ display: "flex", gap: 4, flex: 1 }}>
              {["recent", "pinned"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "3px 10px", borderRadius: 20, border: "none",
                  background: tab === t ? "var(--t-accent, #4361EE)" : "transparent",
                  color: tab === t ? "white" : "var(--t-text3)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  textTransform: "capitalize",
                }}>{t}</button>
              ))}
            </div>
            {tab === "recent" && history.length > 0 && (
              <button onClick={onClear} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 10, color: "var(--t-text3)", fontFamily: "inherit", padding: "2px 4px",
              }}>Clear</button>
            )}
          </div>
          <div style={{ maxHeight: 340, overflowY: "auto", padding: "6px 4px" }}>
            {items.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 12, color: "var(--t-text3)" }}>
                {tab === "pinned" ? "Star items to pin them here" : "Nothing viewed yet"}
              </div>
            ) : items.map((e, i) => (
              <EntryRow key={i} entry={e}
                onNavigate={nav => { onNavigate(nav); setOpen(false); }}
                onPin={onPin} isPinned={isPinned(e)} showTime={tab === "recent"} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
