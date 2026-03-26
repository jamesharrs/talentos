#!/usr/bin/env node
/**
 * patch-copilot-portal.js
 * 
 * Adds CREATE_PORTAL capability to the Vercentic Copilot.
 * The copilot can create portals with full branding, pages, widgets, nav, and footer.
 * 
 * Run from the project root:
 *   node patch-copilot-portal.js
 */

const fs = require('fs');
const path = require('path');

const AI_PATH = path.join(__dirname, 'client/src/AI.jsx');

function patch(file, label, find, replace) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes(find)) {
    console.warn(`⚠ [${label}] anchor not found — skipping`);
    return false;
  }
  content = content.replace(find, replace);
  fs.writeFileSync(file, content);
  console.log(`✅ [${label}] applied`);
  return true;
}

// ── 1. Add pendingPortal state alongside other pending states ─────────────────
patch(AI_PATH, '1. pendingPortal state',
  `const [pendingForm, setPendingForm] = useState(null);`,
  `const [pendingForm, setPendingForm] = useState(null);
  const [pendingPortal, setPendingPortal] = useState(null);`
);

// ── 2. Add parseCreatePortal parser function ──────────────────────────────────
patch(AI_PATH, '2. parseCreatePortal parser',
  `const parseCreateForm = (text) => {`,
  `const parseCreatePortal = (text) => {
    const match = text.match(/<CREATE_PORTAL>([\\s\\S]*?)<\\/CREATE_PORTAL>/);
    if (!match) return null;
    try { return JSON.parse(match[1].trim()); } catch { return null; }
  };

  const parseCreateForm = (text) => {`
);

// ── 3. Add CREATE_PORTAL to stripBlocks ───────────────────────────────────────
patch(AI_PATH, '3. stripBlocks',
  `.replace(/<CREATE_FORM>[\\s\\S]*?<\\/CREATE_FORM>/g,"")`,
  `.replace(/<CREATE_FORM>[\\s\\S]*?<\\/CREATE_FORM>/g,"")
    .replace(/<CREATE_PORTAL>[\\s\\S]*?<\\/CREATE_PORTAL>/g,"")`
);

// ── 4. Reset pendingPortal on new message ─────────────────────────────────────
patch(AI_PATH, '4. Reset pendingPortal',
  `setPendingForm(null);`,
  `setPendingForm(null);
    setPendingPortal(null);`
);

// ── 5. Parse portal data from AI response and set state ───────────────────────
// Find where other blocks are parsed after the AI response
patch(AI_PATH, '5. Parse portal in sendMessage',
  `const formData = parseCreateForm(fullText);
      if (formData) setPendingForm(formData);`,
  `const formData = parseCreateForm(fullText);
      if (formData) setPendingForm(formData);
      const portalData = parseCreatePortal(fullText);
      if (portalData) setPendingPortal(portalData);`
);

