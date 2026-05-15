/**
 * patch-copilot-enhancements.js
 * Run from repo root: node patch-copilot-enhancements.js
 */
const fs = require('fs');
const path = require('path');

const AI_PATH = path.join(__dirname, 'client/src/AI.jsx');

function patch(label, oldStr, newStr) {
  let src = fs.readFileSync(AI_PATH, 'utf8');
  if (!src.includes(oldStr)) {
    console.error(`✗ [${label}] Pattern NOT FOUND — skipping`);
    return;
  }
  fs.writeFileSync(AI_PATH, src.replace(oldStr, newStr), 'utf8');
  console.log(`✓ [${label}]`);
}

// 1. ADD STATE VARIABLES
patch('1 — state vars',
  `  const [interviewTypes, setInterviewTypes] = useState([]);`,
  `  const [interviewTypes, setInterviewTypes] = useState([]);
  const [pendingMoveStage,  setPendingMoveStage]   = useState(null);
  const [pendingComms,      setPendingComms]        = useState(null);
  const [pendingOfferAction,setPendingOfferAction]  = useState(null);
  const [pipelineLinks,     setPipelineLinks]       = useState([]);
  const [todaySchedule,     setTodaySchedule]       = useState(null);`
);

// 2. LOAD PIPELINE LINKS
patch('2 — load pipeline links',
  `  // ── Load interview types ─────────────────────────────────────────────────`,
  `  // ── Load pipeline links when viewing a person ────────────────────────────
  useEffect(() => {
    if (!open || !currentRecord || currentObject?.slug !== 'people') {
      setPipelineLinks([]);
      return;
    }
    tFetch(\`/api/workflows/people-links?person_record_id=\${currentRecord.id}\`)
      .then(r => r.json())
      .then(d => setPipelineLinks(Array.isArray(d) ? d : []))
      .catch(() => setPipelineLinks([]));
  }, [open, currentRecord?.id, currentObject?.slug]);

  // ── Load interview types ─────────────────────────────────────────────────`
);

// 3. ADD parsers
patch('3 — parsers',
  `  const parseSearchQuery = (text) => {`,
  `  const parseMoveStage = (text) => {
    const m = text.match(/<MOVE_STAGE>([\s\S]*?)<\/MOVE_STAGE>/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  };
  const parseSendComms = (text) => {
    const m = text.match(/<SEND_COMMS>([\s\S]*?)<\/SEND_COMMS>/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  };
  const parseOfferAction = (text) => {
    const m = text.match(/<OFFER_ACTION>([\s\S]*?)<\/OFFER_ACTION>/);
    if (!m) return null;
    try { return JSON.parse(m[1].trim()); } catch { return null; }
  };
  const parseTodaySchedule = (text) => /<TODAY_SCHEDULE\s*\/>/.test(text);

  const parseSearchQuery = (text) => {`
);

// 4. ADD to stripBlocks
patch('4 — stripBlocks',
  `    .replace(/<SEARCH_QUERY>[\s\S]*?<\/SEARCH_QUERY>/g,"")
    .trim();`,
  `    .replace(/<SEARCH_QUERY>[\s\S]*?<\/SEARCH_QUERY>/g,"")
    .replace(/<MOVE_STAGE>[\s\S]*?<\/MOVE_STAGE>/g,"")
    .replace(/<SEND_COMMS>[\s\S]*?<\/SEND_COMMS>/g,"")
    .replace(/<OFFER_ACTION>[\s\S]*?<\/OFFER_ACTION>/g,"")
    .replace(/<TODAY_SCHEDULE\s*\/>/g,"")
    .trim();`
);

// 5. RESET pending states in sendMessage
patch('5 — reset pending states',
  `    setPendingRecord(null);
    setPendingWorkflow(null);
    setPendingUser(null);
    setPendingRole(null);`,
  `    setPendingRecord(null);
    setPendingWorkflow(null);
    setPendingUser(null);
    setPendingRole(null);
    setPendingMoveStage(null);
    setPendingComms(null);
    setPendingOfferAction(null);
    setTodaySchedule(null);`
);

// 6. PARSE and SET STATE from assistant response
patch('6 — parse new blocks in response handler',
  `      const offerData    = parseCreateOffer(text);`,
  `      const offerData    = parseCreateOffer(text);
      const moveStageData   = parseMoveStage(text);
      const sendCommsData   = parseSendComms(text);
      const offerActionData = parseOfferAction(text);
      const todayFlag       = parseTodaySchedule(text);
      if (moveStageData)   setPendingMoveStage(moveStageData);
      if (sendCommsData)   setPendingComms(sendCommsData);
      if (offerActionData) setPendingOfferAction(offerActionData);
      if (todayFlag) {
        tFetch(\`/api/interviews?environment_id=\${environment?.id}\`)
          .then(r => r.json())
          .then(data => {
            const today = new Date().toISOString().slice(0,10);
            const todays = (Array.isArray(data) ? data : data.interviews || [])
              .filter(i => i.date === today)
              .sort((a,b) => (a.time||'').localeCompare(b.time||''));
            setTodaySchedule(todays);
          })
          .catch(() => setTodaySchedule([]));
      }`
);

