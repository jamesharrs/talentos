import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  { id:"welcome", target:null, title:"Welcome to Vercentic", body:"This quick tour covers the key areas of the platform. It takes about 2 minutes — you can skip at any time.", icon:"✦", placement:"center", ctaLabel:"Start the tour" },
  { id:"sidebar", target:"[data-tour='sidebar-nav']", title:"Navigation", body:"The left sidebar is your main navigation. Recruit holds your People, Jobs and Talent Pools. Tools gives you Interviews, Calendar, Offers and Reports.", placement:"right" },
  { id:"topbar", target:"[data-tour='global-search']", title:"Search & Create", body:"Search everything from anywhere in the platform. The + Create button adds a new person, job or any record in one click.", placement:"bottom" },
  { id:"dashboard", target:"[data-tour='dashboard-stats']", title:"Your Dashboard", body:"Live snapshot of your pipeline — stat cards, hiring activity chart, pipeline breakdown and a real-time activity feed. Click any card to jump to matching records.", placement:"bottom" },
  { id:"records", target:"[data-tour='records-toolbar']", title:"Smart Lists", body:"Use Columns to choose what you see, Filters to narrow results, and Lists to save and share your favourite views with your team.", placement:"bottom" },
  { id:"pipeline", target:"[data-tour='pipeline-widget']", title:"Candidate Pipeline", body:"On Job records, this bar shows every linked candidate by stage. Click a count to expand and use arrows to advance candidates — without leaving the page.", placement:"bottom" },
  { id:"interviews", target:"[data-tour='nav-interviews']", title:"Interviews", body:"Create interview types with availability grids, schedule candidates, and collect structured scorecard feedback from interviewers.", placement:"right" },
  { id:"copilot", target:"[data-tour='copilot-button']", title:"AI Copilot", body:"Your intelligent assistant. Ask it to find candidates, draft emails, create records, schedule interviews or run reports — all in plain language. It knows your live data.", placement:"top-left" },
  { id:"done", target:null, title:"You're all set!", body:"That's the essentials covered. Find detailed guides in the Help section, and remember the Copilot is always there if you get stuck — just ask.", icon:"✓", placement:"center", ctaLabel:"Start exploring", isDone:true },
];

const PAD = 10;
function getSpotRect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x:r.left-PAD, y:r.top-PAD, w:r.width+PAD*2, h:r.height+PAD*2 };
}
function resolvePos(rect, placement, tw=360, th=240) {
  if (!rect||placement==="center") return {top:"50%",left:"50%",transform:"translate(-50%,-50%)"};
  const vw=window.innerWidth,vh=window.innerHeight,G=20;
  const fits={right:rect.x+rect.w+G+tw<vw,left:rect.x-G-tw>0,bottom:rect.y+rect.h+G+th<vh,top:rect.y-G-th>0};
  let p=placement;
  if(!fits[p]) p=["right","bottom","left","top"].find(x=>fits[x])||"right";
  const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
  if(p==="right") return {top:Math.min(Math.max(cy-th/2,G),vh-th-G),left:rect.x+rect.w+G};
  if(p==="left"||placement==="top-left") return {top:Math.min(Math.max(cy-th/2,G),vh-th-G),left:Math.max(rect.x-tw-G,G)};
  if(p==="bottom") return {top:rect.y+rect.h+G,left:Math.min(Math.max(cx-tw/2,G),vw-tw-G)};
  return {top:Math.max(rect.y-th-G,G),left:Math.min(Math.max(cx-tw/2,G),vw-tw-G)};
}

function Overlay({spotRect}) {
  const BG = "rgba(10,14,33,0.78)";
  const base = {position:"fixed",zIndex:9998,background:BG,animation:"tFadeIn .25s ease"};
  if(!spotRect) return <div style={{...base,inset:0,backdropFilter:"blur(3px)"}}/>;
  const {x,y,w,h}=spotRect;
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,pointerEvents:"none",animation:"tFadeIn .25s ease"}}>
      {/* Top band */}
      <div style={{...base,top:0,left:0,right:0,height:y,animation:"none"}}/>
      {/* Bottom band */}
      <div style={{...base,top:y+h,left:0,right:0,bottom:0,animation:"none"}}/>
      {/* Left strip */}
      <div style={{...base,top:y,left:0,width:x,height:h,animation:"none"}}/>
      {/* Right strip */}
      <div style={{...base,top:y,left:x+w,right:0,height:h,animation:"none"}}/>
      {/* Glow ring around spotlight */}
      <div style={{position:"fixed",top:y-3,left:x-3,width:w+6,height:h+6,borderRadius:18,border:"2px solid rgba(67,97,238,0.8)",boxShadow:"0 0 0 4px rgba(67,97,238,0.1),0 0 24px rgba(67,97,238,0.35)",pointerEvents:"none",zIndex:9998}}/>
    </div>
  );
}

function Dots({total,current}) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{width:i===current?18:6,height:6,borderRadius:99,background:i===current?"#4361EE":i<current?"rgba(67,97,238,0.4)":"rgba(255,255,255,0.15)",transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)"}}/>
      ))}
    </div>
  );
}

