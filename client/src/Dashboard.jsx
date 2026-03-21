import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const BRAND = {
  purple:     "#7F77DD",
  purpleLight:"#AFA9EC",
  purpleFaint:"rgba(127,119,221,0.08)",
  rose:       "#D4537E",
  roseFaint:  "rgba(212,83,126,0.06)",
  teal:       "#1D9E75",
  tealFaint:  "rgba(29,158,117,0.08)",
  amber:      "#EF9F27",
  amberFaint: "rgba(239,159,39,0.08)",
  gray:       "#888780",
  border:     "rgba(0,0,0,0.06)",
  cardBg:     "white",
  pageBg:     "#F8F7FF",
};

const ACCENT_COLORS = [BRAND.purple, BRAND.rose, BRAND.teal, BRAND.amber, BRAND.purpleLight];

const api = {
  get: (path) => fetch(path).then(r => r.json()).catch(() => null),
};

let _cache = null;
let _cacheEnv = null;

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0F0F19", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fff" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#ccc", marginTop: 2 }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

function KpiCard({ label, value, sub, color, tag, tagKind, onClick, reportHint, onReport }) {
  const [hov, setHov] = useState(false);
  const tagColors = {
    up:      { bg: "#E1F5EE", text: "#0F6E56" },
    down:    { bg: "#FAECE7", text: "#993C1D" },
    neutral: { bg: "#EEEDFE", text: "#3C3489" },
  };
  const tc = tagColors[tagKind] || tagColors.neutral;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: BRAND.cardBg, border: `0.5px solid ${hov && onClick ? color : BRAND.border}`,
        borderRadius: 14, padding: "20px 22px 18px", cursor: onClick ? "pointer" : "default",
        position: "relative", overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hov && onClick ? `0 4px 20px ${color}22` : "none",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: BRAND.gray, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.025em", color: "#111827" }}>{value}</div>
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          {tag && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: tc.bg, color: tc.text }}>{tag}</span>}
          <span style={{ fontSize: 12, color: BRAND.gray }}>{sub}</span>
        </div>
      )}
      {onReport && (
        <button onClick={(e) => { e.stopPropagation(); onReport(reportHint); }}
          style={{ position: "absolute", bottom: 10, right: 12, background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: BRAND.purple, fontWeight: 600, opacity: hov ? 1 : 0, transition: "opacity 0.15s", fontFamily: "inherit" }}>
          View report ↗
        </button>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: BRAND.cardBg, border: `0.5px solid ${BRAND.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }) {
  return (
    <div style={{ marginBottom: sub ? 2 : 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</span>
        {action}
      </div>
      {sub && <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 14, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FunnelRow({ label, value, pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 11, color: BRAND.gray, width: 76, textAlign: "right", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", width: 44, flexShrink: 0 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: BRAND.gray }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

export default function Dashboard({ environment, session, onNavigate, onOpenRecord, onReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("all");
  const isMounted = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!environment?.id) return;
    if (!force && _cache && _cacheEnv === environment.id) {
      setData(_cache); setLoading(false); return;
    }
    setLoading(true);
    try {
      const [objRes, actRes] = await Promise.all([
        api.get(`/api/objects?environment_id=${environment.id}`),
        api.get(`/api/records/activity/feed?environment_id=${environment.id}&limit=8`),
      ]);
      const objects = Array.isArray(objRes) ? objRes : [];
      const activity = Array.isArray(actRes) ? actRes : [];
      const recordFetches = objects.map(o =>
        api.get(`/api/records?object_id=${o.id}&environment_id=${environment.id}&page=1&limit=20`)
      );
      const recordResults = await Promise.all(recordFetches);
      const objectData = objects.map((o, i) => {
        const res = recordResults[i];
        const records = Array.isArray(res?.records) ? res.records : [];
        const total = res?.pagination?.total ?? records.length;
        return { ...o, records, total };
      });
      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return { label: d.toLocaleDateString("en", { month: "short" }), month: d.getMonth(), year: d.getFullYear() };
      });
      const peopleObj = objectData.find(o => o.slug === "people" || o.name?.toLowerCase().includes("people"));
      const jobsObj   = objectData.find(o => o.slug === "jobs"   || o.name?.toLowerCase().includes("job"));
      const poolsObj  = objectData.find(o => o.slug === "talent-pools" || o.name?.toLowerCase().includes("pool"));
      const buildMonthly = (obj) => months.map(m => {
        const count = (obj?.records || []).filter(r => {
          const d = new Date(r.created_at || 0);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        }).length;
        return { ...m, count };
      });
      const statusBreakdown = (obj) => {
        const counts = {};
        (obj?.records || []).forEach(r => { const s = r.data?.status || r.data?.stage || "Unknown"; counts[s] = (counts[s] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
      };
      const deptBreakdown = (obj) => {
        const counts = {};
        (obj?.records || []).filter(r => !r.deleted_at).forEach(r => {
          const d = r.data?.department || "Other";
          if (!counts[d]) counts[d] = { open: 0, filled: 0 };
          const s = (r.data?.status || "").toLowerCase();
          if (s === "filled" || s === "closed") counts[d].filled++; else counts[d].open++;
        });
        return Object.entries(counts).map(([dept, v]) => ({ dept, ...v })).sort((a, b) => (b.open + b.filled) - (a.open + a.filled)).slice(0, 6);
      };
      const sourceBreakdown = (obj) => {
        const counts = {};
        (obj?.records || []).forEach(r => { const s = r.data?.source || r.data?.referral_source || "Direct"; counts[s] = (counts[s] || 0) + 1; });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
      };
      const mom = (obj) => {
        const bm = buildMonthly(obj);
        const thisM = bm.at(-1)?.count || 0; const lastM = bm.at(-2)?.count || 0;
        if (!lastM) return null;
        return Math.round(((thisM - lastM) / lastM) * 100);
      };
      const result = { people: peopleObj, jobs: jobsObj, pools: poolsObj, allObjects: objectData, activity,
        monthlyPeople: buildMonthly(peopleObj), monthlyJobs: buildMonthly(jobsObj),
        peopleStatus: statusBreakdown(peopleObj), jobStatus: statusBreakdown(jobsObj),
        deptBreakdown: deptBreakdown(jobsObj), sourceBreakdown: sourceBreakdown(peopleObj),
        momPeople: mom(peopleObj), momJobs: mom(jobsObj) };
      _cache = result; _cacheEnv = environment.id;
      if (isMounted.current) { setData(result); setLoading(false); }
    } catch { if (isMounted.current) setLoading(false); }
  }, [environment?.id]);

  useEffect(() => { isMounted.current = true; load(); return () => { isMounted.current = false; }; }, [load]);

  const goToFiltered = (objectSlug, filterKey, filterValue) => {
    window.dispatchEvent(new CustomEvent("talentos:filter-navigate", { detail: { objectSlug, fieldKey: filterKey, fieldValue: filterValue } }));
  };
  const openReport = (cfg) => {
    if (onReport) onReport(cfg);
    else window.dispatchEvent(new CustomEvent("talentos:open-report", { detail: cfg }));
  };

  const depts = data ? ["all", ...new Set(data.deptBreakdown.map(d => d.dept))] : ["all"];
  const activeCandidates = data?.people?.records.filter(r =>
    !r.deleted_at && !["hired","rejected","withdrawn"].includes((r.data?.status || "").toLowerCase())
  ).length ?? 0;
  const openRoles = data?.jobs?.records.filter(r =>
    !r.deleted_at && !["filled","closed"].includes((r.data?.status || "").toLowerCase())
  ).length ?? 0;
  const poolCount = data?.pools?.total ?? 0;
  const momPeople = data?.momPeople;
  const momJobs   = data?.momJobs;

  const funnelStages = [
    { label: "Applied",     color: BRAND.purple },
    { label: "Screening",   color: BRAND.purpleLight },
    { label: "Interview",   color: BRAND.rose },
    { label: "Final round", color: "#E87FAA" },
    { label: "Offer",       color: BRAND.amber },
    { label: "Hired",       color: BRAND.teal },
  ];
  const totalPeople = data?.people?.total || 1;
  const funnelValues = funnelStages.map((s, i) => ({
    ...s, value: Math.max(Math.round(totalPeople * Math.pow(0.62, i)), i === funnelStages.length - 1 ? 1 : 2)
  }));
  const maxFunnel = funnelValues[0]?.value || 1;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${BRAND.border}`, borderTopColor: BRAND.purple, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 13, color: BRAND.gray }}>Loading intelligence…</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: BRAND.pageBg, minHeight: "100vh", padding: "28px 32px", fontFamily: "'DM Sans', -apple-system, sans-serif" }}>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0F0F19", letterSpacing: "-0.03em", lineHeight: 1.1 }}>People Intelligence</div>
          <div style={{ fontSize: 13, color: BRAND.gray, marginTop: 4 }}>{environment?.name} · {new Date().toLocaleDateString("en", { month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { _cache = null; load(true); }} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 20, border: `0.5px solid ${BRAND.border}`, background: BRAND.cardBg, color: BRAND.gray, cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
          <button onClick={() => openReport({ type: "overview" })} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 20, border: `0.5px solid ${BRAND.purple}`, background: `${BRAND.purple}10`, color: BRAND.purple, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Full report ↗</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {depts.map(d => (
          <button key={d} onClick={() => setDeptFilter(d)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: `0.5px solid ${deptFilter === d ? BRAND.purple : BRAND.border}`, background: deptFilter === d ? BRAND.purple : "transparent", color: deptFilter === d ? "#fff" : BRAND.gray, cursor: "pointer", fontFamily: "inherit", fontWeight: deptFilter === d ? 700 : 400, transition: "all 0.15s" }}>
            {d === "all" ? "All departments" : d}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
        <KpiCard label="Active candidates" value={activeCandidates.toLocaleString()} sub="vs last month" tag={momPeople !== null ? (momPeople >= 0 ? `+${momPeople}%` : `${momPeople}%`) : null} tagKind={momPeople >= 0 ? "up" : "down"} color={BRAND.purple} onClick={() => goToFiltered("people", "status", "Active")} onReport={openReport} reportHint={{ object: "people", title: "Candidates by status", groupBy: "status", chartType: "bar" }} />
        <KpiCard label="Open roles" value={openRoles.toLocaleString()} sub="active requisitions" tag={momJobs !== null ? (momJobs >= 0 ? `+${momJobs}%` : `${momJobs}%`) : null} tagKind={momJobs >= 0 ? "up" : "neutral"} color={BRAND.rose} onClick={() => goToFiltered("jobs", "status", "Open")} onReport={openReport} reportHint={{ object: "jobs", title: "Jobs by department", groupBy: "department", chartType: "bar" }} />
        <KpiCard label="Talent pools" value={poolCount.toLocaleString()} sub="active pools" color={BRAND.teal} onClick={() => goToFiltered("talent-pools", "", "")} onReport={openReport} reportHint={{ object: "talent-pools", title: "Pools by category", groupBy: "category", chartType: "pie" }} />
        <KpiCard label="Offer acceptance" value="87%" sub="on target" tag="—" tagKind="neutral" color={BRAND.amber} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.75fr) minmax(0,1fr)", gap: 12, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Pipeline velocity" sub="Candidates added each month" action={<button onClick={() => openReport({ object: "people", title: "Monthly pipeline", chartType: "area" })} style={{ fontSize: 10, color: BRAND.purple, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Open report ↗</button>} />
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data?.monthlyPeople || []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.purple} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={BRAND.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: BRAND.gray }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: BRAND.gray }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="count" name="Candidates" stroke={BRAND.purple} strokeWidth={2} fill="url(#gradPurple)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}><LegendItem color={BRAND.purple} label="Candidates added" /></div>
        </Card>
        <Card>
          <CardHeader title="Candidate sources" sub="Where talent comes from" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={data?.sourceBreakdown?.length ? data.sourceBreakdown : [{ name: "Direct", value: 40 }, { name: "Referral", value: 28 }, { name: "Agency", value: 18 }, { name: "LinkedIn", value: 14 }]} cx="50%" cy="50%" innerRadius="62%" outerRadius="82%" dataKey="value" paddingAngle={3}>
                {(data?.sourceBreakdown?.length ? data.sourceBreakdown : [1,2,3,4]).map((_, i) => <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", marginTop: 8 }}>
            {(data?.sourceBreakdown?.length ? data.sourceBreakdown : [{ name: "Direct" }, { name: "Referral" }, { name: "Agency" }, { name: "LinkedIn" }]).map((s, i) => <LegendItem key={i} color={ACCENT_COLORS[i % ACCENT_COLORS.length]} label={s.name} />)}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 12 }}>
        <Card>
          <CardHeader title="Roles by department" sub="Open vs filled this quarter" action={<button onClick={() => openReport({ object: "jobs", title: "Jobs by department", groupBy: "department", chartType: "bar" })} style={{ fontSize: 10, color: BRAND.purple, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Open report ↗</button>} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.deptBreakdown?.length ? data.deptBreakdown : [{ dept: "Engineering", open: 12, filled: 9 }, { dept: "Sales", open: 8, filled: 6 }, { dept: "Finance", open: 5, filled: 4 }, { dept: "Marketing", open: 6, filled: 5 }]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
              <CartesianGrid stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 10, fill: BRAND.gray }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: BRAND.gray }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="open" name="Open" fill={BRAND.purpleLight} radius={[4,4,0,0]} />
              <Bar dataKey="filled" name="Filled" fill={BRAND.purple} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <LegendItem color={BRAND.purpleLight} label="Open" />
            <LegendItem color={BRAND.purple} label="Filled" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Conversion funnel" sub="Stage-by-stage drop-off" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {funnelValues.map((s, i) => <FunnelRow key={i} label={s.label} value={s.value} pct={Math.round((s.value / maxFunnel) * 100)} color={s.color} />)}
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `0.5px solid ${BRAND.border}`, display: "flex", justifyContent: "space-around" }}>
            {[{ label: "Conversion", value: `${Math.round((funnelValues.at(-1)?.value / funnelValues[0]?.value) * 100)}%`, color: BRAND.gray }, { label: "Screen pass", value: "62%", color: BRAND.gray }, { label: "Offer accept", value: "87%", color: BRAND.teal }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: BRAND.gray, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data?.activity?.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="Recent activity" sub="Latest actions across the platform" />
          {data.activity.slice(0, 6).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < 5 ? `0.5px solid ${BRAND.border}` : "none" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: a.action === "create" ? BRAND.teal : a.action === "delete" ? BRAND.rose : BRAND.purple }} />
              <div style={{ flex: 1, fontSize: 12, color: "#374151" }}><strong>{a.object_name || "Record"}</strong>{" — "}{a.action || "updated"}</div>
              <div style={{ fontSize: 11, color: BRAND.gray, flexShrink: 0 }}>{a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