// 7. ADD pipeline context builder helper (before buildSystemPrompt)
patch('7 — pipeline context builder',
  `  const buildSystemPrompt = () => {`,
  `  const buildPipelineContext = () => {
    if (!pipelineLinks.length) return '';
    const lines = pipelineLinks.map(l =>
      \`- Link ID: \${l.id} | Job/Record: \${l.target_name || l.target_record_id?.slice(0,8)} | Current stage: \${l.stage_name || 'Not set'} | Workflow: \${l.workflow_name || 'Unknown'}\`
    );
    return \`\\nPIPELINE LINKS (this person's current pipeline positions):\\n\${lines.join('\\n')}\\n\`;
  };

  const buildSystemPrompt = () => {`
);

// 8. APPEND pipeline context to SYSTEM_PROMPT
patch('8 — append pipeline context',
  `  const SYSTEM_PROMPT = buildSystemPrompt();`,
  `  const SYSTEM_PROMPT = buildSystemPrompt() + buildPipelineContext();`
);

// 9. ADD new instruction blocks to system prompt (after the RUN_REPORT rules)
patch('9 — system prompt new instruction blocks',
  `- Always suggest a sensible chart_type for the data shape\`;`,
  `- Always suggest a sensible chart_type for the data shape

MOVE PIPELINE STAGE INSTRUCTIONS:
When the user wants to move a candidate to a different stage (e.g. "move James to Interview", "advance to offer", "put in screening"):
1. Check PIPELINE LINKS context for this person's current positions and link IDs.
2. If ambiguous (multiple pipelines), ask which one.
3. Output:
<MOVE_STAGE>
{"link_id":"UUID from PIPELINE LINKS","stage_name":"Interview","person_name":"James Harrison","from_stage":"Screening","job_name":"Senior Engineer"}
</MOVE_STAGE>
RULES: NEVER guess a link_id — only use IDs from PIPELINE LINKS context. stage_name must exactly match a workflow step name.

SEND COMMUNICATION INSTRUCTIONS:
When the user wants to send an email, SMS, or WhatsApp to the current person:
1. Use email/phone from CURRENT RECORD DATA if available.
2. Collect: type (email/sms/whatsapp), subject (if email), body.
3. Output:
<SEND_COMMS>
{"type":"email","to":"james@example.com","subject":"Interview Invitation","body":"Hi James...","person_name":"James Harrison"}
</SEND_COMMS>
RULES: Keep body professional. "to" for SMS/WhatsApp is a phone number with country code.

OFFER ACTION INSTRUCTIONS:
When the user wants to approve/send/withdraw an existing offer:
Output:
<OFFER_ACTION>
{"offer_id":"UUID","action":"approve","person_name":"James Harrison","note":"Approved"}
</OFFER_ACTION>
action must be: approve | send | withdraw. Only use offer IDs from context.

TODAY'S SCHEDULE:
When asked "what interviews do I have today?" or "today's schedule":
Output: <TODAY_SCHEDULE/>
The client fetches and displays it automatically.\`;`
);