// ── 6. Add portal creation instructions to system prompt ──────────────────────
// Add after the FORM CREATION section
patch(AI_PATH, '6. System prompt - portal instructions',
  `You can also help build reports.`,
  `You can also help build reports.

## PORTAL CREATION

When the user wants to create a portal (career site, hiring manager portal, agency portal, onboarding portal),
gather these details conversationally:

1. **Portal type** — ask what kind: career_site, hm_portal, agency_portal, or onboarding
2. **Name & company** — the portal name and company branding name
3. **Design direction** — ask about their brand: colours, style (modern/corporate/creative/minimal), industry
4. **Content needs** — what pages they want, what information to show

Then output the full portal configuration inside <CREATE_PORTAL>...</CREATE_PORTAL> tags as JSON:

\`\`\`
{
  "name": "Acme Careers",
  "slug": "/careers",
  "type": "career_site",
  "description": "Career site for Acme Corporation",
  "theme": {
    "primaryColor": "#4361EE",
    "secondaryColor": "#7C3AED",
    "bgColor": "#FFFFFF",
    "textColor": "#0F1729",
    "accentColor": "#F79009",
    "fontFamily": "'Plus Jakarta Sans', sans-serif",
    "headingFont": "'Plus Jakarta Sans', sans-serif",
    "fontSize": "16px",
    "headingWeight": "700",
    "borderRadius": "10px",
    "buttonStyle": "filled",
    "buttonRadius": "10px",
    "maxWidth": "1200px"
  },
  "pages": [
    {
      "name": "Home",
      "slug": "/",
      "rows": [
        {
          "preset": "1",
          "padding": "xl",
          "bgColor": "",
          "cells": [
            {
              "widgetType": "hero",
              "widgetConfig": {
                "headline": "Find Your Next Opportunity",
                "subheading": "Join a team building something meaningful.",
                "ctaText": "See Open Roles",
                "ctaHref": "#jobs",
                "align": "center"
              }
            }
          ]
        },
        {
          "preset": "1",
          "padding": "lg",
          "cells": [
            {
              "widgetType": "jobs",
              "widgetConfig": {
                "heading": "Open Positions",
                "showFilters": true
              }
            }
          ]
        }
      ]
    }
  ],
  "nav": {
    "logo_text": "Acme",
    "links": [
      { "label": "Home", "href": "/" },
      { "label": "Roles", "href": "#jobs" }
    ],
    "bg": "#0F1729",
    "color": "#FFFFFF",
    "sticky": true
  },
  "footer": {
    "bg": "#0F1729",
    "color": "#9CA3AF",
    "copyright": "© 2026 Acme Corporation",
    "columns": []
  }
}
\`\`\`

### Available widget types you can use in page rows:
- **hero** — headline, subheading, CTA button, optional background image. Config: headline, subheading, ctaText, ctaHref, align (center/left), bgImage, bgColor
- **text** — rich text content block. Config: heading, content (markdown)
- **rich_text** — article/markdown content. Config: content (markdown string)
- **image** — photo or illustration. Config: src, alt, caption
- **jobs** — live job board pulling from Vercentic jobs. Config: heading, showFilters (true/false), limit
- **job_list** — compact job listing. Config: heading, limit
- **form** — simple contact/application form. Config: heading, fields
- **multistep_form** — multi-step application wizard. Config: formTitle, submitText, successMessage, steps (array of {title, fields})
- **stats** — statistics row. Config: stats (array of {value, label})
- **team** — team member grid. Config: heading
- **testimonials** — quote carousel. Config: items (array of {quote, author, role})
- **video** — embedded video. Config: src, poster
- **cta_banner** — call-to-action banner. Config: heading, subheading, ctaText, ctaHref, bgColor, textColor, eyebrow
- **map_embed** — office location map. Config: address or embedUrl
- **divider** — horizontal line. Config: thickness, color, dividerStyle
- **spacer** — vertical space. Config: height (xs/sm/md/lg/xl)

### Design guidance to follow:
- Career sites should have: hero, stats (team size, offices, rating), job board, CTA banner, and optionally testimonials/team
- HM portals need: a clean dashboard feel, candidate review widgets, feedback forms
- Agency portals need: role listing, submission form, status tracking
- Onboarding portals need: welcome message, task checklist, document upload

### Colour palette suggestions by industry:
- Tech/SaaS: indigo/violet (#4361EE, #7C3AED) on white
- Finance: navy/gold (#1E3A5F, #D4A853) on white
- Healthcare: teal/green (#0D9488, #059669) on soft green
- Creative: rose/coral (#E11D48, #FB7185) on light
- Corporate: slate/blue (#334155, #3B82F6) on white
- Startup: bright accent (#F59E0B or #8B5CF6) on dark (#0F172A)

### Font suggestions:
- Modern: 'Plus Jakarta Sans', 'Geist', 'DM Sans'
- Corporate: 'Outfit', 'Manrope'
- Creative: 'Sora', 'Space Grotesk'
- Editorial: 'Playfair Display' for headings + 'Inter' for body

### Button styles: "filled" (solid bg), "outline" (border only), "ghost" (no border), "underline" (bottom border)

### Row presets: "1" (full width), "2" (two halves), "3" (three cols), "1-2" (⅓ + ⅔), "2-1" (⅔ + ⅓)
### Row padding: "none", "sm", "md", "lg", "xl"

Be creative with the design — suggest unexpected colour combinations, interesting widget arrangements, and compelling copy.
Always generate complete page content with real-sounding copy, not placeholder text.`
);

