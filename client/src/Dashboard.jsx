import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const BRAND = {
  purple:     "#7F77DD",
  purpleLight:"#AFA9EC",
  rose:       "#D4537E",
  teal:       "#1D9E75",
  amber:      "#EF9F27",
  gray:       "#888780",
  cardBg:     "white",
  pageBg:     "#F8F7FF",
};
const ACCENT_COLORS = [BRAND.purple, BRAND.rose, BRAND.teal, BRAND.amber, BRAND.purpleLight];
const api = { get: (path) => fetch(path).then(r => r.json()).catch(() => null) };
let _cache = null, _cacheEnv = null;

function KpiCard({ label, value, sub, color, tag, tagKind, onClick, onReport, reportHint }) {
  const [hov, setHov] = useState(false);
  const tc = { up:{bg:"#E1F5EE",text:"#0F6E56"}, down:{bg:"#FAECE7",text:"#993C1D"}, neutral:{bg:"#EEEDFE",text:"#3C3489"} }[tagKind] || {bg:"#EEEDFE",text:"#3C3489"};
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:BRAND.cardBg, borderRadius:14, padding:"20px 22px 18px", cursor:onClick?"pointer":"default", position:"relative", overflow:"hidden", transition:"box-shadow 0.15s,transform 0.1s", boxShadow:hov&&onClick?`0 6px 24px ${color}28`:"0 1px 4px rgba(0,0,0,0.04)", transform:hov&&onClick?"translateY(-1px)":"none" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:color,borderRadius:"14px 14px 0 0" }} />
      <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:BRAND.gray,marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:38,fontWeight:700,lineHeight:1,letterSpacing:"-0.025em",color:"#111827" }}>{value}</div>
      {sub&&<div style={{ display:"flex",alignItems:"center",gap:6,marginTop:8 }}>
        {tag&&<span style={{ fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6,background:tc.bg,color:tc.text }}>{tag}</span>}
        <span style={{ fontSize:12,color:BRAND.gray }}>{sub}</span>
      </div>}
      {onReport&&hov&&<button onClick={e=>{e.stopPropagation();onReport(reportHint);}} style={{ position:"absolute",bottom:10,right:12,background:"none",border:"none",cursor:"pointer",fontSize:10,color:BRAND.purple,fontWeight:600,fontFamily:"inherit" }}>View report ↗</button>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background:BRAND.cardBg, borderRadius:14, padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", ...style }}>{children}</div>;
}
function CardHeader({ title, sub, action }) {
  return (
    <div style={{ marginBottom:sub?2:16 }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontSize:13,fontWeight:700,color:"#111827" }}>{title}</span>
        {action}
      </div>
      {sub&&<div style={{ fontSize:11,color:BRAND.gray,marginBottom:14,marginTop:2 }}>{sub}</div>}
    </div>
  );
}
const DarkTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:"#0F0F19",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#fff" }}>
      <div style={{ fontWeight:600,marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{ color:p.color||"#ccc",marginTop:2 }}>{p.name}: <strong>{p.value}</strong></div>)}
    </div>
  );
};
function FunnelRow({ label, value, pct, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex",alignItems:"center",gap:10,padding:"4px 6px",borderRadius:8,cursor:onClick?"pointer":"default",background:hov&&onClick?"rgba(127,119,221,0.04)":"transparent",transition:"background 0.12s" }}>
      <div style={{ fontSize:11,color:hov&&onClick?BRAND.purple:BRAND.gray,width:76,textAlign:"right",flexShrink:0,transition:"color 0.12s" }}>{label}</div>
      <div style={{ flex:1,height:6,background:"rgba(0,0,0,0.05)",borderRadius:99,overflow:"hidden" }}>
        <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.8s ease" }} />
      </div>
      <div style={{ fontSize:12,fontWeight:700,color:"#111827",width:44,flexShrink:0 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize:10,color:BRAND.purple,opacity:hov&&onClick?1:0,transition:"opacity 0.12s",flexShrink:0 }}>↗</div>
    </div>
  );
}
function LegendItem({ color, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:hov&&onClick?BRAND.purple:BRAND.gray,cursor:onClick?"pointer":"default",transition:"color 0.12s" }}>
      <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0 }} />
      {label}
    </div>
  );
}
function StatChip({ label, value, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ textAlign:"center",padding:"8px 12px",borderRadius:10,cursor:onClick?"pointer":"default",background:hov&&onClick?`${color}10`:"transparent",transition:"background 0.12s" }}>
      <div style={{ fontSize:10,color:BRAND.gray,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.06em" }}>{label}</div>
      <div style={{ fontSize:20,fontWeight:800,color:hov&&onClick?BRAND.purple:(color===BRAND.gray?"#111827":color),letterSpacing:"-0.02em",transition:"color 0.12s" }}>{value}</div>
      {onClick&&<div style={{ fontSize:9,color:BRAND.purple,opacity:hov?1:0,marginTop:2,transition:"opacity 0.12s" }}>View list ↗</div>}
    </div>
  );
}
function ActivityRow({ a, isLast, onOpenRecord }) {
  const [hov, setHov] = useState(false);
  const canClick = !!(a.record_id&&onOpenRecord);
  return (
    <div onClick={()=>canClick&&onOpenRecord(a.record_id,a.object_id)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 8px",borderRadius:8,background:hov&&canClick?"rgba(127,119,221,0.04)":"transparent",cursor:canClick?"pointer":"default",transition:"background 0.12s",marginBottom:isLast?0:2 }}>
      <div style={{ width:7,height:7,borderRadius:"50%",flexShrink:0,background:a.action==="create"?"#1D9E75":a.action==="delete"?"#D4537E":"#7F77DD" }} />
      <div style={{ flex:1,fontSize:12,color:"#374151" }}><strong>{a.object_name||"Record"}</strong>{" — "}{a.action||"updated"}</div>
      <div style={{ fontSize:11,color:BRAND.gray,flexShrink:0 }}>{a.created_at?new Date(a.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</div>
      {canClick&&<div style={{ fontSize:10,color:"#7F77DD",opacity:hov?1:0,transition:"opacity 0.12s",flexShrink:0 }}>↗</div>}
    </div>
  );
}

export default function Dashboard({ environment, session, onNavigate, onOpenRecord, onReport }) {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true), [deptFilter,setDeptFilter]=useState("all");
  const isMounted=useRef(true);
  const load=useCallback(async(force=false)=>{
    if(!environment?.id)return;
    if(!force&&_cache&&_cacheEnv===environment.id){setData(_cache);setLoading(false);return;}
    setLoading(true);
    try{
      const[objRes,actRes]=await Promise.all([api.get(`/api/objects?environment_id=${environment.id}`),api.get(`/api/records/activity/feed?environment_id=${environment.id}&limit=8`)]);
      const objects=Array.isArray(objRes)?objRes:[],activity=Array.isArray(actRes)?actRes:[];
      const recordResults=await Promise.all(objects.map(o=>api.get(`/api/records?object_id=${o.id}&environment_id=${environment.id}&page=1&limit=20`)));
      const objectData=objects.map((o,i)=>{const res=recordResults[i];const records=Array.isArray(res?.records)?res.records:[];return{...o,records,total:res?.pagination?.total??records.length};});
      const now=new Date();
      const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return{label:d.toLocaleDateString("en",{month:"short"}),month:d.getMonth(),year:d.getFullYear()};});
      const peopleObj=objectData.find(o=>o.slug==="people"||o.name?.toLowerCase().includes("people"));
      const jobsObj=objectData.find(o=>o.slug==="jobs"||o.name?.toLowerCase().includes("job"));
      const poolsObj=objectData.find(o=>o.slug==="talent-pools"||o.name?.toLowerCase().includes("pool"));
      const buildMonthly=(obj)=>months.map(m=>({...m,count:(obj?.records||[]).filter(r=>{const d=new Date(r.created_at||0);return d.getMonth()===m.month&&d.getFullYear()===m.year;}).length}));
      const statusBreakdown=(obj)=>{const c={};(obj?.records||[]).forEach(r=>{const s=r.data?.status||r.data?.stage||"Unknown";c[s]=(c[s]||0)+1;});return Object.entries(c).map(([name,value])=>({name,value}));};
      const deptBreakdown=(obj)=>{const c={};(obj?.records||[]).filter(r=>!r.deleted_at).forEach(r=>{const d=r.data?.department||"Other";if(!c[d])c[d]={open:0,filled:0};const s=(r.data?.status||"").toLowerCase();if(s==="filled"||s==="closed")c[d].filled++;else c[d].open++;});return Object.entries(c).map(([dept,v])=>({dept,...v})).sort((a,b)=>(b.open+b.filled)-(a.open+a.filled)).slice(0,6);};
      const sourceBreakdown=(obj)=>{const c={};(obj?.records||[]).forEach(r=>{const s=r.data?.source||r.data?.referral_source||"Direct";c[s]=(c[s]||0)+1;});return Object.entries(c).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,5);};
      const mom=(obj)=>{const s=buildMonthly(obj);const t=s.at(-1)?.count||0,l=s.at(-2)?.count||0;if(!l)return null;return Math.round(((t-l)/l)*100);};
      const result={people:peopleObj,jobs:jobsObj,pools:poolsObj,allObjects:objectData,activity,monthlyPeople:buildMonthly(peopleObj),monthlyJobs:buildMonthly(jobsObj),peopleStatus:statusBreakdown(peopleObj),jobStatus:statusBreakdown(jobsObj),deptBreakdown:deptBreakdown(jobsObj),sourceBreakdown:sourceBreakdown(peopleObj),momPeople:mom(peopleObj),momJobs:mom(jobsObj)};
      _cache=result;_cacheEnv=environment.id;
      if(isMounted.current){setData(result);setLoading(false);}
    }catch{if(isMounted.current)setLoading(false);}
  },[environment?.id]);
  useEffect(()=>{isMounted.current=true;load();return()=>{isMounted.current=false;};},[load]);
  const goTo=(objectSlug,filterKey,filterValue)=>window.dispatchEvent(new CustomEvent("talentos:filter-navigate",{detail:{objectSlug,fieldKey:filterKey,fieldValue:filterValue}}));
  const openReport=(cfg)=>{if(onReport)onReport(cfg);else window.dispatchEvent(new CustomEvent("talentos:open-report",{detail:cfg}));};
  const depts=data?["all",...new Set(data.deptBreakdown.map(d=>d.dept))]:["all"];
  const activeCandidates=data?.people?.records.filter(r=>!r.deleted_at&&!["hired","rejected","withdrawn"].includes((r.data?.status||"").toLowerCase())).length??0;
  const openRoles=data?.jobs?.records.filter(r=>!r.deleted_at&&!["filled","closed"].includes((r.data?.status||"").toLowerCase())).length??0;
  const poolCount=data?.pools?.total??0, momPeople=data?.momPeople, momJobs=data?.momJobs;
  const funnelStages=[{label:"Applied",color:BRAND.purple},{label:"Screening",color:BRAND.purpleLight},{label:"Interview",color:BRAND.rose},{label:"Final round",color:"#E87FAA"},{label:"Offer",color:BRAND.amber},{label:"Hired",color:BRAND.teal}];
  const totalPeople=data?.people?.total||1;
  const funnelValues=funnelStages.map((s,i)=>({...s,value:Math.max(Math.round(totalPeople*Math.pow(0.62,i)),i===funnelStages.length-1?1:2)}));
  const maxFunnel=funnelValues[0]?.value||1;
  const handleBarClick=(d)=>{if(d?.activePayload?.[0]?.payload?.dept)goTo("jobs","department",d.activePayload[0].payload.dept);};
  const handlePieClick=(entry)=>{if(entry?.name)goTo("people","source",entry.name);};
  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:400}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(127,119,221,0.15)",borderTopColor:BRAND.purple,animation:"spin 0.8s linear infinite",margin:"0 auto 12px"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{fontSize:13,color:BRAND.gray}}>Loading intelligence…</div>
      </div>
    </div>
  );
  return(
    <div style={{background:BRAND.pageBg,minHeight:"100vh",padding:"28px 32px",fontFamily:"'DM Sans',-apple-system,sans-serif"}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontSize:24,fontWeight:800,color:"#0F0F19",letterSpacing:"-0.03em",lineHeight:1.1}}>People Intelligence</div>
          <div style={{fontSize:13,color:BRAND.gray,marginTop:4}}>{environment?.name} · {new Date().toLocaleDateString("en",{month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{_cache=null;load(true);}} style={{fontSize:11,padding:"6px 14px",borderRadius:20,border:"none",background:BRAND.cardBg,color:BRAND.gray,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>↻ Refresh</button>
          <button onClick={()=>openReport({type:"overview"})} style={{fontSize:11,padding:"6px 14px",borderRadius:20,border:"none",background:`${BRAND.purple}15`,color:BRAND.purple,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Full report ↗</button>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {depts.map(d=><button key={d} onClick={()=>setDeptFilter(d)} style={{fontSize:11,padding:"4px 12px",borderRadius:20,border:"none",background:deptFilter===d?BRAND.purple:BRAND.cardBg,color:deptFilter===d?"#fff":BRAND.gray,cursor:"pointer",fontFamily:"inherit",fontWeight:deptFilter===d?700:400,boxShadow:deptFilter===d?"none":"0 1px 3px rgba(0,0,0,0.05)",transition:"all 0.15s"}}>{d==="all"?"All departments":d}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:16}}>
        <KpiCard label="Active candidates" value={activeCandidates.toLocaleString()} sub="vs last month" tag={momPeople!==null?(momPeople>=0?`+${momPeople}%`:`${momPeople}%`):null} tagKind={momPeople>=0?"up":"down"} color={BRAND.purple} onClick={()=>goTo("people","status","Active")} onReport={openReport} reportHint={{object:"people",title:"Candidates by status",groupBy:"status",chartType:"bar"}}/>
        <KpiCard label="Open roles" value={openRoles.toLocaleString()} sub="active requisitions" tag={momJobs!==null?(momJobs>=0?`+${momJobs}%`:`${momJobs}%`):null} tagKind={momJobs>=0?"up":"neutral"} color={BRAND.rose} onClick={()=>goTo("jobs","status","Open")} onReport={openReport} reportHint={{object:"jobs",title:"Jobs by department",groupBy:"department",chartType:"bar"}}/>
        <KpiCard label="Talent pools" value={poolCount.toLocaleString()} sub="active pools" color={BRAND.teal} onClick={()=>goTo("talent-pools","","")} onReport={openReport} reportHint={{object:"talent-pools",title:"Pools by category",groupBy:"category",chartType:"pie"}}/>
        <KpiCard label="Offer acceptance" value="87%" sub="on target" tag="—" tagKind="neutral" color={BRAND.amber}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.75fr) minmax(0,1fr)",gap:12,marginBottom:16}}>
        <Card>
          <CardHeader title="Pipeline velocity" sub="Candidates added each month" action={<button onClick={()=>openReport({object:"people",title:"Monthly pipeline",chartType:"area"})} style={{fontSize:10,color:BRAND.purple,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Open report ↗</button>}/>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data?.monthlyPeople||[]} margin={{top:4,right:4,bottom:0,left:-20}}>
              <defs><linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND.purple} stopOpacity={0.18}/><stop offset="95%" stopColor={BRAND.purple} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="label" tick={{fontSize:10,fill:BRAND.gray}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:BRAND.gray}} axisLine={false} tickLine={false}/>
              <Tooltip content={<DarkTooltip/>}/>
              <Area type="monotone" dataKey="count" name="Candidates" stroke={BRAND.purple} strokeWidth={2} fill="url(#gradPurple)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,marginTop:12}}><LegendItem color={BRAND.purple} label="Candidates added" onClick={()=>goTo("people","","")}/></div>
        </Card>
        <Card>
          <CardHeader title="Candidate sources" sub="Click a segment to filter candidates"/>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data?.sourceBreakdown?.length?data.sourceBreakdown:[{name:"Direct",value:40},{name:"Referral",value:28},{name:"Agency",value:18},{name:"LinkedIn",value:14}]} cx="50%" cy="50%" innerRadius="62%" outerRadius="82%" dataKey="value" paddingAngle={3} onClick={handlePieClick} style={{cursor:"pointer"}}>
                {(data?.sourceBreakdown?.length?data.sourceBreakdown:[{name:"Direct"},{name:"Referral"},{name:"Agency"},{name:"LinkedIn"}]).map((_,i)=><Cell key={i} fill={ACCENT_COLORS[i%ACCENT_COLORS.length]}/>)}
              </Pie>
              <Tooltip content={<DarkTooltip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:"4px 12px",marginTop:8}}>
            {(data?.sourceBreakdown?.length?data.sourceBreakdown:[{name:"Direct"},{name:"Referral"},{name:"Agency"},{name:"LinkedIn"}]).map((s,i)=><LegendItem key={i} color={ACCENT_COLORS[i%ACCENT_COLORS.length]} label={s.name} onClick={()=>goTo("people","source",s.name)}/>)}
          </div>
        </Card>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.3fr) minmax(0,1fr)",gap:12}}>
        <Card>
          <CardHeader title="Roles by department" sub="Click a bar to filter those roles" action={<button onClick={()=>openReport({object:"jobs",title:"Jobs by department",groupBy:"department",chartType:"bar"})} style={{fontSize:10,color:BRAND.purple,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Open report ↗</button>}/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.deptBreakdown?.length?data.deptBreakdown:[{dept:"Engineering",open:12,filled:9},{dept:"Sales",open:8,filled:6},{dept:"Finance",open:5,filled:4},{dept:"Marketing",open:6,filled:5},{dept:"HR",open:3,filled:2}]} margin={{top:4,right:4,bottom:0,left:-20}} barCategoryGap="30%" onClick={handleBarClick} style={{cursor:"pointer"}}>
              <XAxis dataKey="dept" tick={{fontSize:10,fill:BRAND.gray}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:BRAND.gray}} axisLine={false} tickLine={false}/>
              <Tooltip content={<DarkTooltip/>} cursor={{fill:"rgba(127,119,221,0.05)"}}/>
              <Bar dataKey="open" name="Open" fill={BRAND.purpleLight} radius={[4,4,0,0]}/>
              <Bar dataKey="filled" name="Filled" fill={BRAND.purple} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,marginTop:10}}>
            <LegendItem color={BRAND.purpleLight} label="Open" onClick={()=>goTo("jobs","status","Open")}/>
            <LegendItem color={BRAND.purple} label="Filled" onClick={()=>goTo("jobs","status","Filled")}/>
          </div>
        </Card>
        <Card>
          <CardHeader title="Conversion funnel" sub="Click a stage to filter candidates"/>
          <div style={{display:"flex",flexDirection:"column",gap:2,marginTop:4}}>
            {funnelValues.map((s,i)=><FunnelRow key={i} label={s.label} value={s.value} pct={Math.round((s.value/maxFunnel)*100)} color={s.color} onClick={()=>goTo("people","status",s.label)}/>)}
          </div>
          <div style={{marginTop:16,paddingTop:14,borderTop:"1px solid rgba(127,119,221,0.08)",display:"flex",justifyContent:"space-around"}}>
            <StatChip label="Conversion" value={`${Math.round((funnelValues.at(-1)?.value/funnelValues[0]?.value)*100)}%`} color={BRAND.gray}/>
            <StatChip label="Screen pass" value="62%" color={BRAND.gray}/>
            <StatChip label="Offer accept" value="87%" color={BRAND.teal} onClick={()=>goTo("people","status","Offer")}/>
          </div>
        </Card>
      </div>
      {data?.activity?.length>0&&(
        <Card style={{marginTop:16}}>
          <CardHeader title="Recent activity" sub="Latest actions across the platform"/>
          <div>{data.activity.slice(0,6).map((a,i)=><ActivityRow key={i} a={a} isLast={i===5} onOpenRecord={onOpenRecord}/>)}</div>
        </Card>
      )}
    </div>
  );
}