// 10. ADD confirm handlers (after handleConfirmForm, before handleConfirmReport)
patch('10 — confirm handlers',
  `  const handleConfirmReport = () => {`,
  `  const handleConfirmMoveStage = async () => {
    if (!pendingMoveStage) return;
    setCreating(true);
    try {
      await tFetch(\`/api/workflows/people-links/\${pendingMoveStage.link_id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json',
          'X-User-Id': localStorage.getItem('userId') || '',
          'X-Tenant-Slug': localStorage.getItem('tenantSlug') || 'default' },
        body: JSON.stringify({ stage_name: pendingMoveStage.stage_name }),
      });
      setMessages(m => [...m, { role:'assistant',
        content: \`✅ **\${pendingMoveStage.person_name}** moved to **\${pendingMoveStage.stage_name}\${pendingMoveStage.job_name ? \` on \${pendingMoveStage.job_name}\` : ''}**\`,
        ts: new Date() }]);
      if (currentRecord) {
        tFetch(\`/api/workflows/people-links?person_record_id=\${currentRecord.id}\`)
          .then(r => r.json()).then(d => setPipelineLinks(Array.isArray(d) ? d : []));
      }
      setPendingMoveStage(null);
    } catch(err) {
      setMessages(m => [...m, { role:'assistant', content:\`Failed: \${err.message}\`, ts:new Date(), error:true }]);
    }
    setCreating(false);
  };

  const handleConfirmComms = async () => {
    if (!pendingComms || !currentRecord || !environment?.id) return;
    setCreating(true);
    try {
      const item = await tFetch('/api/comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          'X-User-Id': localStorage.getItem('userId') || '',
          'X-Tenant-Slug': localStorage.getItem('tenantSlug') || 'default' },
        body: JSON.stringify({
          record_id: currentRecord.id, environment_id: environment.id,
          type: pendingComms.type, direction: 'outbound',
          to: pendingComms.to, subject: pendingComms.subject, body: pendingComms.body,
          from_label: 'Copilot', created_by: 'Copilot',
        }),
      }).then(r => r.json());
      const simulated = item.simulated || item.status === 'simulated';
      setMessages(m => [...m, { role:'assistant',
        content: simulated
          ? \`📨 \${pendingComms.type === 'email' ? 'Email' : pendingComms.type.toUpperCase()} saved (simulation mode — credentials not configured). Logged for **\${pendingComms.person_name}**.\`
          : \`✅ \${pendingComms.type === 'email' ? 'Email' : pendingComms.type.toUpperCase()} sent to **\${pendingComms.person_name}**\`,
        ts: new Date() }]);
      setPendingComms(null);
    } catch(err) {
      setMessages(m => [...m, { role:'assistant', content:\`Failed to send: \${err.message}\`, ts:new Date(), error:true }]);
    }
    setCreating(false);
  };

  const handleConfirmOfferAction = async () => {
    if (!pendingOfferAction) return;
    setCreating(true);
    try {
      await tFetch(\`/api/offers/\${pendingOfferAction.offer_id}/status\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json',
          'X-User-Id': localStorage.getItem('userId') || '',
          'X-Tenant-Slug': localStorage.getItem('tenantSlug') || 'default' },
        body: JSON.stringify({ action: pendingOfferAction.action, note: pendingOfferAction.note }),
      });
      const label = { approve:'Approved', send:'Sent to candidate', withdraw:'Withdrawn' }[pendingOfferAction.action] || pendingOfferAction.action;
      setMessages(m => [...m, { role:'assistant',
        content: \`✅ Offer for **\${pendingOfferAction.person_name}** — **\${label}**\`,
        ts: new Date() }]);
      setPendingOfferAction(null);
    } catch(err) {
      setMessages(m => [...m, { role:'assistant', content:\`Failed: \${err.message}\`, ts:new Date(), error:true }]);
    }
    setCreating(false);
  };

  const handleConfirmReport = () => {`
);

