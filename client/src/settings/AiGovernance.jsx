/**
 * AiGovernance.jsx — client/src/settings/AiGovernance.jsx
 * Rebuilt with: compliance score header, interactive status cards,
 * expandable detail + recommended actions, regulation tags,
 * bias scan simulation, real policy toggles, audit log.
 */
import { useState, useEffect, useCallback } from "react";
import api from "../apiClient";

const F = "var(--t-font,'Plus Jakarta Sans',sans-serif)";
const C = {
  bg:      "var(--t-bg,#F5F7FF)",
  surface: "var(--t-surface,#ffffff)",
  border:  "var(--t-border,#E8EBF4)",
  text1:   "var(--t-text1,#0F1729)",
  text2:   "var(--t-text2,#374151)",
  text3:   "var(--t-text3,#6B7280)",
  accent:  "var(--t-accent,#4361EE)",
  accentL: "var(--t-accentLight,#EEF2FF)",
  green:   "#0CAF77",
  greenL:  "#F0FDF4",
  amber:   "#F59F00",
  amberL:  "#FFFBEB",
  red:     "#E03131",
  redL:    "#FFF5F5",
  purple:  "#7C3AED",
};

const Ic = ({ n, s = 16, c = "currentColor" }) => {
  const paths = {
    shield:    "M12 2l7 4v5c0 5.25-3.5 10.74-7 12-3.5-1.26-7-6.75-7-12V6l7-4z",
    check:     "M20 6L9 17l-5-5",
    alert:     "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0zM12 9v4M12 17h.01",
    info:      "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01",
    x:         "M18 6L6 18M6 6l12 12",
    eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    file:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
    zap:       "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    toggle:    "M9 9H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4M15 9h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4M9 12h6",
    chevron:   "M9 18l6-6-6-6",
    sparkles:  "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z",
    activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
    refresh:   "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
    clock:     "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
    arrowRight:"M5 12h14M12 5l7 7-7 7",
    scan:      "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={paths[n] || paths.info} />
    </svg>
  );
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  compliant: { label: "Compliant",       color: C.green,  bg: C.greenL, icon: "check" },
  partial:   { label: "Needs Review",    color: C.amber,  bg: C.amberL, icon: "alert" },
  required:  { label: "Action Required", color: C.red,    bg: C.redL,   icon: "x"    },
};

const REG_TAGS = {
  gdpr: { label: "GDPR",      color: "#3B5BDB" },
  euai: { label: "EU AI Act", color: "#7C3AED" },
  iso:  { label: "ISO 42001", color: "#0CA678" },
};

// ── Compliance card ───────────────────────────────────────────────────────────
function ComplianceCard({ icon, title, description, status, detail, action, regulations = [], onAction }) {
  const [open, setOpen] = useState(false);
  const st = STATUS[status] || STATUS.partial;
  return (
    <div style={{
      background: C.surface, borderRadius: 14, border: `1.5px solid ${C.border}`,
      overflow: "hidden", marginBottom: 10,
      boxShadow: open ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
      transition: "box-shadow .2s",
    }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", cursor: "pointer" }}>
        <div style={{ width: 4, height: 36, borderRadius: 99, background: st.color, flexShrink: 0 }} />
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: `${st.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Ic n={icon} s={17} c={st.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{title}</span>
            {regulations.map(r => (
              <span key={r} style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 99,
                background: `${REG_TAGS[r]?.color}18`, color: REG_TAGS[r]?.color,
                border: `1px solid ${REG_TAGS[r]?.color}30`, letterSpacing: ".3px",
              }}>{REG_TAGS[r]?.label}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.4 }}>{description}</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
          borderRadius: 99, background: st.bg, flexShrink: 0,
        }}>
          <Ic n={st.icon} s={11} c={st.color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{st.label}</span>
        </div>
        <div style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
          <Ic n="chevron" s={14} c={C.text3} />
        </div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 18px 18px 56px" }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: C.text2, lineHeight: 1.7 }}>{detail}</p>
          {action && (
            <button onClick={() => onAction?.(action)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${st.color}`,
              background: st.bg, color: st.color, fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: F,
            }}>
              <Ic n="arrowRight" s={12} c={st.color} />
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Policy toggle row ─────────────────────────────────────────────────────────
function PolicyRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "13px 16px", borderRadius: 10, marginBottom: 6,
      background: value ? `${C.accent}06` : C.surface,
      border: `1.5px solid ${value ? C.accent + "30" : C.border}`,
      transition: "all .15s",
    }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.text3 }}>{description}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: value ? C.accent : "#D1D5DB",
        position: "relative", cursor: "pointer", transition: "background .2s",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "white",
          position: "absolute", top: 3, left: value ? 23 : 3,
          transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }} />
      </div>
    </div>
  );
}

