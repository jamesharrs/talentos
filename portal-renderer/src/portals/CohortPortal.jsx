// portal-renderer/src/portals/CohortPortal.jsx
// Cohort community portal — candidate-facing
import { useState, useEffect, useRef, useCallback } from 'react'

const fmt = (iso) => { if(!iso) return ''; const d=new Date(iso),diff=Date.now()-d.getTime(); if(diff<60000) return 'just now'; if(diff<3600000) return `${Math.floor(diff/60000)}m ago`; if(diff<86400000) return `${Math.floor(diff/3600000)}h ago`; return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}); }
const initials = (n='') => n.split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase()||'?'
const Spin = ({color='#8B7EC8',size=32}) => <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:40}}><div style={{width:size,height:size,borderRadius:'50%',border:`3px solid ${color}30`,borderTop:`3px solid ${color}`,animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
const Av = ({name,size=36,color='#8B7EC8'}) => <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.36,fontWeight:700,color:'white',flexShrink:0}}>{initials(name)}</div>

function AuthScreen({cohort,api,onSession}) {
  const [email,setEmail]=useState(''),  [pw,setPw]=useState(''), [sent,setSent]=useState(false)
  const [token,setToken]=useState(''), [memberId,setMemberId]=useState(''), [loading,setLoading]=useState(false), [err,setErr]=useState('')
  const c = cohort.primary_color||'#8B7EC8'

  const requestLink = async() => { setLoading(true); setErr(''); const r=await api.post(`/cohort-auth/${cohort.id}/request-magic-link`,{email}); setSent(true); if(r._dev_token){setToken(r._dev_token);setMemberId(r._dev_member_id);} setLoading(false); }
  const verify = async() => { setLoading(true); setErr(''); const r=await api.post(`/cohort-auth/${cohort.id}/verify-magic-link`,{token,member_id:memberId}); if(r.session) onSession(r.session); else setErr(r.error||'Invalid link'); setLoading(false); }
  const login  = async() => { setLoading(true); setErr(''); const r=await api.post(`/cohort-auth/${cohort.id}/login`,{email,password:pw}); if(r.session) onSession(r.session); else setErr(r.error||'Invalid credentials'); setLoading(false); }

  const inp = (v,s,ph,type='text') => <input type={type} value={v} onChange={e=>s(e.target.value)} placeholder={ph} style={{width:'100%',padding:'11px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,boxSizing:'border-box',outline:'none',marginBottom:12}}/>
  const btn = (label,fn,disabled) => <button onClick={fn} disabled={disabled||loading} style={{width:'100%',padding:12,borderRadius:10,border:'none',background:c,color:'white',fontSize:14,fontWeight:700,cursor:'pointer',opacity:disabled||loading?0.6:1}}>{loading?'…':label}</button>

  return (
    <div style={{minHeight:'100vh',background:`${c}10`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",padding:20}}>
      <div style={{background:'white',borderRadius:20,padding:40,maxWidth:420,width:'100%',boxShadow:'0 4px 40px rgba(0,0,0,0.10)'}}>
        <div style={{width:52,height:52,borderRadius:16,background:c,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h2 style={{margin:'0 0 4px',fontSize:22,fontWeight:800,color:'#0F1729'}}>{cohort.name}</h2>
        <p style={{margin:'0 0 24px',color:'#6B7280',fontSize:14}}>{cohort.programme_type} {cohort.cohort_year} Cohort</p>
        {err&&<div style={{color:'#DC2626',fontSize:13,marginBottom:10}}>{err}</div>}

        {cohort.auth_mode==='password' ? (<>
          <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Email</label>
          {inp(email,setEmail,'name@university.ac.uk','email')}
          <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Password</label>
          {inp(pw,setPw,'Your password','password')}
          {btn('Sign in',login,!email||!pw)}
        </>) : !sent ? (<>
          <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Your email address</label>
          {inp(email,setEmail,'name@university.ac.uk','email')}
          {btn('Send me a login link',requestLink,!email.includes('@'))}
        </>) : (<>
          <div style={{padding:'14px 18px',borderRadius:12,background:`${c}10`,border:`1.5px solid ${c}30`,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:4}}>✓ Link sent to {email}</div>
            <div style={{fontSize:13,color:'#6B7280'}}>Check your inbox — the link expires in 30 minutes.</div>
          </div>
          <div style={{borderTop:'1px solid #F3F4F6',paddingTop:16}}>
            <div style={{fontSize:12,color:'#9CA3AF',marginBottom:8}}>Have a token? Paste it here:</div>
            {inp(token,setToken,'Login token')}
            {inp(memberId,setMemberId,'Member ID')}
            {btn('Verify & Enter',verify,!token||!memberId)}
          </div>
        </>)}
      </div>
    </div>
  )
}

function FeedPage({cohort,session,api}) {
  const [posts,setPosts]=useState([]), [loading,setLoading]=useState(true), [body,setBody]=useState(''), [submitting,setSubmitting]=useState(false)
  const c=cohort.allow_dm!==undefined?cohort.cohort_primary_color||'#8B7EC8':cohort.primary_color||'#8B7EC8'
  const load=useCallback(async()=>{setLoading(true);const r=await api.get(`/cohorts/${cohort.cohort_id||cohort.id}/posts?limit=50`);setPosts(r.posts||[]);setLoading(false);},[cohort])
  useEffect(()=>{load()},[load])
  const submit=async()=>{if(!body.trim())return;setSubmitting(true);await api.post(`/cohorts/${cohort.cohort_id||cohort.id}/posts`,{author_member_id:session.member_id,author_name:session.name,author_type:'member',body,post_type:'post'});setBody('');await load();setSubmitting(false);}
  const react=async(postId,emoji)=>{await api.post(`/cohorts/${cohort.cohort_id||cohort.id}/posts/${postId}/react`,{member_id:session.member_id,emoji});load();}
  const pinned=posts.filter(p=>p.pinned), feed=posts.filter(p=>!p.pinned)
  return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'0 0 40px'}}>
      {(cohort.allow_member_posts||session.role==='admin')&&<div style={{background:'white',borderRadius:16,padding:20,marginBottom:20,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',gap:12,marginBottom:12}}><Av name={session.name} color={c} size={36}/><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Share something with your cohort…" rows={3} style={{flex:1,padding:'10px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,resize:'none',fontFamily:'inherit',boxSizing:'border-box',outline:'none'}}/></div>
        <div style={{display:'flex',justifyContent:'flex-end'}}><button onClick={submit} disabled={!body.trim()||submitting} style={{padding:'9px 20px',borderRadius:10,border:'none',background:c,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',opacity:!body.trim()||submitting?0.5:1}}>{submitting?'Posting…':'Share'}</button></div>
      </div>}
      {[...pinned,...feed].map(p=>{
        const rg={};(p.reactions||[]).forEach(r=>{if(!rg[r.emoji])rg[r.emoji]=[];rg[r.emoji].push(r.member_id);});
        const isAnno=p.post_type==='announcement', isIntro=p.post_type==='intro'
        return <div key={p.id} style={{borderRadius:14,padding:'18px 20px',marginBottom:12,boxShadow:'0 1px 6px rgba(0,0,0,0.05)',background:isAnno?`${c}12`:isIntro?'#F0FDF4':'white',border:isAnno?`1.5px solid ${c}30`:isIntro?'1.5px solid #BBF7D0':'1px solid #F3F4F6'}}>
          {p.pinned&&<div style={{fontSize:11,fontWeight:700,color:c,marginBottom:8}}>📌 PINNED</div>}
          {isAnno&&<div style={{fontSize:11,fontWeight:700,color:c,marginBottom:8}}>📢 ANNOUNCEMENT</div>}
          {isIntro&&<div style={{fontSize:11,fontWeight:700,color:'#10B981',marginBottom:8}}>👋 INTRODUCTION</div>}
          <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
            <Av name={p.author_name} color={p.author_type==='admin'?'#374151':c} size={36}/>
            <div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontWeight:700,fontSize:14,color:'#111827'}}>{p.author_name}</span>{p.author_type==='admin'&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:99,background:'#374151',color:'white',fontWeight:600}}>Admin</span>}<span style={{fontSize:12,color:'#9CA3AF',marginLeft:'auto'}}>{fmt(p.created_at)}</span></div><div style={{fontSize:14,color:'#374151',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{p.body}</div></div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {Object.entries(rg).map(([emoji,members])=><button key={emoji} onClick={()=>react(p.id,emoji)} style={{padding:'3px 10px',borderRadius:99,border:'1.5px solid #E5E7EB',background:members.includes(session.member_id)?`${c}15`:'white',cursor:'pointer',fontSize:13}}>{emoji} <span style={{fontSize:11,fontWeight:600}}>{members.length}</span></button>)}
            {['👍','🎉','❤️','🙌'].map(e=>!rg[e]&&<button key={e} onClick={()=>react(p.id,e)} style={{padding:'3px 10px',borderRadius:99,border:'1.5px solid #E5E7EB',background:'white',cursor:'pointer',fontSize:13,opacity:0.5}}>{e}</button>)}
          </div>
        </div>;
      })}
      {loading&&<Spin color={c}/>}
      {!loading&&feed.length===0&&pinned.length===0&&<div style={{textAlign:'center',padding:60,color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:12}}>👋</div><div style={{fontWeight:600}}>No posts yet — be the first!</div></div>}
    </div>
  )
}

function MembersPage({cohort,session,api}) {
  const [members,setMembers]=useState([]), [loading,setLoading]=useState(true), [search,setSearch]=useState('')
  const c=cohort.cohort_primary_color||'#8B7EC8'
  useEffect(()=>{api.get(`/cohorts/${cohort.cohort_id}/members`).then(m=>setMembers(Array.isArray(m)?m:[])).finally(()=>setLoading(false))},[cohort.cohort_id])
  const filtered=members.filter(m=>{const d=m.person_data||{};const name=`${d.first_name||''} ${d.last_name||''}`.toLowerCase();return !search||name.includes(search.toLowerCase())||(d.university||'').toLowerCase().includes(search.toLowerCase());})
  if(loading) return <Spin color={c}/>
  return <div style={{maxWidth:780,margin:'0 auto'}}>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…" style={{width:'100%',padding:'10px 16px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,boxSizing:'border-box',outline:'none',marginBottom:20}}/>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
      {filtered.map(m=>{const d=m.person_data||{};const name=`${d.first_name||''} ${d.last_name||''}`.trim()||'Member';const isMe=m.id===session.member_id;
        return <div key={m.id} style={{background:isMe?`${c}08`:'white',borderRadius:14,padding:20,border:`1.5px solid ${isMe?c+'30':'#F3F4F6'}`,boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
          <Av name={name} color={c} size={44}/>
          <div style={{fontWeight:700,fontSize:14,color:'#111827',marginTop:10,marginBottom:2}}>{name}{isMe&&<span style={{fontSize:11,color:c,fontWeight:600}}> (you)</span>}</div>
          {d.university&&<div style={{fontSize:12,color:'#6B7280',marginBottom:2}}>{d.university}</div>}
          {d.programme_type&&<div style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:`${c}15`,color:c,fontWeight:600,display:'inline-block',marginTop:4}}>{d.programme_type}</div>}
          {d.cohort_bio&&<div style={{fontSize:12,color:'#4B5563',marginTop:8,lineHeight:1.5}}>{d.cohort_bio.slice(0,120)}{d.cohort_bio.length>120?'…':''}</div>}
        </div>;
      })}
    </div>
  </div>
}

function TasksPage({cohort,session,api}) {
  const [tasks,setTasks]=useState([]), [loading,setLoading]=useState(true)
  const c=cohort.cohort_primary_color||'#8B7EC8'
  const load=useCallback(async()=>{const r=await api.get(`/cohorts/${cohort.cohort_id}/tasks/member/${session.member_id}`);setTasks(Array.isArray(r)?r:[]);setLoading(false);},[cohort.cohort_id,session.member_id])
  useEffect(()=>{load()},[load])
  const toggle=async(t)=>{if(t.completed) await api.delete(`/cohorts/${cohort.cohort_id}/tasks/${t.id}/complete`,{member_id:session.member_id}); else await api.post(`/cohorts/${cohort.cohort_id}/tasks/${t.id}/complete`,{member_id:session.member_id});load();}
  const done=tasks.filter(t=>t.completed).length, pct=tasks.length>0?Math.round((done/tasks.length)*100):0
  if(loading) return <Spin color={c}/>
  return <div style={{maxWidth:600,margin:'0 auto'}}>
    <div style={{background:'white',borderRadius:14,padding:20,marginBottom:20,boxShadow:'0 1px 6px rgba(0,0,0,0.05)'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}><span style={{fontWeight:700,fontSize:14}}>Your Progress</span><span style={{fontSize:14,color:c,fontWeight:700}}>{done}/{tasks.length} completed</span></div>
      <div style={{height:8,borderRadius:99,background:'#F3F4F6',overflow:'hidden'}}><div style={{height:'100%',borderRadius:99,background:c,width:`${pct}%`,transition:'width 0.4s'}}/></div>
    </div>
    {tasks.length===0?<div style={{textAlign:'center',padding:60,color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:12}}>✅</div><div style={{fontWeight:600}}>No tasks yet</div></div>
      :tasks.map(t=><div key={t.id} onClick={()=>toggle(t)} style={{background:'white',borderRadius:12,padding:'14px 18px',marginBottom:10,border:`1.5px solid ${t.completed?c+'40':'#F3F4F6'}`,display:'flex',gap:14,alignItems:'flex-start',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
        <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${t.completed?c:'#D1D5DB'}`,background:t.completed?c:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
          {t.completed&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:t.completed?'#9CA3AF':'#111827',textDecoration:t.completed?'line-through':'none'}}>{t.title}</div>{t.description&&<div style={{fontSize:13,color:'#6B7280',marginTop:3}}>{t.description}</div>}</div>
      </div>)
    }
  </div>
}

function ResourcesPage({cohort,api}) {
  const [resources,setResources]=useState([]), [loading,setLoading]=useState(true)
  const c=cohort.cohort_primary_color||'#8B7EC8'
  useEffect(()=>{api.get(`/cohorts/${cohort.cohort_id}/resources`).then(r=>setResources(Array.isArray(r)?r:[])).finally(()=>setLoading(false))},[cohort.cohort_id])
  if(loading) return <Spin color={c}/>
  const cats=[...new Set(resources.map(r=>r.category||'General'))]
  return <div style={{maxWidth:680,margin:'0 auto'}}>
    {resources.length===0?<div style={{textAlign:'center',padding:60,color:'#9CA3AF'}}><div style={{fontSize:40,marginBottom:12}}>📁</div><div style={{fontWeight:600}}>No resources yet</div></div>
      :cats.map(cat=><div key={cat} style={{marginBottom:28}}>
        <div style={{fontSize:12,fontWeight:700,color:'#9CA3AF',letterSpacing:'0.06em',marginBottom:12}}>{cat.toUpperCase()}</div>
        {resources.filter(r=>(r.category||'General')===cat).map(r=><a key={r.id} href={r.url||'#'} target="_blank" rel="noreferrer" style={{display:'flex',gap:14,alignItems:'center',padding:'14px 18px',background:'white',borderRadius:12,marginBottom:8,textDecoration:'none',border:'1px solid #F3F4F6',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
          <div style={{width:36,height:36,borderRadius:10,background:`${c}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>{r.resource_type==='video'?'🎬':r.resource_type==='document'?'📄':'🔗'}</div>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:'#111827'}}>{r.title}</div>{r.description&&<div style={{fontSize:12,color:'#6B7280',marginTop:2}}>{r.description}</div>}</div>
        </a>)}
      </div>)
    }
  </div>
}

function GroupChat({cohort,session,api}) {
  const [msgs,setMsgs]=useState([]), [body,setBody]=useState(''), [sending,setSending]=useState(false)
  const bottomRef=useRef(null)
  const c=cohort.cohort_primary_color||'#8B7EC8'
  const load=useCallback(async()=>{const r=await api.get(`/cohort-messages/${cohort.cohort_id}/group?limit=100`);setMsgs(r.messages||[]);setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),100);},[cohort.cohort_id])
  useEffect(()=>{load()},[load])
  const send=async()=>{if(!body.trim())return;setSending(true);await api.post(`/cohort-messages/${cohort.cohort_id}/group`,{sender_member_id:session.member_id,sender_name:session.name,body});setBody('');load();setSending(false);}
  return <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 180px)',background:'white',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,0.06)',maxWidth:800,margin:'0 auto'}}>
    <div style={{padding:'14px 18px',borderBottom:'1px solid #F3F4F6',fontWeight:700,fontSize:14,color:'#111827'}}># Group Chat</div>
    <div style={{flex:1,overflow:'auto',padding:'16px 18px',display:'flex',flexDirection:'column',gap:12}}>
      {msgs.map(m=>{const isMe=m.sender_member_id===session.member_id;return<div key={m.id} style={{display:'flex',gap:10,alignItems:'flex-end',flexDirection:isMe?'row-reverse':'row'}}>
        {!isMe&&<Av name={m.sender_name} color={c} size={28}/>}
        <div><if>
          {!isMe&&<div style={{fontSize:11,color:'#9CA3AF',marginBottom:3,marginLeft:4}}>{m.sender_name}</div>}
          <div style={{padding:'9px 14px',borderRadius:14,maxWidth:340,fontSize:14,lineHeight:1.5,background:isMe?c:'#F3F4F6',color:isMe?'white':'#111827',borderBottomRightRadius:isMe?4:14,borderBottomLeftRadius:isMe?14:4}}>{m.body}</div>
          <div style={{fontSize:10,color:'#9CA3AF',marginTop:3,textAlign:isMe?'right':'left'}}>{fmt(m.created_at)}</div>
        </if></div>
      </div>;})}
      <div ref={bottomRef}/>
    </div>
    <div style={{padding:'12px 16px',borderTop:'1px solid #F3F4F6',display:'flex',gap:10,alignItems:'flex-end'}}>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Type a message…" rows={1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} style={{flex:1,padding:'10px 14px',borderRadius:10,border:'1.5px solid #E5E7EB',fontSize:14,resize:'none',fontFamily:'inherit'}}/>
      <button onClick={send} disabled={!body.trim()||sending} style={{padding:'10px 16px',borderRadius:10,border:'none',background:c,color:'white',fontSize:13,fontWeight:700,cursor:'pointer',opacity:!body.trim()||sending?0.5:1}}>Send</button>
    </div>
  </div>
}

