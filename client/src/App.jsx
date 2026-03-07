import { useState, useEffect, useCallback } from "react";
import SettingsPage from "./Settings.jsx";
import ObjectApp from "./ObjectApp.jsx";

// ─── API Client ───────────────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(`/api${path}`).then(r => r.json()),
  post: (path, body) => fetch(`/api${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  patch: (path, body) => fetch(`/api${path}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path) => fetch(`/api${path}`, { method: "DELETE" }).then(r => r.json()),
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value: "text", label: "Text", icon: "T", group: "Basic" },
  { value: "textarea", label: "Long Text", icon: "¶", group: "Basic" },
  { value: "number", label: "Number", icon: "#", group: "Basic" },
  { value: "email", label: "Email", icon: "@", group: "Basic" },
  { value: "phone", label: "Phone", icon: "☎", group: "Basic" },
  { value: "url", label: "URL", icon: "🔗", group: "Basic" },
  { value: "date", label: "Date", icon: "📅", group: "Date & Time" },
  { value: "datetime", label: "Date & Time", icon: "🕐", group: "Date & Time" },
  { value: "boolean", label: "Boolean", icon: "◉", group: "Basic" },
  { value: "select", label: "Select", icon: "▾", group: "Choice" },
  { value: "multi_select", label: "Multi Select", icon: "☑", group: "Choice" },
  { value: "lookup", label: "Lookup", icon: "↗", group: "Relationship" },
  { value: "multi_lookup", label: "Multi Lookup", icon: "↗↗", group: "Relationship" },
  { value: "currency", label: "Currency", icon: "$", group: "Basic" },
  { value: "rating", label: "Rating", icon: "★", group: "Basic" },
  { value: "rich_text", label: "Rich Text", icon: "Ω", group: "Basic" },
];

const ICONS = ["users", "briefcase", "layers", "star", "heart", "zap", "globe", "flag", "box", "tag", "award", "target", "compass", "database", "grid", "list", "activity", "settings"];
const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const paths = {
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    briefcase: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2",
    layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    plus: "M12 5v14M5 12h14",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    chevronRight: "M9 18l6-6-6-6",
    chevronDown: "M6 9l6 6 6-6",
    grip: "M9 5h2M9 12h2M9 19h2M15 5h2M15 12h2M15 19h2",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    database: "M12 2C8.13 2 5 3.34 5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5c0-1.66-3.13-3-7-3zM5 12c0 1.66 3.13 3 7 3s7-1.34 7-3M5 8c0 1.66 3.13 3 7 3s7-1.34 7-3",
    globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8h.01M12 12v4",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    eyeOff: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
    circle: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    activity: "M22 12h-4l-3 9L9 3l-3 9H2",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
    box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
    award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] && <path d={paths[name]} />}
    </svg>
  );
};

// ─── Utility Components ───────────────────────────────────────────────────────
const Badge = ({ children, color = "#6366f1", light = false }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "2px 8px",
    borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
    background: light ? `${color}18` : color,
    color: light ? color : "white",
    border: `1px solid ${color}30`
  }}>
    {children}
  </span>
);

const Button = ({ children, onClick, variant = "primary", size = "md", icon, disabled, style = {} }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: "inherit", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    border: "none", borderRadius: 8, transition: "all 0.15s ease",
    opacity: disabled ? 0.5 : 1,
    ...(size === "sm" ? { fontSize: 12, padding: "5px 10px" } : { fontSize: 13, padding: "8px 14px" }),
  };
  const variants = {
    primary: { background: "#1a1a2e", color: "white" },
    secondary: { background: "#f5f5f7", color: "#1a1a2e", border: "1px solid #e5e5ea" },
    ghost: { background: "transparent", color: "#6b7280" },
    danger: { background: "#fee2e2", color: "#ef4444" },
  };
  return (
    <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", required, help, style = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.02em" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>}
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e5ea",
        fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%",
        background: "white", color: "#1a1a2e", boxSizing: "border-box",
        ...style
      }}
    />
    {help && <span style={{ fontSize: 11, color: "#9ca3af" }}>{help}</span>}
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", letterSpacing: "0.02em" }}>
      {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>}
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e5ea",
      fontSize: 13, fontFamily: "inherit", outline: "none", background: "white",
      color: "#1a1a2e", cursor: "pointer"
    }}>
      {options.map(opt => (
        <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
      ))}
    </select>
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 99, position: "relative",
      background: checked ? "#1a1a2e" : "#d1d5db", transition: "background 0.2s",
      flexShrink: 0
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "white",
        position: "absolute", top: 2, left: checked ? 18 : 2,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
      }} />
    </div>
    {label && <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>}
  </label>
);

