/**
 * HMPortal.jsx — Vercentic Portal Renderer
 * Hiring Manager: dashboard → pipeline kanban → candidate scorecard
 */
import { useState, useEffect, useCallback } from 'react'

const css = (br={}) => ({
  primary: br.primary_color || '#1E293B',
  accent:  br.accent_color  || '#6366F1',
  bg:      '#F1F5F9',
  font:    br.font_family || "'Inter','DM Sans',-apple-system,sans-serif",
})

const STAGE_COLORS = {
  'Applied':             { bg:'#F1F5F9', text:'#64748B', dot:'#94A3B8' },
  'CV Review':           { bg:'#EFF6FF', text:'#3B82F6', dot:'#3B82F6' },
  'Phone Screen':        { bg:'#F0FDF4', text:'#16A34A', dot:'#22C55E' },
  'Recruiter Call':      { bg:'#F0FDF4', text:'#16A34A', dot:'#22C55E' },
  'Technical Screen':    { bg:'#FFF7ED', text:'#EA580C', dot:'#F97316' },
  'Take-Home Task':      { bg:'#FFF7ED', text:'#EA580C', dot:'#F97316' },
  'Technical Interview': { bg:'#FEF3C7', text:'#D97706', dot:'#F59E0B' },
  'Manager Review':      { bg:'#EDE9FE', text:'#7C3AED', dot:'#8B5CF6' },
  'Final Interview':     { bg:'#EDE9FE', text:'#7C3AED', dot:'#8B5CF6' },
  'Culture Fit':         { bg:'#FCE7F3', text:'#DB2777', dot:'#EC4899' },
  'Assessment Centre':   { bg:'#FCE7F3', text:'#DB2777', dot:'#EC4899' },
  'Offer':               { bg:'#D1FAE5', text:'#065F46', dot:'#10B981' },
  'Hired':               { bg:'#D1FAE5', text:'#065F46', dot:'#10B981' },
  'Placed':              { bg:'#D1FAE5', text:'#065F46', dot:'#10B981' },
  'Accepted':            { bg:'#D1FAE5', text:'#065F46', dot:'#10B981' },
  'Rejected':            { bg:'#FEE2E2', text:'#DC2626', dot:'#EF4444' },
  'Withdrawn':           { bg:'#F8FAFC', text:'#94A3B8', dot:'#CBD5E1' },
}
const RATING_LABELS = { 1:'Strong No', 2:'No', 3:'Maybe', 4:'Yes', 5:'Strong Yes' }
const RATING_COLORS = { 1:'#EF4444', 2:'#F97316', 3:'#F59E0B', 4:'#22C55E', 5:'#16A34A' }
const HM_STAGES     = ['Manager Review','Final Interview','Culture Fit','Assessment Centre','Offer']
const STAGE_ORDER   = ['Applied','CV Review','Phone Screen','Recruiter Call','Technical Screen','Take-Home Task','Technical Interview','Manager Review','Final Interview','Culture Fit','Assessment Centre','Offer','Hired','Placed','Accepted']

const Section = ({ children, style={} }) => (
  <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', ...style }}>{children}</div>
)

const Badge = ({ children, color='#94A3B8' }) => (
  <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:99,
    fontSize:11, fontWeight:700, background:`${color}18`, color, whiteSpace:'nowrap' }}>{children}</span>
)

const StageBadge = ({ stage }) => {
  const s = STAGE_COLORS[stage] || { bg:'#F1F5F9', text:'#64748B', dot:'#94A3B8' }
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.text }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {stage}
    </span>
  )
}

const Avatar = ({ name, photo, size=38, color='#6366F1' }) => {
  const initials = name?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?'
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${color}20`, flexShrink:0, overflow:'hidden',
      display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${color}30` }}>
      {photo
        ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{ e.target.style.display='none' }}/>
        : <span style={{ fontSize:size*0.35, fontWeight:700, color }}>{initials}</span>}
    </div>
  )
}

