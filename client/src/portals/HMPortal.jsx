import { useState, useEffect, useCallback } from 'react'
import { css, Section, Badge, Avatar, STATUS_COLORS, recordTitle } from './shared.jsx'
import HMWidget from './HMWidget.jsx'

// ── Icon helper ───────────────────────────────────────────────────────────────
const Ic = ({ n, s=16, c='currentColor' }) => {
  const P = {
    loader:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    user:    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    eye_off: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
    log_out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    grid:    'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    alert:   'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[n] || P.alert}/>
    </svg>
  )
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ portal, api, onLogin }) {
  const c    = css(portal.branding)
  const br   = portal.branding || {}
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const res = await api.post(`/portals/${portal.id}/session`, { email, password })
      if (res.token) onLogin(res)
      else setErr('Login failed. Please check your credentials.')
    } catch {
      setErr('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background: c.bg, fontFamily: c.font,
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:360, background:'#fff', borderRadius:20, padding:36,
        boxShadow:'0 24px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          {br.logo_url
            ? <img src={br.logo_url} style={{ height:44, objectFit:'contain', marginBottom:16 }} alt="logo"/>
            : <div style={{ width:52, height:52, borderRadius:14, background:c.primary,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:900, fontSize:22, margin:'0 auto 16px' }}>
                {(br.company_name||'H')[0]}
              </div>
          }
          <div style={{ fontSize:20, fontWeight:800, color:'#0F1729' }}>
            {br.company_name || 'Hiring Manager'} Portal
          </div>
          <div style={{ fontSize:13, color:'#9DA8C7', marginTop:6 }}>Sign in with your Vercentic account</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#4B5675', display:'block', marginBottom:6 }}>
              Email address
            </label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              placeholder="you@company.com"
              style={{ width:'100%', padding:'11px 14px', borderRadius:10,
                border:'1.5px solid #E8ECF8', fontSize:13, fontFamily:'inherit',
                outline:'none', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor=c.primary}
              onBlur={e=>e.target.style.borderColor='#E8ECF8'}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:'#4B5675', display:'block', marginBottom:6 }}>
              Password
            </label>
            <div style={{ position:'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password}
                onChange={e=>setPassword(e.target.value)} required
                placeholder="••••••••"
                style={{ width:'100%', padding:'11px 40px 11px 14px', borderRadius:10,
                  border:'1.5px solid #E8ECF8', fontSize:13, fontFamily:'inherit',
                  outline:'none', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=c.primary}
                onBlur={e=>e.target.style.borderColor='#E8ECF8'}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', padding:0, color:'#9DA8C7'
              }}>
                <Ic n={showPw ? 'eye_off' : 'eye'} s={15}/>
              </button>
            </div>
          </div>

          {err && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#FEF2F2',
              border:'1px solid #FECACA', color:'#DC2626', fontSize:12, fontWeight:600, marginBottom:16 }}>
              {err}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'12px', borderRadius:12, border:'none',
            background: c.primary, color:'white', fontSize:14, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'#9DA8C7' }}>
          Powered by Vercentic
        </div>
      </div>
    </div>
  )
}

// ── Authenticated portal shell ────────────────────────────────────────────────
function PortalShell({ portal, session, api, onLogout }) {
  const c  = css(portal.branding)
  const br = portal.branding || {}
  const user = session.user

  // Widgets come from portal.pages[0].widgets or portal.hm_widgets
  // An admin configures these in the Portal Builder
  const widgets = portal.hm_widgets || portal.pages?.[0]?.widgets || []

  // Create an authenticated API wrapper that adds the portal session token
  const authedApi = {
    get:   (path) => api.get(path),   // token added by portal renderer's headers
    post:  (path, body) => api.post(path, body),
    patch: (path, body) => api.patch(path, body),
  }

  const accentColor = br.primary_color || '#4361EE'

  return (
    <div style={{ minHeight:'100vh', background: c.bg, fontFamily: c.font }}>
      {/* Header */}
      <div style={{ background:'#1E2235', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:60 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {br.logo_url
                ? <img src={br.logo_url} style={{ height:28, objectFit:'contain' }} alt="logo"/>
                : <div style={{ width:32, height:32, borderRadius:9, background:accentColor,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontWeight:900, fontSize:14 }}>
                    {(br.company_name||'H')[0]}
                  </div>}
              <div style={{ color:'white', fontSize:14, fontWeight:700 }}>
                {br.company_name || 'Hiring Manager'} Portal
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:accentColor,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'white', fontWeight:800, fontSize:12 }}>
                  {(user.first_name||'?')[0]}{(user.last_name||'')[0]}
                </div>
                <div>
                  <div style={{ color:'white', fontSize:12, fontWeight:700 }}>
                    {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>{user.email}</div>
                </div>
              </div>
              <button onClick={onLogout} title="Sign out" style={{
                background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8,
                padding:'7px 10px', cursor:'pointer', color:'rgba(255,255,255,0.6)',
                display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, fontFamily:'inherit'
              }}>
                <Ic n="log_out" s={13} c="rgba(255,255,255,0.6)"/>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
        {widgets.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#9DA8C7' }}>
            <Ic n="grid" s={36} c="#E8ECF8"/>
            <div style={{ marginTop:16, fontSize:16, fontWeight:700, color:'#4B5675' }}>
              No widgets configured
            </div>
            <div style={{ marginTop:8, fontSize:13 }}>
              An admin can add widgets to this portal in the Portal Builder.
            </div>
          </div>
        ) : (
          widgets.map((widgetConfig, i) => (
            <HMWidget key={widgetConfig.id || i}
              widgetConfig={widgetConfig}
              portal={portal}
              api={authedApi}
              color={widgetConfig.color || accentColor}
              user={user}/>
          ))
        )}
      </div>

      <div style={{ borderTop:'1px solid #E8ECF8', padding:'20px 24px', textAlign:'center' }}>
        <p style={{ margin:0, fontSize:11, color:'#9DA8C7' }}>
          Hiring Manager Portal · Powered by Vercentic
        </p>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HMPortal({ portal, api }) {
  const [session, setSession] = useState(null)

  // Restore session from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`hm_session_${portal.id}`)
      if (stored) {
        const s = JSON.parse(stored)
        if (new Date(s.expires_at) > new Date()) setSession(s)
      }
    } catch {}
  }, [portal.id])

  const handleLogin = (sessionData) => {
    sessionStorage.setItem(`hm_session_${portal.id}`, JSON.stringify(sessionData))
    setSession(sessionData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(`hm_session_${portal.id}`)
    setSession(null)
  }

  if (!session) {
    return <LoginScreen portal={portal} api={api} onLogin={handleLogin}/>
  }

  return <PortalShell portal={portal} session={session} api={api} onLogout={handleLogout}/>
}
