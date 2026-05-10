import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import api from './apiClient.js';

const C = { accent: '#4361EE', text1: '#111827', text2: '#374151', text3: '#6B7280', bg: '#EEF2FF', white: 'white', border: '#E5E7EB' };
const F = "'Space Grotesk', 'DM Sans', system-ui, sans-serif";

function StageDropdown({ steps, currentStepId, linkId, onMove, disabled }) {
  const [open, setOpen]     = useState(false);
  const [pos,  setPos]      = useState({ top:0, left:0 });
  const btnRef = useRef(null);
  const current = steps.find(s => (s.id||s.name) === currentStepId) || steps[0];

  useEffect(() => {
    if (!open) return;
    const h = e => { if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleOpen = e => {
    e.stopPropagation();
    if (disabled) return;
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.right + window.scrollX });
    }
    setOpen(v => !v);
  };

  const dropdown = open && ReactDOM.createPortal(
    <div style={{ position:'absolute', top:pos.top, left:pos.left, transform:'translateX(-100%)',
      background:'white', border:`1px solid ${C.border}`, borderRadius:14,
      boxShadow:'0 12px 32px rgba(0,0,0,.13), 0 2px 8px rgba(0,0,0,.06)',
      zIndex:9999, minWidth:172, overflow:'hidden', fontFamily:F }}>
      <div style={{ padding:'8px 12px 6px', borderBottom:`1px solid ${C.border}`,
        fontSize:10, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'0.07em' }}>
        Move to stage
      </div>
      {steps.map(s => {
        const isCurrent = (s.id||s.name) === currentStepId;
        return (
          <button key={s.id||s.name}
            onClick={e => { e.stopPropagation(); onMove(linkId, s.id||s.name); setOpen(false); }}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9,
              padding:'9px 13px', border:'none',
              background: isCurrent ? '#4361EE0e' : 'transparent',
              cursor:'pointer', fontFamily:F, textAlign:'left', transition:'background .1s' }}
            onMouseEnter={e => !isCurrent && (e.currentTarget.style.background='#f8f7ff')}
            onMouseLeave={e => !isCurrent && (e.currentTarget.style.background='transparent')}>
            <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0,
              background: isCurrent ? C.accent : C.border,
              border:`2px solid ${isCurrent ? C.accent : C.border}`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              {isCurrent && <div style={{ width:6, height:6, borderRadius:'50%', background:'white' }}/>}
            </div>
            <span style={{ fontSize:13, fontWeight: isCurrent ? 600 : 400,
              color: isCurrent ? C.accent : C.text1, flex:1 }}>{s.name}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} disabled={disabled}
        style={{ display:'inline-flex', alignItems:'center', gap:4,
          padding:'3px 9px 3px 10px', borderRadius:20, fontSize:10, fontWeight:700,
          border:`1.5px solid ${open ? C.accent : '#c4b5fd'}`,
          background: open ? '#ede9fe' : '#f5f3ff',
          color:'#6d28d9', cursor: disabled ? 'default' : 'pointer',
          fontFamily:F, whiteSpace:'nowrap', maxWidth:100, transition:'all .12s',
          opacity: disabled ? 0.6 : 1 }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{current?.name || 'Stage'}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ flexShrink:0, opacity:.6 }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {dropdown}
    </>
  );
}

export default function CategoryPipelineBar({ record, environment, workflow, links, allPeople, onLinksChange, onNavigate }) {
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState(null); // category id
  const [addingToCat, setAddingToCat] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [moving, setMoving] = useState(null); // link id being moved

  const envId = environment?.id;

  const loadCategories = useCallback(async () => {
    if (!envId) return;
    const cats = await api.get(`/api/stage-categories?environment_id=${envId}`);
    setCategories(Array.isArray(cats) ? cats : []);
  }, [envId]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Map workflow steps to categories
  const steps = workflow?.steps || [];
  const stepsWithCat = steps.map(s => ({
    ...s,
    category: categories.find(c => c.id === s.category_id) || null,
  }));

  // Group steps by category
  const catMap = {};
  categories.forEach(cat => { catMap[cat.id] = { cat, steps: [] }; });
  const uncategorised = [];
  stepsWithCat.forEach(s => {
    if (s.category && catMap[s.category.id]) catMap[s.category.id].steps.push(s);
    else uncategorised.push(s);
  });

  // Count people per category
  const getPeopleInCat = (cat) => {
    const stepIds = (catMap[cat.id]?.steps || []).map(s => s.id || s.name);
    return (links || []).filter(l => stepIds.includes(l.stage_id || l.current_stage));
  };

  const getPeopleInStep = (step) => {
    return (links || []).filter(l => (l.stage_id || l.current_stage) === (step.id || step.name));
  };

  const linkedPersonIds = new Set((links || []).map(l => l.person_id));
  const availablePeople = (allPeople || []).filter(p => {
    if (linkedPersonIds.has(p.id)) return false;
    const n = `${p.data?.first_name || ''} ${p.data?.last_name || ''}`.toLowerCase();
    return n.includes(pickerSearch.toLowerCase()) || (p.data?.email || '').toLowerCase().includes(pickerSearch.toLowerCase());
  });

  const handleMoveToStep = async (linkId, stepId) => {
    setMoving(linkId);
    await api.patch(`/api/people-links/${linkId}`, { current_stage: stepId });
    if (onLinksChange) await onLinksChange();
    setMoving(null);
  };

  const handleAddPerson = async (person, cat) => {
    const firstStep = catMap[cat.id]?.steps[0];
    if (!firstStep || !record) return;
    await api.post('/api/people-links', {
      record_id: record.id,
      person_id: person.id,
      workflow_id: workflow?.id,
      current_stage: firstStep.id || firstStep.name,
    });
    if (onLinksChange) await onLinksChange();
    setAddingToCat(null);
    setPickerSearch('');
    setExpanded(cat.id);
  };

  const handleRemovePerson = async (link) => {
    await api.delete(`/api/people-links/${link.id}`);
    if (onLinksChange) await onLinksChange();
  };

  const visibleCats = categories.filter(cat => catMap[cat.id]?.steps?.length > 0);

  if (!workflow || steps.length === 0) return null;

  return (
    <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, fontFamily: F }}>
      {/* Category bar */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 20px 0', gap: 2, alignItems: 'stretch' }}>
        {visibleCats.map((cat, idx) => {
          const count = getPeopleInCat(cat).length;
          const isExpanded = expanded === cat.id;
          return (
            <button key={cat.id} onClick={() => setExpanded(isExpanded ? null : cat.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 14px 8px',
                background: isExpanded ? cat.color : 'transparent',
                color: isExpanded ? C.white : C.text2,
                border: `1.5px solid ${isExpanded ? cat.color : C.border}`,
                borderBottom: isExpanded ? `1.5px solid ${cat.color}` : `1.5px solid ${C.border}`,
                borderRadius: idx === 0 ? '8px 0 0 0' : idx === visibleCats.length - 1 ? '0 8px 0 0' : '0',
                cursor: 'pointer', fontFamily: F, minWidth: 80, transition: 'all .15s', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: isExpanded ? C.white : cat.color }}>{count}</span>
              <span style={{ fontSize: 11, fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap' }}>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded category detail */}
      {expanded && (() => {
        const cat = categories.find(c => c.id === expanded);
        if (!cat) return null;
        const catSteps = catMap[cat.id]?.steps || [];
        const catPeople = getPeopleInCat(cat);
        return (
          <div style={{ padding: '12px 20px 16px', background: `${cat.color}08`, borderTop: `2px solid ${cat.color}` }}>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto' }}>
              {catSteps.map(step => {
                const stepPeople = getPeopleInStep(step);
                return (
                  <div key={step.id || step.name} style={{ minWidth: 200, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: 'uppercase',
                      letterSpacing: '.05em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{step.name}</span>
                      <span style={{ background: cat.color, color: C.white, borderRadius: 99, padding: '1px 7px', fontSize: 10 }}>{stepPeople.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {stepPeople.map(link => {
                        const p = (allPeople || []).find(pp => pp.id === link.person_id);
                        if (!p) return null;
                        const name = `${p.data?.first_name || ''} ${p.data?.last_name || ''}`.trim() || p.data?.email || 'Unknown';
                        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        return (
                          <div key={link.id} style={{ background: C.white, border: `1px solid ${C.border}`,
                            borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div onClick={() => onNavigate && onNavigate(p.id)}
                              style={{ width: 28, height: 28, borderRadius: '50%', background: cat.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: C.white, fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, cursor: 'pointer' }}
                                onClick={() => onNavigate && onNavigate(p.id)}>{name}</div>
                              <div style={{ fontSize: 11, color: C.text3 }}>{p.data?.current_title || p.data?.email || ''}</div>
                            </div>
                            <StageDropdown
                              steps={steps}
                              currentStepId={step.id || step.name}
                              linkId={link.id}
                              onMove={handleMoveToStep}
                              disabled={moving === link.id}
                            />
                            <button onClick={() => handleRemovePerson(link)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3,
                                fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
                          </div>
                        );
                      })}
                      {/* Add person to this stage */}
                      {addingToCat === cat.id ? (
                        <div style={{ background: C.white, border: `1px dashed ${cat.color}`, borderRadius: 8, padding: 8 }}>
                          <input autoFocus value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                            placeholder="Search people…"
                            style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 8px',
                              fontSize: 12, fontFamily: F, outline: 'none', boxSizing: 'border-box' }} />
                          <div style={{ maxHeight: 140, overflowY: 'auto', marginTop: 6 }}>
                            {availablePeople.slice(0, 8).map(p => {
                              const name = `${p.data?.first_name || ''} ${p.data?.last_name || ''}`.trim() || p.data?.email || 'Unknown';
                              return (
                                <div key={p.id} onClick={() => handleAddPerson(p, cat)}
                                  style={{ padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                                    color: C.text1, ':hover': {} }}
                                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  {name}
                                </div>
                              );
                            })}
                            {availablePeople.length === 0 && <div style={{ fontSize: 11, color: C.text3, padding: '5px 8px' }}>No matches</div>}
                          </div>
                          <button onClick={() => { setAddingToCat(null); setPickerSearch(''); }}
                            style={{ fontSize: 11, color: C.text3, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingToCat(cat.id); setPickerSearch(''); }}
                          style={{ border: `1px dashed ${cat.color}`, borderRadius: 8, padding: '6px',
                            background: 'transparent', color: cat.color, fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', fontFamily: F, textAlign: 'center', width: '100%' }}>
                          + Add person
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