export default function CohortPortal({portal, api}) {
  const [session,setSession]=useState(null), [cohort,setCohort]=useState(null), [loading,setLoading]=useState(true), [page,setPage]=useState('feed'), [error,setError]=useState(null)

  useEffect(()=>{
    const token=portal?.cohort_token||new URLSearchParams(window.location.search).get('cohort')
    if(!token){setError('No cohort specified.');setLoading(false);return;}
    api.get(`/cohort-auth/by-token/${token}`).then(c=>{setCohort(c);setLoading(false);}).catch(()=>{setError('Cohort not found.');setLoading(false);})
    try{const saved=JSON.parse(sessionStorage.getItem(`cohort_session_${token}`)||'null');if(saved)setSession(saved);}catch{}
  },[portal])

  const handleSession=(s)=>{
    const token=portal?.cohort_token||new URLSearchParams(window.location.search).get('cohort')
    sessionStorage.setItem(`cohort_session_${token}`,JSON.stringify(s))
    setSession(s)
    setInterval(()=>api.post(`/cohort-auth/${s.cohort_id}/ping`,{member_id:s.member_id}).catch(()=>{}),120000)
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><Spin/></div>
  if(error||!cohort) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:"'DM Sans',sans-serif",color:'#6B7280',flexDirection:'column',gap:12}}><div style={{fontSize:36}}>🔒</div><div style={{fontWeight:600}}>{error||'Unavailable'}</div></div>
  if(!session) return <AuthScreen cohort={cohort} api={api} onSession={handleSession}/>

  const c=session.cohort_primary_color||'#8B7EC8'
  const NAV=[{id:'feed',label:'Feed'},{...(session.show_member_directory?{id:'members',label:'Members'}:{})},{id:'messages',label:'Messages'},{...(session.tasks_enabled?{id:'tasks',label:'Tasks'}:{})},{id:'resources',label:'Resources'}].filter(n=>n.id)

  return (
    <div style={{minHeight:'100vh',background:'#F8F7FF',fontFamily:"'DM Sans',-apple-system,sans-serif"}}>
      <div style={{background:'white',borderBottom:'1px solid #F3F4F6',position:'sticky',top:0,zIndex:50,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',height:56}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginRight:'auto'}}>
            <div style={{width:30,height:30,borderRadius:8,background:c,display:'flex',alignItems:'center',justifyContent:'center'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <div><div style={{fontWeight:800,fontSize:13,color:'#0F1729',lineHeight:1.1}}>{session.cohort_name}</div><div style={{fontSize:10,color:'#9CA3AF'}}>{session.programme_type} {cohort.cohort_year}</div></div>
          </div>
          {NAV.map(n=><button key={n.id} onClick={()=>setPage(n.id)} style={{padding:'0 14px',height:56,border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:600,color:page===n.id?c:'#6B7280',borderBottom:page===n.id?`2px solid ${c}`:'2px solid transparent',transition:'all 0.15s'}}>{n.label}</button>)}
          <div style={{marginLeft:16}}><Av name={session.name} color={c} size={30}/></div>
        </div>
      </div>
      <div style={{maxWidth:900,margin:'0 auto',padding:'28px 20px'}}>
        {page==='feed'&&<FeedPage cohort={session} session={session} api={api}/>}
        {page==='members'&&<MembersPage cohort={session} session={session} api={api}/>}
        {page==='messages'&&<GroupChat cohort={session} session={session} api={api}/>}
        {page==='tasks'&&<TasksPage cohort={session} session={session} api={api}/>}
        {page==='resources'&&<ResourcesPage cohort={session} api={api}/>}
      </div>
    </div>
  )
}
