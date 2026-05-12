import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../apiClient.js";

const C = { accent: '#4361EE', text1: '#111827', text2: '#374151', text3: '#6B7280', bg: '#EEF2FF', white: 'white', border: '#E5E7EB', red: '#EF4444', accentLight: '#EEF2FF' };
const F = "'Space Grotesk', 'DM Sans', system-ui, sans-serif";

// api calls use apiClient directly

const PRESET_COLORS = ['#3B82F6','#F59E0B','#8B5CF6','#06B6D4','#10B981','#EF4444','#6B7280','#F97316','#EC4899','#14B8A6'];

function CategoryModal({ cat, linkedSteps = [], onSave, onClose }) {
  const [form, setForm] = useState({
    name: cat?.name || '',
    color: cat?.color || '#6B7280',
    description: cat?.description || '',
    is_terminal: cat?.is_terminal || false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const hasSteps = linkedSteps.length > 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: '100%',
        maxWidth: hasSteps ? 720 : 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        fontFamily: F, boxShadow: '0 24px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${form.color}18`,
            border: `2px solid ${form.color}40`, flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>
              {cat ? `Edit — ${cat.name}` : 'New Category'}
            </div>
            {cat?.description && <div style={{ fontSize: 12, color: C.text3, marginTop: 1 }}>{cat.description}</div>}
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: C.text3, fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Body — two column when steps exist */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 0 }}>

          {/* Left — edit form */}
          <div style={{ flex: '0 0 380px', padding: '20px 24px', borderRight: hasSteps ? `1px solid ${C.border}` : 'none' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px',
                fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Colour</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {PRESET_COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)}
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.color === c ? `3px solid ${C.text1}` : '2px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none', transition: 'all .1s' }} />
              ))}
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: 26, height: 26, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0 }} />
            </div>

            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="What does this category represent?"
              style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '8px 10px',
                fontSize: 13, fontFamily: F, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4,
              padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`,
              background: form.is_terminal ? '#FEF3C7' : '#f9fafb' }}>
              <input type="checkbox" checked={form.is_terminal} onChange={e => set('is_terminal', e.target.checked)}
                style={{ accentColor: '#92400E' }}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: form.is_terminal ? '#92400E' : C.text2 }}>Terminal stage</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>End of the workflow process</div>
              </div>
            </label>
          </div>

          {/* Right — linked workflow steps (audit panel) */}
          {hasSteps && (
            <div style={{ flex: 1, padding: '20px 20px', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase',
                letterSpacing: '.06em', marginBottom: 10 }}>
                Linked workflow steps · {linkedSteps.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {linkedSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px',
                    borderRadius: 9, border: `1.5px solid ${C.border}`, background: '#f9fafb' }}>
                    {/* Step colour bar */}
                    <div style={{ width: 3, height: 32, borderRadius: 2,
                      background: form.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.stepName || 'Unnamed step'}
                      </div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.workflowName}
                      </div>
                    </div>
                    {s.automation_type && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99,
                        background: '#EEF2FF', color: C.accent, fontWeight: 700, flexShrink: 0 }}>
                        {s.automation_type.replace(/_/g, ' ')}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>
                      Step {s.order + 1}
                    </span>
                  </div>
                ))}
              </div>
              {linkedSteps.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: C.text3, fontSize: 13 }}>
                  No workflow steps assigned to this category yet.
                </div>
              )}
            </div>
          )}

          {/* No steps — show hint in form area */}
          {!hasSteps && cat && (
            <div style={{ display: 'none' }}/>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          {!hasSteps && cat && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text3 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 8v4M12 16h.01"/></svg>
              No workflow steps use this category yet
            </div>
          )}
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${C.border}`,
            background: 'transparent', color: C.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name.trim()}
            style={{ padding: '9px 24px', borderRadius: 9, border: 'none', background: C.accent,
              color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F,
              opacity: !form.name.trim() ? 0.5 : 1 }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function StageCategoriesSection({ environment }) {
  const [cats, setCats]           = useState([]);
  const [workflows, setWorkflows] = useState([]); // all workflows + steps for this env
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState(null); // null | 'new' | cat object
  const [saving, setSaving]       = useState(false);

  const envId = environment?.id;

  const load = useCallback(async () => {
    if (!envId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [data, wfData] = await Promise.all([
        apiClient.get(`/stage-categories?environment_id=${envId}`),
        apiClient.get(`/workflows?environment_id=${envId}`),
      ]);
      setCats(Array.isArray(data) ? data : []);
      setWorkflows(Array.isArray(wfData) ? wfData : []);
    } catch (err) {
      console.warn('[StageCats] load error:', err?.message || err);
      setCats([]);
    } finally {
      setLoading(false);
    }
  }, [envId]);

  // Build a lookup of category_id → [{stepName, workflowName, order, automation_type}]
  const stepsByCatId = useCallback(() => {
    const map = {};
    workflows.forEach(wf => {
      (wf.steps || []).forEach(step => {
        if (!step.category_id) return;
        if (!map[step.category_id]) map[step.category_id] = [];
        map[step.category_id].push({
          stepName:      step.name || 'Unnamed step',
          workflowName:  wf.name || 'Unnamed workflow',
          order:         step.order ?? 0,
          automation_type: step.automation_type || null,
          workflowId:    wf.id,
        });
      });
    });
    // Sort by workflow name then step order within each category
    Object.values(map).forEach(arr => arr.sort((a, b) =>
      a.workflowName.localeCompare(b.workflowName) || a.order - b.order
    ));
    return map;
  }, [workflows]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing === 'new') {
        await apiClient.post('/stage-categories', { ...form, environment_id: envId });
      } else {
        await apiClient.patch(`/stage-categories/${editing.id}`, form);
      }
      await load();
      setEditing(null);
    } catch (err) {
      console.error('[StageCats] save error:', err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/stage-categories/${cat.id}`);
      await load();
    } catch (err) {
      console.error('[StageCats] delete error:', err?.message);
    }
  };

  const handleMoveUp = async (cat, idx) => {
    if (idx === 0) return;
    const ordered = [...cats];
    [ordered[idx - 1], ordered[idx]] = [ordered[idx], ordered[idx - 1]];
    await apiClient.post('/stage-categories/reorder', { environment_id: envId, ordered_ids: ordered.map(c => c.id) });
    await load();
  };

  const handleMoveDown = async (cat, idx) => {
    if (idx === cats.length - 1) return;
    const ordered = [...cats];
    [ordered[idx], ordered[idx + 1]] = [ordered[idx + 1], ordered[idx]];
    await apiClient.post('/stage-categories/reorder', { environment_id: envId, ordered_ids: ordered.map(c => c.id) });
    await load();
  };

  if (loading) return <div style={{ padding: 32, color: C.text3, fontFamily: F }}>Loading…</div>;

  return (
    <div style={{ fontFamily: F, maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text1 }}>Stage Categories</div>
          <div style={{ fontSize: 13, color: C.text3, marginTop: 2 }}>Group workflow stages into high-level phases for cleaner reporting and UI.</div>
        </div>
        <button onClick={() => setEditing('new')}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: C.white,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>+ Add Category</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cats.map((cat, idx) => (
          <div key={cat.id} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 12,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Colour swatch */}
            <div style={{ width: 12, height: 40, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
            {/* Info */}
            <div style={{ flex: 1 }}>
              {(() => {
              const stepCount = (stepsByCatId()[cat.id] || []).length;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text1 }}>{cat.name}</span>
                  {cat.is_system && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: '#F3F4F6', color: C.text3, fontWeight: 600 }}>system</span>}
                  {cat.is_terminal && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>terminal</span>}
                  {stepCount > 0 && (
                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99,
                      background: `${cat.color}18`, color: cat.color, fontWeight: 700,
                      border: `1px solid ${cat.color}30` }}>
                      {stepCount} step{stepCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              );
            })()}
              {cat.description && <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>{cat.description}</div>}
            </div>
            {/* Sort order */}
            <div style={{ fontSize: 11, color: C.text3, minWidth: 40, textAlign: 'center' }}>#{cat.sort_order + 1}</div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleMoveUp(cat, idx)} disabled={idx === 0}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px',
                  cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? C.text3 : C.text2, fontSize: 12 }}>↑</button>
              <button onClick={() => handleMoveDown(cat, idx)} disabled={idx === cats.length - 1}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px',
                  cursor: idx === cats.length - 1 ? 'default' : 'pointer', color: idx === cats.length - 1 ? C.text3 : C.text2, fontSize: 12 }}>↓</button>
              <button onClick={() => setEditing(cat)}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px',
                  cursor: 'pointer', color: C.text2, fontSize: 12, fontFamily: F }}>Edit</button>
              {!cat.is_system && (
                <button onClick={() => handleDelete(cat)}
                  style={{ background: 'none', border: `1px solid ${C.red}20`, borderRadius: 6, padding: '4px 10px',
                    cursor: 'pointer', color: C.red, fontSize: 12, fontFamily: F }}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CategoryModal
          cat={editing === 'new' ? null : editing}
          linkedSteps={editing !== 'new' ? (stepsByCatId()[editing.id] || []) : []}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