function Tooltip({step,stepIndex,total,onNext,onPrev,onSkip,position,isFirst,isLast}) {
  return (
    <div style={{position:"fixed",zIndex:9999,width:360,...position,background:"linear-gradient(135deg,#0d1117 0%,#0f1629 100%)",border:"1px solid rgba(67,97,238,0.25)",borderRadius:18,boxShadow:"0 24px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04) inset",overflow:"hidden",animation:"tSlideIn .28s cubic-bezier(0.34,1.3,0.64,1)",fontFamily:"Geist,'Geist Sans',system-ui,sans-serif"}}>
      <div style={{height:3,background:"linear-gradient(90deg,#4361EE,#7c3aed)"}}/>
      <div style={{padding:"22px 24px 20px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {step.icon&&<div style={{width:36,height:36,borderRadius:10,background:"rgba(67,97,238,0.15)",border:"1px solid rgba(67,97,238,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#4361EE"}}>{step.icon}</div>}
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"rgba(67,97,238,0.8)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{step.isDone?"Tour Complete":`Step ${stepIndex+1} of ${total}`}</div>
              <h3 style={{margin:0,fontSize:16,fontWeight:700,color:"#ffffff",lineHeight:1.2}}>{step.title}</h3>
            </div>
          </div>
          <button onClick={onSkip} title="Skip tour" style={{background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:6,color:"rgba(255,255,255,0.35)",fontSize:18,lineHeight:1,flexShrink:0,marginTop:-2}} onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.7)"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.35)"}>×</button>
        </div>
        <p style={{margin:"0 0 20px",fontSize:13.5,color:"rgba(255,255,255,0.65)",lineHeight:1.65}}>{step.body}</p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Dots total={total} current={stepIndex}/>
          <div style={{display:"flex",gap:8}}>
            {!isFirst&&!step.isDone&&(
              <button onClick={onPrev} style={{padding:"8px 16px",borderRadius:9,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}>← Back</button>
            )}
            <button onClick={onNext} style={{padding:"8px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#4361EE,#6d28d9)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(67,97,238,0.35)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(67,97,238,0.5)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 4px 14px rgba(67,97,238,0.35)";}}>
              {step.ctaLabel||(isLast?"Finish":"Next →")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuidedTour({active,onClose,initialStep=0}) {
  const [stepIndex,setStepIndex]=useState(initialStep);
  const [spotRect,setSpotRect]=useState(null);
  const [pos,setPos]=useState({top:"50%",left:"50%",transform:"translate(-50%,-50%)"});
  const scrollRef=useRef(null);
  const step=STEPS[stepIndex];
  const isFirst=stepIndex===0,isLast=stepIndex===STEPS.length-1;

  const compute=useCallback(()=>{
    if(!step?.target){setSpotRect(null);setPos({top:"50%",left:"50%",transform:"translate(-50%,-50%)"});return;}
    const el=document.querySelector(step.target);
    if(!el){setSpotRect(null);setPos({top:"50%",left:"50%",transform:"translate(-50%,-50%)"});return;}
    const r=getSpotRect(el);setSpotRect(r);setPos(resolvePos(r,step.placement));
  },[step]);

  useEffect(()=>{
    if(!active)return;
    if(step?.target){
      const el=document.querySelector(step.target);
      if(el){el.scrollIntoView({behavior:"smooth",block:"center"});clearTimeout(scrollRef.current);scrollRef.current=setTimeout(compute,350);return;}
    }
    compute();
  },[stepIndex,active,compute]);

  useEffect(()=>{window.addEventListener("resize",compute);return()=>window.removeEventListener("resize",compute);},[compute]);

  if(!active)return null;
  const next=()=>{if(isLast){onClose();return;}setStepIndex(i=>i+1);};
  const prev=()=>setStepIndex(i=>Math.max(0,i-1));

  return createPortal(<>
    <style>{`@keyframes tFadeIn{from{opacity:0}to{opacity:1}}@keyframes tSlideIn{from{opacity:0;transform:translateY(8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    <Overlay spotRect={spotRect}/>
    <Tooltip step={step} stepIndex={stepIndex} total={STEPS.length} onNext={next} onPrev={prev} onSkip={onClose} position={pos} isFirst={isFirst} isLast={isLast}/>
  </>,document.body);
}

export function useTour() {
  const [tourActive,setTourActive]=useState(false);
  const [tourStep,setTourStep]=useState(0);
  const startTour=useCallback((step=0)=>{setTourStep(step);setTourActive(true);},[]);
  const endTour=useCallback(()=>{setTourActive(false);localStorage.setItem("vercentic_tour_done","1");},[]);
  useEffect(()=>{
    const h=(e)=>startTour(e.detail?.step||0);
    window.addEventListener("vercentic:start-tour",h);
    return()=>window.removeEventListener("vercentic:start-tour",h);
  },[startTour]);
  const TourPortal=<GuidedTour active={tourActive} onClose={endTour} initialStep={tourStep}/>;
  return {tourActive,startTour,endTour,TourPortal};
}
