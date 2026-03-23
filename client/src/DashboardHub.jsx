import { Suspense, lazy } from "react";

const Dashboard          = lazy(() => import("./Dashboard.jsx"));
const InterviewDashboard = lazy(() => import("./InterviewDashboard.jsx"));
const OfferDashboard     = lazy(() => import("./OfferDashboard.jsx"));
const AdminDashboard     = lazy(() => import("./AdminDashboard.jsx"));

const TABS = [
  { id: "overview",    label: "Overview",    icon: "🏠" },
  { id: "interviews",  label: "Interviews",  icon: "📅" },
  { id: "offers",      label: "Offers",      icon: "💰" },
  { id: "admin",       label: "Admin",       icon: "⚙️" },
];

const F = "'DM Sans', -apple-system, sans-serif";

const Loader = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
    height:300, color:"#9ca3af", fontSize:13, fontFamily:F }}>
    Loading…
  </div>
);

export default function DashboardHub({ tab = "overview", onTabChange, environment, session, onOpenRecord, onNavigate }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"var(--t-bg, #EEF2FF)", fontFamily:F }}>

      {/* Tab strip */}
      <div style={{
        background:"var(--t-surface, #fff)",
        borderBottom:"1.5px solid var(--t-border, #E8ECF8)",
        padding:"0 32px",
        display:"flex",
        alignItems:"flex-end",
        gap:0,
        position:"sticky",
        top:0,
        zIndex:50,
      }}>
        {/* Page heading */}
        <div style={{ paddingBottom:14, paddingTop:14, marginRight:32, flexShrink:0 }}>
          <span style={{ fontSize:16, fontWeight:800, color:"var(--t-text1, #0F1729)" }}>Dashboards</span>
        </div>

        {/* Tabs */}
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                display:"flex", alignItems:"center", gap:7,
                padding:"14px 18px 12px",
                background:"transparent", border:"none", cursor:"pointer",
                fontFamily:F, fontSize:13, fontWeight:active ? 700 : 500,
                color: active ? "var(--t-accent, #4361EE)" : "var(--t-text3, #9CA3AF)",
                borderBottom: active ? "2.5px solid var(--t-accent, #4361EE)" : "2.5px solid transparent",
                marginBottom:-1.5,
                transition:"color .12s, border-color .12s",
                whiteSpace:"nowrap",
              }}
            >
              <span style={{ fontSize:14 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex:1 }}>
        <Suspense fallback={<Loader/>}>
          {tab === "overview" && (
            <Dashboard
              environment={environment}
              session={session}
              onOpenRecord={onOpenRecord}
              onNavigate={onNavigate}
            />
          )}
          {tab === "interviews" && (
            <InterviewDashboard
              environment={environment}
              session={session}
              onNavigate={onNavigate}
            />
          )}
          {tab === "offers" && (
            <OfferDashboard
              environment={environment}
              session={session}
              onNavigate={onNavigate}
            />
          )}
          {tab === "admin" && (
            <AdminDashboard
              environment={environment}
              session={session}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