// 11. ADD UI CARDS in JSX (before the Messages section)
patch('11 — UI cards',
  `          {/* Messages */}`,
  `          {/* ── Move Stage Card ── */}
          {pendingMoveStage && (
            <div style={{margin:"8px 16px",padding:"14px",borderRadius:12,border:"1.5px solid #7c3aed",background:"#f5f3ff"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#7c3aed",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="arrowRight" s={14} c="white"/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>Move Pipeline Stage</div>
                  <div style={{fontSize:11,color:"#7c3aed",fontWeight:600}}>
                    {pendingMoveStage.person_name} → <strong>{pendingMoveStage.stage_name}</strong>
                    {pendingMoveStage.job_name ? \` on \${pendingMoveStage.job_name}\` : ''}
                  </div>
                </div>
              </div>
              {pendingMoveStage.from_stage && (
                <div style={{marginBottom:10,fontSize:12,color:"#6b7280"}}>
                  <span style={{color:"#374151",fontWeight:600}}>{pendingMoveStage.from_stage}</span>{' → '}<span style={{color:"#7c3aed",fontWeight:700}}>{pendingMoveStage.stage_name}</span>
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPendingMoveStage(null)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #E5E7EB",background:"transparent",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
                <button onClick={handleConfirmMoveStage} disabled={creating} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:"#7c3aed",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {creating?<><Ic n="loader" s={12}/> Moving…</>:<><Ic n="check" s={12}/> Confirm Move</>}
                </button>
              </div>
            </div>
          )}
          {/* ── Send Comms Card ── */}
          {pendingComms && (
            <div style={{margin:"8px 16px",padding:"14px",borderRadius:12,border:"1.5px solid #0891b2",background:"#ecfeff"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#0891b2",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="mail" s={14} c="white"/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{pendingComms.type==='email'?'Send Email':pendingComms.type==='sms'?'Send SMS':'Send WhatsApp'}</div>
                  <div style={{fontSize:11,color:"#0891b2",fontWeight:600}}>To: {pendingComms.person_name||pendingComms.to}</div>
                </div>
              </div>
              {pendingComms.subject&&<div style={{marginBottom:6,fontSize:12,color:"#374151"}}><strong>Subject:</strong> {pendingComms.subject}</div>}
              <div style={{marginBottom:10,padding:"8px 10px",background:"white",borderRadius:8,border:"1px solid #cffafe",fontSize:12,color:"#374151",lineHeight:1.5,maxHeight:80,overflow:"hidden"}}>{pendingComms.body}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPendingComms(null)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #E5E7EB",background:"transparent",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
                <button onClick={handleConfirmComms} disabled={creating} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:"#0891b2",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {creating?<><Ic n="loader" s={12}/> Sending…</>:<><Ic n="mail" s={12}/> Send</>}
                </button>
              </div>
            </div>
          )}
          {/* ── Offer Action Card ── */}
          {pendingOfferAction && (
            <div style={{margin:"8px 16px",padding:"14px",borderRadius:12,border:"1.5px solid #0ca678",background:"#f0fdf4"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#0ca678",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="dollar" s={14} c="white"/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{pendingOfferAction.action==='approve'?'Approve Offer':pendingOfferAction.action==='send'?'Send Offer to Candidate':'Withdraw Offer'}</div>
                  <div style={{fontSize:11,color:"#0ca678",fontWeight:600}}>{pendingOfferAction.person_name}</div>
                </div>
              </div>
              {pendingOfferAction.note&&<div style={{marginBottom:10,fontSize:12,color:"#374151"}}>{pendingOfferAction.note}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setPendingOfferAction(null)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #E5E7EB",background:"transparent",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F}}>Cancel</button>
                <button onClick={handleConfirmOfferAction} disabled={creating} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:pendingOfferAction.action==='withdraw'?"#e03131":"#0ca678",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {creating?<><Ic n="loader" s={12}/> Processing…</>:<><Ic n="check" s={12}/> Confirm</>}
                </button>
              </div>
            </div>
          )}
          {/* ── Today's Schedule Card ── */}
          {todaySchedule !== null && (
            <div style={{margin:"8px 16px",padding:"14px",borderRadius:12,border:"1.5px solid #3b5bdb",background:"#eef2ff"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#3b5bdb",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="calendar" s={14} c="white"/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>Today's Interviews</div>
                  <div style={{fontSize:11,color:"#3b5bdb",fontWeight:600}}>{todaySchedule.length===0?'None scheduled':\`\${todaySchedule.length} interview\${todaySchedule.length!==1?'s':''}\`}</div>
                </div>
                <button onClick={()=>setTodaySchedule(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4,opacity:0.5}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.5}><Ic n="x" s={13} c="#374151"/></button>
              </div>
              {todaySchedule.length===0
                ? <div style={{fontSize:12,color:"#6b7280",textAlign:"center",padding:"8px 0"}}>No interviews scheduled for today.</div>
                : <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {todaySchedule.map(iv=>(
                      <div key={iv.id} style={{padding:"8px 10px",background:"white",borderRadius:8,border:"1px solid #c5d0f8",fontSize:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontWeight:700,color:"#3b5bdb",minWidth:42}}>{iv.time||'—'}</span>
                          <span style={{color:"#111827",fontWeight:600,flex:1}}>{iv.candidate_name||iv.candidate_id?.slice(0,8)}</span>
                          <span style={{color:"#6b7280",fontSize:11}}>{iv.format||'Interview'}</span>
                        </div>
                        {iv.job_title&&<div style={{fontSize:11,color:"#6b7280",marginTop:3,paddingLeft:50}}>{iv.job_title}</div>}
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}
          {/* Messages */}`
);

// 12. ADD move stage quick action to RECORD_ACTIONS people
patch('12 — move stage quick action',
  `    { id:"match",     icon:"layers",   label:"Recommend jobs",  prompt:"Which open jobs would be the best fit for this candidate and why?" },
  ],`,
  `    { id:"match",     icon:"layers",   label:"Recommend jobs",  prompt:"Which open jobs would be the best fit for this candidate and why?" },
    { id:"move",      icon:"arrowRight",label:"Move stage",      prompt:"Move this candidate to the next stage in the pipeline." },
  ],`
);

// 13. ADD today's schedule to CREATE_ACTIONS
patch('13 — today schedule quick action',
  `  { id:"search",       icon:"search",    label:"Search records",  prompt:"Search for " },
];`,
  `  { id:"search",       icon:"search",    label:"Search records",  prompt:"Search for " },
  { id:"today",        icon:"calendar",  label:"Today's schedule", prompt:"What interviews do I have today?" },
];`
);

console.log('\n✅ All patches done.');
