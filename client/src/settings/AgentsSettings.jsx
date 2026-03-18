/**
 * TalentOS — Interview Agents Settings
 * client/src/settings/AgentsSettings.jsx
 */
import { useState, useEffect, useRef } from "react";

const api = {
  get:   u => fetch(u).then(r => r.json()),
  post:  (u,b) => fetch(u,{method:'POST',  headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()),
  patch: (u,b) => fetch(u,{method:'PATCH', headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()),
  del:   u => fetch(u,{method:'DELETE'}).then(r=>r.json()),
};
const F = "'DM Sans', -apple-system, sans-serif";
const C = { accent:'#4361ee', accentLight:'#eef0ff', bg:'#f7f8fa', white:'#fff',
  text1:'#111827', text2:'#374151', text3:'#6b7280', border:'#e5e7eb', green:'#059669', red:'#e03131' };
const AVATAR_COLORS = ['#6366f1','#0891b2','#059669','#d97706','#e03131','#7c3aed','#db2777','#0284c7'];
const VOICES = [{id:'en-US',label:'English (US)'},{id:'en-GB',label:'English (UK)'},
  {id:'en-AU',label:'English (AU)'},{id:'ar-SA',label:'Arabic (Gulf)'},{id:'fr-FR',label:'French'},{id:'de-DE',label:'German'}];
const TYPE_COLORS = { knockout:'#dc2626', competency:'#2563eb', technical:'#7c3aed', culture:'#059669' };

function Ic({n,s=16,c='currentColor'}) {
  const P = {
    plus:"M12 5v14M5 12h14", x:"M18 6L6 18M6 6l12 12",
    edit:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6", check:"M20 6L9 17l-5-5",
    link:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
    grip:"M9 5h2M13 5h2M9 12h2M13 12h2M9 19h2M13 19h2",
    zap:"M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    briefcase:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={P[n]||''}/></svg>;
}

// ── Question picker ───────────────────────────────────────────────────────────
function QuestionPicker({ environment, selectedIds, onToggle, onImportFromJob }) {
  const [questions, setQuestions] = useState([]);
  const [jobs, setJobs]           = useState([]);
  const [search, setSearch]       = useState('');
  const [showJobPick, setShowJobPick] = useState(false);

  useEffect(() => {
    api.get('/api/question-bank/questions').then(d => setQuestions(Array.isArray(d) ? d : []));
    if (environment?.id) {
      api.get(`/api/objects?environment_id=${environment.id}`).then(objs => {
        const jobObj = (Array.isArray(objs)?objs:[]).find(o=>o.slug==='jobs'||o.name?.toLowerCase()==='jobs');
        if (jobObj) api.get(`/api/records?object_id=${jobObj.id}&environment_id=${environment.id}&limit=50`)
          .then(r=>{const recs=Array.isArray(r)?r:(r.records||[]);
            setJobs(recs.map(rec=>({id:rec.id,title:rec.data?.job_title||rec.data?.title||'Untitled',q_ids:rec.data?.interview_question_ids||[]})));
          });
      });
    }
  }, [environment?.id]);

  const handleImportJob = async (job) => {
    if (!job.q_ids?.length) { alert('This job has no questions linked yet.'); return; }
    const qs = await api.post('/api/question-bank/bulk', { ids: job.q_ids });
    onImportFromJob(Array.isArray(qs) ? qs : []);
    setShowJobPick(false);
  };

  const filtered = questions.filter(q => !search ||
    q.text?.toLowerCase().includes(search.toLowerCase()) ||
    (q.competency||'').toLowerCase().includes(search.toLowerCase()));
  const grouped = {};
  filtered.forEach(q => { const k=q.type||'other'; if(!grouped[k]) grouped[k]=[]; grouped[k].push(q); });

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>setShowJobPick(!showJobPick)}
          style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:C.white,color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:F}}>
          <Ic n="briefcase" s={12}/> Import from Job
        </button>
        <span style={{fontSize:12,color:C.text3,alignSelf:'center'}}>{selectedIds.length} selected</span>
      </div>
      {showJobPick && (
        <div style={{padding:10,background:C.bg,borderRadius:9,border:`1px solid ${C.border}`}}>
          {jobs.length===0 ? <div style={{fontSize:12,color:C.text3}}>No jobs with linked questions found.</div>
            : jobs.map(j=>(
              <button key={j.id} onClick={()=>handleImportJob(j)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',padding:'7px 10px',borderRadius:7,border:`1px solid ${C.border}`,background:C.white,cursor:'pointer',fontFamily:F,marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600,color:C.text1}}>{j.title}</span>
                <span style={{fontSize:11,color:C.text3}}>{j.q_ids?.length||0} questions →</span>
              </button>))}
        </div>
      )}
      <div style={{position:'relative'}}>
        <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}><Ic n="search" s={12} c={C.text3}/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…"
          style={{width:'100%',padding:'7px 10px 7px 30px',borderRadius:8,border:`1px solid ${C.border}`,fontSize:12,fontFamily:F,outline:'none',boxSizing:'border-box'}}/>
      </div>
      {questions.length===0 ? (
        <div style={{padding:16,background:C.bg,borderRadius:9,fontSize:13,color:C.text3,textAlign:'center'}}>
          No questions yet. Add them in Settings → Question Bank.
        </div>
      ) : (
        <div style={{maxHeight:300,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
          {Object.entries(grouped).map(([type,qs])=>(
            <div key={type}>
              <div style={{fontSize:10,fontWeight:800,color:TYPE_COLORS[type]||C.text3,textTransform:'uppercase',padding:'6px 4px 2px',letterSpacing:'0.06em'}}>{type} ({qs.length})</div>
              {qs.map(q=>{
                const sel = selectedIds.includes(q.id);
                return (
                  <label key={q.id} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'7px 8px',borderRadius:7,cursor:'pointer',background:sel?C.accentLight:'transparent',border:`1px solid ${sel?C.accent+'30':'transparent'}`,marginBottom:2}}>
                    <input type="checkbox" checked={sel} onChange={()=>onToggle(q)} style={{marginTop:2,accentColor:C.accent,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:12,color:C.text1,lineHeight:1.4}}>{q.text}</div>
                      {q.competency&&<div style={{fontSize:10,color:C.text3,marginTop:2}}>{q.competency}</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Selected questions (drag to reorder) ─────────────────────────────────────
function SelectedList({ questions, onRemove, onReorder }) {
  const dragIdx = useRef(null);
  if (questions.length === 0) return (
    <div style={{padding:14,textAlign:'center',background:C.bg,borderRadius:9,fontSize:12,color:C.text3,border:`1.5px dashed ${C.border}`}}>
      No questions selected — pick from the bank below.
    </div>
  );
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      {questions.map((q,i)=>(
        <div key={q.id} draggable
          onDragStart={()=>dragIdx.current=i} onDragOver={e=>e.preventDefault()}
          onDrop={()=>{if(dragIdx.current!==null&&dragIdx.current!==i){const r=[...questions];const[m]=r.splice(dragIdx.current,1);r.splice(i,0,m);onReorder(r);}dragIdx.current=null;}}
          style={{display:'flex',alignItems:'flex-start',gap:8,padding:'8px 10px',background:C.white,borderRadius:8,border:`1px solid ${C.border}`,cursor:'grab'}}>
          <div style={{color:C.text3,marginTop:2,flexShrink:0}}><Ic n="grip" s={13} c={C.text3}/></div>
          <div style={{width:18,height:18,borderRadius:'50%',background:C.accent,color:'#fff',fontSize:9,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i+1}</div>
          <div style={{flex:1,fontSize:12,color:C.text1,lineHeight:1.4}}>{q.text}</div>
          <button onClick={()=>onRemove(q.id)} style={{background:'none',border:'none',cursor:'pointer',color:C.text3,padding:2,flexShrink:0}}><Ic n="x" s={12} c={C.text3}/></button>
        </div>
      ))}
      <div style={{fontSize:11,color:C.text3,textAlign:'center',paddingTop:2}}>Drag to reorder · {questions.length} question{questions.length!==1?'s':''}</div>
    </div>
  );
}

// ── Agent Editor Modal ────────────────────────────────────────────────────────
function AgentModal({ agent, environment, onSave, onClose }) {
  const isEdit = !!agent?.id;
  const [tab, setTab] = useState('identity');
  const [saving, setSaving] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [form, setForm] = useState({
    name: agent?.name||'', persona_name: agent?.persona_name||'Alex',
    persona_description: agent?.persona_description||"Hi, I'm Alex. I'm here to learn more about you and your experience.",
    description: agent?.description||'', avatar_color: agent?.avatar_color||'#6366f1',
    voice: agent?.voice||'en-US', is_active: agent?.is_active!==false,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => {
    if (agent?.question_ids?.length) {
      api.post('/api/question-bank/bulk',{ids:agent.question_ids}).then(qs=>{
        const ordered = agent.question_ids.map(id=>(Array.isArray(qs)?qs:[]).find(q=>q.id===id)).filter(Boolean);
        setSelectedQuestions(ordered);
      });
    }
  }, [agent?.id]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, environment_id: environment?.id, trigger_type:'manual', question_ids: selectedQuestions.map(q=>q.id) };
    const result = isEdit ? await api.patch(`/api/agents/${agent.id}`, payload) : await api.post('/api/agents', payload);
    setSaving(false); onSave(result);
  };

  const TABS = [
    {id:'identity',label:'Identity'},
    {id:'questions',label:`Questions${selectedQuestions.length?` (${selectedQuestions.length})`:''}`},
    {id:'voice',label:'Voice'},
    {id:'instructions',label:'Instructions'},
  ];

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:20,width:600,maxHeight:'88vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,.15)'}} onMouseDown={e=>e.stopPropagation()}>
        <div style={{padding:'18px 22px 0',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:800,color:C.text1}}>{isEdit?`Edit: ${agent.persona_name||agent.name}`:'Create Interview Agent'}</div>
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.text3}}><Ic n="x" s={18}/></button>
          </div>
          <div style={{display:'flex',gap:0}}>
            {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'7px 14px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?700:500,fontFamily:F,color:tab===t.id?C.accent:C.text3,borderBottom:`2px solid ${tab===t.id?C.accent:'transparent'}`,marginBottom:-1}}>{t.label}</button>)}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
          {tab==='identity' && (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:5}}>INTERNAL NAME *</label>
                  <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Engineering Screener"
                    style={{width:'100%',padding:'8px 11px',borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:5}}>PERSONA NAME (shown to candidate)</label>
                  <input value={form.persona_name} onChange={e=>set('persona_name',e.target.value)} placeholder="e.g. Alex"
                    style={{width:'100%',padding:'8px 11px',borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:5}}>OPENING INTRODUCTION</label>
                <textarea value={form.persona_description} onChange={e=>set('persona_description',e.target.value)} rows={3}
                  style={{width:'100%',padding:'8px 11px',borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:7}}>AVATAR COLOUR</label>
                <div style={{display:'flex',gap:8}}>{AVATAR_COLORS.map(col=><button key={col} onClick={()=>set('avatar_color',col)} style={{width:26,height:26,borderRadius:'50%',background:col,border:`3px solid ${form.avatar_color===col?'#111':'transparent'}`,cursor:'pointer'}}/>)}</div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:10,padding:'11px 13px',background:C.bg,borderRadius:9,cursor:'pointer'}}>
                <div onClick={()=>set('is_active',!form.is_active)} style={{width:38,height:21,borderRadius:10,background:form.is_active?C.accent:'#d1d5db',cursor:'pointer',position:'relative',transition:'background .2s',flexShrink:0}}>
                  <div style={{width:15,height:15,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:form.is_active?20:3,transition:'left .2s'}}/>
                </div>
                <div><div style={{fontSize:13,fontWeight:600,color:C.text1}}>Active</div><div style={{fontSize:11,color:C.text3}}>Agent is available for use</div></div>
              </label>
            </div>
          )}
          {tab==='questions' && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{padding:'10px 13px',background:C.accentLight,borderRadius:9,fontSize:12,color:C.accent,lineHeight:1.6}}>
                <strong>How questions work:</strong> The agent covers them naturally in conversation — not as a rigid checklist. Drag to reorder. Follow-up probes are used when answers are shallow.
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.text2,marginBottom:7}}>SELECTED QUESTIONS — drag to reorder</div>
                <SelectedList questions={selectedQuestions} onRemove={id=>setSelectedQuestions(p=>p.filter(q=>q.id!==id))} onReorder={setSelectedQuestions}/>
              </div>
              <div style={{borderTop:`1px solid ${C.border}`}}/>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:C.text2,marginBottom:7}}>QUESTION BANK</div>
                <QuestionPicker environment={environment} selectedIds={selectedQuestions.map(q=>q.id)}
                  onToggle={q=>setSelectedQuestions(p=>p.some(s=>s.id===q.id)?p.filter(s=>s.id!==q.id):[...p,q])}
                  onImportFromJob={qs=>setSelectedQuestions(p=>{const ex=new Set(p.map(q=>q.id));return[...p,...qs.filter(q=>!ex.has(q.id))];})}/>
              </div>
            </div>
          )}
          {tab==='voice' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:13,background:C.accentLight,borderRadius:9,fontSize:12,color:C.accent,lineHeight:1.6}}>
                Voice interviews use the browser's built-in Web Speech API — free, no extra services. Works best in Chrome/Edge.
              </div>
              {VOICES.map(v=>(
                <label key={v.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:`1.5px solid ${form.voice===v.id?C.accent:C.border}`,background:form.voice===v.id?C.accentLight:C.white,cursor:'pointer'}}>
                  <input type="radio" name="voice" checked={form.voice===v.id} onChange={()=>set('voice',v.id)} style={{accentColor:C.accent}}/>
                  <span style={{fontSize:13,fontWeight:600,color:C.text1}}>{v.label}</span>
                </label>
              ))}
            </div>
          )}
          {tab==='instructions' && (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{fontSize:13,color:C.text2,lineHeight:1.6}}>Additional instructions for the agent's system prompt. It already knows the candidate's name, the role, and your questions.</div>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={8}
                placeholder={"e.g.\n- Focus on depth for technical questions\n- Be encouraging if candidate seems nervous\n- Ask for specific examples — don't accept vague answers"}
                style={{width:'100%',padding:'10px 12px',borderRadius:9,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',resize:'vertical',lineHeight:1.6,boxSizing:'border-box'}}/>
            </div>
          )}
        </div>
        <div style={{padding:'13px 22px',borderTop:`1px solid ${C.border}`,display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,color:C.text2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:F}}>Cancel</button>
          <button onClick={handleSave} disabled={saving||!form.name.trim()}
            style={{padding:'8px 18px',borderRadius:8,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:F,opacity:saving?.7:1,display:'flex',alignItems:'center',gap:7}}>
            {saving?'Saving…':<><Ic n="check" s={13} c="#fff"/> {isEdit?'Save Changes':'Create Agent'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Link Modal ────────────────────────────────────────────────────────────────
function LinkModal({ agent, environment, onClose }) {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [candId, setCandId]         = useState('');
  const [jobId, setJobId]           = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult]         = useState(null);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    if (!environment?.id) return;
    api.get(`/api/objects?environment_id=${environment.id}`).then(objs => {
      const all=Array.isArray(objs)?objs:[];
      const pObj=all.find(o=>o.slug==='people'||o.name?.toLowerCase()==='people');
      const jObj=all.find(o=>o.slug==='jobs'||o.name?.toLowerCase()==='jobs');
      if (pObj) api.get(`/api/records?object_id=${pObj.id}&environment_id=${environment.id}&limit=100`).then(r=>setCandidates(Array.isArray(r)?r:(r.records||[])));
      if (jObj) api.get(`/api/records?object_id=${jObj.id}&environment_id=${environment.id}&limit=100`).then(r=>setJobs(Array.isArray(r)?r:(r.records||[])));
    });
  }, [environment?.id]);

  const getName = r => { const d=r.data||{}; return [d.first_name,d.last_name].filter(Boolean).join(' ')||d.email||d.job_title||r.id.slice(0,8); };
  const generate = async () => { setGenerating(true); const r=await api.post(`/api/agents/${agent.id}/generate-token`,{candidate_id:candId||null,job_id:jobId||null,environment_id:environment?.id,expires_hours:72}); setResult(r); setGenerating(false); };
  const copy = () => { navigator.clipboard.writeText(`${window.location.origin}/interview/${result.token}`); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.white,borderRadius:16,width:440,padding:22,boxShadow:'0 24px 80px rgba(0,0,0,.15)'}} onMouseDown={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div><div style={{fontSize:15,fontWeight:800,color:C.text1}}>Generate Interview Link</div><div style={{fontSize:12,color:C.text3}}>Agent: {agent.persona_name||agent.name}</div></div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.text3}}><Ic n="x" s={18}/></button>
        </div>
        {!result ? (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:18}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:5}}>CANDIDATE (optional)</label>
                <select value={candId} onChange={e=>setCandId(e.target.value)} style={{width:'100%',padding:'8px 11px',borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',background:C.white}}>
                  <option value="">— No candidate linked —</option>
                  {candidates.map(c=><option key={c.id} value={c.id}>{getName(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.text2,display:'block',marginBottom:5}}>JOB (optional)</label>
                <select value={jobId} onChange={e=>setJobId(e.target.value)} style={{width:'100%',padding:'8px 11px',borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:'none',background:C.white}}>
                  <option value="">— No job linked —</option>
                  {jobs.map(j=><option key={j.id} value={j.id}>{getName(j)}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,color:C.text2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:F}}>Cancel</button>
              <button onClick={generate} disabled={generating} style={{padding:'8px 16px',borderRadius:8,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:700,cursor:generating?'not-allowed':'pointer',fontFamily:F,display:'flex',alignItems:'center',gap:7,opacity:generating?.7:1}}>
                {generating?'Generating…':<><Ic n="link" s={13} c="#fff"/> Generate</>}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div style={{padding:14,background:'#f0fdf4',borderRadius:10,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:8}}>✓ Ready — expires in 72 hours</div>
              <div style={{display:'flex',gap:8}}>
                <div style={{flex:1,padding:'7px 9px',background:C.white,borderRadius:7,border:`1px solid ${C.border}`,fontSize:11,color:C.text2,fontFamily:'monospace',wordBreak:'break-all'}}>
                  {window.location.origin}/interview/{result.token}
                </div>
                <button onClick={copy} style={{padding:'7px 12px',borderRadius:7,border:'none',background:copied?C.green:C.accent,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F,flexShrink:0,transition:'background .2s'}}>
                  {copied?'✓':'Copy'}
                </button>
              </div>
            </div>
            <button onClick={onClose} style={{width:'100%',padding:'9px',borderRadius:8,border:`1.5px solid ${C.border}`,background:C.white,color:C.text2,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:F}}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AgentsSettings({ environment }) {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [linkFor, setLinkFor] = useState(null);

  const load = async () => {
    if (!environment?.id) return;
    setLoading(true);
    const d = await api.get(`/api/agents?environment_id=${environment.id}`);
    setAgents(Array.isArray(d) ? d.filter(a => !a.deleted_at) : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [environment?.id]);

  const handleDelete = async id => { if (!confirm('Delete this agent?')) return; await api.del(`/api/agents/${id}`); load(); };

  return (
    <div style={{fontFamily:F,maxWidth:780}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:C.text1}}>Interview Agents</h2>
          <p style={{margin:'4px 0 0',fontSize:13,color:C.text3}}>AI agents that conduct voice interviews — questions sourced from your Question Bank</p>
        </div>
        <button onClick={()=>setEditing({})} style={{display:'flex',alignItems:'center',gap:7,padding:'8px 16px',borderRadius:9,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F}}>
          <Ic n="plus" s={14} c="#fff"/> New Agent
        </button>
      </div>
      <div style={{padding:'11px 14px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:9,marginBottom:18,fontSize:12,color:'#92400e',display:'flex',alignItems:'center',gap:8}}>
        <Ic n="zap" s={13} c="#d97706"/>
        Set up your questions first in <strong style={{marginLeft:3}}>Settings → Question Bank</strong>, then assign them to an agent.
      </div>
      {loading ? <div style={{textAlign:'center',padding:60,color:C.text3}}>Loading…</div>
        : agents.length === 0 ? (
          <div style={{textAlign:'center',padding:'50px 20px',border:`2px dashed ${C.border}`,borderRadius:14}}>
            <div style={{fontSize:38,marginBottom:12}}>🤖</div>
            <div style={{fontSize:16,fontWeight:700,color:C.text1,marginBottom:6}}>No agents yet</div>
            <div style={{fontSize:13,color:C.text3,marginBottom:20,maxWidth:340,margin:'0 auto 20px'}}>Create an interview agent, select questions, then share the link with candidates.</div>
            <button onClick={()=>setEditing({})} style={{padding:'10px 20px',borderRadius:9,border:'none',background:C.accent,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F}}>Create First Agent</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {agents.map(a=>(
              <div key={a.id} style={{background:C.white,borderRadius:12,border:`1.5px solid ${C.border}`,overflow:'hidden'}}>
                <div style={{height:3,background:a.avatar_color||'#6366f1'}}/>
                <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:a.avatar_color||'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🤖</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontSize:14,fontWeight:700,color:C.text1}}>{a.persona_name||a.name}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:'1px 7px',borderRadius:99,background:a.is_active?'#dcfce7':'#f3f4f6',color:a.is_active?'#166534':C.text3}}>{a.is_active?'Active':'Inactive'}</span>
                    </div>
                    <div style={{fontSize:12,color:C.text3}}>{a.name}{a.question_ids?.length?` · ${a.question_ids.length} questions`:''}</div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setLinkFor(a)} style={{padding:'6px 10px',borderRadius:7,border:`1px solid ${C.border}`,background:C.white,color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:F,display:'flex',alignItems:'center',gap:5}}>
                      <Ic n="link" s={12} c={C.accent}/> Link
                    </button>
                    <button onClick={()=>setEditing(a)} style={{padding:'6px 8px',borderRadius:7,border:`1px solid ${C.border}`,background:C.white,cursor:'pointer',display:'flex',alignItems:'center'}}><Ic n="edit" s={13}/></button>
                    <button onClick={()=>handleDelete(a.id)} style={{padding:'6px 8px',borderRadius:7,border:`1px solid ${C.border}`,background:C.white,cursor:'pointer',color:C.red,display:'flex',alignItems:'center'}}><Ic n="trash" s={13} c={C.red}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      {editing!==null && <AgentModal agent={editing?.id?editing:null} environment={environment} onSave={()=>{setEditing(null);load();}} onClose={()=>setEditing(null)}/>}
      {linkFor && <LinkModal agent={linkFor} environment={environment} onClose={()=>setLinkFor(null)}/>}
    </div>
  );
}