// ── 7. Add handleConfirmPortal function ────────────────────────────────────────
patch(AI_PATH, '7. handleConfirmPortal',
  `const handleConfirmForm = async () => {`,
  `const handleConfirmPortal = async () => {
    if (!pendingPortal || !environment?.id) return;
    setCreating(true);
    try {
      const uid = () => Math.random().toString(36).slice(2, 10);
      
      // Build the full portal object with IDs
      const pages = (pendingPortal.pages || []).map(page => ({
        id: uid(),
        name: page.name || "Home",
        slug: page.slug || "/",
        rows: (page.rows || []).map(row => ({
          id: uid(),
          preset: row.preset || "1",
          bgColor: row.bgColor || "",
          bgImage: row.bgImage || "",
          overlayOpacity: row.overlayOpacity || 0,
          padding: row.padding || "lg",
          cells: (row.cells || []).map(cell => ({
            id: uid(),
            widgetType: cell.widgetType || null,
            widgetConfig: cell.widgetConfig || {},
          })),
        })),
        seo: page.seo || {},
      }));

      const portal = await api.post("/portals", {
        environment_id: environment.id,
        name: pendingPortal.name || "New Portal",
        slug: pendingPortal.slug || "/" + (pendingPortal.name || "portal").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: pendingPortal.description || "",
        type: pendingPortal.type || "career_site",
        status: "draft",
        theme: pendingPortal.theme || {},
        pages,
        nav: pendingPortal.nav || {},
        footer: pendingPortal.footer || {},
        gdpr: pendingPortal.gdpr || {},
      });

      const pageSummary = pages.map(p => p.name).join(", ");
      const widgetCount = pages.reduce((sum, p) => sum + p.rows.reduce((s, r) => s + r.cells.filter(c => c.widgetType).length, 0), 0);

      setMessages(m => [...m, {
        role: "assistant",
        content: \`✅ **\${portal.name}** portal created as a draft! It has \${pages.length} page\${pages.length !== 1 ? "s" : ""} with \${widgetCount} widget\${widgetCount !== 1 ? "s" : ""}. Go to Settings → Portals to preview and publish it.\`,
        ts: new Date(),
        createdNav: {
          label: portal.name,
          nav: "settings",
          icon: "globe",
          color: pendingPortal.theme?.primaryColor || "#4361EE",
          sub: \`\${pendingPortal.type?.replace(/_/g, " ")} · \${pageSummary}\`,
        },
      }]);
      setPendingPortal(null);
    } catch (err) {
      setMessages(m => [...m, {
        role: "assistant",
        content: \`Failed to create portal: \${err.message}\`,
        ts: new Date(),
        error: true,
      }]);
    }
    setCreating(false);
  };

  const handleConfirmForm = async () => {`
);

// ── 8. Add "Create Portal" quick action ───────────────────────────────────────
patch(AI_PATH, '8. Quick action button',
  `{icon:"form",label:"Create Form",prompt:"I want to create a new form"},`,
  `{icon:"form",label:"Create Form",prompt:"I want to create a new form"},
          {icon:"globe",label:"Build Portal",prompt:"I want to build a new portal — a branded external experience like a career site"},`
);

