// Append new instruction blocks to the static SYSTEM_PROMPT
const fs = require('fs');
const path = 'client/src/AI.jsx';
let src = fs.readFileSync(path, 'utf8');

// Find the end of SYSTEM_PROMPT — look for the closing backtick + semicolon
// The prompt ends with a backtick on its own line followed by ; or just `; at end
const PROMPT_END_MARKER = '`; // END SYSTEM_PROMPT';
const ALT_MARKER = 'answer questions and assist with recruitment, hiring, and talent management.`;';

const NEW_INSTRUCTIONS = `

MOVE PIPELINE STAGE INSTRUCTIONS:
When the user wants to move a candidate to a different stage (e.g. "move James to Interview", "advance to offer", "put in screening"):
1. Check PIPELINE LINKS context for this person's current positions and link IDs.
2. If ambiguous (multiple pipelines), ask which one.
3. Output:
<MOVE_STAGE>
{"link_id":"UUID from PIPELINE LINKS","stage_name":"Interview","person_name":"James Harrison","from_stage":"Screening","job_name":"Senior Engineer"}
</MOVE_STAGE>
RULES: NEVER guess a link_id. Only use IDs from PIPELINE LINKS context. stage_name must exactly match a workflow step name. If user says "next stage" pick the next step after current.

SEND COMMUNICATION INSTRUCTIONS:
When the user wants to send an email, SMS, or WhatsApp to the current person record:
1. Use email/phone from CURRENT RECORD DATA if available.
2. Output:
<SEND_COMMS>
{"type":"email","to":"james@example.com","subject":"Interview Invitation","body":"Hi James...","person_name":"James Harrison"}
</SEND_COMMS>
RULES: type is email | sms | whatsapp. For SMS/WhatsApp, "to" is a phone number with country code.

OFFER ACTION INSTRUCTIONS:
When the user wants to approve/send/withdraw an existing offer:
<OFFER_ACTION>
{"offer_id":"UUID","action":"approve","person_name":"James Harrison","note":"Approved"}
</OFFER_ACTION>
action must be: approve | send | withdraw. Only use offer IDs visible in context.

TODAY'S SCHEDULE:
When asked "what interviews do I have today?", "today's schedule", "what's on today?":
Output exactly: <TODAY_SCHEDULE/>
The client fetches and displays the schedule automatically.`;

if (src.includes(PROMPT_END_MARKER)) {
  src = src.replace(PROMPT_END_MARKER, NEW_INSTRUCTIONS + '\n`; // END SYSTEM_PROMPT');
  console.log('✓ Appended new instructions to SYSTEM_PROMPT via END marker');
} else {
  // Find last backtick+semicolon near line 674 area
  // Strategy: find the SYSTEM_PROMPT const and its closing
  const idx = src.indexOf('const SYSTEM_PROMPT = `');
  if (idx === -1) { console.error('✗ SYSTEM_PROMPT not found'); process.exit(1); }
  // Find the matching closing backtick - it will be `; on its own
  // Count from idx forward to find the template literal end
  let i = idx + 'const SYSTEM_PROMPT = `'.length;
  let depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '`' && src[i-1] !== '\\') depth--;
    else if (src[i] === '$' && src[i+1] === '{') { i++; depth++; }
    i++;
  }
  // i is now right after the closing backtick
  // Insert NEW_INSTRUCTIONS just before the closing backtick
  const before = src.slice(0, i - 1); // up to but not including `
  const after = src.slice(i - 1);     // from ` onwards
  src = before + NEW_INSTRUCTIONS + after;
  console.log('✓ Appended new instructions to SYSTEM_PROMPT via depth search');
}

// Also inject pipeline context into the dynamic system parts
// Find where interview types are injected into the dynamic prompt
const INTERVIEW_INJECT = `interviewTypes.length?\`\\n\\nAVAILABLE INTERVIEW TYPES:\\n\${interviewTypes.map(t=>\`- \${t.name} (id:\${t.id}, duration:\${t.duration}min, format:\${t.format||t.interview_format||'Video Call'})\`).join("\\n")}\``;
if (src.includes(INTERVIEW_INJECT)) {
  src = src.replace(
    INTERVIEW_INJECT,
    INTERVIEW_INJECT + `
    +
    (pipelineLinks.length?\`\\n\\nPIPELINE LINKS (this person's current pipeline positions):\\n\${pipelineLinks.map(l=>\`- Link ID: \${l.id} | Job/Record: \${l.target_name||l.target_record_id?.slice(0,8)} | Current stage: \${l.stage_name||'Not set'}\`).join("\\n")}\`:'')
    +`
  );
  console.log('✓ Injected pipelineLinks into dynamic system prompt');
} else {
  console.warn('⚠ Interview inject pattern not found — pipeline context not injected into dynamic prompt');
}

fs.writeFileSync(path, src, 'utf8');
console.log('\nDone.');
