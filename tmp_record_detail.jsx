/* ─── Record Detail (slide-in panel + full-page 2-col layout) ─────────────── */

// Panel registry — future: load custom panels from object config (Settings > Objects > Panels)
const PANEL_META = {
  notes:       { icon:"messageSquare", label:"Notes",     defaultOpen:true  },
  attachments: { icon:"paperclip",     label:"Files",     defaultOpen:true  },
  activity:    { icon:"activity",      label:"Activity",  defaultOpen:false },
  workflows:   { icon:"zap",           label:"Workflows", defaultOpen:false },
  match:       { icon:"sparkles",      label:"AI Match",  defaultOpen:false },
};

const getDefaultPanelOrder = (objectName) => {
  const base = ["notes","attachments","activity","workflows"];
  if (["Person","Job"].includes(objectName)) base.push("match");
  return base;
};

const RecordDetail = ({ record, fields, allObjects, environment, objectName, objectColor, onClose, fullPage, onToggleFullPage, onUpdate, onDelete }) => {
  const [tab, setTab]           = useState("fields");
  const [editing, setEditing]   = useState({});
  const [notes, setNotes]       = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newNote, setNewNote]   = useState("");
  const [saving, setSaving]     = useState(false);
  const [openPanels, setOpenPanels] = useState({notes:true,attachments:true,activity:false,workflows:false,match:false});
  const [draggingPanel, setDraggingPanel] = useState(null);
  const [dragOverPanel, setDragOverPanel] = useState(null);

  const storageKey = `talentos_panels_${objectName}`;
  const [panelOrder, setPanelOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || getDefaultPanelOrder(objectName); }
    catch { return getDefaultPanelOrder(objectName); }
  });

  const savePanelOrder = (order) => {
    setPanelOrder(order);
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch {}
  };


  const load = useCallback(async () => {
    const [n, att, act] = await Promise.all([
      api.get(`/notes?record_id=${record.id}`),
      api.get(`/attachments?record_id=${record.id}`),
      api.get(`/records/${record.id}/activity`),
    ]);
    setNotes(Array.isArray(n)?n:[]);
    setAttachments(Array.isArray(att)?att:[]);
    setActivity(Array.isArray(act)?act:[]);
  }, [record.id]);

  useEffect(() => { load(); setEditing({}); setTab("fields"); }, [record.id, load]);

  const handleFieldEdit = (key, value) => setEditing(e=>({...e,[key]:value}));
  const handleSaveField = async (key) => {
    setSaving(true);
    const updated = await api.patch(`/records/${record.id}`, { data: { [key]: editing[key] } });
    onUpdate(updated);
    setEditing(e=>{ const n={...e}; delete n[key]; return n; });
    setSaving(false);
  };
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await api.post("/notes", { record_id:record.id, content:newNote, author:"Admin" });
    setNewNote(""); load();
  };
  const handleDeleteNote = async (id) => { await api.del(`/notes/${id}`); load(); };
  const handleAddAttachment = async () => {
    const name = prompt("File name (demo):"); if (!name) return;
    await api.post("/attachments", { record_id:record.id, name, size:0, type:"application/pdf" }); load();
  };

  // Drag handlers for panel reorder
  const onPanelDragStart = (e, id) => { setDraggingPanel(id); e.dataTransfer.effectAllowed="move"; };
  const onPanelDragOver  = (e, id) => { e.preventDefault(); setDragOverPanel(id); };
  const onPanelDrop      = (targetId) => {
    if (!draggingPanel || draggingPanel===targetId) { setDraggingPanel(null); setDragOverPanel(null); return; }
    const next=[...panelOrder];
    const from=next.indexOf(draggingPanel), to=next.indexOf(targetId);
    next.splice(from,1); next.splice(to,0,draggingPanel);
    savePanelOrder(next); setDraggingPanel(null); setDragOverPanel(null);
  };

  const title = recordTitle(record, fields);
  const subtitle = recordSubtitle(record, fields);
  const statusField = fields.find(f=>f.api_key==="status");
  const status = record.data?.status;

  const fieldSections = [
    { label:"Core",       fs: fields.filter((_,i)=>i<7) },
    { label:"Additional", fs: fields.filter((_,i)=>i>=7) },
  ].filter(s=>s.fs.length);


  // ── Shared field panel (used in both slide-out tab and full-page left col) ──
  const FieldsPanel = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      {fieldSections.map(section => (
        <div key={section.label} style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>{section.label}</div>
          <div style={{ background:"#f8f9fc", borderRadius:12, overflow:"hidden", border:`1px solid ${C.border}` }}>
            {section.fs.map((field,i) => {
              const isEditing = editing.hasOwnProperty(field.api_key);
              const val = isEditing ? editing[field.api_key] : record.data?.[field.api_key];
              return (
                <div key={field.id} style={{ display:"flex", alignItems:isEditing?"flex-start":"center", gap:12, padding:"11px 14px", borderBottom:i<section.fs.length-1?`1px solid ${C.border}`:"none", background:isEditing?"#fafbff":"transparent", transition:"background .1s" }}>
                  <div style={{ width:130, fontSize:12, fontWeight:600, color:C.text3, flexShrink:0 }}>{field.name}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    {isEditing
                      ? <FieldEditor field={field} value={val} onChange={v=>handleFieldEdit(field.api_key,v)}/>
                      : <div onClick={()=>!field.is_system&&handleFieldEdit(field.api_key,val)} style={{ cursor:"text", minHeight:22 }}>
                          <FieldValue field={field} value={val}/>
                        </div>
                    }
                  </div>
                  {isEditing ? (
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      <Btn sz="sm" onClick={()=>handleSaveField(field.api_key)} disabled={saving}>Save</Btn>
                      <Btn v="ghost" sz="sm" icon="x" onClick={()=>setEditing(e=>{const n={...e};delete n[field.api_key];return n;})}/>
                    </div>
                  ) : (
                    <button onClick={()=>handleFieldEdit(field.api_key,val)} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, opacity:0, padding:4, display:"flex", transition:"opacity .1s" }}
                      onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                      <Ic n="edit" s={13}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );


  // ── Panel content renderer ──
  const PanelContent = ({ id }) => {
    if (id==="notes") return (
      <div>
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
          <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a note…" rows={3}
            style={{ padding:"10px 12px", borderRadius:10, border:`1px solid ${C.border}`, fontSize:13, fontFamily:F, outline:"none", color:C.text1, resize:"vertical", width:"100%", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <Btn onClick={handleAddNote} disabled={!newNote.trim()} sz="sm">Add Note</Btn>
          </div>
        </div>
        {notes.length===0
          ? <div style={{ textAlign:"center", padding:"20px 0", color:C.text3, fontSize:13 }}>No notes yet</div>
          : notes.map(note=>(
            <div key={note.id} style={{ background:"#f8f9fc", borderRadius:10, padding:"12px 14px", marginBottom:8, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Avatar name={note.author} size={22} color={C.accent}/>
                  <span style={{ fontSize:12, fontWeight:600, color:C.text2 }}>{note.author}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:11, color:C.text3 }}>{new Date(note.created_at).toLocaleString()}</span>
                  <button onClick={()=>handleDeleteNote(note.id)} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:2, display:"flex" }}><Ic n="trash" s={12}/></button>
                </div>
              </div>
              <p style={{ margin:0, fontSize:13, color:C.text1, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{note.content}</p>
            </div>
          ))
        }
      </div>
    );

    if (id==="attachments") return (
      <div>
        <button onClick={handleAddAttachment}
          style={{ width:"100%", border:`2px dashed ${C.border}`, borderRadius:12, padding:"18px", textAlign:"center", cursor:"pointer", background:"transparent", marginBottom:12, fontFamily:F, color:C.text3, transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text3;}}>
          <Ic n="upload" s={18}/><div style={{ fontSize:13, marginTop:4, fontWeight:600 }}>Upload File</div>
        </button>
        {attachments.length===0
          ? <div style={{ textAlign:"center", padding:"16px 0", color:C.text3, fontSize:13 }}>No attachments yet</div>
          : attachments.map(att=>(
            <div key={att.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f8f9fc", borderRadius:10, marginBottom:8, border:`1px solid ${C.border}` }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Ic n="file" s={15} c={C.accent}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text1 }}>{att.name}</div>
                <div style={{ fontSize:11, color:C.text3 }}>{new Date(att.created_at).toLocaleDateString()}</div>
              </div>
              <button onClick={async()=>{await api.del(`/attachments/${att.id}`);load();}} style={{ background:"none", border:"none", cursor:"pointer", color:C.text3, padding:4, display:"flex" }}><Ic n="trash" s={14}/></button>
            </div>
          ))
        }
      </div>
    );


    if (id==="activity") return (
      <div>
        {activity.length===0
          ? <div style={{ textAlign:"center", padding:"28px 0", color:C.text3, fontSize:13 }}>No activity yet</div>
          : activity.map(event=>(
            <div key={event.id} style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:event.action==="created"?"#f0fdf4":C.accentLight, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Ic n={event.action==="created"?"plus":"edit"} s={12} c={event.action==="created"?"#16a34a":C.accent}/>
              </div>
              <div style={{ flex:1, paddingTop:4 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text1, textTransform:"capitalize" }}>{event.action}</div>
                {event.actor && <div style={{ fontSize:11, color:C.text3 }}>by {event.actor}</div>}
                <div style={{ fontSize:11, color:C.text3, marginTop:2 }}>{new Date(event.created_at).toLocaleString()}</div>
                {event.changes && Object.keys(event.changes).length>0 && (
                  <div style={{ marginTop:6, background:"#f8f9fc", borderRadius:8, padding:"8px 10px" }}>
                    {Object.entries(event.changes).slice(0,5).map(([k,v])=>(
                      <div key={k} style={{ fontSize:11, color:C.text2 }}><strong>{k}:</strong> {String(v)?.slice(0,60)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        }
      </div>
    );

    if (id==="workflows") return <RecordWorkflows record={record} objectId={record.object_id} environment={environment}/>;

    if (id==="match") return (
      <div style={{ margin:"-16px" }}>
        <MatchingEngine environment={environment} initialRecord={record} initialObject={{ name:objectName, slug:objectName==="Person"?"people":"jobs" }}/>
      </div>
    );

    return null;
  };


  // ── Collapsible draggable panel card (right col) ──
  const PanelCard = ({ id }) => {
    const meta = PANEL_META[id];
    if (!meta) return null;
    const isOpen = openPanels[id];
    const badge = id==="notes" ? notes.length : id==="attachments" ? attachments.length : 0;
    const isDragOver = dragOverPanel===id;

    return (
      <div draggable onDragStart={e=>onPanelDragStart(e,id)} onDragOver={e=>onPanelDragOver(e,id)} onDrop={()=>onPanelDrop(id)} onDragEnd={()=>{setDraggingPanel(null);setDragOverPanel(null);}}
        style={{ background:C.surface, border:`1.5px solid ${isDragOver?C.accent:C.border}`, borderRadius:14, marginBottom:12, overflow:"hidden", transition:"border-color .15s, opacity .15s", opacity:draggingPanel===id?0.5:1, boxShadow:isDragOver?`0 0 0 3px ${C.accent}22`:"0 1px 4px rgba(0,0,0,.04)" }}>
        {/* Panel header — click to collapse, drag handle on left */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:"pointer", userSelect:"none", borderBottom:isOpen?`1px solid ${C.border}`:"none" }}
          onClick={()=>setOpenPanels(p=>({...p,[id]:!p[id]}))}>
          <div title="Drag to reorder" style={{ color:C.text3, cursor:"grab", padding:"0 2px", display:"flex", flexShrink:0 }} onClick={e=>e.stopPropagation()}>
            <svg width="12" height="18" viewBox="0 0 12 18" fill="none"><circle cx="4" cy="4" r="1.5" fill="currentColor"/><circle cx="9" cy="4" r="1.5" fill="currentColor"/><circle cx="4" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="4" cy="14" r="1.5" fill="currentColor"/><circle cx="9" cy="14" r="1.5" fill="currentColor"/></svg>
          </div>
          <Ic n={meta.icon} s={14} c={C.accent}/>
          <span style={{ flex:1, fontSize:13, fontWeight:700, color:C.text1 }}>{meta.label}</span>
          {badge>0 && <span style={{ background:C.accentLight, color:C.accent, fontSize:11, fontWeight:700, borderRadius:20, padding:"1px 7px" }}>{badge}</span>}
          <span style={{ display:"flex", transition:"transform .2s", transform:isOpen?"rotate(180deg)":"rotate(0deg)" }}><Ic n="chevD" s={14} c={C.text3}/></span>
        </div>
        {isOpen && <div style={{ padding:"16px" }}><PanelContent id={id}/></div>}
      </div>
    );
  };


  // ── Shared header ──
  const Header = () => (
    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 24px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      {fullPage && (
        <button onClick={onClose} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:C.text3, fontSize:13, fontWeight:600, padding:"4px 8px", borderRadius:7, fontFamily:F }}
          onMouseEnter={e=>e.currentTarget.style.background=C.border} onMouseLeave={e=>e.currentTarget.style.background="none"}>
          <Ic n="arrowLeft" s={14}/> Back
        </button>
      )}
      <Avatar name={title} color={objectColor} size={38}/>
      <div style={{ flex:1, minWidth:0 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:C.text1 }}>{title}</h2>
        {subtitle && <div style={{ fontSize:12, color:C.text3, marginTop:1 }}>{subtitle}</div>}
      </div>
      {status && statusField && <Badge color={STATUS_COLORS[status]||C.accent} light>{status}</Badge>}
      <div style={{ display:"flex", gap:6 }}>
        <Btn v="ghost" sz="sm" icon={fullPage?"chevL":"expand"} onClick={onToggleFullPage}/>
        <Btn v="danger" sz="sm" icon="trash" onClick={()=>onDelete(record.id)}/>
        <Btn v="ghost" sz="sm" icon="x" onClick={onClose}/>
      </div>
    </div>
  );

  // ── SLIDE-OUT (600px panel) — tabs layout ──
  const TABS = [
    { id:"fields",      icon:"edit",          label:"Fields" },
    { id:"activity",    icon:"activity",      label:"Activity" },
    { id:"notes",       icon:"messageSquare", label:`Notes${notes.length?` (${notes.length})`:""}` },
    { id:"attachments", icon:"paperclip",     label:`Files${attachments.length?` (${attachments.length})`:""}` },
    { id:"workflows",   icon:"zap",           label:"Workflows" },
    ...( ["Person","Job"].includes(objectName) ? [{ id:"match", icon:"sparkles", label:"AI Match" }] : [] ),
  ];

  if (!fullPage) return (
    <>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.2)", zIndex:899 }} onClick={onClose}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:600, background:C.surface, zIndex:900, display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,.14)", animation:"slideIn .2s ease" }}>
        <Header/>
        <div style={{ display:"flex", gap:0, padding:"0 24px", borderBottom:`1px solid ${C.border}`, flexShrink:0, overflowX:"auto" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"11px 14px", border:"none", background:"transparent", cursor:"pointer", fontFamily:F, fontSize:13, fontWeight:tab===t.id?700:500, color:tab===t.id?C.accent:C.text3, borderBottom:`2px solid ${tab===t.id?C.accent:"transparent"}`, transition:"all .12s", whiteSpace:"nowrap" }}>
              <Ic n={t.icon} s={13}/>{t.label}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:"auto", padding:"24px" }}>
          {tab==="fields"  && <FieldsPanel/>}
          {tab!=="fields"  && <PanelContent id={tab}/>}
        </div>
      </div>
    </>
  );


  // ── FULL PAGE — 2-col layout ──
  return (
    <div style={{ position:"fixed", inset:0, background:"#F4F6FB", zIndex:900, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <Header/>
      {/* 2-col body */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", gap:0 }}>

        {/* LEFT COL — Identity card + Fields */}
        <div style={{ width:420, flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.surface, display:"flex", flexDirection:"column", overflow:"auto" }}>
          {/* Identity card */}
          <div style={{ padding:"24px 24px 16px", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <Avatar name={title} color={objectColor} size={52}/>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:C.text1, lineHeight:1.2 }}>{title}</div>
                {subtitle && <div style={{ fontSize:13, color:C.text3, marginTop:3 }}>{subtitle}</div>}
                <div style={{ marginTop:6 }}>
                  {status && statusField && <Badge color={STATUS_COLORS[status]||C.accent} light>{status}</Badge>}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, fontSize:12 }}>
              <div style={{ padding:"5px 10px", borderRadius:8, background:C.accentLight, color:C.accent, fontWeight:600 }}>{objectName}</div>
              <div style={{ padding:"5px 10px", borderRadius:8, background:"#f8f9fc", color:C.text3, fontWeight:600 }}>
                Created {new Date(record.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
              </div>
            </div>
          </div>
          {/* Fields */}
          <div style={{ flex:1, padding:"20px 24px", overflow:"auto" }}>
            <FieldsPanel/>
          </div>
        </div>

        {/* RIGHT COL — Draggable panel cards */}
        <div style={{ flex:1, overflow:"auto", padding:"20px 24px" }}>
          {/* Panel layout hint */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.text3, textTransform:"uppercase", letterSpacing:"0.08em" }}>Panels</div>
            <div style={{ fontSize:11, color:C.text3 }}>Drag to reorder</div>
          </div>
          {panelOrder.filter(id=>PANEL_META[id]).map(id=>(
            <PanelCard key={id} id={id}/>
          ))}
        </div>
      </div>
    </div>
  );
};

