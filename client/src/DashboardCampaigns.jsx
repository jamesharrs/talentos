// DashboardCampaigns.jsx — Campaign analytics dashboard
import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "./apiClient.js";

const F = "'Geist', 'Inter', system-ui, sans-serif";
const C = {
  purple: "#6941C6", purpleL: "#7F56D9", purpleFaint: "#F9F5FF",
  green: "#027A48", greenL: "#12B76A", greenFaint: "#ECFDF3",
  amber: "#B54708", amberL: "#F79009", amberFaint: "#FFFAEB",
  blue: "#1849A9", blueL: "#2E90FA", blueFaint: "#EFF8FF",
  red: "#B42318", redL: "#F04438", redFaint: "#FEF3F2",
  gray: "#667085", gray2: "#344054", border: "#E4E7EC", bg: "#F9FAFB", surface: "#fff",
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: "16px 20px", ...style }}>
    {children}
  </div>
);

const Stat = ({ label, value, sub, color = C.purple, icon }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 5 }}>
      {icon && <span style={{ color }}>{icon}</span>}{label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>{value ?? "—"}</div>
    {sub && <div style={{ fontSize: 12, color: C.gray }}>{sub}</div>}
  </div>
);

const COLORS = ["#6941C6","#12B76A","#2E90FA","#F79009","#F04438","#0891B2","#7C3AED","#059669"];

