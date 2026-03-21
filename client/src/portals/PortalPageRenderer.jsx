import { useState, useEffect } from 'react'

const PADDING_MAP = { none:'0px', sm:'24px', md:'56px', lg:'96px', xl:'140px' }

// ─── Lucide SVG icon helper ───────────────────────────────────────────────────
const Icon = ({ path, size=20, color="currentColor", style={} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {path.split('M').filter(Boolean).map((d,i) => <path key={i} d={'M'+d}/>)}
  </svg>
)

const ICONS = {
  briefcase: "20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  lock: "19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  check: "22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
  building: "2 20h20M6 20V10l6-6 6 6v10M10 20v-5h4v5",
  arrowLeft: "19 12H5M12 19l-7-7 7-7",
  search: "21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
}

const Tag = ({ children, color }) => (
  <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:99,
    background:`${color}15`, color, border:`1px solid ${color}30` }}>{children}</span>
)

function getButtonStyle(theme) {
  const base = {
    padding: theme.buttonRadius==='999px' ? '10px 28px' : '9px 22px',
    borderRadius: theme.buttonRadius || theme.borderRadius || '8px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: theme.fontFamily, display: 'inline-block', transition: 'opacity .15s',
  }
  switch (theme.buttonStyle) {
    case 'outline':   return { ...base, background:'transparent', color:theme.primaryColor, border:`2px solid ${theme.primaryColor}` }
    case 'ghost':     return { ...base, background:'transparent', color:theme.primaryColor, border:'none', padding:'9px 4px' }
    case 'underline': return { ...base, background:'transparent', color:theme.primaryColor, border:'none', borderBottom:`2px solid ${theme.primaryColor}`, borderRadius:0, padding:'9px 4px' }
    default:          return { ...base, background:theme.primaryColor, color:'#fff', border:'none' }
  }
}

const ErrorScreen = ({ message }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#FEF2F2', fontFamily:"'Geist', sans-serif" }}>
    <div style={{ textAlign:'center', maxWidth:400, padding:40 }}>
      <Icon path={ICONS.lock} size={56} color="#EF4444" style={{ marginBottom:16 }}/>
      <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Portal Unavailable</h2>
      <p style={{ color:'#6B7280', fontSize:14 }}>{message}</p>
    </div>
  </div>
)

