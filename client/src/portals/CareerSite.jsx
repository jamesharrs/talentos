import { useState, useEffect } from 'react'
import { css, Badge, Btn, Input, Section, STATUS_COLORS, recordTitle } from './shared.jsx'

const JobCard = ({ job, color, onClick }) => {
  const d = job.data || {}
  return (
    <div onClick={onClick} style={{ background:'#fff', borderRadius:16, border:'1.5px solid #E8ECF8',
      padding:'20px 24px', cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', gap:16 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 20px ${color}20` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8ECF8'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ width:48, height:48, borderRadius:14, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:22 }}>💼</span>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:700, color:'#0F1729', marginBottom:4 }}>{d.job_title || 'Open Role'}</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {d.department && <Badge color="#6366F1">{d.department}</Badge>}
          {d.location && <Badge color="#0CA678">{d.location}</Badge>}
          {d.work_type && <Badge color="#F79009">{d.work_type}</Badge>}
          {d.employment_type && <Badge color="#9DA8C7">{d.employment_type}</Badge>}
        </div>
      </div>
      <div style={{ padding:'8px 18px', borderRadius:10, background:color, color:'white', fontSize:13, fontWeight:700, flexShrink:0 }}>
        View Role →
      </div>
    </div>
  )
}

const JobDetail = ({ job, portal, onApply, onBack }) => {
  const c = css(portal.branding)
  const d = job.data || {}
  return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:c.font }}>
      <div style={{ background:c.primary, padding:'16px 0' }}>
        <Section>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6, fontFamily:c.font }}>
            ← Back to all jobs
          </button>
        </Section>
      </div>
      <Section style={{ padding:'40px 24px' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'32px', marginBottom:20 }}>
            <h1 style={{ margin:'0 0 12px', fontSize:28, fontWeight:800, color:'#0F1729' }}>{d.job_title || 'Open Role'}</h1>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
              {d.department && <Badge color="#6366F1">{d.department}</Badge>}
              {d.location && <Badge color="#0CA678">{d.location}</Badge>}
              {d.work_type && <Badge color="#F79009">{d.work_type}</Badge>}
              {d.status && <Badge color={STATUS_COLORS[d.status]||'#9DA8C7'}>{d.status}</Badge>}
            </div>
            {d.summary && <p style={{ fontSize:15, color:'#4B5675', lineHeight:1.7, marginBottom:24 }}>{d.summary}</p>}
            <Btn color={c.button} onClick={onApply}>Apply for this role →</Btn>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── Application Wizard ──────────────────────────────────────────────────────
// Step 0: How do you want to apply? (entry method)
// Step 1: Your details (pre-filled from CV parse if uploaded)
// Step 2: Application questions (configurable per job, with conditions)
// Step 3: Documents (CV upload if not done in step 0)
// Step 4: Review & submit
//
// Local draft saved to sessionStorage so candidates can't accidentally lose progress.

const DRAFT_KEY = (jobId) => `portal_app_draft_${jobId}`

const FieldRow = ({ label, required, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>
      {label}{required && <span style={{ color:'#EF4444', marginLeft:2 }}>*</span>}
    </label>
    {children}
  </div>
)

const AppInput = ({ value, onChange, type='text', placeholder, required, style:s }) => (
  <input value={value||''} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder} required={required}
    style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8ECF8', fontSize:14,
      fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box', ...s }}
    onFocus={e=>e.target.style.borderColor='#4361EE'} onBlur={e=>e.target.style.borderColor='#E8ECF8'}/>
)

const AppTextarea = ({ value, onChange, placeholder, rows=4 }) => (
  <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder}
    style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8ECF8', fontSize:14,
      fontFamily:'inherit', resize:'vertical', outline:'none', width:'100%', boxSizing:'border-box' }}
    onFocus={e=>e.target.style.borderColor='#4361EE'} onBlur={e=>e.target.style.borderColor='#E8ECF8'}/>
)