export default function DashboardCampaigns({ environment, onNavigate }) {
  const [campaigns, setCampaigns] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!environment?.id) return;
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        api.get(`/campaigns?environment_id=${environment.id}&limit=200`).catch(() => []),
        api.get(`/campaign-links?environment_id=${environment.id}&limit=500`).catch(() => []),
      ]);
      setCampaigns(Array.isArray(cRes) ? cRes : cRes?.campaigns || []);
      setLinks(Array.isArray(lRes) ? lRes : lRes?.links || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [environment?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.gray, fontSize: 13 }}>Loading campaign analytics…</div>;

  // ── Derived metrics ──────────────────────────────────────────────────────
  const total     = campaigns.length;
  const active    = campaigns.filter(c => c.status === "active").length;
  const draft     = campaigns.filter(c => c.status === "draft").length;
  const paused    = campaigns.filter(c => c.status === "paused").length;
  const ended     = campaigns.filter(c => c.status === "ended").length;

  // Clicks per campaign (links)
  const clicksMap = {};
  links.forEach(l => {
    const cid = l.campaign_id;
    if (!cid) return;
    clicksMap[cid] = (clicksMap[cid] || 0) + (l.clicks || 0);
  });
  const totalClicks = Object.values(clicksMap).reduce((a,b) => a+b, 0);
  const totalJoins  = campaigns.reduce((a,c) => a + (c.joins_30d || c.joins || 0), 0);
  const convRate    = totalClicks > 0 ? ((totalJoins / totalClicks) * 100).toFixed(1) : "0.0";

  // Status breakdown for pie
  const statusData = [
    { name: "Active",  value: active,  color: C.greenL },
    { name: "Draft",   value: draft,   color: C.gray   },
    { name: "Paused",  value: paused,  color: C.amberL },
    { name: "Ended",   value: ended,   color: C.redL   },
  ].filter(d => d.value > 0);

  // Top campaigns by clicks
  const topCampaigns = campaigns
    .map(c => ({ ...c, totalClicks: clicksMap[c.id] || 0 }))
    .sort((a,b) => b.totalClicks - a.totalClicks)
    .slice(0, 8)
    .map(c => ({
      name: (c.name||"Untitled").length > 22 ? (c.name||"Untitled").slice(0,22)+"…" : (c.name||"Untitled"),
      clicks: c.totalClicks,
      joins: c.joins_30d || c.joins || 0,
    }));

  // Clicks by goal type
  const byGoal = {};
  campaigns.forEach(c => {
    const g = c.goal_type || c.type || "Other";
    byGoal[g] = (byGoal[g] || { clicks: 0, joins: 0, count: 0 });
    byGoal[g].clicks += clicksMap[c.id] || 0;
    byGoal[g].joins  += c.joins_30d || c.joins || 0;
    byGoal[g].count  += 1;
  });
  const byGoalData = Object.entries(byGoal).map(([name, d], i) => ({
    name: name.length > 18 ? name.slice(0,18)+"…" : name,
    clicks: d.clicks, joins: d.joins, campaigns: d.count, color: COLORS[i % COLORS.length],
  })).sort((a,b) => b.clicks - a.clicks).slice(0,6);

  // Monthly trend (from created_at)
  const monthMap = {};
  campaigns.forEach(c => {
    if (!c.created_at) return;
    const m = c.created_at.slice(0,7);
    monthMap[m] = (monthMap[m] || { launched: 0, clicks: 0, joins: 0 });
    monthMap[m].launched += 1;
    monthMap[m].clicks   += clicksMap[c.id] || 0;
    monthMap[m].joins    += c.joins_30d || c.joins || 0;
  });
  const monthData = Object.entries(monthMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, d]) => ({
      month: new Date(m+"-01").toLocaleDateString("en-GB", { month:"short", year:"2-digit" }),
      ...d,
    }));

  const empty = total === 0;

  return (
    <div style={{ fontFamily: F, padding: "28px 32px", boxSizing: "border-box", width: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: C.purpleFaint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.gray2 }}>Campaign Analytics</div>
            <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{total} campaign{total !== 1 ? "s" : ""} across all talent pools & jobs</div>
          </div>
        </div>
        {onNavigate && (
          <button onClick={() => onNavigate("campaigns")}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.purple}`, background: "transparent", color: C.purple, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: F }}>
            Manage Campaigns →
          </button>
        )}
      </div>

      {empty ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📣</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.gray2, marginBottom: 6 }}>No campaigns yet</div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>Create your first campaign to track clicks, joins and conversion rates.</div>
          {onNavigate && (
            <button onClick={() => onNavigate("campaigns")}
              style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: C.purple, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
              + New Campaign
            </button>
          )}
        </Card>
      ) : (<>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
          <Card><Stat label="Total Campaigns" value={total} sub={`${active} active`} color={C.purple}/></Card>
          <Card><Stat label="Active" value={active} sub={`${paused} paused`} color={C.greenL}/></Card>
          <Card><Stat label="Total Clicks (30d)" value={totalClicks.toLocaleString()} color={C.blueL}/></Card>
          <Card><Stat label="Total Joins (30d)" value={totalJoins.toLocaleString()} color={C.greenL}/></Card>
          <Card><Stat label="Conversion Rate" value={`${convRate}%`} sub="clicks → joins" color={C.amberL}/></Card>
        </div>

        {/* Row 2: Status pie + Top campaigns bar */}
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, marginBottom: 16 }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray2, marginBottom: 12 }}>Status Breakdown</div>
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                      {statusData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {statusData.map((d,i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0, display:"inline-block" }}/>
                        <span style={{ color: C.gray2 }}>{d.name}</span>
                      </span>
                      <span style={{ fontWeight: 700, color: C.gray2 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ color: C.gray, fontSize: 12, textAlign: "center", paddingTop: 40 }}>No data</div>}
          </Card>

          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray2, marginBottom: 12 }}>Top Campaigns by Clicks</div>
            {topCampaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topCampaigns} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: C.gray2 }} axisLine={false} tickLine={false}/>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                  <Tooltip formatter={(v,n) => [v, n === "clicks" ? "Clicks" : "Joins"]}/>
                  <Bar dataKey="clicks" fill={C.purpleL} radius={[0,4,4,0]} name="clicks"/>
                  <Bar dataKey="joins" fill={C.greenL} radius={[0,4,4,0]} name="joins"/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: C.gray, fontSize: 12, textAlign: "center", paddingTop: 40 }}>No click data yet</div>}
          </Card>
        </div>

        {/* Row 3: Monthly trend + by Goal type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray2, marginBottom: 12 }}>Monthly Trend</div>
            {monthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false}/>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <Tooltip/>
                  <Legend wrapperStyle={{ fontSize: 11 }}/>
                  <Line type="monotone" dataKey="launched" stroke={C.purpleL} strokeWidth={2} dot={{ r: 3 }} name="Launched"/>
                  <Line type="monotone" dataKey="clicks"   stroke={C.blueL}   strokeWidth={2} dot={{ r: 3 }} name="Clicks"/>
                  <Line type="monotone" dataKey="joins"    stroke={C.greenL}  strokeWidth={2} dot={{ r: 3 }} name="Joins"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <div style={{ color: C.gray, fontSize: 12, textAlign: "center", paddingTop: 40 }}>Not enough history yet</div>}
          </Card>

          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.gray2, marginBottom: 12 }}>Performance by Campaign Type</div>
            {byGoalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byGoalData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: C.gray }} axisLine={false} tickLine={false}/>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <Tooltip formatter={(v,n) => [v, n === "clicks" ? "Clicks" : n === "joins" ? "Joins" : "Campaigns"]}/>
                  <Legend wrapperStyle={{ fontSize: 11 }}/>
                  <Bar dataKey="clicks"    fill={C.purpleL} radius={[4,4,0,0]} name="clicks"/>
                  <Bar dataKey="joins"     fill={C.greenL}  radius={[4,4,0,0]} name="joins"/>
                  <Bar dataKey="campaigns" fill={C.blueL}   radius={[4,4,0,0]} name="campaigns"/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: C.gray, fontSize: 12, textAlign: "center", paddingTop: 40 }}>No type data yet</div>}
          </Card>
        </div>

      </>)}
    </div>
  );
}
