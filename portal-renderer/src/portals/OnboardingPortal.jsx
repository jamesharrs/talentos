import { useState, useEffect } from 'react'
import { css, Btn, Section } from './shared.jsx'
import TaskWidget from './TaskWidget.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ── Auth helpers ──────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('portal_token') || sessionStorage.getItem('portal_token') || ''
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('portal_user') || sessionStorage.getItem('portal_user') || 'null') }
  catch { return null }
}

// ── Steps definition ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 'welcome',  icon: '👋', label: 'Welcome'  },
  { id: 'tasks',    icon: '✅', label: 'Your Tasks' },
  { id: 'profile',  icon: '👤', label: 'Profile'  },
  { id: 'complete', icon: '🎉', label: 'All Done!' },
]

// ── Welcome step ──────────────────────────────────────────────────────────────
const WelcomeStep = ({ portal, name, onNext }) => {
  const c  = css(portal.branding)
  const br = portal.branding || {}
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>👋</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F1729', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
        Welcome{name ? `, ${name}` : ''}!
      </h1>
      <p style={{ fontSize: 16, color: '#4B5675', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
        We're thrilled to have you joining {br.company_name || 'us'}. This portal will guide you through everything you need to complete before your first day.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420, margin: '0 auto 32px', textAlign: 'left' }}>
        {[
          { icon: '✅', title: 'Your Tasks', desc: 'Complete the tasks assigned to you before day one' },
          { icon: '👤', title: 'Your Profile', desc: 'Confirm your preferences and emergency contact' },
        ].map(s => (
          <div key={s.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFF', borderRadius: 12 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1729' }}>{s.title}</div>
              <div style={{ fontSize: 11, color: '#9DA8C7' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <Btn color={c.button} onClick={onNext}>Let's Get Started →</Btn>
    </div>
  )
}

// ── Tasks step (wraps TaskWidget) ─────────────────────────────────────────────
const TasksStep = ({ portal, onNext, onBack }) => {
  const c     = css(portal.branding)
  const token = getToken()
  const [taskData, setTaskData] = useState(null)

  useEffect(() => {
    if (!token) return
    fetch(`${API_BASE}/api/portal-auth/tasks`, { headers: { 'x-portal-token': token } })
      .then(r => r.json()).then(d => setTaskData(d)).catch(() => {})
  }, [token])

  const totalDone  = taskData ? taskData.groups.reduce((s, g) => s + g.tasks_done, 0) + taskData.tasks.filter(t => t.status === 'done').length : 0
  const totalCount = taskData ? taskData.groups.reduce((s, g) => s + g.task_count, 0) + taskData.tasks.length : 0
  const allDone    = totalCount > 0 && totalDone === totalCount

  return (
    <div style={{ padding: '32px 0' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1729', margin: '0 0 6px' }}>Your Tasks</h2>
      <p style={{ fontSize: 13, color: '#9DA8C7', margin: '0 0 24px' }}>
        Complete the tasks below before your first day. Some require you to upload a document, sign something, or fill in a form.
      </p>

      <TaskWidget token={token} primary={c.button} />

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Btn outline color="#9DA8C7" onClick={onBack}>← Back</Btn>
        <Btn color={c.button} onClick={onNext}>
          {allDone ? 'Continue →' : totalCount === 0 ? 'Continue →' : `Continue (${totalDone}/${totalCount} done) →`}
        </Btn>
      </div>
    </div>
  )
}

// ── Profile step ──────────────────────────────────────────────────────────────
const ProfileStep = ({ portal, onNext, onBack }) => {
  const c = css(portal.branding)
  const [form, setForm] = useState({ emergency_name: '', emergency_phone: '', dietary: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inp = { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E8ECF8', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
  return (
    <div style={{ padding: '32px 0' }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F1729', margin: '0 0 6px' }}>Complete Your Profile</h2>
      <p style={{ fontSize: 13, color: '#9DA8C7', margin: '0 0 28px' }}>Help us prepare for your arrival</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4B5675', borderBottom: '1px solid #E8ECF8', paddingBottom: 8 }}>Emergency Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4B5675' }}>Contact Name</label>
            <input value={form.emergency_name} onChange={e => set('emergency_name', e.target.value)} style={inp}
              onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = '#E8ECF8'} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4B5675' }}>Contact Phone</label>
            <input value={form.emergency_phone} onChange={e => set('emergency_phone', e.target.value)} style={inp}
              onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = '#E8ECF8'} />
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#4B5675', borderBottom: '1px solid #E8ECF8', paddingBottom: 8, marginTop: 4 }}>Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4B5675' }}>Dietary Requirements</label>
          <input value={form.dietary} onChange={e => set('dietary', e.target.value)} placeholder="e.g. Vegetarian, Halal, Gluten-free…" style={inp}
            onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = '#E8ECF8'} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn outline color="#9DA8C7" onClick={onBack}>← Back</Btn>
        <Btn color={c.button} onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  )
}

// ── Complete step ─────────────────────────────────────────────────────────────
const CompleteStep = ({ portal, name }) => {
  const br = portal.branding || {}
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F1729', margin: '0 0 12px' }}>You're all set{name ? `, ${name}` : ''}!</h1>
      <p style={{ fontSize: 15, color: '#4B5675', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 28px' }}>
        Your pre-boarding is complete. {br.company_name || 'The team'} will be in touch with your first-day details.
      </p>
      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: '#F8FAFF', borderRadius: 16, padding: '20px 28px' }}>
        {['Profile received ✓', 'Tasks submitted ✓', 'You\'re ready to go ✓'].map(s => (
          <div key={s} style={{ fontSize: 14, fontWeight: 600, color: '#0CAF77' }}>{s}</div>
        ))}
      </div>
    </div>
  )
}

// ── Main OnboardingPortal ─────────────────────────────────────────────────────
export default function OnboardingPortal({ portal }) {
  const c    = css(portal.branding)
  const br   = portal.branding || {}
  const user = getUser()
  const name = user?.name || ''
  const [step, setStep] = useState(0)

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const STEP_COMPONENTS = [
    <WelcomeStep  portal={portal} name={name} onNext={next} />,
    <TasksStep    portal={portal} onNext={next} onBack={back} />,
    <ProfileStep  portal={portal} onNext={next} onBack={back} />,
    <CompleteStep portal={portal} name={name} />,
  ]

  return (
    <div style={{ minHeight: '100vh', background: c.bg, fontFamily: c.font }}>
      {/* Header */}
      <div style={{ background: c.primary, padding: '16px 0' }}>
        <Section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {br.logo_url
                ? <img src={br.logo_url} style={{ height: 28, objectFit: 'contain' }} alt="logo" />
                : <div style={{ color: 'white', fontSize: 15, fontWeight: 800 }}>{br.company_name || 'Onboarding'}</div>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              Step {step + 1} of {STEPS.length}
            </div>
          </div>
        </Section>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#E8ECF8', height: 4 }}>
        <div style={{ height: 4, background: c.primary, width: `${(step / (STEPS.length - 1)) * 100}%`, transition: 'width .4s ease' }} />
      </div>

      {/* Step nav */}
      <div style={{ background: 'white', borderBottom: '1px solid #E8ECF8' }}>
        <Section>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px',
                borderBottom: `2px solid ${i === step ? c.primary : 'transparent'}`,
                opacity: i > step ? 0.4 : 1, flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{i < step ? '✅' : s.icon}</span>
                <span style={{ fontSize: 12, fontWeight: i === step ? 700 : 500, color: i === step ? c.primary : '#4B5675', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
        {STEP_COMPONENTS[step]}
      </Section>

      <div style={{ borderTop: '1px solid #E8ECF8', padding: '20px', textAlign: 'center', marginTop: 40 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#9DA8C7' }}>Onboarding Portal · Powered by Vercentic</p>
      </div>
    </div>
  )
}
