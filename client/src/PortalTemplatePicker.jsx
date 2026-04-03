import { useState } from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
import { getTemplatesForType } from './portalTemplates.js';

const F = "'DM Sans', -apple-system, sans-serif";
const ICON_PATHS = {
  check: "M20 6L9 17l-5-5",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  x: "M18 6L6 18M6 6l12 12",
  layout: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM3 9h18M9 21V9",
  sparkles: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};
const Ic = ({ n, s = 16, c = 'currentColor' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICON_PATHS[n] || ''} />
  </svg>
);

// ─── Template Card ──────────────────────────────────────────────────────────────
const TemplateCard = ({ template, isSelected, onSelect, onPreview }) => {
  const t = template;
  const th = t.theme || {};
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onSelect(t.id)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        border: `2.5px solid ${isSelected ? th.primaryColor || '#4361EE' : hovered ? '#D1D5DB' : '#E5E7EB'}`,
        background: '#FFFFFF', transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected ? `0 0 0 3px ${th.primaryColor||'#4361EE'}25, 0 8px 24px rgba(0,0,0,0.1)` : hovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}>
      {isSelected && (
        <div style={{ position:'absolute',top:12,right:12,zIndex:2,width:28,height:28,borderRadius:'50%',
          background:th.primaryColor||'#4361EE',display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
          <Ic n="check" s={14} c="white" />
        </div>
      )}
      {/* Mini preview */}
      <div style={{ height:200, overflow:'hidden', position:'relative', background:th.bgColor||'#F8FAFC' }}>
        {/* Simulated nav bar */}
        <div style={{ height:32, background:t.nav?.bgColor||th.primaryColor||'#0F1729', display:'flex', alignItems:'center', padding:'0 12px', gap:8 }}>
          <div style={{ fontSize:8, fontWeight:800, color:t.nav?.textColor||'white', fontFamily:th.fontFamily||F }}>{t.nav?.logoText||'Logo'}</div>
          <div style={{ flex:1 }}/>
          {(t.nav?.links||[]).slice(0,3).map((l,i)=>(
            <div key={i} style={{ fontSize:6, color:t.nav?.textColor||'white', opacity:0.7 }}>{l.label}</div>
          ))}
        </div>
        {/* Simulated hero */}
        {(()=>{
          const hero = t.pages?.[0]?.rows?.[0]?.cells?.[0];
          const cfg = hero?.widgetConfig||{};
          const hasBg = cfg.bgImage||cfg.overlayColor;
          return (
            <div style={{ padding:'16px 12px', textAlign:cfg.align||'center', minHeight:70,
              display:'flex', flexDirection:'column', justifyContent:'center',
              background: hasBg ? `linear-gradient(${cfg.overlayColor||'rgba(0,0,0,0.5)'},${cfg.overlayColor||'rgba(0,0,0,0.5)'}), url(${cfg.bgImage||''}) center/cover` : th.primaryColor+'15',
            }}>
              <div style={{ fontSize:11, fontWeight:800, color:hasBg?'white':th.textColor, fontFamily:th.fontFamily||F, lineHeight:1.2, marginBottom:4, maxWidth:200 }}>
                {cfg.heading||t.name}
              </div>
              <div style={{ fontSize:6, opacity:0.7, color:hasBg?'white':'#6B7280', lineHeight:1.3, maxWidth:180 }}>
                {(cfg.subheading||'').slice(0,80)}...
              </div>
              {cfg.buttonText && (
                <div style={{ marginTop:6, padding:'3px 8px', borderRadius:parseInt(th.buttonRadius)/2||4,
                  background:th.primaryColor||'#4361EE', color:'white', fontSize:6, fontWeight:700,
                  display:'inline-block', alignSelf:cfg.align==='center'?'center':'flex-start' }}>
                  {cfg.buttonText}
                </div>
              )}
            </div>
          );
        })()}
        {/* Placeholder content blocks */}
        <div style={{ padding:'8px 12px', display:'flex', gap:6 }}>
          {[1,2,3].map(i=><div key={i} style={{ flex:1,height:8,borderRadius:2,background:(th.primaryColor||'#E5E7EB')+'20' }}/>)}
        </div>
        <div style={{ padding:'4px 12px', display:'flex', gap:6 }}>
          {[1,2].map(i=><div key={i} style={{ flex:1,height:24,borderRadius:4,background:(th.primaryColor||'#F3F4F6')+'10',border:`1px solid ${(th.primaryColor||'#E5E7EB')}15` }}/>)}
        </div>
        {/* Colour strip */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:4,display:'flex' }}>
          <div style={{ flex:1,background:th.primaryColor||'#4361EE' }}/>
          <div style={{ flex:1,background:th.secondaryColor||'#7C3AED' }}/>
          <div style={{ flex:1,background:th.accentColor||'#06D6A0' }}/>
        </div>
      </div>
      {/* Card info */}
      <div style={{ padding:'14px 16px' }}>
        <div style={{ fontSize:14,fontWeight:800,color:'#111827',fontFamily:F,marginBottom:4 }}>{t.name}</div>
        <div style={{ fontSize:12,color:'#6B7280',lineHeight:1.5,fontFamily:F,marginBottom:10 }}>{t.description}</div>
        <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
          {(t.tags||[]).map(tag=>(
            <span key={tag} style={{ padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:600,
              background:(th.primaryColor||'#4361EE')+'12',color:th.primaryColor||'#4361EE',fontFamily:F }}>{tag}</span>
          ))}
        </div>
        <button onClick={e=>{e.stopPropagation();onPreview(t);}}
          style={{ marginTop:10,width:'100%',padding:'7px 0',borderRadius:8,border:'1px solid #E5E7EB',
            background:'transparent',color:'#6B7280',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:F,
            display:'flex',alignItems:'center',justifyContent:'center',gap:4,transition:'all .15s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.color='#111827';}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#6B7280';}}>
          <Ic n="eye" s={12}/> Full Preview
        </button>
      </div>
    </div>
  );
};

// ─── Preview Widget Renderer ────────────────────────────────────────────────────
const PreviewWidget = ({ type, config, theme }) => {
  const th = theme; const cfg = config;
  const btnStyle = { padding:'8px 20px',borderRadius:th.buttonRadius||'8px',
    background:th.buttonStyle==='filled'?th.primaryColor:'transparent',
    color:th.buttonStyle==='filled'?'white':th.primaryColor,
    border:th.buttonStyle==='outline'?`2px solid ${th.primaryColor}`:'none',
    fontSize:13,fontWeight:700,fontFamily:th.fontFamily||F,display:'inline-block',cursor:'default' };

  if (type==='hero') return (
    <div style={{ padding:'48px 24px',textAlign:cfg.align||'center',
      ...(cfg.bgImage?{backgroundImage:`linear-gradient(${cfg.overlayColor||'rgba(0,0,0,0.5)'},${cfg.overlayColor||'rgba(0,0,0,0.5)'}), url(${cfg.bgImage})`,backgroundSize:'cover',backgroundPosition:'center'}:{}) }}>
      <h1 style={{ fontSize:cfg.size==='large'?36:cfg.size==='small'?22:28,fontWeight:900,margin:'0 0 12px',
        color:cfg.bgImage?'white':th.textColor,fontFamily:th.fontFamily||F,lineHeight:1.15 }}>{cfg.heading}</h1>
      <p style={{ fontSize:15,margin:'0 0 20px',maxWidth:560,...(cfg.align==='center'?{marginLeft:'auto',marginRight:'auto'}:{}),
        color:cfg.bgImage?'rgba(255,255,255,0.8)':'#6B7280',lineHeight:1.6,fontFamily:th.fontFamily||F }}>{cfg.subheading}</p>
      {cfg.buttonText&&<span style={btnStyle}>{cfg.buttonText}</span>}
    </div>
  );
  if (type==='stats') return (
    <div style={{ display:'grid',gridTemplateColumns:`repeat(${cfg.columns||4},1fr)`,gap:16,padding:'8px 0' }}>
      {(cfg.items||[]).map((item,i)=>(
        <div key={i} style={{ textAlign:'center',padding:16,background:cfg.style==='card'?'white':'transparent',
          borderRadius:cfg.style==='card'?12:0,boxShadow:cfg.style==='card'?'0 2px 8px rgba(0,0,0,0.05)':'none' }}>
          <div style={{ fontSize:28,fontWeight:900,color:th.primaryColor,fontFamily:th.fontFamily||F }}>{item.value}</div>
          <div style={{ fontSize:12,color:'#6B7280',marginTop:4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
  if (type==='content') return (
    <div>
      {cfg.heading&&<h2 style={{ fontSize:24,fontWeight:800,margin:'0 0 12px',color:th.textColor,fontFamily:th.fontFamily||F }}>{cfg.heading}</h2>}
      {cfg.body&&<p style={{ fontSize:14,color:'#4B5563',lineHeight:1.7,fontFamily:th.fontFamily||F,whiteSpace:'pre-line' }}>{cfg.body}</p>}
      {cfg.cards&&(
        <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min(cfg.cards.length,3)},1fr)`,gap:16,marginTop:16 }}>
          {cfg.cards.map((card,i)=>(
            <div key={i} style={{ padding:16,borderRadius:12,border:'1px solid #E5E7EB',background:'white' }}>
              <div style={{ fontSize:14,fontWeight:700,color:th.textColor,marginBottom:6 }}>{card.title}</div>
              <div style={{ fontSize:12,color:'#6B7280',lineHeight:1.5 }}>{card.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  if (type==='image') return cfg.src?<img src={cfg.src} alt={cfg.alt||''} style={{ width:'100%',borderRadius:cfg.borderRadius||'8px',objectFit:'cover',display:'block' }}/>:null;
  if (type==='video') return (
    <div style={{ textAlign:'center' }}>
      {cfg.heading&&<h2 style={{ fontSize:22,fontWeight:800,margin:'0 0 8px',color:'white',fontFamily:th.fontFamily||F }}>{cfg.heading}</h2>}
      {cfg.subheading&&<p style={{ fontSize:13,color:'rgba(255,255,255,0.7)',margin:'0 0 16px' }}>{cfg.subheading}</p>}
      <div style={{ background:'#000',borderRadius:12,aspectRatio:'16/9',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:13,opacity:0.5 }}>▶ Video Preview</div>
    </div>
  );
  if (type==='jobs') return (
    <div>
      {cfg.heading&&<h2 style={{ fontSize:24,fontWeight:800,margin:'0 0 8px',color:th.textColor,fontFamily:th.fontFamily||F }}>{cfg.heading}</h2>}
      {cfg.subheading&&<p style={{ fontSize:13,color:'#6B7280',margin:'0 0 16px' }}>{cfg.subheading}</p>}
      {cfg.showSearch&&<div style={{ padding:'8px 12px',borderRadius:8,border:'1px solid #E5E7EB',background:'white',fontSize:12,color:'#9CA3AF',marginBottom:12 }}>🔍 Search roles...</div>}
      <div style={{ display:cfg.layout==='cards'?'grid':'flex',gridTemplateColumns:cfg.layout==='cards'?'repeat(2,1fr)':undefined,flexDirection:cfg.layout!=='cards'?'column':undefined,gap:10 }}>
        {['Senior Engineer','Product Manager','UX Designer'].map((title,i)=>(
          <div key={i} style={{ padding:14,borderRadius:10,border:'1px solid #E5E7EB',background:'white' }}>
            <div style={{ fontSize:13,fontWeight:700,color:th.textColor }}>{title}</div>
            <div style={{ fontSize:11,color:'#9CA3AF',marginTop:4 }}>{['Engineering','Product','Design'][i]} · {['Dubai','London','Remote'][i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (type==='cta') return (
    <div style={{ textAlign:'center',padding:'32px 24px',color:cfg.style==='dark'?'white':th.textColor }}>
      <h2 style={{ fontSize:26,fontWeight:900,margin:'0 0 8px',fontFamily:th.fontFamily||F }}>{cfg.heading}</h2>
      {cfg.subheading&&<p style={{ fontSize:14,opacity:0.8,margin:'0 0 16px' }}>{cfg.subheading}</p>}
      {cfg.buttonText&&<span style={{ ...btnStyle,background:'white',color:th.primaryColor }}>{cfg.buttonText}</span>}
    </div>
  );
  if (type==='team') return (
    <div>
      {cfg.heading&&<h2 style={{ fontSize:24,fontWeight:800,margin:'0 0 16px',color:th.textColor,textAlign:'center' }}>{cfg.heading}</h2>}
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min((cfg.members||[]).length,4)},1fr)`,gap:20 }}>
        {(cfg.members||[]).map((m,i)=>(
          <div key={i} style={{ textAlign:'center' }}>
            <img src={m.avatar} alt={m.name} style={{ width:72,height:72,borderRadius:'50%',objectFit:'cover',marginBottom:8 }}/>
            <div style={{ fontSize:13,fontWeight:700,color:th.textColor }}>{m.name}</div>
            <div style={{ fontSize:11,color:'#6B7280' }}>{m.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (type==='testimonials') return (
    <div>
      {cfg.heading&&<h2 style={{ fontSize:24,fontWeight:800,margin:'0 0 20px',color:th.textColor,textAlign:'center' }}>{cfg.heading}</h2>}
      <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min((cfg.items||[]).length,3)},1fr)`,gap:16 }}>
        {(cfg.items||[]).map((t2,i)=>(
          <div key={i} style={{ padding:20,borderRadius:12,background:'white',border:'1px solid #E5E7EB' }}>
            <p style={{ fontSize:13,color:'#4B5563',lineHeight:1.6,fontStyle:'italic',margin:'0 0 12px' }}>"{t2.quote}"</p>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              {t2.avatar&&<img src={t2.avatar} alt={t2.author} style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover' }}/>}
              <div><div style={{ fontSize:12,fontWeight:700 }}>{t2.author}</div><div style={{ fontSize:10,color:'#9CA3AF' }}>{t2.role}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (type==='gallery') return (
    <div style={{ display:'grid',gridTemplateColumns:`repeat(${cfg.columns||4},1fr)`,gap:cfg.gap||8 }}>
      {(cfg.images||[]).map((img,i)=><img key={i} src={img.src} alt={img.alt||''} style={{ width:'100%',aspectRatio:'4/3',objectFit:'cover',borderRadius:cfg.borderRadius||'8px' }}/>)}
    </div>
  );
  if (type==='form') return (
    <div style={{ maxWidth:500,margin:'0 auto',padding:24,borderRadius:12,background:'white',border:'1px solid #E5E7EB' }}>
      {cfg.heading&&<h3 style={{ fontSize:18,fontWeight:800,margin:'0 0 4px',color:th.textColor }}>{cfg.heading}</h3>}
      {cfg.subheading&&<p style={{ fontSize:12,color:'#6B7280',margin:'0 0 16px' }}>{cfg.subheading}</p>}
      {(cfg.fields||[]).slice(0,4).map((f,i)=>(
        <div key={i} style={{ marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:600,color:'#374151',marginBottom:3 }}>{f.label} {f.required&&<span style={{ color:'#EF4444' }}>*</span>}</div>
          <div style={{ padding:'7px 10px',borderRadius:6,border:'1px solid #D1D5DB',fontSize:12,color:'#9CA3AF',background:'#F9FAFB' }}>
            {f.type==='textarea'?'Enter text...':f.type==='file'?'Choose file':`Enter ${f.label.toLowerCase()}...`}
          </div>
        </div>
      ))}
      <span style={{ ...btnStyle,marginTop:8,display:'block',textAlign:'center' }}>{cfg.submitText||'Submit'}</span>
    </div>
  );
  if (type==='accordion') return (
    <div>
      {cfg.heading&&<h2 style={{ fontSize:24,fontWeight:800,margin:'0 0 16px',color:th.textColor }}>{cfg.heading}</h2>}
      {(cfg.items||[]).map((item,i)=>(
        <div key={i} style={{ padding:'12px 0',borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontSize:14,fontWeight:700,color:th.textColor }}>{item.title}</div>
          <div style={{ fontSize:12,color:'#6B7280',marginTop:4,lineHeight:1.5 }}>{item.content}</div>
        </div>
      ))}
    </div>
  );
  if (type==='divider') return <div style={{ borderTop:`${cfg.thickness||1}px solid ${cfg.color||'#E5E7EB'}`,margin:'8px 0' }}/>;
  return <div style={{ padding:16,background:'#F3F4F6',borderRadius:8,fontSize:12,color:'#9CA3AF',textAlign:'center' }}>{type||'Empty'} widget</div>;
};

// ─── Full-Screen Template Preview ───────────────────────────────────────────────
const TemplatePreview = ({ template, onClose, onSelect }) => {
  const t = template; const th = t.theme||{}; const pages = t.pages||[];
  const [currentPage, setCurrentPage] = useState(0);
  return ReactDOM.createPortal(
    <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(15,23,41,0.85)',display:'flex',flexDirection:'column' }}>
      {/* Header bar */}
      <div style={{ padding:'12px 24px',background:'#0F1729',display:'flex',alignItems:'center',gap:16,borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:700,fontFamily:F,padding:'6px 12px',borderRadius:8 }}>
          <Ic n="x" s={14} c="white"/> Close preview
        </button>
        <div style={{ flex:1 }}/>
        <div style={{ fontSize:14,fontWeight:800,color:'white',fontFamily:F }}>
          {t.name} — {({career_site:'Career Site',hm_portal:'Hiring Manager',onboarding:'Onboarding',agency_portal:'Agency'})[t.type]||t.type} Template
        </div>
        <div style={{ flex:1 }}/>
        {pages.length>1&&<div style={{ display:'flex',gap:4 }}>
          {pages.map((p,i)=>(
            <button key={i} onClick={()=>setCurrentPage(i)} style={{ padding:'4px 10px',borderRadius:6,
              background:i===currentPage?'rgba(255,255,255,0.2)':'transparent',border:'1px solid rgba(255,255,255,0.2)',
              color:'white',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:F }}>{p.name}</button>
          ))}
        </div>}
        <button onClick={()=>onSelect(t.id)} style={{ padding:'7px 16px',borderRadius:8,background:th.primaryColor||'#4361EE',border:'none',
          color:'white',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:F,display:'flex',alignItems:'center',gap:4 }}>
          <Ic n="check" s={13} c="white"/> Use This Template
        </button>
      </div>
      {/* Scrollable preview */}
      <div style={{ flex:1,overflow:'auto',display:'flex',justifyContent:'center',padding:24 }}>
        <div style={{ width:'100%',maxWidth:1200,background:th.bgColor||'white',borderRadius:12,overflow:'hidden',boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
          {/* Nav */}
          <div style={{ padding:'12px 24px',background:t.nav?.bgColor||th.primaryColor||'#0F1729',display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ fontSize:15,fontWeight:800,color:t.nav?.textColor||'white',fontFamily:th.fontFamily||F }}>{t.nav?.logoText||'Logo'}</div>
            <div style={{ flex:1 }}/>
            {(t.nav?.links||[]).map((l,i)=><span key={i} style={{ fontSize:12,color:t.nav?.textColor||'white',opacity:0.8,fontFamily:th.fontFamily||F }}>{l.label}</span>)}
          </div>
          {/* Page rows */}
          {(pages[currentPage]?.rows||[]).map((r,ri)=>(
            <div key={ri} style={{
              padding:r.padding==='none'?0:r.padding==='xl'?'64px 32px':r.padding==='lg'?'48px 32px':'24px 32px',
              background:r.bgColor||'transparent', position:'relative',
              ...(r.bgImage?{backgroundImage:`url(${r.bgImage})`,backgroundSize:'cover',backgroundPosition:'center'}:{}),
            }}>
              {r.bgImage&&r.overlayOpacity>0&&<div style={{ position:'absolute',inset:0,background:`rgba(0,0,0,${(r.overlayOpacity||0)/100})` }}/>}
              <div style={{ position:'relative',maxWidth:th.maxWidth||'1200px',margin:'0 auto',display:'flex',gap:32,flexWrap:'wrap' }}>
                {(r.cells||[]).map((c,ci)=>{
                  const total=(r.cells||[]).length;
                  const flex=r.preset==='1-2'?(ci===0?'0 0 33%':'0 0 calc(67% - 32px)'):r.preset==='2-1'?(ci===0?'0 0 calc(67% - 32px)':'0 0 33%'):r.preset==='1-1'?'0 0 calc(50% - 16px)':`1 1 ${Math.floor(100/total)}%`;
                  return <div key={ci} style={{ flex,minWidth:0 }}><PreviewWidget type={c.widgetType} config={c.widgetConfig||{}} theme={th}/></div>;
                })}
              </div>
            </div>
          ))}
          {/* Footer */}
          <div style={{ padding:'32px 24px 16px',background:t.footer?.bgColor||'#0F1729' }}>
            {(t.footer?.columns||[]).length>0&&(
              <div style={{ display:'grid',gridTemplateColumns:`repeat(${Math.min((t.footer.columns||[]).length,4)},1fr)`,gap:32,marginBottom:24 }}>
                {(t.footer.columns||[]).map((col,i)=>(
                  <div key={i}>
                    <div style={{ fontSize:12,fontWeight:700,marginBottom:8,color:t.footer?.textColor||'#F1F5F9' }}>{col.heading}</div>
                    {(col.links||[]).map((l,j)=><div key={j} style={{ fontSize:11,opacity:0.6,marginBottom:4,color:t.footer?.textColor||'#F1F5F9' }}>{l.label}</div>)}
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:12,fontSize:11,opacity:0.5,color:t.footer?.textColor||'#F1F5F9',display:'flex',justifyContent:'space-between' }}>
              <span>{t.footer?.bottomText||'© 2026 Your Company'}</span>
              <span>Powered by Vercentic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Template Picker ───────────────────────────────────────────────────────
export default function PortalTemplatePicker({ portalType, onSelect, onSkip }) {
  const templates = getTemplatesForType(portalType);
  const [selected, setSelected] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const typeLabel = ({career_site:'Career Site',hm_portal:'Hiring Manager Portal',onboarding:'Onboarding Portal',agency_portal:'Agency Portal',campaign:'Campaign Page'})[portalType]||portalType;

  const handleConfirm = () => {
    if (!selected) return;
    const template = templates.find(t => t.id === selected);
    if (template) onSelect(template);
  };

  return (
    <div style={{ maxWidth:960,margin:'0 auto',padding:'24px 20px' }}>
      {/* Header */}
      <div style={{ textAlign:'center',marginBottom:32 }}>
        <div style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:99,background:'#EEF2FF',marginBottom:12 }}>
          <Ic n="layout" s={13} c="#4361EE"/>
          <span style={{ fontSize:11,fontWeight:700,color:'#4361EE',fontFamily:F }}>CHOOSE A TEMPLATE</span>
        </div>
        <h2 style={{ fontSize:28,fontWeight:900,color:'#0F1729',margin:'0 0 8px',fontFamily:F,letterSpacing:'-0.5px' }}>{typeLabel} Templates</h2>
        <p style={{ fontSize:15,color:'#6B7280',margin:0,fontFamily:F,maxWidth:500,marginLeft:'auto',marginRight:'auto' }}>
          Pick a starting point. Every element is fully customisable — you can replace any widget, text, or image after applying.
        </p>
      </div>
      {/* Template grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:32 }}>
        {templates.map(t=>(
          <TemplateCard key={t.id} template={t} isSelected={selected===t.id} onSelect={setSelected} onPreview={setPreviewTemplate}/>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex',justifyContent:'center',gap:12,paddingTop:8,borderTop:'1px solid #E5E7EB' }}>
        <button onClick={onSkip} style={{ padding:'10px 24px',borderRadius:10,border:'1px solid #D1D5DB',background:'white',
          color:'#374151',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:F }}>Start from scratch</button>
        <button onClick={handleConfirm} disabled={!selected}
          style={{ padding:'10px 24px',borderRadius:10,border:'none',
            background:selected?'#4361EE':'#D1D5DB',color:'white',fontSize:13,fontWeight:700,
            cursor:selected?'pointer':'not-allowed',fontFamily:F,display:'flex',alignItems:'center',gap:6,transition:'background .15s' }}>
          <Ic n="sparkles" s={14} c="white"/> Apply Template
        </button>
      </div>

      {/* Preview overlay */}
      {previewTemplate&&<TemplatePreview template={previewTemplate} onClose={()=>setPreviewTemplate(null)} onSelect={id=>{setSelected(id);setPreviewTemplate(null);}}/>}
    </div>
  );
}