const Modal = ({ title, children, onClose, width = 520 }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: "white", borderRadius: 16, width: "100%", maxWidth: width,
      boxShadow: "0 25px 50px rgba(0,0,0,0.15)", maxHeight: "90vh", overflow: "auto"
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px", borderBottom: "1px solid #f0f0f0"
      }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#9ca3af" }}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// ─── Field Type Pill ──────────────────────────────────────────────────────────
const FieldTypePill = ({ type }) => {
  const ft = FIELD_TYPES.find(f => f.value === type) || { icon: "?", label: type };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px",
      background: "#f5f5f7", borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: "#6b7280", fontFamily: "ui-monospace, monospace"
    }}>
      <span style={{ fontSize: 10 }}>{ft.icon}</span> {ft.label}
    </span>
  );
};

// ─── Add/Edit Field Modal ─────────────────────────────────────────────────────
const FieldModal = ({ field, objectId, environmentId, objects, onSave, onClose }) => {
  const isEdit = !!field?.id;
  const [form, setForm] = useState({
    name: field?.name || "",
    api_key: field?.api_key || "",
    field_type: field?.field_type || "text",
    is_required: field?.is_required || false,
    is_unique: field?.is_unique || false,
    show_in_list: field?.show_in_list !== undefined ? !!field.show_in_list : true,
    show_in_form: field?.show_in_form !== undefined ? !!field.show_in_form : true,
    placeholder: field?.placeholder || "",
    help_text: field?.help_text || "",
    default_value: field?.default_value || "",
    options: field?.options ? (Array.isArray(field.options) ? field.options.join(", ") : field.options) : "",
    lookup_object_id: field?.lookup_object_id || "",
  });
  const [saving, setSaving] = useState(false);
  const [autoKey, setAutoKey] = useState(!isEdit);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v) => {
    set("name", v);
    if (autoKey) {
      set("api_key", v.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/__+/g, "_").replace(/^_|_$/g, ""));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.api_key) return;
    setSaving(true);
    const payload = {
      ...form,
      object_id: objectId,
      environment_id: environmentId,
      options: ["select", "multi_select"].includes(form.field_type)
        ? form.options.split(",").map(s => s.trim()).filter(Boolean)
        : undefined,
    };
    await onSave(payload, field?.id);
    setSaving(false);
  };

  const needsOptions = ["select", "multi_select"].includes(form.field_type);
  const needsLookup = ["lookup", "multi_lookup"].includes(form.field_type);

  return (
    <Modal title={isEdit ? `Edit Field: ${field.name}` : "Add New Field"} onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Field Type *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {FIELD_TYPES.map(ft => (
              <button key={ft.value} onClick={() => set("field_type", ft.value)} style={{
                padding: "8px 6px", borderRadius: 8, border: "2px solid",
                borderColor: form.field_type === ft.value ? "#1a1a2e" : "#e5e5ea",
                background: form.field_type === ft.value ? "#1a1a2e" : "white",
                color: form.field_type === ft.value ? "white" : "#6b7280",
                cursor: "pointer", fontSize: 11, fontWeight: 600, textAlign: "center",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2
              }}>
                <span style={{ fontSize: 14 }}>{ft.icon}</span>
                <span>{ft.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Field Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Current Title" required />
          <Input label="API Key" value={form.api_key} onChange={v => { set("api_key", v); setAutoKey(false); }}
            placeholder="e.g. current_title" help="Used in API and data exports" disabled={isEdit && field?.is_system} />
        </div>

        {needsOptions && (
          <Input label="Options (comma-separated)" value={form.options}
            onChange={v => set("options", v)} placeholder="Option A, Option B, Option C" />
        )}

        {needsLookup && (
          <Select label="Link to Object" value={form.lookup_object_id}
            onChange={v => set("lookup_object_id", v)}
            options={[{ value: "", label: "Select object..." }, ...objects.map(o => ({ value: o.id, label: o.name }))]} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Placeholder" value={form.placeholder} onChange={v => set("placeholder", v)} placeholder="Hint text" />
          <Input label="Help Text" value={form.help_text} onChange={v => set("help_text", v)} placeholder="Description for users" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "#f9f9fb", borderRadius: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>Field Settings</span>
          <Toggle checked={form.is_required} onChange={v => set("is_required", v)} label="Required field" />
          <Toggle checked={form.is_unique} onChange={v => set("is_unique", v)} label="Unique values only" />
          <Toggle checked={form.show_in_list} onChange={v => set("show_in_list", v)} label="Show in list view" />
          <Toggle checked={form.show_in_form} onChange={v => set("show_in_form", v)} label="Show in form" />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.api_key}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Field"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Create Object Modal ──────────────────────────────────────────────────────
const CreateObjectModal = ({ environmentId, onSave, onClose }) => {
  const [form, setForm] = useState({ name: "", plural_name: "", slug: "", icon: "circle", color: "#6366f1", description: "" });
  const [saving, setSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [autoPlural, setAutoPlural] = useState(true);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v) => {
    set("name", v);
    if (autoSlug) set("slug", v.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, ""));
    if (autoPlural) set("plural_name", v + "s");
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    await onSave({ ...form, environment_id: environmentId });
    setSaving(false);
  };

  return (
    <Modal title="Create New Object" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Object Name" value={form.name} onChange={handleNameChange} placeholder="e.g. Application" required />
          <Input label="Plural Name" value={form.plural_name} onChange={v => { set("plural_name", v); setAutoPlural(false); }} placeholder="e.g. Applications" />
        </div>
        <Input label="Slug (URL key)" value={form.slug} onChange={v => { set("slug", v); setAutoSlug(false); }}
          placeholder="e.g. applications" help="Used in API and URLs" />
        <Input label="Description" value={form.description} onChange={v => set("description", v)} placeholder="What is this object used for?" />

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Color</label>
          <div style={{ display: "flex", gap: 8 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set("color", c)} style={{
                width: 28, height: 28, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: 2
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.slug} style={{ background: form.color }}>
            {saving ? "Creating..." : "Create Object"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Field Row ────────────────────────────────────────────────────────────────
const FieldRow = ({ field, onEdit, onDelete }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    background: "white", borderRadius: 10, border: "1px solid #f0f0f0",
    transition: "border-color 0.15s",
  }} onMouseEnter={e => e.currentTarget.style.borderColor = "#d1d5db"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#f0f0f0"}>
    <div style={{ color: "#d1d5db", cursor: "grab", flexShrink: 0 }}>
      <Icon name="grip" size={14} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{field.name}</span>
        {field.is_system ? <Badge color="#6b7280" light>system</Badge> : null}
        {field.is_required ? <Badge color="#ef4444" light>required</Badge> : null}
        {field.is_unique ? <Badge color="#f59e0b" light>unique</Badge> : null}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
        <code style={{ fontSize: 11, color: "#9ca3af", fontFamily: "ui-monospace, monospace" }}>{field.api_key}</code>
        {field.help_text && <span style={{ fontSize: 11, color: "#9ca3af" }}>· {field.help_text}</span>}
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <FieldTypePill type={field.field_type} />
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <span title={field.show_in_list ? "Visible in list" : "Hidden from list"} style={{ color: field.show_in_list ? "#10b981" : "#d1d5db" }}>
          <Icon name={field.show_in_list ? "eye" : "eyeOff"} size={13} />
        </span>
      </div>
      <button onClick={() => onEdit(field)} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, color: "#9ca3af" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f7"; e.currentTarget.style.color = "#374151"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}>
        <Icon name="edit" size={13} />
      </button>
      {!field.is_system && (
        <button onClick={() => onDelete(field)} style={{ background: "none", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, color: "#9ca3af" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#9ca3af"; }}>
          <Icon name="trash" size={13} />
        </button>
      )}
    </div>
  </div>
);

// ─── Object Schema View ───────────────────────────────────────────────────────
const ObjectSchemaView = ({ object, allObjects, environmentId, onBack }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [search, setSearch] = useState("");

  const loadFields = useCallback(async () => {
    const data = await api.get(`/fields?object_id=${object.id}`);
    setFields(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [object.id]);

  useEffect(() => { loadFields(); }, [loadFields]);

  const handleSaveField = async (payload, fieldId) => {
    if (fieldId) await api.patch(`/fields/${fieldId}`, payload);
    else await api.post("/fields", payload);
    await loadFields();
    setShowAddField(false);
    setEditingField(null);
  };

  const handleDeleteField = async (field) => {
    if (!confirm(`Delete field "${field.name}"? This will remove data for all records.`)) return;
    await api.delete(`/fields/${field.id}`);
    loadFields();
  };

  const filtered = fields.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.api_key.includes(search.toLowerCase()));
  const systemFields = filtered.filter(f => f.is_system);
  const customFields = filtered.filter(f => !f.is_system);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#6b7280", display: "flex" }}>
          <Icon name="arrowLeft" size={18} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: object.color || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={object.icon || "circle"} size={16} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>{object.name} Schema</h1>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{fields.length} fields · {object.is_system ? "System object" : "Custom object"}</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fields…"
              style={{ padding: "7px 10px 7px 32px", borderRadius: 8, border: "1px solid #e5e5ea", fontSize: 12, fontFamily: "inherit", outline: "none", width: 200 }} />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
              <Icon name="search" size={13} />
            </span>
          </div>
          <Button icon="plus" onClick={() => setShowAddField(true)}>Add Field</Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading fields…</div>
      ) : (
        <div>
          {systemFields.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>System Fields</span>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
                <Badge color="#6b7280" light>{systemFields.length}</Badge>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {systemFields.map(f => <FieldRow key={f.id} field={f} onEdit={setEditingField} onDelete={handleDeleteField} />)}
              </div>
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>Custom Fields</span>
              <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
              <Badge color="#6366f1" light>{customFields.length}</Badge>
            </div>
            {customFields.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", border: "2px dashed #e5e5ea", borderRadius: 12, color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>＋</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No custom fields yet</p>
                <p style={{ margin: "4px 0 16px", fontSize: 12 }}>Add fields to capture additional data for {object.name}</p>
                <Button icon="plus" onClick={() => setShowAddField(true)}>Add Your First Field</Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {customFields.map(f => <FieldRow key={f.id} field={f} onEdit={setEditingField} onDelete={handleDeleteField} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {(showAddField || editingField) && (
        <FieldModal field={editingField} objectId={object.id} environmentId={environmentId} objects={allObjects}
          onSave={handleSaveField} onClose={() => { setShowAddField(false); setEditingField(null); }} />
      )}
    </div>
  );
};

// ─── Objects List View ────────────────────────────────────────────────────────
const ObjectsListView = ({ environment, onSelectObject, mode = "schema" }) => {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadObjects = useCallback(async () => {
    const data = await api.get(`/objects?environment_id=${environment.id}`);
    setObjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [environment.id]);

  useEffect(() => { loadObjects(); }, [loadObjects]);

  const handleCreate = async (payload) => {
    await api.post("/objects", payload);
    await loadObjects();
    setShowCreate(false);
  };

  const systemObjects = objects.filter(o => o.is_system);
  const customObjects = objects.filter(o => !o.is_system);

  const ObjectCard = ({ obj }) => (
    <div onClick={() => onSelectObject(obj, objects)} style={{
      padding: "18px 20px", background: "white", borderRadius: 14,
      border: "1px solid #f0f0f0", cursor: "pointer", transition: "all 0.15s",
      display: "flex", alignItems: "center", gap: 14
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#f0f0f0"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: obj.color || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={obj.icon || "circle"} size={20} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{obj.plural_name || obj.name}</span>
          {obj.is_system && <Badge color="#6b7280" light>system</Badge>}
        </div>
        {obj.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{obj.description}</p>}
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}><strong>{obj.field_count || 0}</strong> fields</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}><strong>{obj.record_count || 0}</strong> records</span>
        </div>
      </div>
      <Icon name="chevronRight" size={16} color="#d1d5db" />
    </div>
  );

  const title = mode === "app" ? "Choose an Object" : "Data Model";
  const subtitle = mode === "app"
    ? `Select an object to view and manage records in ${environment.name}`
    : `Configure objects and their fields for ${environment.name}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>{title}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{subtitle}</p>
        </div>
        {mode === "schema" && <Button icon="plus" onClick={() => setShowCreate(true)}>New Object</Button>}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[{ label: "Core Objects", items: systemObjects }, { label: "Custom Objects", items: customObjects }].map(group => (
            <div key={group.label}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>{group.label}</span>
                <div style={{ flex: 1, height: 1, background: "#f0f0f0" }} />
              </div>
              {group.items.length === 0 ? (
                <div style={{ padding: "32px 24px", textAlign: "center", border: "2px dashed #e5e5ea", borderRadius: 14, color: "#9ca3af" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>No custom objects yet</p>
                  {mode === "schema" && <Button icon="plus" onClick={() => setShowCreate(true)}>Create Custom Object</Button>}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {group.items.map(o => <ObjectCard key={o.id} obj={o} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateObjectModal environmentId={environment.id} onSave={handleCreate} onClose={() => setShowCreate(false)} />}
    </div>
  );
};

// ─── Environment Badge ────────────────────────────────────────────────────────
const EnvironmentBadge = ({ env, selected, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 7, padding: "6px 12px",
    borderRadius: 8, border: "2px solid", cursor: "pointer",
    borderColor: selected ? env.color || "#6366f1" : "transparent",
    background: selected ? `${env.color || "#6366f1"}10` : "transparent",
    color: selected ? env.color || "#6366f1" : "#6b7280",
    fontSize: 13, fontWeight: selected ? 700 : 500, fontFamily: "inherit",
    transition: "all 0.15s", width: "100%", textAlign: "left"
  }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: env.color || "#6366f1", flexShrink: 0 }} />
    {env.name}
  </button>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [environments, setEnvironments] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [allObjects, setAllObjects] = useState([]);
  const [activeNav, setActiveNav] = useState("app");
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    if (apiOnline !== true) return;
    api.get("/environments").then(data => {
      const envs = Array.isArray(data) ? data : [];
      setEnvironments(envs);
      const def = envs.find(e => e.is_default) || envs[0];
      if (def) setSelectedEnv(def);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [apiOnline]);

  const navSections = [
    {
      label: "Recruit",
      items: [
        { id: "app", icon: "grid", label: "All Objects" },
      ]
    },
    {
      label: "Configure",
      items: [
        { id: "schema", icon: "database", label: "Data Model" },
        { id: "settings", icon: "settings", label: "Settings" },
      ]
    }
  ];

  const switchNav = (id) => {
    setActiveNav(id);
    setSelectedObject(null);
  };

  if (apiOnline === false) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>API Server Not Running</h2>
          <p style={{ color: "#6b7280", lineHeight: 1.6 }}>Start the backend server to use TalentOS.</p>
          <div style={{ background: "#1a1a2e", color: "#a5f3fc", padding: "14px 20px", borderRadius: 10, fontFamily: "ui-monospace, monospace", fontSize: 13, marginTop: 20, textAlign: "left" }}>
            <div style={{ color: "#94a3b8", marginBottom: 4 }}># In the server directory:</div>
            <div>node index.js</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: "'DM Sans', -apple-system, sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "white", borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", padding: "0 0 16px", position: "fixed", height: "100vh", top: 0, left: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1a1a2e, #3b5bdb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 14, fontWeight: 900 }}>T</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>TalentOS</div>
              <div style={{ fontSize: 10, color: "#9ca3af", letterSpacing: "0.05em" }}>PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div style={{ padding: "12px 12px 8px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Environment</div>
          {environments.map(env => (
            <EnvironmentBadge key={env.id} env={env} selected={selectedEnv?.id === env.id} onClick={() => { setSelectedEnv(env); setSelectedObject(null); }} />
          ))}
        </div>

        {/* Nav */}
        <div style={{ padding: "8px 12px", flex: 1 }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>{section.label}</div>
              {section.items.map(item => (
                <button key={item.id} onClick={() => switchNav(item.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeNav === item.id ? "#f0f4ff" : "transparent",
                  color: activeNav === item.id ? "#3b5bdb" : "#6b7280",
                  fontSize: 13, fontWeight: activeNav === item.id ? 700 : 500,
                  fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", marginBottom: 2
                }}>
                  <Icon name={item.icon} size={15} color={activeNav === item.id ? "#3b5bdb" : "#9ca3af"} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}

          {/* Object quick-nav when in app mode */}
          {activeNav === "app" && allObjects.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Objects</div>
              {allObjects.map(obj => (
                <button key={obj.id} onClick={() => setSelectedObject(obj)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: selectedObject?.id === obj.id ? `${obj.color || "#3b5bdb"}12` : "transparent",
                  color: selectedObject?.id === obj.id ? obj.color || "#3b5bdb" : "#6b7280",
                  fontSize: 13, fontWeight: selectedObject?.id === obj.id ? 700 : 400,
                  fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", marginBottom: 1
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: obj.color || "#3b5bdb", flexShrink: 0 }} />
                  {obj.plural_name || obj.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 16px" }}>
          <div style={{ padding: "10px 12px", background: "#f9f9fb", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>API Connected</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: 32, minHeight: "100vh", overflow: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "#9ca3af" }}>Loading…</div>
        ) : !selectedEnv ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>No environments found.</div>
        ) : activeNav === "settings" ? (
          <SettingsPage />
        ) : activeNav === "schema" ? (
          selectedObject
            ? <ObjectSchemaView object={selectedObject} allObjects={allObjects} environmentId={selectedEnv.id} onBack={() => setSelectedObject(null)} />
            : <ObjectsListView environment={selectedEnv} onSelectObject={(obj, objs) => { setSelectedObject(obj); setAllObjects(objs); }} mode="schema" />
        ) : activeNav === "app" ? (
          selectedObject
            ? <ObjectApp object={selectedObject} environment={selectedEnv} />
            : <ObjectsListView environment={selectedEnv} onSelectObject={(obj, objs) => { setSelectedObject(obj); setAllObjects(objs); }} mode="app" />
        ) : null}
      </div>
    </div>
  );
}
