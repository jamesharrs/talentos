// server/routes/analytics.js — Predictive analytics engine
const express = require('express');
const router = express.Router();
const { query, getStore } = require('../db/init');

const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const percentile = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, idx)];
};

// GET /api/analytics/job-insights?job_id=xxx
router.get('/job-insights', (req, res) => {
  try {
    const { job_id, environment_id } = req.query;
    if (!job_id) return res.status(400).json({ error: 'job_id required' });

    const store = getStore();
    const records = store.records || [];
    const peopleLinks = store.people_links || [];
    const workflows = store.workflows || [];
    const workflowAssignments = store.record_workflow_assignments || [];
    const comms = store.communications || [];
    const offers = store.offers || [];
    const objects = store.object_definitions || [];

    const job = records.find(r => r.id === job_id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const jobData = job.data || {};
    const envId = job.environment_id || environment_id;
    const peopleObj = objects.find(o => o.slug === 'people' && o.environment_id === envId);

    // ── 1. Time to Fill ─────────────────────────────────────────────
    const allJobs = records.filter(r => r.object_id === job.object_id && r.environment_id === envId && !r.deleted_at);
    const completedJobs = allJobs.filter(j => ['Filled','Closed'].includes(j.data?.status) && j.created_at);

    const similarCompleted = completedJobs.filter(j => {
      const d = j.data || {};
      let score = 0;
      if (d.department === jobData.department) score += 3;
      if (d.employment_type === jobData.employment_type) score += 1;
      if (d.location === jobData.location) score += 1;
      if (d.work_type === jobData.work_type) score += 1;
      return score >= 2;
    });

    const calcTtf = (jobs) => jobs.map(j => {
      const start = j.data?.open_date || j.created_at;
      const end = j.updated_at || j.created_at;
      return daysBetween(start, end);
    }).filter(d => d > 0 && d < 365);

    const ttfDays = calcTtf(completedJobs);
    const similarTtfDays = calcTtf(similarCompleted);
    const useDays = similarTtfDays.length >= 3 ? similarTtfDays : ttfDays;

    const timeToFill = {
      estimated_days: median(useDays),
      p25: percentile(useDays, 25),
      p75: percentile(useDays, 75),
      sample_size: useDays.length,
      basis: similarTtfDays.length >= 3 ? 'similar_roles' : 'all_roles',
      confidence: useDays.length >= 10 ? 'high' : useDays.length >= 5 ? 'medium' : useDays.length >= 3 ? 'low' : 'insufficient',
      days_open: jobData.open_date ? daysBetween(jobData.open_date, new Date().toISOString()) : daysBetween(job.created_at, new Date().toISOString()),
      on_track: null,
    };
    if (timeToFill.estimated_days && timeToFill.days_open) {
      const ratio = timeToFill.days_open / timeToFill.estimated_days;
      timeToFill.on_track = ratio <= 0.7 ? 'ahead' : ratio <= 1.0 ? 'on_track' : ratio <= 1.3 ? 'at_risk' : 'overdue';
    }

    // ── 2. Pipeline Velocity ────────────────────────────────────────
    const jobLinks = peopleLinks.filter(l => l.record_id === job_id);
    const wfAssignment = workflowAssignments.find(a => a.record_id === job_id && a.workflow_type === 'linked_person');
    const workflow = wfAssignment ? workflows.find(w => w.id === wfAssignment.workflow_id) : null;
    const steps = workflow?.steps || [];

    const stageCounts = {}, stageDurations = {};
    steps.forEach(s => { stageCounts[s.name] = 0; stageDurations[s.name] = []; });
    jobLinks.forEach(link => {
      const stage = link.current_step || steps[0]?.name || 'Unknown';
      if (stageCounts[stage] !== undefined) stageCounts[stage]++;
      const entered = link.stage_updated_at || link.linked_at || link.created_at;
      if (entered && stageDurations[stage]) stageDurations[stage].push(daysBetween(entered, new Date().toISOString()));
    });

    // Environment-wide averages for comparison
    const allEnvLinks = peopleLinks.filter(l => {
      const rec = records.find(r => r.id === l.record_id);
      return rec && rec.environment_id === envId;
    });
    const envStageDurations = {};
    allEnvLinks.forEach(link => {
      const stage = link.current_step;
      if (!stage) return;
      const entered = link.stage_updated_at || link.linked_at || link.created_at;
      if (entered) {
        if (!envStageDurations[stage]) envStageDurations[stage] = [];
        envStageDurations[stage].push(daysBetween(entered, new Date().toISOString()));
      }
    });

    const pipelineStages = steps.map(s => {
      const count = stageCounts[s.name] || 0;
      const durations = stageDurations[s.name] || [];
      const envDurations = envStageDurations[s.name] || [];
      const avgDays = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : null;
      const envAvgDays = envDurations.length >= 3 ? Math.round(envDurations.reduce((a,b)=>a+b,0)/envDurations.length) : null;
      let health = 'normal';
      if (avgDays && envAvgDays) {
        if (avgDays > envAvgDays * 2) health = 'bottleneck';
        else if (avgDays > envAvgDays * 1.5) health = 'slow';
        else if (avgDays < envAvgDays * 0.5) health = 'fast';
      }
      return { name: s.name, count, avg_days: avgDays, env_avg_days: envAvgDays, health, automation: s.automation_type || null };
    });

    // Conversion rates
    const conversionRates = [];
    for (let i = 0; i < pipelineStages.length - 1; i++) {
      const fromIdx = i, toIdx = i + 1;
      const atOrPast = jobLinks.filter(l => { const si = steps.findIndex(s => s.name === (l.current_step || steps[0]?.name)); return si >= fromIdx; }).length;
      const pastTo = jobLinks.filter(l => { const si = steps.findIndex(s => s.name === (l.current_step || steps[0]?.name)); return si >= toIdx; }).length;
      conversionRates.push({ from: pipelineStages[i].name, to: pipelineStages[i+1].name, rate: atOrPast > 0 ? Math.round((pastTo / atOrPast) * 100) : null });
    }

    const bottlenecks = pipelineStages.filter(s => s.health === 'bottleneck' || s.health === 'slow').map(s => ({
      stage: s.name, severity: s.health, avg_days: s.avg_days, env_avg_days: s.env_avg_days,
      message: s.health === 'bottleneck'
        ? `${s.name} averaging ${s.avg_days}d vs ${s.env_avg_days}d norm — 2× slower`
        : `${s.name} slightly slow at ${s.avg_days}d vs ${s.env_avg_days}d norm`,
    }));

    const pipeline = { total_candidates: jobLinks.length, stages: pipelineStages, conversion_rates: conversionRates, bottlenecks };

    // ── 3. Candidate Drop-off Risk ──────────────────────────────────
    const candidateRisk = jobLinks.map(link => {
      const person = records.find(r => r.id === link.person_id);
      if (!person) return null;
      const pData = person.data || {};
      const name = [pData.first_name, pData.last_name].filter(Boolean).join(' ') || pData.email || 'Unknown';
      const lastComm = comms.filter(c => c.record_id === link.person_id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const daysSinceComm = lastComm ? daysBetween(lastComm.created_at, new Date().toISOString()) : 999;
      const stageEnteredAt = link.stage_updated_at || link.linked_at || link.created_at;
      const daysInStage = stageEnteredAt ? daysBetween(stageEnteredAt, new Date().toISOString()) : 0;
      const currentStage = link.current_step || steps[0]?.name || 'Unknown';
      const envAvg = envStageDurations[currentStage] ? median(envStageDurations[currentStage]) : null;

      let riskScore = 0; const factors = [];
      if (daysSinceComm > 14) { riskScore += 35; factors.push('No contact for ' + daysSinceComm + ' days'); }
      else if (daysSinceComm > 7) { riskScore += 20; factors.push('Last contact ' + daysSinceComm + ' days ago'); }
      if (envAvg && daysInStage > envAvg * 2) { riskScore += 30; factors.push(`${daysInStage}d in ${currentStage} (avg ${Math.round(envAvg)}d)`); }
      else if (envAvg && daysInStage > envAvg * 1.5) { riskScore += 15; factors.push(`Slightly long in ${currentStage}`); }
      if (!lastComm) { riskScore += 20; factors.push('No communications recorded'); }
      const inbound = comms.filter(c => c.record_id === link.person_id && c.direction === 'inbound');
      if (inbound.length === 0 && daysSinceComm < 999) { riskScore += 10; factors.push('No inbound responses'); }
      const level = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
      return { person_id: link.person_id, name, stage: currentStage, risk_score: Math.min(100, riskScore), risk_level: level, factors, days_in_stage: daysInStage, days_since_contact: daysSinceComm === 999 ? null : daysSinceComm };
    }).filter(Boolean).sort((a, b) => b.risk_score - a.risk_score);

    // ── 4. Source Effectiveness ──────────────────────────────────────
    const sourceStats = {};
    if (peopleObj) {
      records.filter(r => r.object_id === peopleObj.id && r.environment_id === envId && !r.deleted_at).forEach(p => {
        const src = p.data?.source || 'Unknown';
        if (!sourceStats[src]) sourceStats[src] = { source: src, total: 0, linked: 0, interviewed: 0, hired: 0 };
        sourceStats[src].total++;
        if (peopleLinks.some(l => l.person_id === p.id)) sourceStats[src].linked++;
        peopleLinks.filter(l => l.person_id === p.id).forEach(l => {
          const si = steps.findIndex(s => s.name === l.current_step);
          if (si >= 2) sourceStats[src].interviewed++;
          if (l.current_step === 'Hired' || l.current_step === 'Placed') sourceStats[src].hired++;
        });
      });
    }
    const sourceEffectiveness = Object.values(sourceStats).map(s => ({
      ...s, link_rate: s.total > 0 ? Math.round((s.linked / s.total) * 100) : 0,
      hire_rate: s.linked > 0 ? Math.round((s.hired / s.linked) * 100) : 0,
    })).sort((a, b) => b.total - a.total);

    // ── 5. Offer Insights ───────────────────────────────────────────
    const jobOffers = offers.filter(o => o.job_id === job_id);
    const offerInsights = {
      total: jobOffers.length, accepted: jobOffers.filter(o => o.status === 'accepted').length,
      declined: jobOffers.filter(o => o.status === 'declined').length,
      pending: jobOffers.filter(o => ['draft','pending_approval','sent'].includes(o.status)).length,
      avg_salary: jobOffers.length > 0 ? Math.round(jobOffers.reduce((s,o) => s + (o.base_salary||0), 0) / jobOffers.length) : null,
      acceptance_rate: jobOffers.length > 0 ? Math.round((jobOffers.filter(o => o.status === 'accepted').length / jobOffers.length) * 100) : null,
    };

    // ── 6. Summary ──────────────────────────────────────────────────
    const summaryPoints = [];
    if (timeToFill.on_track === 'overdue') summaryPoints.push(`This role has been open for ${timeToFill.days_open} days — ${Math.round((timeToFill.days_open / timeToFill.estimated_days - 1) * 100)}% longer than typical.`);
    else if (timeToFill.on_track === 'ahead') summaryPoints.push(`Progressing well — ${timeToFill.days_open} days open vs estimated ${timeToFill.estimated_days} days.`);
    if (bottlenecks.length > 0) summaryPoints.push(`Bottleneck: ${bottlenecks[0].message}.`);
    const highRisk = candidateRisk.filter(c => c.risk_level === 'high');
    if (highRisk.length > 0) summaryPoints.push(`${highRisk.length} candidate${highRisk.length > 1 ? 's' : ''} at high drop-off risk.`);
    if (pipeline.total_candidates === 0) summaryPoints.push('No candidates currently in the pipeline.');

    res.json({
      job_id, job_title: jobData.job_title || 'Untitled', department: jobData.department, status: jobData.status,
      time_to_fill: timeToFill, pipeline, candidate_risk: candidateRisk,
      source_effectiveness: sourceEffectiveness, offers: offerInsights, summary: summaryPoints,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics] job-insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
