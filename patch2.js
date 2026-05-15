const fs = require('fs');
const path = 'client/src/AI.jsx';
let src = fs.readFileSync(path, 'utf8');

function patch(label, oldStr, newStr) {
  if (!src.includes(oldStr)) { console.error('✗', label, 'NOT FOUND'); return; }
  src = src.replace(oldStr, newStr);
  console.log('✓', label);
}

// 2 — pipeline links useEffect
patch('2 pipeline links',
  `    // linked jobs loaded by separate useEffect watching currentRecord?.id
    // (settings-section listener is in its own useEffect above)
  },[open, currentRecord?.id, currentObject?.slug]);`,
  `    // linked jobs loaded by separate useEffect watching currentRecord?.id
    // (settings-section listener is in its own useEffect above)
  },[open, currentRecord?.id, currentObject?.slug]);

  // Load pipeline links when viewing a person record
  useEffect(() => {
    if (!open || !currentRecord || currentObject?.slug !== 'people') { setPipelineLinks([]); return; }
    tFetch(\`/api/workflows/people-links?person_record_id=\${currentRecord.id}\`)
      .then(r => r.json()).then(d => setPipelineLinks(Array.isArray(d) ? d : [])).catch(() => setPipelineLinks([]));
  }, [open, currentRecord?.id, currentObject?.slug]);`
);

// 6 — parse new blocks in response handler
patch('6 parse new blocks',
  `      const createData    = parseCreateRecord(reply);`,
  `      const moveStageData   = parseMoveStage(reply);
      const sendCommsData   = parseSendComms(reply);
      const offerActionData = parseOfferAction(reply);
      const todayFlag       = parseTodaySchedule(reply);
      if (moveStageData)   setPendingMoveStage(moveStageData);
      if (sendCommsData)   setPendingComms(sendCommsData);
      if (offerActionData) setPendingOfferAction(offerActionData);
      if (todayFlag) {
        tFetch(\`/api/interviews?environment_id=\${environment?.id}\`)
          .then(r => r.json()).then(data => {
            const today = new Date().toISOString().slice(0,10);
            const todays = (Array.isArray(data) ? data : data.interviews || [])
              .filter(i => i.date === today).sort((a,b) => (a.time||'').localeCompare(b.time||''));
            setTodaySchedule(todays);
          }).catch(() => setTodaySchedule([]));
      }
      const createData    = parseCreateRecord(reply);`
);

// 13 — today quick action
patch('13 today schedule action',
  `  { id:"srch", icon:"search",      label:"Search records",      prompt:"Search for " },
];`,
  `  { id:"srch", icon:"search",      label:"Search records",      prompt:"Search for " },
  { id:"today",icon:"calendar",   label:"Today's schedule",   prompt:"What interviews do I have today?" },
];`
);

fs.writeFileSync(path, src, 'utf8');
console.log('\nDone.');
