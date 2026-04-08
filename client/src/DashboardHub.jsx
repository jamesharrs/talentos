import { Suspense, lazy, useState } from "react";
import DashboardViewer  from "./DashboardViewer.jsx";
import DashboardBuilder from "./DashboardBuilder.jsx";

const Dashboard           = lazy(() => import("./Dashboard.jsx"));
const InterviewDashboard  = lazy(() => import("./InterviewDashboard.jsx"));
const OfferDashboard      = lazy(() => import("./OfferDashboard.jsx"));
const AdminDashboard      = lazy(() => import("./AdminDashboard.jsx"));
const AgentDashboard      = lazy(() => import("./AgentDashboard.jsx"));
const ScreeningDashboard  = lazy(() => import("./ScreeningDashboard.jsx"));
const OnboardingDashboard = lazy(() => import("./OnboardingDashboard.jsx"));
const DashboardInsights   = lazy(() => import("./DashboardInsights.jsx"));

const F = "'DM Sans', -apple-system, sans-serif";
const Loader = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
    height:300, color:"#9ca3af", fontSize:13, fontFamily:F }}>
    Loading…
  </div>
);

const NAV_TABS = [
  { label:"Overview",   id:"overview",   color:"#6B7280" },
  { label:"Screening",  id:"screening",  color:"#7F77DD" },
  { label:"Interviews", id:"interviews", color:"#1D9E75" },
  { label:"Offers",     id:"offers",     color:"#D4537E" },
  { label:"Onboarding", id:"onboarding", color:"#EF9F27" },
];

function DashNav({ tab, onNavigate }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"20px 32px 0", flexWrap:"wrap" }}>
      {NAV_TABS.map(({ label, id, color }) => {
        const current = tab === id;
        return (
          <button key={id} onClick={() => onNavigate?.(id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 13px", borderRadius:20,
              border: current ? `1.5px solid ${color}` : `1.5px solid ${color}40`,
              background: current ? `${color}18` : `${color}10`, color,
              fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:F, transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background=`${color}22`; e.currentTarget.style.borderColor=color; }}
            onMouseLeave={e => { e.currentTarget.style.background=current?`${color}18`:`${color}10`; e.currentTarget.style.borderColor=current?color:`${color}40`; }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }}/>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function DashboardHub({ tab = "overview", onTabChange, environment, session, onOpenRecord, onNavigate, builderMode, setBuilderMode, onViewAll }) {
  // Sub-tabs that hide the nav (builder, insights, agents, admin, custom)
  const showNav = ["overview","screening","interviews","offers","onboarding"].includes(tab);

  const navigate = (id) => {
    if (id === "overview") { onTabChange?.("overview"); onNavigate?.(id); return; }
    onTabChange?.(`dashboard_${id}`); onNavigate?.(id);
  };

  return (
    <Suspense fallback={<Loader/>}>
      {showNav && <DashNav tab={tab} onNavigate={navigate}/>}
      {tab === "overview" && (
        <Dashboard environment={environment} session={session} onOpenRecord={onOpenRecord} onNavigate={onNavigate} onViewAll={onViewAll}/>
      )}
      {tab === "interviews" && (
        <InterviewDashboard environment={environment} session={session} onNavigate={onNavigate}/>
      )}
      {tab === "offers" && (
        <OfferDashboard environment={environment} session={session} onNavigate={onNavigate}/>
      )}
      {tab === "agents" && (
        <AgentDashboard environment={environment} session={session} onNavigate={onNavigate}/>
      )}
      {tab === "admin" && (
        <AdminDashboard environment={environment} session={session}/>
      )}
      {tab === "screening" && (
        <ScreeningDashboard environment={environment} onNavigate={onNavigate}/>
      )}
      {tab === "onboarding" && (
        <OnboardingDashboard environment={environment} onNavigate={onNavigate}/>
      )}
      {tab === "insights" && (
        <DashboardInsights environment={environment} onNavigate={(id) => {
          window.dispatchEvent(new CustomEvent("talentos:openRecord", { detail: { recordId: id } }));
        }}/>
      )}
      {tab === "custom" && !builderMode && (
        <DashboardViewer environment={environment} session={session}
          onOpenRecord={onOpenRecord} onNavigate={onNavigate}
          onManage={() => setBuilderMode(true)}/>
      )}
      {tab === "custom" && builderMode && (
        <DashboardBuilder environment={environment} session={session}
          onBack={() => setBuilderMode(false)}/>
      )}
    </Suspense>
  );
}