// ── Stage column (kanban) ─────────────────────────────────────────────────────
const StageColumn = ({ stage, candidates, color, onSelect, dimmed }) => {
  const sc = STAGE_COLORS[stage] || { bg:'#F1F5F9', text:'#64748B', dot:'#94A3B8' }
  return (
    <div style={{ minWidth:210, flex:1, opacity:dimmed?0.35:1, transition:'opacity .2s' }}>
      <div style={{ padding:'8px 12px', borderRadius:10, background:sc.bg, border:`1px solid ${sc.dot}30`,
        marginBottom:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:sc.dot }}/>
          <span style={{ fontSize:12, fontWeight:700, color:sc.text }}>{stage}</span>
        </div>
        <span style={{ fontSize:11, fontWeight:700, color:sc.dot, background:'white', padding:'2px 8px', borderRadius:99, border:`1px solid ${sc.dot}30` }}>
          {candidates.length}
        </span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {candidates.length===0 ? (
          <div style={{ padding:'18px 12px', textAlign:'center', fontSize:12, color:'#CBD5E1',
            borderRadius:10, border:'1.5px dashed #E2E8F0', background:'#FAFBFC' }}>No candidates</div>
        ) : candidates.map(c=>(
          <div key={c.person_id||c.id} onClick={()=>onSelect(c)}
            style={{ background:'white', borderRadius:10, border:'1.5px solid #E2E8F0', padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 4px 12px ${color}18`; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <Avatar name={c.name} photo={c.photo} size={32} color={color}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name||'Unknown'}</div>
                <div style={{ fontSize:11, color:'#94A3B8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.title||c.company||''}</div>
              </div>
              {c.rating && (
                <div style={{ width:22, height:22, borderRadius:'50%', background:RATING_COLORS[c.rating],
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'white', flexShrink:0 }}>
                  {c.rating}
                </div>
              )}
            </div>
            {c.location && <div style={{ fontSize:11, color:'#94A3B8' }}>📍 {c.location}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Candidate scorecard panel ─────────────────────────────────────────────────
const CandidatePanel = ({ candidate, job, onClose, color, api, portal }) => {
  const [score, setScore]   = useState(candidate.rating||0)
  const [note, setNote]     = useState('')
  const [saved, setSaved]   = useState(false)
  const [saving, setSaving] = useState(false)
  const d = candidate

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post(`/portals/${portal.id}/feedback`, {
        person_id: d.id, job_id: job?.id, job_title: job?.data?.job_title,
        rating: score, note, stage: d.stage,
      })
    } catch {}
    setSaved(true); setSaving(false)
    setTimeout(()=>setSaved(false), 3000)
  }

  const skills   = Array.isArray(d.skills) ? d.skills : (d.skills?d.skills.split(',').map(s=>s.trim()):[])
  const required = job ? (Array.isArray(job.data?.required_skills)?job.data.required_skills:(job.data?.required_skills||'').split(',').map(s=>s.trim()).filter(Boolean)) : []
  const matched  = skills.filter(s=>required.some(r=>r.toLowerCase().includes(s.toLowerCase())||s.toLowerCase().includes(r.toLowerCase())))
  const matchPct = required.length ? Math.round((matched.length/required.length)*100) : 0

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex' }}>
      <div onClick={onClose} style={{ flex:1, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)' }}/>
      <div style={{ width:480, background:'white', height:'100%', overflowY:'auto', boxShadow:'-8px 0 48px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ padding:'24px', borderBottom:'1px solid #E2E8F0', background:`linear-gradient(135deg,${color}08,${color}03)`, flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
            <StageBadge stage={d.stage||'Unknown'}/>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94A3B8', lineHeight:1 }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <Avatar name={d.name} photo={d.photo} size={56} color={color}/>
            <div>
              <h2 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#0F172A' }}>{d.name}</h2>
              <div style={{ fontSize:14, color:'#475569' }}>{d.title}{d.company?` · ${d.company}`:''}</div>
              {d.location && <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>📍 {d.location}</div>}
            </div>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
          {/* Quick stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              { label:'Experience',    val:d.years_experience?`${d.years_experience} years`:'—' },
              { label:'Notice Period', val:d.notice_period||'—' },
              { label:'Email',         val:d.email||'—' },
              { label:'Phone',         val:d.phone||'—' },
            ].map(({label,val})=>(
              <div key={label} style={{ padding:'10px 14px', borderRadius:10, background:'#F8FAFC', border:'1px solid #E2E8F0' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#0F172A', wordBreak:'break-all' }}>{val}</div>
              </div>
            ))}
          </div>
          {d.summary && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Summary</div>
              <p style={{ margin:0, fontSize:14, color:'#475569', lineHeight:1.7, padding:'12px 16px', background:'#F8FAFC', borderRadius:10, border:'1px solid #E2E8F0' }}>{d.summary}</p>
            </div>
          )}
          {skills.length>0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Skills</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {skills.map(s=><Badge key={s} color={color}>{s}</Badge>)}
              </div>
            </div>
          )}
          {/* Match score */}
          {required.length>0 && skills.length>0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:8 }}>Match to Role</div>
              <div style={{ padding:'14px 16px', borderRadius:10, background:`${color}08`, border:`1px solid ${color}20` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>Skills match</span>
                  <span style={{ fontSize:15, fontWeight:800, color:matchPct>=70?'#16A34A':matchPct>=40?'#F59E0B':'#EF4444' }}>{matchPct}%</span>
                </div>
                <div style={{ height:6, borderRadius:99, background:'#E2E8F0', overflow:'hidden', marginBottom:10 }}>
                  <div style={{ height:'100%', borderRadius:99, width:`${matchPct}%`,
                    background:matchPct>=70?'#22C55E':matchPct>=40?'#F59E0B':'#EF4444', transition:'width .6s ease' }}/>
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {required.slice(0,8).map(r=>{
                    const hit = skills.some(s=>s.toLowerCase().includes(r.toLowerCase())||r.toLowerCase().includes(s.toLowerCase()))
                    return (
                      <span key={r} style={{ fontSize:11, padding:'3px 8px', borderRadius:99, fontWeight:600,
                        background:hit?'#D1FAE5':'#FEE2E2', color:hit?'#065F46':'#DC2626' }}>
                        {hit?'✓':'✗'} {r}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {d.linkedin_url && (
            <div style={{ marginBottom:20 }}>
              <a href={d.linkedin_url} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13, color:'#0A66C2', fontWeight:600, textDecoration:'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                View LinkedIn Profile
              </a>
            </div>
          )}
        </div>
        {/* Scorecard footer */}
        <div style={{ padding:'20px 24px', borderTop:'1px solid #E2E8F0', background:'#FAFBFC', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:10 }}>Your Assessment</div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setScore(n)}
                style={{ flex:1, padding:'10px 4px', borderRadius:10,
                  border:`2px solid ${score>=n?RATING_COLORS[n]:'#E2E8F0'}`,
                  background:score===n?RATING_COLORS[n]:score>n?`${RATING_COLORS[n]}20`:'white',
                  color:score>=n?(score===n?'white':RATING_COLORS[n]):'#94A3B8',
                  cursor:'pointer', fontSize:11, fontWeight:700, fontFamily:'inherit', transition:'all .15s' }}>
                {n}
              </button>
            ))}
          </div>
          {score>0 && (
            <div style={{ padding:'8px 12px', borderRadius:8, background:`${RATING_COLORS[score]}15`,
              color:RATING_COLORS[score], fontSize:12, fontWeight:700, textAlign:'center', marginBottom:12 }}>
              {RATING_LABELS[score]}
            </div>
          )}
          <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3}
            placeholder="Add interview notes, feedback, or observations…"
            style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #E2E8F0', fontSize:13,
              fontFamily:'inherit', resize:'vertical', outline:'none', boxSizing:'border-box', marginBottom:12 }}
            onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor='#E2E8F0'}/>
          <button onClick={handleSave} disabled={saving||(!score&&!note)}
            style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
              background:saved?'#22C55E':(!score&&!note)?'#E2E8F0':color,
              color:(!score&&!note)?'#94A3B8':'white',
              fontSize:14, fontWeight:700, cursor:(!score&&!note)?'default':'pointer', fontFamily:'inherit' }}>
            {saved?'✓ Feedback Saved':saving?'Saving…':'Save Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main HMPortal ─────────────────────────────────────────────────────────────
export default function HMPortal({ portal, objects, api }) {
  const c   = css(portal.branding)
  const br  = portal.branding || {}
  const [reqs, setReqs]               = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [links, setLinks]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeReq, setActiveReq]     = useState(null)
  const [view, setView]               = useState('dashboard')
  const [selected, setSelected]       = useState(null)
  const [filterStage, setFilterStage] = useState('')

  const jobObj    = objects.find(o=>o.slug==='jobs')
  const peopleObj = objects.find(o=>o.slug==='people')

  useEffect(()=>{
    if (!jobObj||!peopleObj) { setLoading(false); return }
    Promise.all([
      api.get(`/records?object_id=${jobObj.id}&environment_id=${portal.environment_id}&limit=100`),
      api.get(`/records?object_id=${peopleObj.id}&environment_id=${portal.environment_id}&limit=500`),
      api.get(`/people-links?environment_id=${portal.environment_id}`),
    ]).then(([jobRes,pplRes,linkRes])=>{
      setReqs((jobRes.records||[]).filter(r=>['Open','Interviewing'].includes(r.data?.status)))
      setAllCandidates(pplRes.records||[])
      setLinks(linkRes.links||linkRes||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  },[jobObj?.id,peopleObj?.id])

  // Build candidate objects from links + records
  const buildCandidate = useCallback((link)=>{
    const person = allCandidates.find(p=>p.id===link.person_id)
    if (!person) return null
    const d = person.data||{}
    return {
      id:person.id, person_id:link.person_id,
      name:`${d.first_name||''} ${d.last_name||''}`.trim()||'Unknown',
      title:d.current_title||'', company:d.current_company||'', location:d.location||'',
      email:d.email||'', phone:d.phone||'', skills:d.skills||[], years_experience:d.years_experience,
      rating:d.rating, summary:d.summary||'', notice_period:d.notice_period||'',
      photo:d.profile_photo||null, linkedin_url:d.linkedin_url||'',
      stage:link.current_stage_name||'Applied', job_id:link.job_id,
    }
  },[allCandidates])

  // Pipeline for active req
  const pipelineData = useCallback(()=>{
    if (!activeReq) return {}
    const map = {}
    links.filter(l=>l.job_id===activeReq.id).forEach(link=>{
      const stage = link.current_stage_name||'Applied'
      if (!map[stage]) map[stage]=[]
      const c2 = buildCandidate(link)
      if (c2) map[stage].push(c2)
    })
    return map
  },[activeReq,links,buildCandidate])

  const pipeline       = pipelineData()
  const pipelineStages = activeReq
    ? Object.keys(pipeline).sort((a,b)=>{
        const ai=STAGE_ORDER.indexOf(a), bi=STAGE_ORDER.indexOf(b)
        return (ai===-1?99:ai)-(bi===-1?99:bi)
      }).filter(s=>!['Rejected','Withdrawn'].includes(s))
    : []

  // Candidates needing HM attention (across all reqs)
  const attentionLinks = links.filter(l=>HM_STAGES.includes(l.current_stage_name))
  const attentionCandidates = attentionLinks.map(l=>{
    const c2   = buildCandidate(l)
    const job  = reqs.find(r=>r.id===l.job_id)
    if (!c2) return null
    return { ...c2, job_title:job?.data?.job_title, job }
  }).filter(Boolean)

  const totalLinks = links.length
  const pending    = links.filter(l=>{ const p=allCandidates.find(x=>x.id===l.person_id); return !p?.data?.rating }).length

  return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:c.font }}>
      {/* Candidate panel */}
      {selected && (
        <CandidatePanel candidate={selected} job={activeReq||reqs.find(r=>r.id===selected.job_id)}
          onClose={()=>setSelected(null)} color={c.accent} api={api} portal={portal}/>
      )}

      {/* Top nav */}
      <div style={{ background:'#0F172A', borderBottom:'1px solid #1E293B' }}>
        <Section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {br.logo_url
                ? <img src={br.logo_url} style={{ height:30, objectFit:'contain' }} alt="logo"/>
                : <div style={{ width:36, height:36, borderRadius:10, background:c.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:14 }}>HM</div>}
              <div>
                <div style={{ color:'white', fontSize:15, fontWeight:700 }}>{br.company_name||'Hiring Manager'} Portal</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>Internal Review Access</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {[{id:'dashboard',label:'Dashboard'},{id:'pipeline',label:'Pipeline'},{id:'all',label:'All Candidates'}].map(t=>(
                <button key={t.id} onClick={()=>{ setView(t.id); if(t.id!=='pipeline') setActiveReq(null) }}
                  style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:c.font,
                    fontSize:12, fontWeight:600,
                    background:view===t.id?c.accent:'rgba(255,255,255,0.07)',
                    color:view===t.id?'white':'rgba(255,255,255,0.5)' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* Stats strip */}
      <div style={{ background:'white', borderBottom:'1px solid #E2E8F0' }}>
        <Section>
          <div style={{ display:'flex', overflowX:'auto' }}>
            {[
              { label:'Open Requisitions',   value:reqs.length,                  color:c.accent },
              { label:'Total in Pipeline',   value:totalLinks,                   color:'#0CA678' },
              { label:'Needs Attention',     value:attentionCandidates.length,   color:'#F59E0B' },
              { label:'Pending Your Review', value:pending,                       color:'#6366F1' },
            ].map((s,i)=>(
              <div key={i} style={{ padding:'16px 28px', borderRight:'1px solid #E2E8F0', flexShrink:0 }}>
                <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{loading?'—':s.value}</div>
                <div style={{ fontSize:11, color:'#94A3B8', fontWeight:600, marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {loading ? (
        <Section style={{ padding:'80px 24px', textAlign:'center' }}>
          <div style={{ fontSize:14, color:'#94A3B8' }}>Loading your hiring data…</div>
        </Section>
      ) : (
        <Section style={{ padding:'32px 24px' }}>

          {/* ── DASHBOARD ── */}
          {view==='dashboard' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, alignItems:'start' }}>
              {/* My open reqs */}
              <div>
                <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800, color:'#0F172A' }}>My Open Requisitions</h2>
                {reqs.length===0 ? (
                  <div style={{ textAlign:'center', padding:'48px', background:'white', borderRadius:16, border:'1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
                    <p style={{ color:'#94A3B8', fontSize:14, margin:0 }}>No open requisitions</p>
                  </div>
                ) : reqs.map(req=>{
                  const reqLinks = links.filter(l=>l.job_id===req.id)
                  const stagesCount = {}
                  reqLinks.forEach(l=>{ stagesCount[l.current_stage_name]=(stagesCount[l.current_stage_name]||0)+1 })
                  return (
                    <div key={req.id} onClick={()=>{ setActiveReq(req); setView('pipeline') }}
                      style={{ background:'white', borderRadius:14, border:'1.5px solid #E2E8F0', padding:'18px 20px', marginBottom:10, cursor:'pointer', transition:'all .15s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=c.accent; e.currentTarget.style.boxShadow=`0 4px 16px ${c.accent}18` }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E2E8F0'; e.currentTarget.style.boxShadow='none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{req.data?.job_title}</div>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {req.data?.department && <Badge color="#6366F1">{req.data.department}</Badge>}
                            {req.data?.location   && <Badge color="#0CA678">📍 {req.data.location}</Badge>}
                          </div>
                        </div>
                        <span style={{ fontSize:20, color:c.accent }}>→</span>
                      </div>
                      {reqLinks.length>0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {Object.entries(stagesCount).slice(0,5).map(([stage,count])=>{
                            const sc = STAGE_COLORS[stage]||{ bg:'#F1F5F9', text:'#64748B' }
                            return <span key={stage} style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, background:sc.bg, color:sc.text }}>{stage}: {count}</span>
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Needs attention */}
              <div>
                <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800, color:'#0F172A' }}>
                  Needs Your Attention
                  {attentionCandidates.length>0 && (
                    <span style={{ marginLeft:10, fontSize:12, fontWeight:700, color:'white', background:'#F59E0B', padding:'2px 10px', borderRadius:99 }}>
                      {attentionCandidates.length}
                    </span>
                  )}
                </h2>
                {attentionCandidates.length===0 ? (
                  <div style={{ textAlign:'center', padding:'48px', background:'white', borderRadius:16, border:'1.5px solid #E2E8F0' }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
                    <p style={{ color:'#94A3B8', fontSize:14, margin:0 }}>All caught up — no pending reviews</p>
                  </div>
                ) : attentionCandidates.map((c2,i)=>{
                  const sc = STAGE_COLORS[c2.stage]||{ dot:c.accent }
                  return (
                    <div key={`${c2.id}-${c2.job_id}-${i}`} onClick={()=>setSelected(c2)}
                      style={{ background:'white', borderRadius:14, padding:'16px 18px', marginBottom:10, cursor:'pointer', transition:'all .15s',
                        border:'1.5px solid #E2E8F0', borderLeft:`4px solid ${sc.dot}` }}
                      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)' }}
                      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <Avatar name={c2.name} photo={c2.photo} size={36} color={c.accent}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{c2.name}</div>
                          <div style={{ fontSize:12, color:'#64748B' }}>{c2.title}{c2.company?` · ${c2.company}`:''}</div>
                        </div>
                        <StageBadge stage={c2.stage}/>
                      </div>
                      {c2.job_title && <div style={{ fontSize:12, color:'#94A3B8' }}>For: <strong style={{ color:'#475569' }}>{c2.job_title}</strong></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PIPELINE ── */}
          {view==='pipeline' && (
            <div>
              {/* Req picker */}
              <div style={{ display:'flex', gap:8, marginBottom:24, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', flexShrink:0 }}>Viewing:</div>
                {reqs.map(r=>(
                  <button key={r.id} onClick={()=>setActiveReq(r)}
                    style={{ padding:'8px 16px', borderRadius:10, border:`2px solid ${activeReq?.id===r.id?c.accent:'#E2E8F0'}`,
                      background:activeReq?.id===r.id?c.accent:'white', color:activeReq?.id===r.id?'white':'#475569',
                      fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:c.font, transition:'all .15s' }}>
                    {r.data?.job_title}
                    {links.filter(l=>l.job_id===r.id).length>0 && (
                      <span style={{ marginLeft:8, fontSize:11, opacity:0.75 }}>({links.filter(l=>l.job_id===r.id).length})</span>
                    )}
                  </button>
                ))}
              </div>

              {!activeReq ? (
                <div style={{ textAlign:'center', padding:'80px', background:'white', borderRadius:20, border:'1.5px solid #E2E8F0' }}>
                  <p style={{ color:'#94A3B8', fontSize:15 }}>Select a requisition above to view its pipeline</p>
                </div>
              ) : pipelineStages.length===0 ? (
                <div style={{ textAlign:'center', padding:'80px', background:'white', borderRadius:20, border:'1.5px solid #E2E8F0' }}>
                  <div style={{ fontSize:32, marginBottom:12 }}>👥</div>
                  <p style={{ color:'#94A3B8', fontSize:15 }}>No candidates in pipeline yet for <strong>{activeReq.data?.job_title}</strong></p>
                </div>
              ) : (
                <div>
                  {/* Stage highlight filters */}
                  <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#94A3B8', flexShrink:0 }}>HIGHLIGHT:</span>
                    {HM_STAGES.filter(s=>pipelineStages.includes(s)).map(s=>{
                      const sc = STAGE_COLORS[s]||{ dot:'#94A3B8', text:'#64748B' }
                      return (
                        <button key={s} onClick={()=>setFilterStage(filterStage===s?'':s)}
                          style={{ padding:'5px 12px', borderRadius:99, border:`1.5px solid ${filterStage===s?sc.dot:'#E2E8F0'}`,
                            background:filterStage===s?sc.dot:'white', color:filterStage===s?'white':sc.text,
                            fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:c.font }}>
                          {s} ({(pipeline[s]||[]).length})
                        </button>
                      )
                    })}
                    {filterStage && (
                      <button onClick={()=>setFilterStage('')}
                        style={{ padding:'5px 12px', borderRadius:99, border:'1.5px solid #E2E8F0', background:'none',
                          color:'#94A3B8', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:c.font }}>
                        Clear ✕
                      </button>
                    )}
                  </div>
                  {/* Kanban */}
                  <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:16, alignItems:'flex-start' }}>
                    {pipelineStages.map(stage=>(
                      <StageColumn key={stage} stage={stage} candidates={pipeline[stage]||[]} color={c.accent}
                        onSelect={setSelected} dimmed={!!filterStage && filterStage!==stage}/>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ALL CANDIDATES ── */}
          {view==='all' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
                <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'#0F172A' }}>All Candidates</h2>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {HM_STAGES.map(s=>{
                    const count = links.filter(l=>l.current_stage_name===s).length
                    return count>0 ? (
                      <button key={s} onClick={()=>setFilterStage(filterStage===s?'':s)}
                        style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${filterStage===s?c.accent:'#E2E8F0'}`,
                          background:filterStage===s?c.accent:'white', color:filterStage===s?'white':'#475569',
                          fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:c.font }}>
                        {s} ({count})
                      </button>
                    ) : null
                  })}
                  {filterStage && (
                    <button onClick={()=>setFilterStage('')}
                      style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #E2E8F0', background:'none',
                        color:'#94A3B8', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:c.font }}>
                      Clear ✕
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
                {links.filter(l=>!filterStage||l.current_stage_name===filterStage).map((link,i)=>{
                  const c2  = buildCandidate(link)
                  const job = reqs.find(r=>r.id===link.job_id)
                  if (!c2) return null
                  const sc = STAGE_COLORS[link.current_stage_name]||{ dot:c.accent }
                  return (
                    <div key={`${link.person_id}-${link.job_id}-${i}`} onClick={()=>setSelected(c2)}
                      style={{ background:'white', borderRadius:14, padding:'18px', cursor:'pointer', transition:'all .15s',
                        border:'1.5px solid #E2E8F0', borderLeft:`4px solid ${sc.dot}` }}
                      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)' }}
                      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <Avatar name={c2.name} photo={c2.photo} size={40} color={c.accent}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:'#0F172A', marginBottom:2 }}>{c2.name}</div>
                          <div style={{ fontSize:12, color:'#64748B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {c2.title}{c2.company?` · ${c2.company}`:''}
                          </div>
                        </div>
                        {c2.rating && (
                          <div style={{ width:26, height:26, borderRadius:'50%', background:RATING_COLORS[c2.rating],
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'white' }}>
                            {c2.rating}
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <StageBadge stage={link.current_stage_name}/>
                        {job && <span style={{ fontSize:11, color:'#94A3B8' }}>{job.data?.job_title}</span>}
                      </div>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            </div>
          )}
        </Section>
      )}

      <div style={{ borderTop:'1px solid #E2E8F0', padding:'20px', textAlign:'center', marginTop:40 }}>
        <p style={{ margin:0, fontSize:11, color:'#94A3B8' }}>Hiring Manager Portal · {br.company_name||''} · Powered by Vercentic</p>
      </div>
    </div>
  )
}
