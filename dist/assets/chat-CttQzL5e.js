import{h}from"./index-CKzVDbUq.js";const f=t=>{if(typeof t=="string")return t;if(typeof t=="number"||typeof t=="boolean")return String(t);if(Array.isArray(t))return t.map(f).filter(Boolean).join(" ").trim();if(t&&typeof t=="object"){const e=t;if(typeof e.text=="string")return e.text;if(typeof e.content=="string")return e.content;if(e.content){const o=f(e.content);if(o)return o}try{return JSON.stringify(t)}catch{return""}}return""},y=t=>{const e=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(e)return e[1].trim();const o=t.match(/\{[\s\S]*\}/);if(o)return o[0];const s=t.match(/\[[\s\S]*\]/);return s?s[0]:t.trim()},$=t=>{const e=[],o=Math.min(t.length,2e4),s=t.slice(0,o);for(let i=0;i<s.length;i+=1){const r=s[i];if(r!=="{"&&r!=="[")continue;const n=r==="{"?"}":"]";let a=0,l=!1,c=!1;for(let p=i;p<s.length;p+=1){const d=s[p];if(l){c?c=!1:d==="\\"?c=!0:d==='"'&&(l=!1);continue}if(d==='"'){l=!0;continue}if(d===r&&(a+=1),d===n&&(a-=1),a===0){e.push(s.slice(i,p+1)),i=p;break}}}return e},k=t=>{let e="",o=!1,s=!1;for(let i=0;i<t.length;i+=1){const r=t[i];if(o){e+=r,s?s=!1:r==="\\"?s=!0:r==='"'&&(o=!1);continue}if(r==='"'){o=!0,e+=r;continue}if(r===","){let n=i+1;for(;n<t.length&&/\s/.test(t[n]);)n+=1;if(t[n]==="}"||t[n]==="]")continue}e+=r}return e},S=t=>{const e=t.replace(/^\uFEFF/,"").trim(),o=[e,y(e),...Array.from(e.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map(s=>s[1].trim()),...$(e)].filter(Boolean);for(const s of o){const i=[s,k(s)].filter((r,n,a)=>r&&a.indexOf(r)===n);for(const r of i)try{return JSON.parse(r)}catch{}}throw new Error("PARSE_ERROR: Failed to parse JSON payload from model response")},w=t=>t.map(e=>`${e.role.toUpperCase()}:
${e.content.trim()}`).join(`

`),N=t=>R(t,"json"),C=t=>{var r;const e=t.recentArtifacts.length?t.recentArtifacts.map(n=>`- ${n.topic}${n.dateStr?` (${n.dateStr})`:""}: ${n.summary}`).join(`
`):"- No saved artifacts yet.",o=t.recentSignals.length?t.recentSignals.map(n=>`- [${n.type}] ${n.sourceName}: ${n.content} (${n.timestamp})`).join(`
`):"- No saved signals yet.",s=(r=t.mentionedContext)!=null&&r.length?t.mentionedContext.map(n=>`[${n.id}] ${n.title}
Kind: ${n.kind}
Snippet: ${n.snippet}`).join(`

`):"No explicit canonical records were mentioned in this turn.",i=t.retrievedContext.length?t.retrievedContext.map(n=>`[${n.id}] ${n.title}
Kind: ${n.kind}
Snippet: ${n.snippet}`).join(`

`):"No high-confidence workspace snippets were retrieved for this turn.";return`
Workspace
- Title: ${h(t.workspace)}
- Launch Topic: ${t.workspace.launchTopic||h(t.workspace)}
- Launch Angle: ${t.workspace.launchAngle||"None recorded"}
- Priority Sources: ${t.workspace.prioritySourcesSummary||"Default pack sources"}
- Summary: ${t.workspaceSummary}
- Pack: ${t.pack.name}
- Purpose: ${t.purpose.name}

Recent Artifacts
${e}

Recent Signals
${o}

Explicitly Mentioned Records
${s}

Retrieved Workspace Context
${i}
`.trim()},u=t=>`
You are Sherlock's workspace chat assistant.

Stay grounded in the current workspace. Prefer the provided workspace materials over general knowledge.
If the answer is not supported by the workspace context, say so clearly and note what is missing.
Keep the answer concise, practical, and easy to scan.

${C(t)}
`.trim(),g=t=>t==="tagged"?`
Return plain text using this exact structure and no markdown fences:
<answer>
markdown answer
</answer>
<citations>CTX-REPORT-abc,CTX-SIGNAL-def</citations>
<title>optional concise session title</title>

Rules:
- Put the full user-facing answer inside <answer>.
- Only cite ids that appear in Retrieved Workspace Context.
- If you do not use any retrieved context, leave <citations></citations> empty.
- Keep <title> empty if no better session title is obvious.
`.trim():`
Return valid JSON with this shape:
{
  "content": "markdown answer",
  "citations": ["CTX-REPORT-abc", "CTX-SIGNAL-def"],
  "suggestedTitle": "optional concise session title"
}

Rules:
- Only cite ids that appear in Retrieved Workspace Context.
- If you do not use any retrieved context, return an empty citations array.
- Do not wrap the JSON in markdown fences.
`.trim(),x=(t,e)=>[{role:"system",content:`${u(t)}

${g(e)}`},...t.messages.map(o=>({role:o.role,content:o.content.trim()}))],R=(t,e)=>`
${u(t)}

Conversation
${w(t.messages)}

${g(e)}
`.trim(),m=(t,e)=>{var s;const o=t.match(new RegExp(`<${e}>([\\s\\S]*?)<\\/${e}>`,"i"));return((s=o==null?void 0:o[1])==null?void 0:s.trim())||""},j=t=>{const e=t.match(/<answer>/i);if(!e||e.index===void 0)return"";const o=t.slice(e.index+e[0].length),s=o.search(/<\/answer>/i);return(s>=0?o.slice(0,s):o).replace(/<citations>[\s\S]*$/i,"").replace(/<title>[\s\S]*$/i,"").trimStart()},b=(t,e,o)=>{const s=m(t,"answer"),i=m(t,"citations"),r=m(t,"title")||void 0;if(!s&&!i&&!r)return null;const n=i.split(/[,\n]/).map(a=>a.trim()).filter(Boolean);return{content:s||"No response generated.",citations:n,suggestedTitle:r,rawText:t,provider:e,modelId:o}},T=(t,e,o)=>{const s=b(t,e,o);if(s)return s;const i=S(t),r=i&&typeof i=="object"?i:{},n=Array.isArray(r.citations)?r.citations.filter(c=>typeof c=="string"&&c.trim().length>0):[],a=f(r.content).trim()||t.trim(),l=f(r.suggestedTitle).trim()||void 0;return{content:a||"No response generated.",citations:n,suggestedTitle:l,rawText:t,provider:e,modelId:o}};export{N as a,R as b,x as c,j as e,T as n,S as p,f as t};
