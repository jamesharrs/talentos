const express=require('express'),router=express.Router(),{getStore,saveStore}=require('../db/init'),crypto=require('crypto');
function ensure(){const s=getStore();if(!s.portal_events){s.portal_events=[];saveStore();}}
router.post('/:id/track',(req,res)=>{ensure();const{event,data}=req.body;const s=getStore();s.portal_events.push({id:crypto.randomUUID(),portal_id:req.params.id,event:event||'page_view',data:data||{},created_at:new Date().toISOString()});if(s.portal_events.length>100000)s.portal_events=s.portal_events.slice(-100000);saveStore();res.json({ok:true});});
router.get('/:id/stats',(req,res)=>{ensure();const s=getStore();const all=(s.portal_events||[]).filter(e=>e.portal_id===req.params.id);const since=new Date(Date.now()-parseInt(req.query.days||30)*86400000).toISOString();const recent=all.filter(e=>e.created_at>=since);const count=(arr,ev)=>arr.filter(e=>e.event===ev).length;const dm={};recent.filter(e=>e.event==='page_view').forEach(e=>{const d=e.created_at.slice(0,10);dm[d]=(dm[d]||0)+1;});const daily=Object.entries(dm).sort(([a],[b])=>a.localeCompare(b)).map(([date,views])=>({date,views}));const jc={};recent.filter(e=>e.event==='job_click').forEach(e=>{const t=e.data?.job_title||'Unknown';jc[t]=(jc[t]||0)+1;});const topJobs=Object.entries(jc).sort(([,a],[,b])=>b-a).slice(0,5).map(([title,clicks])=>({title,clicks}));res.json({total_views:count(all,'page_view'),views_period:count(recent,'page_view'),job_clicks:count(recent,'job_click'),applications:count(recent,'application'),form_starts:count(recent,'form_start'),form_completions:count(recent,'form_complete'),conversion_rate:count(recent,'page_view')>0?Math.round((count(recent,'application')/count(recent,'page_view'))*100):0,daily,top_jobs:topJobs,days:parseInt(req.query.days||30)});});

// ── Enhanced /stats with A/B variant breakdown ────────────────────────────────
router.get('/:id/stats_v2',(req,res)=>{
  ensure();
  const s=getStore();
  const days=parseInt(req.query.days||30);
  const since=new Date(Date.now()-days*86400000).toISOString();
  const all=(s.portal_events||[]).filter(e=>e.portal_id===req.params.id);
  const recent=all.filter(e=>e.created_at>=since);
  const count=(arr,ev)=>arr.filter(e=>e.event===ev).length;
  const dm={};
  recent.filter(e=>e.event==='page_view').forEach(e=>{const d=e.created_at.slice(0,10);dm[d]=(dm[d]||0)+1;});
  const daily=Object.entries(dm).sort(([a],[b])=>a.localeCompare(b)).map(([date,views])=>({date,views}));
  const jc={};
  recent.filter(e=>e.event==='job_click').forEach(e=>{const t=e.data?.job_title||'Unknown';jc[t]=(jc[t]||0)+1;});
  const top_jobs=Object.entries(jc).sort(([,a],[,b])=>b-a).slice(0,5).map(([title,clicks])=>({title,clicks}));
  const srcMap={};
  recent.filter(e=>e.event==='page_view').forEach(e=>{const src=(e.data?.utm_source||'direct').toLowerCase();srcMap[src]=(srcMap[src]||0)+1;});
  const by_source=Object.entries(srcMap).sort(([,a],[,b])=>b-a).map(([source,views])=>({source,views}));
  let by_variant=null;
  if(req.query.variant_breakdown==='1'){
    const vmap={};
    recent.forEach(e=>{
      const v=(e.data?.variant||'').trim().toLowerCase();
      if(!v)return;
      if(!vmap[v])vmap[v]={variant:v,views:0,conversions:0,applications:0};
      if(e.event==='page_view')vmap[v].views++;
      if(e.event==='application'||e.event==='form_complete')vmap[v].conversions++;
      if(e.event==='application')vmap[v].applications++;
    });
    by_variant=Object.values(vmap).sort((a,b)=>a.variant.localeCompare(b.variant));
  }
  res.json({
    total_views:count(all,'page_view'),views_period:count(recent,'page_view'),
    job_clicks:count(recent,'job_click'),applications:count(recent,'application'),
    form_starts:count(recent,'form_start'),form_completions:count(recent,'form_complete'),
    conversion_rate:count(recent,'page_view')>0?Math.round((count(recent,'application')/count(recent,'page_view'))*100):0,
    daily,top_jobs,by_source,
    ...(by_variant!==null?{by_variant}:{}),days,
  });
});

module.exports=router;