const HeroWidget = ({ cfg, theme }) => {
  const btnStyle = getButtonStyle(theme)
  return (
    <div style={{ padding:'60px 24px', textAlign:'center', background:`linear-gradient(135deg,${theme.primaryColor}22,${theme.secondaryColor||theme.primaryColor}0a)` }}>
      <h1 style={{ margin:'0 0 16px', fontSize:'clamp(28px,5vw,52px)', fontWeight:theme.headingWeight||800, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>
        {cfg.headline||'Your Compelling Headline'}
      </h1>
      <p style={{ margin:'0 0 28px', fontSize:18, color:theme.textColor||'#0F1729', opacity:0.7, maxWidth:600, marginLeft:'auto', marginRight:'auto', fontFamily:theme.fontFamily, lineHeight:1.6 }}>
        {cfg.subheading||'A short description that tells visitors what to expect here.'}
      </p>
      {cfg.ctaText && <a href={cfg.ctaHref||'#jobs'} style={{ ...btnStyle, textDecoration:'none' }}>{cfg.ctaText}</a>}
    </div>
  )
}

const TextWidget = ({ cfg, theme }) => (
  <div style={{ padding:'8px 0', fontFamily:theme.fontFamily }}>
    {cfg.heading && <h2 style={{ margin:'0 0 12px', fontSize:'clamp(20px,3vw,32px)', fontWeight:theme.headingWeight||700, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>{cfg.heading}</h2>}
    {cfg.content && <p style={{ margin:0, fontSize:16, color:theme.textColor||'#0F1729', opacity:0.75, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{cfg.content}</p>}
  </div>
)

const ImageWidget = ({ cfg }) => cfg.url ? (
  <div style={{ borderRadius:12, overflow:'hidden' }}><img src={cfg.url} alt={cfg.alt||''} style={{ width:'100%', display:'block', borderRadius:12 }}/></div>
) : null

const StatsWidget = ({ cfg, theme }) => {
  const stats = cfg.stats || [{ value:'500+', label:'Employees' }, { value:'12', label:'Offices' }, { value:'20+', label:'Countries' }]
  return (
    <div style={{ display:'flex', gap:32, justifyContent:'center', flexWrap:'wrap', padding:'8px 0' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign:'center', minWidth:80 }}>
          <div style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:800, color:theme.primaryColor, fontFamily:theme.headingFont||theme.fontFamily }}>{s.value}</div>
          <div style={{ fontSize:13, color:theme.textColor||'#6B7280', opacity:0.7, marginTop:4, fontFamily:theme.fontFamily }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

const VideoWidget = ({ cfg }) => {
  if (!cfg.url) return null
  let embedUrl = cfg.url
  const yt = cfg.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) embedUrl = `https://www.youtube.com/embed/${yt[1]}`
  const vm = cfg.url.match(/vimeo\.com\/(\d+)/)
  if (vm) embedUrl = `https://player.vimeo.com/video/${vm[1]}`
  return (
    <div style={{ position:'relative', paddingBottom:'56.25%', height:0, overflow:'hidden', borderRadius:12 }}>
      <iframe src={embedUrl} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none', borderRadius:12 }} allowFullScreen/>
    </div>
  )
}

const DividerWidget = ({ theme }) => <div style={{ borderTop:`1px solid ${theme.primaryColor}30`, margin:'8px 0' }}/>
const SpacerWidget = ({ cfg }) => <div style={{ height:cfg.height||'48px' }}/>

const JobsWidget = ({ cfg, theme, portal, api }) => {
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('all')
  const [selected, setSelected] = useState(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!portal?.environment_id) return
    api.get(`/objects?environment_id=${portal.environment_id}`)
      .then(objs => {
        const obj = (Array.isArray(objs)?objs:[]).find(o => o.slug==='jobs')
        if (!obj) return null
        return api.get(`/records?object_id=${obj.id}&environment_id=${portal.environment_id}&limit=200`)
      })
      .then(data => { if (data) setJobs((data?.records||data||[]).filter(r => r.data?.status !== 'Closed' && r.data?.status !== 'Filled')) })
      .catch(() => {})
  }, [portal?.environment_id])

  const depts = ['all', ...new Set(jobs.map(j => j.data?.department).filter(Boolean))]
  const filtered = jobs.filter(j => {
    const d = j.data || {}
    if (dept !== 'all' && d.department !== dept) return false
    if (search && !`${d.job_title} ${d.department} ${d.location}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (selected && applying) return <ApplyForm job={selected} portal={portal} theme={theme} api={api} onBack={()=>setApplying(false)} onSuccess={()=>{setApplying(false);setSelected(null)}}/>
  if (selected) return <JobDetail job={selected} theme={theme} onBack={()=>setSelected(null)} onApply={()=>setApplying(true)}/>

  return (
    <div id="jobs">
      {cfg.heading && <h2 style={{ margin:'0 0 20px', fontSize:'clamp(22px,3vw,34px)', fontWeight:theme.headingWeight||700, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>{cfg.heading}</h2>}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ flex:'1 1 200px', position:'relative', display:'flex', alignItems:'center' }}>
          <Icon path={ICONS.search} size={16} color="#9CA3AF" style={{ position:'absolute', left:12, pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles…"
            style={{ width:'100%', padding:'10px 16px 10px 38px', borderRadius:theme.borderRadius||8, border:'1.5px solid #E8ECF8', fontSize:14, fontFamily:theme.fontFamily, outline:'none', color:theme.textColor||'#0F1729', background:'#fff', boxSizing:'border-box' }}/>
        </div>
        {depts.length > 2 && (
          <select value={dept} onChange={e=>setDept(e.target.value)}
            style={{ padding:'10px 16px', borderRadius:theme.borderRadius||8, border:'1.5px solid #E8ECF8', fontSize:14, fontFamily:theme.fontFamily, outline:'none', color:theme.textColor||'#0F1729', background:'#fff', cursor:'pointer' }}>
            {depts.map(d => <option key={d} value={d}>{d==='all'?'All departments':d}</option>)}
          </select>
        )}
      </div>
      <p style={{ fontSize:13, color:theme.textColor||'#6B7280', opacity:0.6, marginBottom:16, fontFamily:theme.fontFamily }}>{filtered.length} open position{filtered.length!==1?'s':''}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(job => {
          const d = job.data||{}
          return (
            <div key={job.id} onClick={() => setSelected(job)}
              style={{ background:'#fff', borderRadius:theme.borderRadius||12, border:'1.5px solid #E8ECF8', padding:'18px 24px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=theme.primaryColor;e.currentTarget.style.boxShadow=`0 4px 20px ${theme.primaryColor}20`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#E8ECF8';e.currentTarget.style.boxShadow='none'}}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${theme.primaryColor}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon path={ICONS.briefcase} size={20} color={theme.primaryColor}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:16, fontWeight:700, color:theme.textColor||'#0F1729', fontFamily:theme.fontFamily, marginBottom:4 }}>{d.job_title||'Open Role'}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {d.department&&<Tag color="#6366F1">{d.department}</Tag>}
                  {d.location&&<Tag color="#0CA678">{d.location}</Tag>}
                  {d.work_type&&<Tag color="#F79009">{d.work_type}</Tag>}
                  {d.employment_type&&<Tag color="#9DA8C7">{d.employment_type}</Tag>}
                </div>
              </div>
              <span style={{ ...getButtonStyle(theme), textDecoration:'none', fontSize:13, padding:'8px 16px' }}>View Role →</span>
            </div>
          )
        })}
        {filtered.length===0 && <div style={{ textAlign:'center', padding:'48px 24px', color:theme.textColor||'#6B7280', opacity:0.5, fontFamily:theme.fontFamily }}>No open positions match your search.</div>}
      </div>
    </div>
  )
}

const JobDetail = ({ job, theme, onBack, onApply }) => {
  const d = job.data||{}
  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:theme.primaryColor, fontWeight:600, fontSize:14, padding:'0 0 20px', fontFamily:theme.fontFamily, display:'flex', alignItems:'center', gap:6 }}>
        <Icon path={ICONS.arrowLeft} size={14} color={theme.primaryColor}/> Back to all jobs
      </button>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF8', padding:32, marginBottom:20 }}>
        <h1 style={{ margin:'0 0 12px', fontSize:28, fontWeight:800, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>{d.job_title||'Open Role'}</h1>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
          {d.department&&<Tag color="#6366F1">{d.department}</Tag>}
          {d.location&&<Tag color="#0CA678">{d.location}</Tag>}
          {d.work_type&&<Tag color="#F79009">{d.work_type}</Tag>}
        </div>
        {d.summary&&<p style={{ fontSize:15, color:theme.textColor||'#4B5675', lineHeight:1.8, marginBottom:24, fontFamily:theme.fontFamily }}>{d.summary}</p>}
        {d.description&&<div style={{ fontSize:14, color:theme.textColor||'#4B5675', lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:theme.fontFamily, marginBottom:24 }}>{d.description}</div>}
        <button onClick={onApply} style={{ ...getButtonStyle(theme), border:'none', cursor:'pointer', fontFamily:theme.fontFamily, fontSize:14, fontWeight:700 }}>Apply for this role →</button>
      </div>
    </div>
  )
}

const ApplyForm = ({ job, portal, theme, api, onBack, onSuccess }) => {
  const d = job.data||{}
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', cover_note:'' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const inp = { width:'100%', padding:'10px 14px', borderRadius:theme.borderRadius||8, border:'1.5px solid #E8ECF8', fontSize:14, fontFamily:theme.fontFamily, outline:'none', boxSizing:'border-box', color:theme.textColor||'#0F1729' }
  const handleSubmit = async () => {
    if (!form.first_name||!form.email) return
    setBusy(true); setErr('')
    try {
      const res = await api.post(`/portals/${portal.id}/apply`, { ...form, job_id:job.id, job_title:d.job_title||'' })
      if (res.error) { setErr(res.error); setBusy(false); return }
      setDone(true); setTimeout(onSuccess, 2500)
    } catch { setErr('Something went wrong. Please try again.'); setBusy(false) }
  }
  if (done) return (
    <div style={{ textAlign:'center', padding:'60px 24px' }}>
      <Icon path={ICONS.check} size={64} color={theme.primaryColor} style={{ marginBottom:16 }}/>
      <h2 style={{ fontSize:24, fontWeight:800, color:theme.textColor||'#0F1729', marginBottom:8, fontFamily:theme.headingFont||theme.fontFamily }}>Application Submitted!</h2>
      <p style={{ color:theme.textColor||'#6B7280', opacity:0.7, fontFamily:theme.fontFamily }}>Thank you {form.first_name}. We'll be in touch soon.</p>
    </div>
  )
  return (
    <div>
      <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:theme.primaryColor, fontWeight:600, fontSize:14, padding:'0 0 20px', fontFamily:theme.fontFamily, display:'flex', alignItems:'center', gap:6 }}>
        <Icon path={ICONS.arrowLeft} size={14} color={theme.primaryColor}/> Back to job
      </button>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #E8ECF8', padding:32, maxWidth:560 }}>
        <h2 style={{ margin:'0 0 24px', fontSize:22, fontWeight:800, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>Apply — {d.job_title}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div><label style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#6B7280', opacity:0.7, display:'block', marginBottom:5, fontFamily:theme.fontFamily }}>First name *</label><input value={form.first_name} onChange={e=>set('first_name',e.target.value)} style={inp}/></div>
          <div><label style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#6B7280', opacity:0.7, display:'block', marginBottom:5, fontFamily:theme.fontFamily }}>Last name</label><input value={form.last_name} onChange={e=>set('last_name',e.target.value)} style={inp}/></div>
        </div>
        <div style={{ marginBottom:14 }}><label style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#6B7280', opacity:0.7, display:'block', marginBottom:5, fontFamily:theme.fontFamily }}>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} style={inp}/></div>
        <div style={{ marginBottom:14 }}><label style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#6B7280', opacity:0.7, display:'block', marginBottom:5, fontFamily:theme.fontFamily }}>Phone</label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} style={inp}/></div>
        <div style={{ marginBottom:20 }}><label style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#6B7280', opacity:0.7, display:'block', marginBottom:5, fontFamily:theme.fontFamily }}>Cover note</label><textarea value={form.cover_note} onChange={e=>set('cover_note',e.target.value)} rows={4} style={{ ...inp, resize:'vertical' }}/></div>
        {err&&<p style={{ color:'#EF4444', fontSize:13, marginBottom:14, fontFamily:theme.fontFamily }}>{err}</p>}
        <button onClick={handleSubmit} disabled={busy||!form.first_name||!form.email}
          style={{ ...getButtonStyle(theme), border:'none', cursor:busy?'wait':'pointer', fontFamily:theme.fontFamily, fontSize:14, fontWeight:700, opacity:(busy||!form.first_name||!form.email)?0.6:1 }}>
          {busy ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

const TeamWidget = ({ cfg, theme, portal, api }) => {
  const [people, setPeople] = useState([])
  useEffect(() => {
    if (!portal?.environment_id) return
    api.get(`/objects?environment_id=${portal.environment_id}`)
      .then(objs => { const po=(Array.isArray(objs)?objs:[]).find(o=>o.slug==='people'); if(!po) return null; return api.get(`/records?object_id=${po.id}&environment_id=${portal.environment_id}&limit=12`) })
      .then(data => { if(data) setPeople((data?.records||data||[]).filter(r=>r.data?.person_type==='Employee'||!r.data?.person_type)) })
      .catch(()=>{})
  }, [portal?.environment_id])
  return (
    <div>
      {cfg.heading&&<h2 style={{ margin:'0 0 20px', fontSize:24, fontWeight:700, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>{cfg.heading}</h2>}
      <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
        {people.slice(0,8).map(p => {
          const d=p.data||{}; const name=[d.first_name,d.last_name].filter(Boolean).join(' ')||d.email||'Team Member'
          const initials=name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
          return (
            <div key={p.id} style={{ textAlign:'center', width:100 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:`${theme.primaryColor}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontSize:22, fontWeight:700, color:theme.primaryColor, overflow:'hidden' }}>
                {d.photo?<img src={d.photo} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }}/>:initials}
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:theme.textColor||'#0F1729', fontFamily:theme.fontFamily }}>{name}</div>
              {d.current_title&&<div style={{ fontSize:11, color:theme.textColor||'#6B7280', opacity:0.6, fontFamily:theme.fontFamily }}>{d.current_title}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const FormWidget = ({ cfg, theme }) => {
  const inp = { width:'100%', padding:'10px 14px', borderRadius:theme.borderRadius||8, border:'1.5px solid #E8ECF8', fontSize:14, fontFamily:theme.fontFamily, outline:'none', boxSizing:'border-box', marginBottom:12 }
  return (
    <div style={{ maxWidth:480 }}>
      {cfg.title&&<h3 style={{ margin:'0 0 20px', fontSize:20, fontWeight:700, color:theme.textColor||'#0F1729', fontFamily:theme.headingFont||theme.fontFamily }}>{cfg.title}</h3>}
      <input placeholder="Your name" style={inp}/>
      <input placeholder="Email address" type="email" style={inp}/>
      <textarea placeholder="Message" rows={4} style={{ ...inp, resize:'vertical' }}/>
      <button style={{ ...getButtonStyle(theme), border:'none', cursor:'pointer', fontFamily:theme.fontFamily, fontSize:14, fontWeight:700 }}>Send</button>
    </div>
  )
}

const Widget = ({ cell, theme, portal, api }) => {
  const cfg = cell.widgetConfig||{}
  switch (cell.widgetType) {
    case 'hero':    return <HeroWidget    cfg={cfg} theme={theme}/>
    case 'text':    return <TextWidget    cfg={cfg} theme={theme}/>
    case 'image':   return <ImageWidget   cfg={cfg}/>
    case 'stats':   return <StatsWidget   cfg={cfg} theme={theme}/>
    case 'video':   return <VideoWidget   cfg={cfg}/>
    case 'divider': return <DividerWidget theme={theme}/>
    case 'spacer':  return <SpacerWidget  cfg={cfg}/>
    case 'jobs':    return <JobsWidget    cfg={cfg} theme={theme} portal={portal} api={api}/>
    case 'team':    return <TeamWidget    cfg={cfg} theme={theme} portal={portal} api={api}/>
    case 'form':    return <FormWidget    cfg={cfg} theme={theme}/>
    default:        return null
  }
}

const PortalRow = ({ row, theme, portal, api }) => {
  const padding = PADDING_MAP[row.padding]||'56px'
  const cellFlex = (ci, total, preset) => {
    if (preset==='1') return '1 1 100%'
    if (preset==='1-2') return ci===0?'0 0 33%':'0 0 67%'
    if (preset==='2-1') return ci===0?'0 0 67%':'0 0 33%'
    return `1 1 ${Math.floor(100/total)}%`
  }
  const bgStyle = {}
  if (row.bgColor) bgStyle.background = row.bgColor
  if (row.bgImage) { bgStyle.backgroundImage=`url(${row.bgImage})`; bgStyle.backgroundSize='cover'; bgStyle.backgroundPosition='center' }
  return (
    <div style={{ position:'relative', ...bgStyle }}>
      {row.bgImage&&(row.overlayOpacity||0)>0&&<div style={{ position:'absolute', inset:0, background:`rgba(0,0,0,${(row.overlayOpacity||0)/100})`, pointerEvents:'none' }}/>}
      <div style={{ position:'relative', maxWidth:theme.maxWidth||'1200px', margin:'0 auto', padding:`${padding} 24px`, boxSizing:'border-box' }}>
        <div style={{ display:'flex', gap:32, flexWrap:'wrap', alignItems:'flex-start' }}>
          {(row.cells||[]).map((cell, ci) => (
            <div key={cell.id} style={{ flex:cellFlex(ci,(row.cells||[]).length,row.preset), minWidth:0 }}>
              {cell.widgetType&&<Widget cell={cell} theme={theme} portal={portal} api={api}/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PortalNav = ({ portal, theme, currentPage, onNav, pages }) => (
  <nav style={{ position:'sticky', top:0, zIndex:100, background:theme.bgColor||'#fff', borderBottom:`1px solid ${theme.primaryColor}18`, boxShadow:'0 1px 8px rgba(0,0,0,.06)' }}>
    <div style={{ maxWidth:theme.maxWidth||'1200px', margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
      <div style={{ fontSize:18, fontWeight:800, color:theme.primaryColor, fontFamily:theme.headingFont||theme.fontFamily }}>{portal.branding?.company_name||portal.name}</div>
      {pages.length>1&&(
        <div style={{ display:'flex', gap:4 }}>
          {pages.map(pg=>(
            <button key={pg.id} onClick={()=>onNav(pg)} style={{ background:'none', border:'none', cursor:'pointer', padding:'6px 14px', borderRadius:8, fontSize:14, fontWeight:currentPage?.id===pg.id?700:500, color:currentPage?.id===pg.id?theme.primaryColor:(theme.textColor||'#374151'), fontFamily:theme.fontFamily }}>{pg.name}</button>
          ))}
        </div>
      )}
    </div>
  </nav>
)

export default function PortalPageRenderer({ portal, api }) {
  const theme = portal.theme || portal.branding || {}
  const pages = portal.pages || []
  const [currentPage, setCurrentPage] = useState(pages[0]||null)

  useEffect(() => {
    const font = theme.fontFamily||theme.headingFont
    if (!font) return
    const name = font.replace(/['"]/g,'').split(',')[0].trim()
    const link = document.createElement('link')
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700;800&display=swap`
    link.rel = 'stylesheet'; document.head.appendChild(link)
  }, [theme.fontFamily])

  if (!pages.length||!currentPage) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', fontFamily:'sans-serif', color:'#9CA3AF', flexDirection:'column', gap:8 }}>
      <Icon path={ICONS.building} size={40} color="#9CA3AF"/>
      <div style={{ fontWeight:600 }}>Portal content not configured yet.</div>
      <div style={{ fontSize:13 }}>Add widgets in the portal builder to get started.</div>
    </div>
  )

  return (
    <div style={{ background:theme.bgColor||'#fff', minHeight:'100vh', color:theme.textColor||'#0F1729', fontFamily:theme.fontFamily||'sans-serif' }}>
      <PortalNav portal={portal} theme={theme} currentPage={currentPage} onNav={setCurrentPage} pages={pages}/>
      {(currentPage.rows||[]).map(row => <PortalRow key={row.id} row={row} theme={theme} portal={portal} api={api}/>)}
      <div style={{ padding:'20px 24px', textAlign:'center', borderTop:`1px solid ${theme.primaryColor}15`, fontFamily:theme.fontFamily }}>
        <span style={{ fontSize:11, color:theme.textColor||'#9CA3AF', opacity:0.5 }}>Powered by Vercentic</span>
      </div>
    </div>
  )
}
