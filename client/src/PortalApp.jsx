import { useState, useEffect } from 'react'
import PortalPageRenderer from './portals/PortalPageRenderer.jsx'

// Simple fetch helper — credentials:include sends session cookie for draft previews
const api = {
  get:  (p) => fetch(`/api${p}`, { credentials: 'include' })
                 .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
  post: (p, b) => fetch(`/api${p}`, {
                   method: 'POST',
                   credentials: 'include',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(b)
                 }).then(r => r.json()),
}

const Spinner = ({ color = '#4361EE' }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#EEF2FF' }}>
    <div style={{ width:40, height:40, border:`4px solid ${color}30`, borderTop:`4px solid ${color}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)

const ErrorScreen = ({ message }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#FEF2F2', fontFamily:"'DM Sans', sans-serif" }}>
    <div style={{ textAlign:'center', maxWidth:440, padding:40 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:800, color:'#0F1729' }}>Portal Unavailable</h2>
      <p style={{ color:'#6B7280', fontSize:14, lineHeight:1.6 }}>{message}</p>
    </div>
  </div>
)

export default function PortalApp({ slug }) {
  const [portal,  setPortal]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!slug) {
      setError('No portal slug provided.')
      setLoading(false)
      return
    }

    // Strip leading slashes — /new-careers and new-careers both work
    const cleanSlug = slug.replace(/^\/+/, '')

    api.get(`/portals/slug/${cleanSlug}`)
      .then(p => {
        // Inject page title
        document.title = p.branding?.company_name || p.name || 'Portal'
        // Inject custom font if configured
        const font = p.theme?.fontFamily || p.branding?.font
        if (font) {
          const fontName = font.replace(/['"]/g, '').split(',')[0].trim()
          const link = document.createElement('link')
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800&display=swap`
          link.rel = 'stylesheet'
          document.head.appendChild(link)
        }
        setPortal(p)
        setLoading(false)
      })
      .catch(err => {
        const status = err?.message || ''
        if (status === '403') {
          setError('This portal exists but has not been published yet. Open the portal builder and click Publish.')
        } else if (status === '404') {
          setError('No portal found at this URL. Check the link and try again.')
        } else if (status === '401') {
          setError('This portal is not available. It may have been unpublished or the URL is incorrect.')
        } else {
          setError('This portal is not available. It may have been unpublished or the URL is incorrect.')
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) return <Spinner color={portal?.theme?.primaryColor || portal?.branding?.primary_color} />
  if (error || !portal) return <ErrorScreen message={error || 'Portal not found.'} />

  return <PortalPageRenderer portal={portal} api={api} />
}