const StepBar = ({ steps, current, color }) => (
  <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
    {steps.map((s, i) => (
      <div key={i} style={{ display:'flex', alignItems:'center', flex: i < steps.length-1 ? 1 : 0 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700,
            background: i < current ? color : i === current ? color : '#E8ECF8',
            color: i <= current ? 'white' : '#9CA3AF',
            transition:'all .3s' }}>
            {i < current ? '✓' : i + 1}
          </div>
          <div style={{ fontSize:10, fontWeight:600, color: i <= current ? color : '#9CA3AF',
            marginTop:4, whiteSpace:'nowrap', textAlign:'center' }}>{s}</div>
        </div>
        {i < steps.length-1 && (
          <div style={{ flex:1, height:2, background: i < current ? color : '#E8ECF8',
            margin:'0 6px', marginBottom:20, transition:'all .3s' }}/>
        )}
      </div>
    ))}
  </div>
)

const ApplyForm = ({ job, portal, onBack, onSuccess, api }) => {
  const c = css(portal.branding)
  const color = c.primary || '#4361EE'
  const d = job.data || {}

  // Wizard state
  const [step, setStep] = useState(0)          // 0=entry, 1=details, 2=questions, 3=documents, 4=review
  const [entryMethod, setEntryMethod] = useState(null)  // 'cv'|'linkedin'|'indeed'|'manual'
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [cvFile, setCvFile] = useState(null)

  // Load draft from sessionStorage
  const [form, setForm] = useState(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY(job.id))
      return draft ? JSON.parse(draft) : {
        first_name:'', last_name:'', email:'', phone:'',
        location:'', current_title:'', linkedin_url:'',
        salary_expectation:'', notice_period:'', available_from:'',
        work_right:'', cover_letter:'',
        // Screening questions (populated from portal.apply_form_fields if configured)
        q1:'', q2:'', q3:'',
        source:'', referral_code:'',
        gdpr_consent: false, diversity_opt_in: false,
      }
    } catch { return {} }
  })

  const set = (k, v) => setForm(f => {
    const next = {...f, [k]:v}
    try { sessionStorage.setItem(DRAFT_KEY(job.id), JSON.stringify(next)) } catch {}
    return next
  })

  const customQuestions = portal.apply_form_questions || []

  const STEPS = ['Start', 'Your Details', 'Questions', 'Documents', 'Review & Submit']

  // Parse CV on upload
  const handleCvUpload = async (file) => {
    if (!file) return
    setCvFile(file)
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cv-parse', { method:'POST', body:fd })
      if (res.ok) {
        const { result } = await res.json()
        if (result) {
          setForm(f => {
            const next = {
              ...f,
              first_name: result.first_name || f.first_name,
              last_name:  result.last_name  || f.last_name,
              email:      result.email       || f.email,
              phone:      result.phone       || f.phone,
              location:   result.location   || f.location,
              current_title: result.current_title || f.current_title,
              linkedin_url:  result.linkedin_url  || f.linkedin_url,
            }
            try { sessionStorage.setItem(DRAFT_KEY(job.id), JSON.stringify(next)) } catch {}
            return next
          })
        }
      }
    } catch {}
    setParsing(false)
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!form.first_name || !form.email) { setError('First name and email are required.'); return }
    if (!form.gdpr_consent) { setError('Please accept the data processing agreement.'); return }
    setSubmitting(true); setError('')
    try {
      // Upload CV if present
      let cvAttachmentId = null
      if (cvFile) {
        const fd = new FormData()
        fd.append('file', cvFile)
        fd.append('file_type_name', 'CV / Resume')
        fd.append('uploaded_by', `${form.first_name} ${form.last_name}`)
        // We don't have record_id yet — server will attach after creating the person
        fd.append('pending_for_job_id', job.id)
        // Best-effort upload; don't block submit on failure
        try {
          const r2 = await fetch('/api/attachments/upload', { method:'POST', body:fd })
          if (r2.ok) { const a = await r2.json(); cvAttachmentId = a.id }
        } catch {}
      }

      const result = await api.post(`/portals/${portal.id}/apply`, {
        ...form,
        job_id: job.id,
        job_title: d.job_title || '',
        cv_attachment_id: cvAttachmentId,
        custom_answers: customQuestions.map(q => ({ question: q.label, answer: form[`cq_${q.id}`] || '' })),
        entry_method: entryMethod,
        source: form.source,
        referral_code: form.referral_code,
      })
      if (result.error) { setError(result.error); setSubmitting(false); return }
      try { sessionStorage.removeItem(DRAFT_KEY(job.id)) } catch {}
      setDone(true)
    } catch { setError('Something went wrong. Please try again.'); setSubmitting(false) }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:c.font, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:40, maxWidth:440 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:36 }}>🎉</div>
        <h2 style={{ fontSize:26, fontWeight:900, color:'#0F1729', marginBottom:8, letterSpacing:'-0.5px' }}>Application Submitted!</h2>
        <p style={{ color:'#6B7280', lineHeight:1.6, marginBottom:24 }}>
          Thanks {form.first_name} — your application for <strong>{d.job_title}</strong> is on its way to {portal.branding?.company_name || 'us'}.
          We'll review it and be in touch soon.
        </p>
        <p style={{ color:'#9CA3AF', fontSize:13 }}>A confirmation has been sent to <strong>{form.email}</strong>.</p>
        <button onClick={onSuccess}
          style={{ marginTop:24, padding:'10px 24px', borderRadius:10, background:color, color:'white',
            fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:c.font }}>
          Back to jobs
        </button>
      </div>
    </div>
  )

  const fieldStyle = { padding:'10px 14px', borderRadius:10, border:'1.5px solid #E8ECF8', fontSize:14,
    fontFamily:c.font, outline:'none', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:c.font }}>
      {/* Top bar */}
      <div style={{ background:color, padding:'14px 0', flexShrink:0 }}>
        <Section>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <button onClick={step === 0 ? onBack : ()=>setStep(s=>Math.max(0,s-1))}
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.85)', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:c.font, display:'flex', alignItems:'center', gap:4 }}>
              ← {step === 0 ? 'Back to role' : 'Back'}
            </button>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13 }}>
              Applying for <strong style={{ color:'white' }}>{d.job_title}</strong>
              {portal.branding?.company_name && <> at <strong style={{ color:'white' }}>{portal.branding.company_name}</strong></>}
            </div>
          </div>
        </Section>
      </div>

      <Section style={{ padding:'32px 24px 64px' }}>
        <div style={{ maxWidth:620, margin:'0 auto' }}>

          {step > 0 && <StepBar steps={STEPS} current={step} color={color}/>}

          {/* ── STEP 0: Entry method ─────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 style={{ margin:'0 0 6px', fontSize:26, fontWeight:900, color:'#0F1729', letterSpacing:'-0.5px' }}>
                How would you like to apply?
              </h2>
              <p style={{ margin:'0 0 28px', color:'#6B7280', fontSize:15 }}>Choose the quickest way to get started.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                {/* Upload CV */}
                <label style={{ display:'block', cursor:'pointer' }}>
                  <div style={{ background:'#fff', border:`2px solid ${color}`, borderRadius:14, padding:'18px 22px',
                    display:'flex', alignItems:'center', gap:16, transition:'all .2s' }}
                    onMouseEnter={e=>e.currentTarget.parentElement.style.transform='translateY(-1px)'}
                    onMouseLeave={e=>e.currentTarget.parentElement.style.transform=''}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`${color}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📄</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#0F1729' }}>Upload your CV</div>
                      <div style={{ fontSize:13, color:'#6B7280', marginTop:2 }}>We'll read it and pre-fill your application — takes seconds</div>
                    </div>
                    <div style={{ padding:'6px 14px', borderRadius:8, background:color, color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>
                      {parsing ? 'Reading…' : 'Upload'}
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }}
                      onChange={e=>{ const f=e.target.files?.[0]; if(f){ setEntryMethod('cv'); handleCvUpload(f); }}}/>
                  </div>
                </label>

                {/* LinkedIn */}
                <button onClick={()=>{ setEntryMethod('linkedin'); setStep(1); }}
                  style={{ background:'#fff', border:'1.5px solid #E8ECF8', borderRadius:14, padding:'18px 22px',
                    display:'flex', alignItems:'center', gap:16, cursor:'pointer', fontFamily:c.font, textAlign:'left', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#0A66C2'; e.currentTarget.style.boxShadow='0 4px 16px rgba(10,102,194,.12)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E8ECF8'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'#E8F3FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>💼</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#0F1729' }}>Import from LinkedIn</div>
                    <div style={{ fontSize:13, color:'#6B7280', marginTop:2 }}>Use your LinkedIn profile to fill in your details</div>
                  </div>
                  <div style={{ padding:'4px 10px', borderRadius:6, background:'#EBF5FF', color:'#0A66C2', fontSize:11, fontWeight:700, flexShrink:0 }}>Coming soon</div>
                </button>

                {/* Manual */}
                <button onClick={()=>{ setEntryMethod('manual'); setStep(1); }}
                  style={{ background:'#fff', border:'1.5px solid #E8ECF8', borderRadius:14, padding:'18px 22px',
                    display:'flex', alignItems:'center', gap:16, cursor:'pointer', fontFamily:c.font, textAlign:'left', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='#6B7280'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E8ECF8'; }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>✏️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'#0F1729' }}>Fill in manually</div>
                    <div style={{ fontSize:13, color:'#6B7280', marginTop:2 }}>Complete the application form yourself</div>
                  </div>
                </button>

                {/* Returning applicant */}
                <div style={{ textAlign:'center', paddingTop:8 }}>
                  <button onClick={()=>{ setEntryMethod('returning'); setStep(1); }}
                    style={{ background:'none', border:'none', color:'#6B7280', fontSize:13, cursor:'pointer', fontFamily:c.font, textDecoration:'underline' }}>
                    Applied before? Enter your email to continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Details ──────────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'28px 32px' }}>
              <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Your details</h3>
              {entryMethod === 'cv' && cvFile && (
                <div style={{ margin:'0 0 20px', padding:'10px 14px', borderRadius:10, background:`${color}0d`,
                  border:`1px solid ${color}30`, fontSize:13, color:color, display:'flex', alignItems:'center', gap:8 }}>
                  ✓ Pre-filled from <strong>{cvFile.name}</strong> — review and edit below
                </div>
              )}
              <p style={{ margin:'0 0 20px', color:'#9CA3AF', fontSize:14 }}>This forms part of your application — make sure everything is correct.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <FieldRow label="First name" required>
                    <AppInput value={form.first_name} onChange={v=>set('first_name',v)} placeholder="James" required/>
                  </FieldRow>
                  <FieldRow label="Last name">
                    <AppInput value={form.last_name} onChange={v=>set('last_name',v)} placeholder="Smith"/>
                  </FieldRow>
                </div>
                <FieldRow label="Email address" required>
                  <AppInput value={form.email} onChange={v=>set('email',v)} type="email" placeholder="james@email.com" required/>
                </FieldRow>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <FieldRow label="Phone number">
                    <AppInput value={form.phone} onChange={v=>set('phone',v)} type="tel" placeholder="+971 50 000 0000"/>
                  </FieldRow>
                  <FieldRow label="Location">
                    <AppInput value={form.location} onChange={v=>set('location',v)} placeholder="Dubai, UAE"/>
                  </FieldRow>
                </div>
                <FieldRow label="Current job title">
                  <AppInput value={form.current_title} onChange={v=>set('current_title',v)} placeholder="Senior Engineer"/>
                </FieldRow>
                <FieldRow label="LinkedIn URL">
                  <AppInput value={form.linkedin_url} onChange={v=>set('linkedin_url',v)} placeholder="linkedin.com/in/yourprofile" type="url"/>
                </FieldRow>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, gap:10 }}>
                <Btn color={color} onClick={()=>{
                  if (!form.first_name || !form.email) { setError('First name and email are required.'); return }
                  setError(''); setStep(2);
                }}>Continue →</Btn>
              </div>
              {error && <p style={{ color:'#dc2626', fontSize:13, marginTop:8, textAlign:'right' }}>{error}</p>}
            </div>
          )}

          {/* ── STEP 2: Questions ───────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'28px 32px' }}>
              <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Application questions</h3>
              <p style={{ margin:'0 0 20px', color:'#9CA3AF', fontSize:14 }}>A few more things about you and this role.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <FieldRow label="Salary expectation">
                  <AppInput value={form.salary_expectation} onChange={v=>set('salary_expectation',v)} placeholder="e.g. AED 25,000/month or 'Open to discussion'"/>
                </FieldRow>
                <FieldRow label="Notice period">
                  <select value={form.notice_period||''} onChange={e=>set('notice_period',e.target.value)}
                    style={{ ...fieldStyle }}>
                    <option value="">Select notice period…</option>
                    <option value="Immediately available">Immediately available</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="1 month">1 month</option>
                    <option value="2 months">2 months</option>
                    <option value="3 months">3 months</option>
                    <option value="Other">Other</option>
                  </select>
                </FieldRow>
                <FieldRow label="Earliest start date">
                  <AppInput value={form.available_from} onChange={v=>set('available_from',v)} type="date"/>
                </FieldRow>
                <FieldRow label="Right to work in this location">
                  <select value={form.work_right||''} onChange={e=>set('work_right',e.target.value)} style={{ ...fieldStyle }}>
                    <option value="">Please select…</option>
                    <option value="Yes, full right to work">Yes, I have full right to work</option>
                    <option value="Yes, with visa">Yes, with a current work visa</option>
                    <option value="Requires sponsorship">I would require sponsorship</option>
                    <option value="No">No</option>
                  </select>
                </FieldRow>

                {/* Custom questions from portal config */}
                {customQuestions.map(q => (
                  <FieldRow key={q.id} label={q.label} required={q.required}>
                    {q.type === 'textarea' ? (
                      <AppTextarea value={form[`cq_${q.id}`]||''} onChange={v=>set(`cq_${q.id}`,v)} placeholder={q.placeholder}/>
                    ) : q.type === 'select' ? (
                      <select value={form[`cq_${q.id}`]||''} onChange={e=>set(`cq_${q.id}`,e.target.value)} style={{ ...fieldStyle }}>
                        <option value="">Select…</option>
                        {(q.options||[]).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : q.type === 'radio' ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {(q.options||[]).map(o=>(
                          <label key={o} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer', color:'#374151' }}>
                            <input type="radio" name={`cq_${q.id}`} value={o} checked={form[`cq_${q.id}`]===o} onChange={()=>set(`cq_${q.id}`,o)}/>
                            {o}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <AppInput value={form[`cq_${q.id}`]||''} onChange={v=>set(`cq_${q.id}`,v)} placeholder={q.placeholder} required={q.required}/>
                    )}
                  </FieldRow>
                ))}

                <FieldRow label="Cover letter">
                  <AppTextarea value={form.cover_letter} onChange={v=>set('cover_letter',v)}
                    placeholder="Tell us why you're a great fit for this role and what excites you about it…" rows={5}/>
                </FieldRow>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24 }}>
                <Btn color={color} onClick={()=>setStep(3)}>Continue →</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 3: Documents ───────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'28px 32px' }}>
              <h3 style={{ margin:'0 0 4px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Documents</h3>
              <p style={{ margin:'0 0 20px', color:'#9CA3AF', fontSize:14 }}>Attach your CV and any supporting materials.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <FieldRow label="CV / Resume">
                  {cvFile ? (
                    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                      background:'#F0FDF4', borderRadius:10, border:'1px solid #BBF7D0' }}>
                      <span style={{ fontSize:18 }}>📄</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'#166534' }}>{cvFile.name}</div>
                        <div style={{ fontSize:11, color:'#4ADE80' }}>Ready to submit</div>
                      </div>
                      <button onClick={()=>setCvFile(null)} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', fontSize:12 }}>Remove</button>
                    </div>
                  ) : (
                    <label style={{ display:'block', cursor:'pointer' }}>
                      <div style={{ padding:'20px', borderRadius:10, border:'2px dashed #E8ECF8', textAlign:'center',
                        background:'#F8F9FF', transition:'all .2s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.background=`${color}06`; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor='#E8ECF8'; e.currentTarget.style.background='#F8F9FF'; }}>
                        <div style={{ fontSize:24, marginBottom:8 }}>📄</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Click to upload CV</div>
                        <div style={{ fontSize:11, color:'#9CA3AF', marginTop:4 }}>PDF, DOC, DOCX — max 10MB</div>
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) setCvFile(f); }}/>
                      </div>
                    </label>
                  )}
                </FieldRow>

                <FieldRow label="How did you hear about us?">
                  <select value={form.source||''} onChange={e=>set('source',e.target.value)} style={{ ...fieldStyle }}>
                    <option value="">Select…</option>
                    <option>LinkedIn</option>
                    <option>Indeed</option>
                    <option>Company website</option>
                    <option>Referral from employee</option>
                    <option>Recruitment agency</option>
                    <option>Job board</option>
                    <option>Social media</option>
                    <option>Other</option>
                  </select>
                </FieldRow>

                <FieldRow label="Referral code (if any)">
                  <AppInput value={form.referral_code} onChange={v=>set('referral_code',v)} placeholder="Optional"/>
                </FieldRow>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24 }}>
                <Btn color={color} onClick={()=>setStep(4)}>Continue →</Btn>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Submit ──────────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'28px 32px', marginBottom:16 }}>
                <h3 style={{ margin:'0 0 20px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Review your application</h3>
                {[
                  {section:'Your details', step:1, rows:[
                    ['Name', `${form.first_name} ${form.last_name}`.trim()],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Location', form.location],
                    ['Current title', form.current_title],
                    ['LinkedIn', form.linkedin_url],
                  ]},
                  {section:'Application', step:2, rows:[
                    ['Salary expectation', form.salary_expectation],
                    ['Notice period', form.notice_period],
                    ['Available from', form.available_from],
                    ['Right to work', form.work_right],
                    ...(form.cover_letter ? [['Cover letter', form.cover_letter.slice(0,80)+'…']] : []),
                  ]},
                  {section:'Documents', step:3, rows:[
                    ['CV', cvFile?.name || 'Not uploaded'],
                    ['Source', form.source],
                  ]},
                ].map(({section, step:s, rows}) => (
                  <div key={section} style={{ marginBottom:20, paddingBottom:20, borderBottom:'1px solid #F3F4F6' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{section}</div>
                      <button onClick={()=>setStep(s)}
                        style={{ background:'none', border:'none', cursor:'pointer', color:color, fontSize:12, fontWeight:600, fontFamily:c.font }}>
                        Edit
                      </button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {rows.filter(([,v])=>v).map(([k,v])=>(
                        <div key={k} style={{ display:'flex', gap:12, fontSize:13 }}>
                          <span style={{ color:'#9CA3AF', width:130, flexShrink:0 }}>{k}</span>
                          <span style={{ color:'#0F1729', fontWeight:500, flex:1 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* GDPR consent */}
              <div style={{ background:'#fff', borderRadius:20, border:'1px solid #E8ECF8', padding:'20px 24px', marginBottom:16 }}>
                <label style={{ display:'flex', gap:12, cursor:'pointer', alignItems:'flex-start' }}>
                  <input type="checkbox" checked={!!form.gdpr_consent} onChange={e=>set('gdpr_consent',e.target.checked)}
                    style={{ marginTop:2, width:16, height:16, flexShrink:0 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0F1729', marginBottom:2 }}>Data processing agreement <span style={{ color:'#EF4444' }}>*</span></div>
                    <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.5 }}>
                      I agree that {portal.branding?.company_name || 'this company'} may store and process my personal data
                      for the purposes of this job application. My data will be held for up to 12 months and I can request deletion at any time.
                    </div>
                  </div>
                </label>
              </div>

              {error && <div style={{ padding:'12px 16px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:13, marginBottom:12 }}>{error}</div>}

              <Btn color={color} onClick={handleSubmit} disabled={submitting||!form.gdpr_consent} full>
                {submitting ? 'Submitting…' : 'Submit Application →'}
              </Btn>

              <p style={{ textAlign:'center', fontSize:12, color:'#9CA3AF', marginTop:12 }}>
                You can save and return to this application later by using the same email address.
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

export default function CareerSite({ portal, objects, api }) {
  const c = css(portal.branding)
  const br = portal.branding || {}
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [view, setView] = useState('list')   // 'list' | 'detail' | 'apply'
  const [selected, setSelected] = useState(null)

  const jobObj = objects.find(o => o.slug === 'jobs')

  useEffect(() => {
    if (!jobObj) { setLoading(false); return }
    api.get(`/records?object_id=${jobObj.id}&environment_id=${portal.environment_id}&limit=50`)
      .then(d => { setJobs((d.records||[]).filter(j => j.data?.status === 'Open' || !j.data?.status)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [jobObj?.id])

  const depts = [...new Set(jobs.map(j => j.data?.department).filter(Boolean))]
  const filtered = jobs.filter(j => {
    const title = (j.data?.job_title || '').toLowerCase()
    const matchSearch = !search || title.includes(search.toLowerCase())
    const matchDept = !dept || j.data?.department === dept
    return matchSearch && matchDept
  })

  if (view === 'apply') return <ApplyForm job={selected} portal={portal} api={api} onBack={()=>setView('detail')} onSuccess={()=>setView('list')}/>
  if (view === 'detail') return <JobDetail job={selected} portal={portal} onApply={()=>setView('apply')} onBack={()=>setView('list')}/>

  return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:c.font }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg, ${c.primary}ee, ${c.primary})`, padding:'56px 0 48px' }}>
        <Section>
          {br.logo_url && <img src={br.logo_url} alt="logo" style={{ height:40, marginBottom:20, objectFit:'contain' }}/>}
          <h1 style={{ margin:'0 0 10px', fontSize:38, fontWeight:900, color:'white', letterSpacing:'-1px', lineHeight:1.15 }}>
            {br.tagline || `Join ${br.company_name || 'Us'}`}
          </h1>
          <p style={{ margin:'0 0 32px', fontSize:16, color:'rgba(255,255,255,0.75)', maxWidth:520 }}>
            {br.company_name ? `${br.company_name} is hiring. Find your next opportunity below.` : 'Explore our open positions and find your next opportunity.'}
          </p>
          {/* Search bar */}
          <div style={{ display:'flex', gap:8, maxWidth:580 }}>
            <div style={{ flex:1, position:'relative' }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search roles…"
                style={{ width:'100%', padding:'12px 16px 12px 44px', borderRadius:12, border:'none', fontSize:14, fontFamily:c.font, outline:'none', boxSizing:'border-box' }}/>
              <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
            </div>
            {depts.length > 0 && (
              <select value={dept} onChange={e=>setDept(e.target.value)}
                style={{ padding:'12px 14px', borderRadius:12, border:'none', fontSize:13, fontFamily:c.font, background:'white', cursor:'pointer' }}>
                <option value="">All departments</option>
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
            )}
          </div>
        </Section>
      </div>

      {/* Job list */}
      <Section style={{ padding:'40px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <p style={{ margin:0, fontSize:14, color:c.text3, fontWeight:600 }}>
            {loading ? 'Loading…' : `${filtered.length} open position${filtered.length!==1?'s':''}`}
          </p>
        </div>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height:88, borderRadius:16, background:'#fff', border:'1.5px solid #E8ECF8', animation:'pulse 1.5s ease-in-out infinite' }}/>)}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
            <p style={{ fontSize:16, fontWeight:700, color:'#0F1729', marginBottom:4 }}>No roles found</p>
            <p style={{ fontSize:13, color:'#9DA8C7' }}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(job => <JobCard key={job.id} job={job} color={c.primary} onClick={()=>{ setSelected(job); setView('detail') }}/>)}
          </div>
        )}
      </Section>

      {/* Footer */}
      <div style={{ borderTop:'1px solid #E8ECF8', padding:'24px', textAlign:'center', marginTop:40 }}>
        <p style={{ margin:0, fontSize:12, color:'#9DA8C7' }}>Powered by Vercentic · {br.company_name || ''}</p>
      </div>
    </div>
  )
}
