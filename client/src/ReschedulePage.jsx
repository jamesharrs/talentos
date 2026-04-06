import React, { useState, useEffect, useCallback } from "react";

const F = "'Plus Jakarta Sans', -apple-system, sans-serif";
const C = {
  accent: "#4361EE", accentLight: "#EEF2FF", border: "#E8EAED",
  surface: "#fff", bg: "#f8f9fc",
  text1: "#111827", text2: "#4b5563", text3: "#9ca3af",
  green: "#0ca678", greenLight: "#ECFDF5", amber: "#f79009", amberLight: "#FFFBEB",
};

const API = (window.__VERCENTIC_API__ || "") + "/api";
const apiFetch = (url, opts = {}) =>
  fetch(API + url, { headers: { "Content-Type": "application/json" }, ...opts });

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const fmtDate  = d => d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const fmtTime  = t => { const [h,m]=t.split(":"); const hr=parseInt(h); return `${hr>12?hr-12:hr||12}:${m} ${hr>=12?"PM":"AM"}`; };
const addDays  = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const isSameDay = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const dayKey   = d => d.toISOString().slice(0,10);

// ── Mini Calendar ─────────────────────────────────────────────────────────────
const SlotCalendar = ({ selectedSlots, onToggleSlot }) => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastDay  = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0);
  const startPad = firstDay.getDay();
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

  const [pickerDate, setPickerDate] = useState(null); // day user clicked to add time
  const [timeVal, setTimeVal] = useState("09:00");

  const addSlot = () => {
    if (!pickerDate || !timeVal) return;
    const key = `${dayKey(pickerDate)}T${timeVal}`;
    if (selectedSlots.find(s => s.date===dayKey(pickerDate) && s.time===timeVal)) return;
    onToggleSlot({ date: dayKey(pickerDate), time: timeVal });
    setPickerDate(null);
  };

  const removeSlot = s => onToggleSlot(s, true);

  return (
    <div>
      {/* Month nav */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={()=>setCursor(d=>{const r=new Date(d);r.setMonth(r.getMonth()-1);return r;})}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:14}}>‹</button>
        <span style={{fontWeight:700,fontSize:15,color:C.text1}}>
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button onClick={()=>setCursor(d=>{const r=new Date(d);r.setMonth(r.getMonth()+1);return r;})}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:14}}>›</button>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.text3,padding:"4px 0"}}>{d}</div>)}
      </div>

      {/* Calendar cells */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {Array.from({length:totalCells},(_,i)=>{
          const cellDate = addDays(firstDay, i - startPad);
          const inMonth  = cellDate.getMonth() === cursor.getMonth();
          const isPast   = cellDate < today;
          const isToday  = isSameDay(cellDate, today);
          const isSelected = pickerDate && isSameDay(cellDate, pickerDate);
          const hasSlots = selectedSlots.some(s => s.date === dayKey(cellDate));
          return (
            <button key={i} disabled={!inMonth || isPast}
              onClick={() => { if(inMonth && !isPast){ setPickerDate(cellDate); setTimeVal("09:00"); }}}
              style={{
                aspectRatio:"1",border:"none",borderRadius:10,fontSize:13,fontWeight:isToday?800:500,
                cursor: (!inMonth||isPast) ? "default" : "pointer",
                background: isSelected ? C.accent : hasSlots ? C.accentLight : isToday ? "#f0f4ff" : "transparent",
                color: isSelected ? "white" : !inMonth||isPast ? C.text3 : C.text1,
                outline: hasSlots && !isSelected ? `2px solid ${C.accent}` : "none",
                position:"relative",
              }}>
              {cellDate.getDate()}
              {hasSlots && !isSelected && (
                <span style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",
                  width:4,height:4,borderRadius:"50%",background:C.accent}}/>
              )}
            </button>
          );
        })}
      </div>

      {/* Time picker for selected date */}
      {pickerDate && (
        <div style={{marginTop:16,padding:"14px 16px",background:C.accentLight,borderRadius:12,
          border:`1.5px solid ${C.accent}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.accent,marginBottom:10}}>
            Add time for {fmtDate(pickerDate)}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="time" value={timeVal} onChange={e=>setTimeVal(e.target.value)}
              style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1.5px solid ${C.accent}`,
                fontSize:13,fontFamily:F,outline:"none",background:"white",color:C.text1}}/>
            <button onClick={addSlot}
              style={{padding:"8px 16px",borderRadius:8,border:"none",background:C.accent,
                color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>
              Add slot
            </button>
            <button onClick={()=>setPickerDate(null)}
              style={{background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:18,padding:"4px"}}>✕</button>
          </div>
          <p style={{fontSize:11,color:C.accent,margin:"8px 0 0"}}>
            Tip: Add 2–3 options to give the other person flexibility
          </p>
        </div>
      )}

      {/* Selected slots list */}
      {selectedSlots.length > 0 && (
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text3,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>
            Your {selectedSlots.length} suggested time{selectedSlots.length!==1?"s":""}
          </div>
          {selectedSlots.map((s,i) => {
            const d = new Date(`${s.date}T${s.time}`);
            return (
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,
                marginBottom:6,background:"white"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.text1}}>{fmtDate(d)}</div>
                  <div style={{fontSize:12,color:C.text3}}>{fmtTime(s.time)}</div>
                </div>
                <button onClick={()=>removeSlot(s)}
                  style={{background:"none",border:"none",cursor:"pointer",color:C.text3,fontSize:16,padding:4}}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Propose Phase ─────────────────────────────────────────────────────────────
const ProposePhase = ({ interview, id, token, role, onDone }) => {
  const [slots, setSlots] = useState([]);
  const [name, setName]   = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const toggleSlot = (slot, remove=false) => {
    if (remove) {
      setSlots(prev => prev.filter(s => !(s.date===slot.date && s.time===slot.time)));
    } else {
      setSlots(prev => [...prev, slot]);
    }
  };

  const submit = async () => {
    if (slots.length === 0) { setError("Please add at least one time slot."); return; }
    setSending(true); setError("");
    try {
      const r = await apiFetch(`/reschedule/${id}/${token}/propose`, {
        method: "POST",
        body: JSON.stringify({ role, slots, name: name || (role==="candidate" ? interview.candidate_name : "Interviewer") }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Failed to send"); setSending(false); return; }
      onDone(slots);
    } catch(e) { setError(e.message); setSending(false); }
  };

  return (
    <div>
      <div style={{background:C.amberLight,border:`1px solid #fde68a`,borderRadius:12,padding:"14px 16px",marginBottom:24,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:20}}>📅</span>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:4}}>Request to reschedule</div>
          <div style={{fontSize:13,color:"#78350f"}}>
            Your current interview is <strong>{fmtDate(new Date(`${interview.date}T${interview.time}`))}</strong> at <strong>{fmtTime(interview.time)}</strong>.
            Suggest 2–3 new times below and we'll email the other party to choose.
          </div>
        </div>
      </div>

      {role === "candidate" && (
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,fontWeight:700,color:C.text3,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>Your name (optional)</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={interview.candidate_name || "Your name"}
            style={{width:"100%",padding:"8px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:13,fontFamily:F,outline:"none",boxSizing:"border-box",color:C.text1}}/>
        </div>
      )}

      <SlotCalendar selectedSlots={slots} onToggleSlot={toggleSlot}/>

      {error && <div style={{marginTop:12,color:"#dc2626",fontSize:13,fontWeight:600}}>{error}</div>}

      <button onClick={submit} disabled={sending || slots.length===0}
        style={{marginTop:20,width:"100%",padding:"12px",borderRadius:12,border:"none",
          background: slots.length===0 ? C.border : (interview?.primary_color||C.accent),
          color: slots.length===0 ? C.text3 : "white",
          fontSize:14,fontWeight:700,cursor:slots.length===0?"default":"pointer",fontFamily:F}}>
        {sending ? "Sending…" : `Send ${slots.length} time option${slots.length!==1?"s":""} →`}
      </button>
    </div>
  );
};

// ── Confirm Phase ─────────────────────────────────────────────────────────────
const ConfirmPhase = ({ interview, id, token, role, pickIndex, onDone }) => {
  const [chosen, setChosen] = useState(pickIndex !== null ? pickIndex : null);
  const [confirming, setConfirming] = useState(false);
  const [autoConfirmed, setAutoConfirmed] = useState(false);
  const slots = interview.proposed_slots || [];
  const proposedBy = interview.proposed_by === role ? "you" : (interview.proposed_by === "candidate" ? interview.candidate_name : "the interviewer");

  const confirm = async (idx) => {
    setChosen(idx); setConfirming(true);
    try {
      const r = await apiFetch(`/reschedule/${id}/${token}/confirm`, {
        method: "POST",
        body: JSON.stringify({ role, pick_index: idx }),
      });
      const data = await r.json();
      if (!r.ok) { alert(data.error||"Error"); setConfirming(false); return; }
      onDone({ date: data.date, time: data.time });
    } catch(e) { alert(e.message); setConfirming(false); }
  };

  // Auto-confirm if pick query param was set
  useEffect(() => {
    if (pickIndex !== null && !autoConfirmed && slots.length > 0) {
      setAutoConfirmed(true);
      confirm(pickIndex);
    }
  }, [pickIndex, slots.length]);

  if (confirming) return (
    <div style={{textAlign:"center",padding:"40px 0"}}>
      <div style={{fontSize:32,marginBottom:16}}>⏳</div>
      <div style={{fontSize:15,color:C.text2}}>Confirming your new time…</div>
    </div>
  );

  return (
    <div>
      <div style={{background:C.accentLight,border:`1px solid #c7d2fe`,borderRadius:12,padding:"14px 16px",marginBottom:24}}>
        <div style={{fontSize:14,fontWeight:700,color:C.accent,marginBottom:4}}>Choose a new time</div>
        <div style={{fontSize:13,color:C.text2}}>
          {proposedBy === "you" ? "You" : <strong>{proposedBy}</strong>} suggested the following times. Pick one to confirm.
        </div>
      </div>

      {slots.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px 0",color:C.text3}}>No time slots available.</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {slots.map((s, i) => {
            const d = new Date(`${s.date}T${s.time}`);
            const isChosen = chosen === i;
            return (
              <button key={i} onClick={()=>confirm(i)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"16px 18px",borderRadius:12,border:`2px solid ${isChosen?C.accent:C.border}`,
                  background: isChosen ? C.accentLight : "white",
                  cursor:"pointer",fontFamily:F,textAlign:"left",transition:"all .12s"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text1}}>{fmtDate(d)}</div>
                  <div style={{fontSize:13,color:C.text3,marginTop:2}}>{fmtTime(s.time)} · {interview.duration||45} min · {interview.format||"Video Call"}</div>
                </div>
                <div style={{padding:"6px 14px",borderRadius:8,background:C.accent,color:"white",fontSize:12,fontWeight:700}}>
                  Confirm →
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Success ───────────────────────────────────────────────────────────────────
const SuccessScreen = ({ type, slots, newTime }) => (
  <div style={{textAlign:"center",padding:"32px 0"}}>
    <div style={{fontSize:48,marginBottom:16}}>{type==="proposed" ? "📨" : "✅"}</div>
    <div style={{fontSize:20,fontWeight:800,color:C.text1,marginBottom:8}}>
      {type==="proposed" ? "Reschedule request sent!" : "Interview rescheduled!"}
    </div>
    {type==="proposed" ? (
      <div style={{fontSize:14,color:C.text2,lineHeight:1.6}}>
        We've emailed your {slots.length} suggested time{slots.length!==1?"s":""} to the other party.
        You'll receive a confirmation email once they choose.
      </div>
    ) : (
      <div style={{fontSize:14,color:C.text2,lineHeight:1.6}}>
        Your interview has been rescheduled to <strong>{fmtDate(new Date(`${newTime.date}T${newTime.time}`))}</strong> at <strong>{fmtTime(newTime.time)}</strong>.
        A confirmation has been sent to all participants.
      </div>
    )}
    <div style={{marginTop:24,padding:"14px 20px",background:C.greenLight,borderRadius:12,
      border:`1px solid #a7f3d0`,display:"inline-block",fontSize:13,color:"#065f46",fontWeight:600}}>
      You can close this window.
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReschedulePage() {
  // Parse /reschedule/:id/:token from URL
  const [, , id, token] = window.location.pathname.split("/");
  const params = new URLSearchParams(window.location.search);
  const role      = params.get("role") || "candidate";
  const phase     = params.get("phase") || "propose";         // propose | confirm
  const pickIndex = params.get("pick") !== null ? parseInt(params.get("pick")) : null;

  const [interview, setInterview] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(null); // {type, ...}

  useEffect(() => {
    if (!id || !token) { setError("Invalid reschedule link."); setLoading(false); return; }
    apiFetch(`/reschedule/${id}/${token}?role=${role}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else { setInterview(data); }
        setLoading(false);
      })
      .catch(() => { setError("Could not load interview details."); setLoading(false); });
  }, [id, token, role]);

  const interviewTitle = interview ? (interview.interview_type_name || "Interview") : "Interview";
  const companyName = "Vercentic";

  return (
    <div style={{minHeight:"100vh",background:interview?.bg_color||C.bg,fontFamily:F,display:"flex",flexDirection:"column"}}>
      {/* Header — brand-aware */}
      <div style={{background:"white",borderBottom:`1px solid ${C.border}`,padding:"14px 24px",display:"flex",alignItems:"center",gap:12}}>
        {interview?.company_logo
          ? <img src={interview.company_logo} alt={interview.company_name||"Company"} style={{height:32,maxWidth:120,objectFit:"contain"}}/>
          : <div style={{width:36,height:36,borderRadius:10,
              background:interview?.primary_color ? `linear-gradient(135deg,${interview.primary_color},${interview.primary_color}aa)` : "linear-gradient(135deg,#4361EE,#7c3aed)",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"white",fontWeight:900,fontSize:16}}>
                {(interview?.company_name||"V")[0].toUpperCase()}
              </span>
            </div>
        }
        <span style={{fontSize:15,fontWeight:700,color:C.text1}}>
          {interview?.company_name || "Vercentic"}
        </span>
      </div>

      {/* Card */}
      <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px"}}>
        <div style={{width:"100%",maxWidth:520,background:"white",borderRadius:20,
          boxShadow:"0 4px 24px rgba(0,0,0,.08)",border:`1px solid ${C.border}`,overflow:"hidden"}}>
          {/* Interview summary header */}
          {interview && !done && (
            <div style={{padding:"20px 24px",background:interview?.primary_color||"#0f1729",color:"white"}}>
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>
                {phase==="propose" ? "Request to reschedule" : "Choose a new time"}
              </div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:2}}>{interviewTitle}</div>
              <div style={{fontSize:13,color:"#94a3b8"}}>
                {interview.candidate_name}
                {interview.job_name ? ` · ${interview.job_name}` : ""}
              </div>
            </div>
          )}

          <div style={{padding:"24px"}}>
            {loading && <div style={{textAlign:"center",padding:"40px 0",color:C.text3}}>Loading…</div>}
            {!loading && error && (
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
                <div style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>Invalid link</div>
                <div style={{fontSize:13,color:C.text2}}>{error}</div>
              </div>
            )}
            {!loading && !error && done && (
              <SuccessScreen type={done.type} slots={done.slots} newTime={done.newTime}/>
            )}
            {!loading && !error && !done && interview && (
              interview.status === "cancelled" ? (
                <div style={{textAlign:"center",padding:"32px 0"}}>
                  <div style={{fontSize:32,marginBottom:12}}>🚫</div>
                  <div style={{fontSize:15,fontWeight:700,color:C.text1,marginBottom:8}}>Interview cancelled</div>
                  <div style={{fontSize:13,color:C.text2}}>This interview has already been cancelled or rescheduled.</div>
                </div>
              ) : phase === "confirm" ? (
                <ConfirmPhase interview={interview} id={id} token={token} role={role} pickIndex={pickIndex}
                  onDone={newTime=>setDone({type:"confirmed",newTime})}/>
              ) : (
                <ProposePhase interview={interview} id={id} token={token} role={role}
                  onDone={slots=>setDone({type:"proposed",slots})}/>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