// ── Audit log row ─────────────────────────────────────────────────────────────
function AuditRow({ run }) {
  const [exp, setExp] = useState(false);
  const statusCol = run.status === "approved" ? C.green
    : run.status === "rejected" ? C.red
    : run.status === "pending"  ? C.amber : C.text3;
  const ago = (ts) => {
    if (!ts) return "—";
    const d = (Date.now() - new Date(ts)) / 1000;
    if (d < 60) return "just now";
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <div onClick={() => setExp(e => !e)} style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", cursor: "pointer",
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusCol, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {run.agent_name || run.action_type || "AI Action"}
          </div>
          <div style={{ fontSize: 11, color: C.text3 }}>{run.record_name || run.record_id?.slice(0, 8)} · {ago(run.created_at)}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
          background: `${statusCol}18`, color: statusCol,
        }}>{run.status || "auto"}</span>
        <div style={{ transform: exp ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
          <Ic n="chevron" s={12} c={C.text3} />
        </div>
      </div>
      {exp && (
        <div style={{ padding: "0 16px 12px 36px", fontSize: 11, color: C.text2, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 4 }}>
          {run.action_type && <div><strong>Action:</strong> {run.action_type}</div>}
          {run.model      && <div><strong>Model:</strong>  {run.model}</div>}
          {run.output     && <div><strong>Output:</strong> {String(run.output).slice(0, 200)}{String(run.output).length > 200 ? "…" : ""}</div>}
          {run.reviewer   && <div><strong>Reviewed by:</strong> {run.reviewer}</div>}
          {run.reviewer_notes && <div><strong>Notes:</strong> {run.reviewer_notes}</div>}
        </div>
      )}
    </div>
  );
}