// ── 9. Add portal confirmation card in the render ─────────────────────────────
// Add after the form creation card
patch(AI_PATH, '9. Portal confirmation card',
  `{/* ── Form Creation Card ── */}`,
  `{/* ── Portal Creation Card ── */}
{pendingPortal&&(
  <div style={{margin:"8px 0",padding:"16px",borderRadius:14,border:"1.5px solid #4361EE",background:"linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
      <div style={{width:36,height:36,borderRadius:10,background:pendingPortal.theme?.primaryColor||"#4361EE",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(67,97,238,.3)"}}>
        <Ic n="globe" s={18} c="white"/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0F1729"}}>{pendingPortal.name||"New Portal"}</div>
        <div style={{fontSize:11,color:"#6B7280",fontWeight:600}}>{(pendingPortal.type||"career_site").replace(/_/g," ")} · {(pendingPortal.pages||[]).length} page{(pendingPortal.pages||[]).length!==1?"s":""}</div>
      </div>
    </div>

    {/* Theme preview */}
    {pendingPortal.theme&&(
      <div style={{marginBottom:12,padding:"10px 12px",borderRadius:10,background:"white",border:"1px solid #E8ECF8"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Theme</div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {[pendingPortal.theme.primaryColor,pendingPortal.theme.secondaryColor,pendingPortal.theme.bgColor,pendingPortal.theme.textColor].filter(Boolean).map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:16,height:16,borderRadius:4,background:c,border:"1px solid #E8ECF8",flexShrink:0}}/>
              <span style={{fontSize:10,color:"#6B7280",fontFamily:"monospace"}}>{c}</span>
            </div>
          ))}
        </div>
        {pendingPortal.theme.fontFamily&&(
          <div style={{marginTop:6,fontSize:11,color:"#374151"}}>
            Font: <strong>{pendingPortal.theme.fontFamily.replace(/'/g,"").split(",")[0]}</strong>
            {pendingPortal.theme.buttonStyle&&<> · Button: <strong>{pendingPortal.theme.buttonStyle}</strong></>}
          </div>
        )}
      </div>
    )}

    {/* Pages & widgets summary */}
    <div style={{marginBottom:12,display:"flex",flexDirection:"column",gap:4}}>
      {(pendingPortal.pages||[]).map((page,pi)=>(
        <div key={pi} style={{padding:"8px 10px",background:"white",borderRadius:8,border:"1px solid #E8ECF8"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <Ic n="fileText" s={11} c="#4361EE"/>
            <span style={{fontSize:12,fontWeight:700,color:"#0F1729"}}>{page.name||"Page "+(pi+1)}</span>
            <span style={{fontSize:10,color:"#9CA3AF",marginLeft:"auto"}}>{page.slug}</span>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {(page.rows||[]).flatMap(r=>(r.cells||[])).filter(c=>c.widgetType).map((c,ci)=>(
              <span key={ci} style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#EEF2FF",color:"#4361EE",fontWeight:600}}>{c.widgetType.replace(/_/g," ")}</span>
            ))}
          </div>
        </div>
      ))}
    </div>

    {/* Nav preview */}
    {pendingPortal.nav&&(
      <div style={{marginBottom:12,padding:"6px 10px",borderRadius:8,background:pendingPortal.nav.bg||"#0F1729",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,fontWeight:700,color:pendingPortal.nav.color||"white"}}>{pendingPortal.nav.logo_text||pendingPortal.name}</span>
        {(pendingPortal.nav.links||[]).map((l,i)=>(
          <span key={i} style={{fontSize:10,color:(pendingPortal.nav.color||"white")+"99"}}>{l.label}</span>
        ))}
      </div>
    )}

    <div style={{display:"flex",gap:8}}>
      <button onClick={()=>setPendingPortal(null)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #E5E7EB",background:"transparent",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>Discard</button>
      <button onClick={handleConfirmPortal} disabled={creating} style={{flex:2,padding:"9px",borderRadius:8,border:"none",background:pendingPortal.theme?.primaryColor||"#4361EE",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 2px 8px rgba(67,97,238,.25)"}}>
        {creating?<><Ic n="loader" s={12}/> Creating…</>:<><Ic n="globe" s={12}/> Create Portal</>}
      </button>
    </div>
  </div>
)}
{/* ── Form Creation Card ── */}`
);

console.log('\n✅ All patches applied!');
console.log('\nThe Copilot can now create portals. Users can say:');
console.log('  "Build me a career site for Acme Corp with a modern blue theme"');
console.log('  "Create an onboarding portal for new hires"');
console.log('  "I need a hiring manager portal where managers can review candidates"');
console.log('\nRestart the dev server to test.');