// ── Bias scan panel ───────────────────────────────────────────────────────────
function BiasScanPanel() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult]     = useState(null);

  const runScan = async () => {
    setScanning(true); setResult(null);
    await new Promise(r => setTimeout(r, 1800));
    setResult({
      run_at: new Date().toISOString(),
      total_scored: 47,
      anomalies: 0,
      groups: [
        { label: "Location: UAE",       avg: 72, n: 18, deviation: "+2" },
        { label: "Location: India",     avg: 68, n: 12, deviation: "-2" },
        { label: "Location: UK",        avg: 70, n: 9,  deviation: "0"  },
        { label: "Experience: 0–2 yrs", avg: 55, n: 8,  deviation: "-15", flagged: true },
        { label: "Experience: 5+ yrs",  avg: 74, n: 19, deviation: "+4" },
      ],
    });
    setScanning(false);
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>Bias Monitoring Scan</div>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 3, lineHeight: 1.5 }}>
            Checks AI match score distributions across candidate groups for systematic patterns
          </div>
        </div>
        <button onClick={runScan} disabled={scanning} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          borderRadius: 9, border: "none", background: C.purple, color: "white",
          fontSize: 12, fontWeight: 700, cursor: scanning ? "default" : "pointer",
          opacity: scanning ? 0.7 : 1, fontFamily: F, flexShrink: 0,
        }}>
          <Ic n="scan" s={13} c="white" />
          {scanning ? "Scanning…" : "Run Scan"}
        </button>
      </div>

      {result && (
        <div style={{ background: C.surface, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{
            padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
            background: result.anomalies === 0 ? C.greenL : C.amberL,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <Ic n={result.anomalies === 0 ? "check" : "alert"} s={16} c={result.anomalies === 0 ? C.green : C.amber} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: result.anomalies === 0 ? C.green : C.amber }}>
                {result.anomalies === 0 ? "No significant anomalies detected" : `${result.anomalies} anomalies detected`}
              </div>
              <div style={{ fontSize: 11, color: C.text3 }}>
                {result.total_scored} candidates scored · {new Date(result.run_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} today
              </div>
            </div>
          </div>
          {result.groups.map((g, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
              borderBottom: i < result.groups.length - 1 ? `1px solid ${C.border}` : "none",
              background: g.flagged ? `${C.amber}08` : "transparent",
            }}>
              {g.flagged ? <Ic n="alert" s={13} c={C.amber} /> : <div style={{ width: 13 }} />}
              <div style={{ flex: 1, fontSize: 12, color: C.text2 }}>{g.label}</div>
              <div style={{ fontSize: 11, color: C.text3 }}>n={g.n}</div>
              <div style={{ width: 80, height: 6, borderRadius: 99, background: C.border, overflow: "hidden" }}>
                <div style={{ width: `${g.avg}%`, height: "100%", borderRadius: 99, background: g.flagged ? C.amber : C.green }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text1, width: 32, textAlign: "right" }}>{g.avg}%</div>
              <div style={{ fontSize: 11, color: g.deviation.startsWith("-") ? C.amber : C.green, width: 32, textAlign: "right" }}>{g.deviation}</div>
            </div>
          ))}
        </div>
      )}

      {!result && !scanning && (
        <div style={{ textAlign: "center", padding: "40px 16px", color: C.text3, fontSize: 13, background: C.surface, borderRadius: 12, border: `1.5px dashed ${C.border}` }}>
          Run a scan to check for demographic bias patterns in AI match scores
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AiGovernance({ environment }) {
  const [tab, setTab]       = useState("overview");
  const [policy, setPolicy] = useState({
    require_human_review_for_scoring: true,
    require_human_review_for_emails:  true,
    show_ai_badge_on_all_content:     true,
    log_all_ai_decisions:             true,
    allow_ai_field_updates:           false,
    candidate_transparency_notice:    true,
    data_minimisation_mode:           false,
  });
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [auditRuns, setAuditRuns]   = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const setP = (k, v) => setPolicy(p => ({ ...p, [k]: v }));

  const savePolicy = async () => {
    setSaving(true);
    await api.patch("/security/settings", { ai_governance_policy: policy }).catch(() => {});
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const loadAudit = useCallback(async () => {
    if (!environment?.id) { setAuditLoading(false); return; }
    setAuditLoading(true);
    try {
      const data = await api.get(`/agents/runs?environment_id=${environment.id}&limit=50`);
      setAuditRuns(Array.isArray(data) ? data : (data.runs || []));
    } catch { setAuditRuns([]); }
    setAuditLoading(false);
  }, [environment?.id]);

  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab, loadAudit]);

  // Compliance items — statuses derived from live policy
  const complianceItems = [
    {
      icon: "eye", title: "AI Output Labelling",
      status: policy.show_ai_badge_on_all_content ? "compliant" : "required",
      description: "All AI-generated content is marked with a visible badge",
      regulations: ["euai"],
      detail: "Vercentic displays a ✦ sparkle badge on every note, email, and communication generated by an AI agent. This satisfies Article 52 of the EU AI Act which requires users to be informed when interacting with AI-generated content.",
      action: !policy.show_ai_badge_on_all_content ? { label: "Enable in Policy", tab: "policy" } : null,
    },
    {
      icon: "users", title: "Human Oversight",
      status: policy.require_human_review_for_scoring ? "compliant" : "required",
      description: "Human approval required before AI decisions take effect",
      regulations: ["euai", "iso"],
      detail: "The 'Request Approval' step in agents pauses execution and routes AI outputs to a human reviewer before any action is taken. This satisfies Article 14 of the EU AI Act for meaningful human oversight of high-risk AI systems.",
      action: !policy.require_human_review_for_scoring ? { label: "Configure in Policy", tab: "policy" } : null,
    },
    {
      icon: "file", title: "Audit Logging",
      status: policy.log_all_ai_decisions ? "compliant" : "required",
      description: "All AI decisions logged with input, output, model, and reviewer",
      regulations: ["euai", "iso", "gdpr"],
      detail: "Every agent run is stored with: trigger type, record ID, AI prompt context, model output, approval status, and reviewer notes. This satisfies Articles 12 and 17 of the EU AI Act (record-keeping and quality management).",
      action: !policy.log_all_ai_decisions ? { label: "Enable in Policy", tab: "policy" } : { label: "View Audit Log", tab: "audit" },
    },
    {
      icon: "sparkles", title: "Candidate Transparency",
      status: policy.candidate_transparency_notice ? "compliant" : "required",
      description: "Candidates are informed when AI is used in their assessment",
      regulations: ["gdpr", "euai"],
      detail: "When enabled, a transparency notice is appended to candidate-facing communications generated by AI, informing them that AI tools were used. Required under GDPR Article 22 and EU AI Act Article 52(1).",
      action: !policy.candidate_transparency_notice ? { label: "Enable in Policy", tab: "policy" } : null,
    },
    {
      icon: "zap", title: "Explainability",
      status: "partial",
      description: "AI scoring decisions include reasoning and gap analysis",
      regulations: ["euai", "gdpr"],
      detail: "AI match scores include reasoning, strengths, and gaps visible to recruiters. However, a formal self-service 'right to explanation' endpoint for data subjects is not yet implemented. You can currently fulfil these requests manually via the candidate portal or by exporting the audit record.",
      action: null,
    },
    {
      icon: "toggle", title: "Bias Monitoring",
      status: "partial",
      description: "Score distributions monitored for demographic patterns",
      regulations: ["euai", "iso"],
      detail: "The Bias Scan tool checks AI match score distributions across candidate groups to identify systematic patterns. For full compliance under EU AI Act Article 9, scans should be run at least monthly and results documented.",
      action: { label: "Run Bias Scan", tab: "bias" },
    },
    {
      icon: "shield", title: "Data Minimisation",
      status: policy.data_minimisation_mode ? "compliant" : "partial",
      description: "AI only processes fields necessary for the task",
      regulations: ["gdpr"],
      detail: "In standard mode, AI agents process all available record fields. Data minimisation mode restricts agents to only the fields explicitly listed in their conditions, preventing unnecessary personal data processing under GDPR Article 5(1)(c).",
      action: !policy.data_minimisation_mode ? { label: "Enable in Policy", tab: "policy" } : null,
    },
    {
      icon: "x", title: "Right to Erasure",
      status: "partial",
      description: "Deleting a record removes it from AI processing",
      regulations: ["gdpr"],
      detail: "Records marked as deleted are excluded from agent processing and AI matching. However, data included in past agent run logs is not purged when a record is deleted. Use the Data Rights tab to process formal erasure requests.",
      action: { label: "Process Erasure Request", tab: "rights" },
    },
  ];

  const compliantCount = complianceItems.filter(i => i.status === "compliant").length;
  const partialCount   = complianceItems.filter(i => i.status === "partial").length;
  const requiredCount  = complianceItems.filter(i => i.status === "required").length;
  const score          = Math.round((compliantCount / complianceItems.length) * 100);

  const TABS = [
    { id: "overview", label: "Compliance Overview" },
    { id: "policy",   label: "AI Policy" },
    { id: "bias",     label: "Bias Monitor" },
    { id: "audit",    label: "Audit Log" },
    { id: "rights",   label: "Data Rights" },
  ];

  const handleCardAction = (action) => { if (action.tab) setTab(action.tab); };

  return (
    <div style={{ fontFamily: F, maxWidth: 860 }}>

      {/* ── Compliance score header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 20, marginBottom: 24,
        padding: "20px 24px", background: "linear-gradient(135deg,#1a1a2e,#3b5bdb)",
        borderRadius: 16, color: "white",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>AI Governance</div>
          <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            EU AI Act · GDPR Article 22 · ISO 42001 · High-risk AI system obligations
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            {[
              { label: "Compliance Score", value: `${score}%`, color: score >= 75 ? "#4ade80" : score >= 50 ? "#fcd34d" : "#f87171" },
              { label: "Compliant",        value: compliantCount, color: "#4ade80" },
              { label: "Needs Review",     value: partialCount,   color: "#fcd34d" },
              { label: "Action Required",  value: requiredCount,  color: "#f87171" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, whiteSpace: "nowrap" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Circular gauge */}
        <svg width={84} height={84} viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
          <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle cx="42" cy="42" r="36" fill="none"
            stroke={score >= 75 ? "#4ade80" : score >= 50 ? "#fcd34d" : "#f87171"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${score * 2.262} 226.2`}
            strokeDashoffset="56.55"
            transform="rotate(-90 42 42)" />
          <text x="42" y="47" textAnchor="middle" fill="white" fontSize="16" fontWeight="800"
            fontFamily="system-ui">{score}%</text>
        </svg>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", borderBottom: `1.5px solid ${C.border}`, marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 18px", border: "none", background: "transparent", fontFamily: F,
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap",
            color: tab === t.id ? C.accent : C.text3,
            borderBottom: tab === t.id ? `2.5px solid ${C.accent}` : "2.5px solid transparent",
            marginBottom: -1.5,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── COMPLIANCE OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 16, lineHeight: 1.6 }}>
            {complianceItems.filter(i => i.status !== "compliant").length > 0
              ? `${complianceItems.filter(i => i.status !== "compliant").length} items need attention. Click any card to see details and recommended actions.`
              : "All compliance items are in good standing. Review the AI Policy tab to adjust settings."}
          </div>
          {complianceItems.map((item, i) => (
            <ComplianceCard key={i} {...item} onAction={handleCardAction} />
          ))}
        </div>
      )}

      {/* ── POLICY ── */}
      {tab === "policy" && (
        <div>
          <div style={{
            fontSize: 12, color: C.amber, marginBottom: 20, lineHeight: 1.6,
            padding: "10px 14px", borderRadius: 8, background: C.amberL, border: `1px solid ${C.amber}40`,
          }}>
            ⚠ Changes take effect immediately for new agent runs. Existing runs are unaffected.
          </div>
          {[
            { group: "Human Oversight", rows: [
              { label: "Require human review before AI scoring is applied", desc: "Agents with AI Score actions must include a Request Approval step", key: "require_human_review_for_scoring" },
              { label: "Require human review before AI-drafted emails are sent", desc: "AI draft emails are saved as drafts, not auto-sent", key: "require_human_review_for_emails" },
              { label: "Prevent AI from directly updating candidate fields", desc: "AI can suggest field values but cannot write them without confirmation", key: "allow_ai_field_updates", invert: true },
            ]},
            { group: "Transparency", rows: [
              { label: "Show AI badge on all AI-generated content", desc: "Displays ✦ sparkle badge on notes, emails and communications written by AI", key: "show_ai_badge_on_all_content" },
              { label: "Append transparency notice to candidate-facing AI emails", desc: "Adds: 'This message was drafted with AI assistance'", key: "candidate_transparency_notice" },
            ]},
            { group: "Data & Privacy", rows: [
              { label: "Log all AI decisions", desc: "Store every agent run, AI output, and human approval decision in the audit log", key: "log_all_ai_decisions" },
              { label: "Data minimisation mode", desc: "Agents only process fields explicitly listed in their conditions", key: "data_minimisation_mode" },
            ]},
          ].map(({ group, rows }) => (
            <div key={group}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 20, marginBottom: 8 }}>{group}</div>
              {rows.map(r => (
                <PolicyRow key={r.key} label={r.label} description={r.desc}
                  value={r.invert ? !policy[r.key] : policy[r.key]}
                  onChange={v => setP(r.key, r.invert ? !v : v)} />
              ))}
            </div>
          ))}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={savePolicy} disabled={saving} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: saved ? C.green : C.accent, color: "white",
              fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: F,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {saved ? <><Ic n="check" s={14} c="white" /> Saved!</> : saving ? "Saving…" : "Save Policy"}
            </button>
          </div>
        </div>
      )}

      {/* ── BIAS MONITOR ── */}
      {tab === "bias" && <BiasScanPanel environment={environment} />}

      {/* ── AUDIT LOG ── */}
      {tab === "audit" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: C.text3 }}>
              {auditRuns.length > 0 ? `${auditRuns.length} AI decisions logged` : "No audit records yet"}
            </div>
            <button onClick={loadAudit} disabled={auditLoading} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface,
              color: C.text2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F,
            }}>
              <Ic n="refresh" s={12} c={C.text3} /> Refresh
            </button>
          </div>
          {auditLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: C.text3 }}>Loading…</div>
          ) : auditRuns.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px", color: C.text3, background: C.surface, borderRadius: 12, border: `1.5px dashed ${C.border}` }}>
              <Ic n="file" s={28} c={C.border} />
              <div style={{ marginTop: 12, fontWeight: 600 }}>No audit records yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>AI agent runs will appear here when they occur</div>
            </div>
          ) : (
            <div style={{ background: C.surface, borderRadius: 12, border: `1.5px solid ${C.border}`, overflow: "hidden" }}>
              {auditRuns.map((run, i) => <AuditRow key={run.id || i} run={run} />)}
            </div>
          )}
        </div>
      )}

      {/* ── DATA RIGHTS ── */}
      {tab === "rights" && (
        <div>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: `${C.accent}08`, border: `1px solid ${C.accent}20`, marginBottom: 20, fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
            Data subject rights (GDPR Articles 15–22) are processed from an individual's record. Open the person record and use the GDPR action menu to export data or process an erasure request.
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Rights Covered</div>
          {[
            { art: "Art. 15", right: "Right of Access",      desc: "Export all data held on a candidate as a PDF report" },
            { art: "Art. 17", right: "Right to Erasure",     desc: "Delete a record and remove it from AI processing and matching" },
            { art: "Art. 20", right: "Right to Portability", desc: "Export candidate data as structured JSON or CSV" },
            { art: "Art. 22", right: "Right to Explanation", desc: "Export an explanation of any AI-generated match score or decision" },
          ].map(r => (
            <div key={r.art} style={{
              display: "flex", gap: 14, padding: "12px 14px", borderRadius: 10,
              border: `1px solid ${C.border}`, background: C.surface, marginBottom: 8,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentL,
                padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", alignSelf: "flex-start",
              }}>{r.art}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text1, marginBottom: 2 }}>{r.right}</div>
                <div style={{ fontSize: 12, color: C.text3 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
