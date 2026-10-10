import{cj as O,ck as g,cl as d,Y as V,cm as L,cn as H,co as _,b1 as J,cp as X,b3 as k,cq as q,h as $}from"./index-CKzVDbUq.js";import{g as Q}from"./labels-5NZmLU7q.js";import{t as p,p as x}from"./chat-CttQzL5e.js";const Z=/https?:\/\/[^\s<>"'`)\]}]+/gi,ee=e=>{const r=e.trim().replace(/[),.;\]}]+$/,"");try{const t=new URL(r);return t.hostname?(t.hash="",t.toString()):null}catch{return null}},G=e=>{const r=typeof e.url=="string"?e.url:typeof e.uri=="string"?e.uri:"",t=ee(r);return t?{title:typeof e.title=="string"&&e.title.trim().length>0?e.title.trim():"Untitled Source",url:t}:null},I=e=>{const r=new Map;return e.forEach(t=>{const n=G(t);if(!n)return;const s=n.url.toLowerCase();r.has(s)||r.set(s,n)}),Array.from(r.values())},Ie=e=>{const r=[];return(e.candidates||[]).forEach(n=>{var i;(((i=n.groundingMetadata)==null?void 0:i.groundingChunks)||[]).forEach(a=>{const o=G(a.web||{});o&&r.push(o)})}),I(r)},te=e=>{const r=e.match(Z)||[];return I(r.map(t=>({title:"Referenced Source",url:t})))},N=e=>{const r=O(e,["leads","agendas","items","results","data","list"]);return(r.length>0?r:e&&typeof e=="object"&&!Array.isArray(e)?[e]:[]).map(n=>g(n).trim()).filter(n=>n.length>0)},re=e=>Array.isArray(e)?e.map(r=>{if(typeof r=="string")return{name:r,type:"UNKNOWN"};if(!r||typeof r!="object")return null;const t=r,n=p(t.name).trim();if(!n)return null;const s=p(t.type).toUpperCase(),i=s==="PERSON"||s==="ORGANIZATION"||s==="UNKNOWN"?s:"UNKNOWN",a=p(t.role).trim()||void 0,o=p(t.sentiment).toUpperCase();return{name:n,type:i,role:a,sentiment:o==="POSITIVE"||o==="NEGATIVE"||o==="NEUTRAL"?o:void 0}}).filter(r=>!!r):[],ne=(e,r,t,n)=>{const s=O(e,["items","results","data","signals","feed"]);return(s.length>0?s:e&&typeof e=="object"&&!Array.isArray(e)?[e]:[]).map((a,o)=>{const l=a,c=g(d(l,"riskLevel")).toUpperCase(),u=c==="LOW"||c==="MEDIUM"||c==="HIGH"?c:"MEDIUM";return{id:g(d(l,"id"))||`${n}-${Date.now()}-${o}`,title:g(d(l,"title")??d(l,"headline")??d(l,"name"),{includePriority:!1,fallback:"Untitled signal"}),category:g(d(l,"category"),{includePriority:!1,fallback:r}),riskLevel:u,timestamp:g(d(l,"timestamp")??d(l,"publishedAt")??d(l,"time"),{includePriority:!1,fallback:t})}})},se=(e,r)=>{const t=O(e,["events","items","results","data","signals"]);return(t.length>0?t:e&&typeof e=="object"&&!Array.isArray(e)?[e]:[]).map((s,i)=>{const a=s,o=g(d(a,"type")??d(a,"eventType")).toUpperCase(),l=o==="SOCIAL"||o==="NEWS"||o==="OFFICIAL"?o:"NEWS",c=g(d(a,"sentiment")).toUpperCase(),u=c==="NEGATIVE"||c==="NEUTRAL"||c==="POSITIVE"?c:"NEUTRAL",m=g(d(a,"threatLevel")??d(a,"severity")??d(a,"riskLevel")).toUpperCase(),f=m==="INFO"||m==="CAUTION"||m==="CRITICAL"?m:"INFO";return{id:g(d(a,"id")??d(a,"eventId"),{includePriority:!1,fallback:`${r}-${Date.now()}-${i}`}),type:l,sourceName:g(d(a,"sourceName")??d(a,"source")??d(a,"publisher")??d(a,"origin"),{includePriority:!1,fallback:"Unknown Source"}),content:g(d(a,"content")??d(a,"description")??d(a,"summary")??d(a,"headline")??d(a,"title")??a,{includePriority:!1}),timestamp:g(d(a,"timestamp")??d(a,"publishedAt")??d(a,"time")??d(a,"date"),{includePriority:!1,fallback:"now"}),sentiment:u,threatLevel:f,url:g(d(a,"url")??d(a,"link")??d(a,"sourceUrl"),{includePriority:!1})||void 0}})},ae=(e,r)=>{if(r){const t=r.personas.find(n=>n.id===e);if(t)return t.instruction}switch(e){case"JOURNALIST":return"You are an award-winning investigative journalist. Focus on public interest, uncovering corruption, and verifying sources with extreme rigor. Your tone is objective but compelling.";case"INTELLIGENCE_OFFICER":return"You are a senior intelligence analyst. Focus on threat assessment, geopolitical implications, and connecting disparate data points. Your tone is clinical, brief, and highly classified.";case"CONSPIRACY_ANALYST":return"You are a fringe researcher looking for hidden patterns. You are skeptical of official narratives and look for deep state connections, though you must still rely on finding evidence. Your tone is urgent.";case"FORENSIC_ACCOUNTANT":return"You are a world-class forensic accountant and OSINT investigator. Focus on financial discrepancies, money trails, and regulatory violations. Your tone is professional and evidence-based.";default:for(const t of V){const n=t.personas.find(s=>s.id===e);if(n)return n.instruction}return"You are a versatile OSINT investigator. Adapt your approach to the subject matter. Your tone is professional and thorough."}},v=(e,r)=>{if(r!=null&&r.start||r!=null&&r.end){const t=r.start||"historical records",n=r.end||"present";return`Focus on the time period from ${t} to ${n}.`}if(!e||e.strategy==="NONE")return"";if(e.strategy==="RELATIVE"&&e.relativeYears)return`Focus on the time period from ${new Date().getFullYear()-e.relativeYears} to present.`;if(e.strategy==="ABSOLUTE"&&(e.absoluteStart||e.absoluteEnd)){const t=e.absoluteStart||"historical records",n=e.absoluteEnd||"present";return`Focus on the time period from ${t} to ${n}.`}return""},Y=(e,r=10)=>!e.suggestedSources||e.suggestedSources.length===0?"":`SUGGESTED SOURCES: ${e.suggestedSources.flatMap(n=>n.sources.map(s=>s.label)).slice(0,r).join(", ")}`,Te=(e,r,t,n,s,i,a)=>{const o=ae(t.persona,r),l=v(r.defaultDateRange,s),c=Y(r),u=i?`RUN PURPOSE: ${i.name}. ${i.promptDirective}`:"",m=a?`DOMAIN PACK: ${a.name}. Workspace mode: ${a.workspaceMode}.`:"",f=i?`OUTPUT CONTRACT: Return a structured ${i.recommendedArtifactType.toLowerCase()} with sections covering ${i.defaultSectionKinds.join(", ")} when relevant.`:"OUTPUT CONTRACT: Return a structured report with clear sections when relevant.",h=a?ie(a):"",A=i?oe(i):"";let E=`${o}

WORKSPACE CONTEXT: ${r.domainContext}
OBJECTIVE: ${r.investigationObjective}
TARGET: "${e}"
${m}
${u}
${l?`TEMPORAL SCOPE: ${l}`:""}
${c}
${f}
${h}
${A}
`;return t.searchDepth==="DEEP"&&(E+=`
STRICT REQUIREMENT: Prioritize obscure filings, local reports, and deep-web sources. Cross-reference multiple sources.`),n&&(E+=`
CONTEXT: This run builds on parent workspace "${n.topic}". Parent summary: "${n.summary}". Extend, test, or refine those findings rather than repeating them.`),E+=`

Analyze thoroughly, preserve uncertainty, distinguish evidence from inference, and make the output useful for follow-up work.`,E},ie=e=>{switch(e.id){case"scientific-research":return"PACK GUIDANCE: Prioritize peer-reviewed research, reputable preprints, review articles, and institutional sources. Explicitly call out methodology quality, limitations, uncertainty, and whether findings replicate or conflict.";case"ai-technology-landscape":return"PACK GUIDANCE: Prioritize primary releases, official documentation, model cards, benchmark reports, repositories, and direct product announcements before commentary. Separate capability claims from verified evidence.";case"policy-regulation":return"PACK GUIDANCE: Prioritize primary policy texts, regulator statements, official guidance, enforcement actions, and effective dates. Be precise about jurisdiction, timing, and affected stakeholders.";case"corporate-due-diligence":return"PACK GUIDANCE: Prioritize filings, court records, enforcement documents, ownership data, and reputable business reporting. Surface hidden liabilities, governance concerns, and reputational exposure.";case"government-fraud":return"PACK GUIDANCE: Prioritize procurement records, oversight reports, grants data, enforcement actions, and primary documentation. Look for unusual spending, conflicts, weak controls, and concentrated counterparties.";default:return"PACK GUIDANCE: Prefer primary sources first, then add credible secondary reporting only where it adds context or synthesis."}},oe=e=>{switch(e.id){case"latest-findings":return"PURPOSE GUIDANCE: Emphasize recency, exact dates, what changed, and why the newest developments matter. Avoid padding with older background unless it changes interpretation.";case"monitor":return"PURPOSE GUIDANCE: Focus on deltas, escalation thresholds, and signals worth watching next. Prefer operational clarity over exhaustive history.";case"synthesis":return"PURPOSE GUIDANCE: Compare sources directly, surface consensus and disagreement, and preserve uncertainty. Organize findings so a reader can quickly understand the strongest evidence.";case"trend-scan":return"PURPOSE GUIDANCE: Focus on directional movement, major actors, repeated patterns, and strategic implications rather than one-off details.";default:return"PURPOSE GUIDANCE: Develop a rigorous, evidence-backed picture of the topic and leave the reader with practical follow-up paths."}},Se=(e,r,t="STAGED")=>{const n=Q(r),s=e.id==="deep-dive"?"4-6":e.id==="monitor"?"3-5":"3-4";return`CRITICAL: Respond with JSON only using this shape:
{
  "summary": "string",
  "entities": [{ "name": "string", "type": "PERSON|ORGANIZATION|UNKNOWN", "role": "string", "sentiment": "POSITIVE|NEGATIVE|NEUTRAL" }],
  "keyFindings": [{ "title": "string", "summary": "string", "supportRefs": ["optional strings"] }],
  "agendas": ["string"],
  "leads": ["string"],
  "followUps": ["string"],
  "methodology": "string",
  "sources": [{ "title": "string", "url": "https://..." }],
  "evidence": [{ "kind": "SOURCE|QUOTE|FINDING|DATA_POINT|TIMELINE_EVENT|METHOD", "title": "string", "summary": "string", "quote": "optional string", "sourceTitle": "optional string", "sourceUrl": "optional https://..." }],
  "sections": [{ "kind": "EXECUTIVE_SUMMARY|KEY_FINDINGS|ANOMALIES|LEADS|EVIDENCE|TIMELINE|METHODOLOGY|LITERATURE_REVIEW|IMPLICATIONS|NEXT_STEPS|CUSTOM", "title": "string", "content": "optional string", "items": ["optional strings"] }]
}
Use keyFindings for the main substantive findings you want a teammate to reuse elsewhere in the workspace. Use agendas only for ${n.anomalyLabel.toLowerCase()} such as discrepancies, risk flags, outliers, or unresolved concerns. Use leads/followUps for ${n.followUpLabel.toLowerCase()} even when they are questions, comparisons, monitoring actions, or recommendations. Include 3-6 key findings and ${s} follow-up items when possible. Include 3-8 unique sources. Include 3-8 evidence records tied to specific claims or observations whenever possible. ${t==="STAGED"?"Assume this output is part of a deeper research workflow, so emphasize evidence quality, methodology transparency, and reusable sections.":"Keep the output decisive but still evidence-backed and structured."}`},Ne=e=>{const{region:r,category:t,limit:n,prioritySources:s,scope:i,dateRange:a,purpose:o,pack:l}=e,c=r.trim()?r:"globally",u=i.investigationObjective,m=t!=="All"?`${t}-related issues within the scope of: ${u}`:u,f=v(i.defaultDateRange,a),h=l?`DOMAIN PACK: ${l.name}.`:"",A=o?`RUN PURPOSE: ${o.name}. ${o.promptDirective}`:"";let E="";return s.trim()?E=`PRIORITY: Actively search for and prioritize information from these specific sources/handles: ${s}.`:i.suggestedSources.length>0&&(E=`SUGGESTED SOURCES: Consider ${i.suggestedSources.flatMap(T=>T.sources.map(S=>S.label)).slice(0,5).join(", ")}.`),`
CONTEXT: ${i.domainContext}
${h}
${A}

Analyze real-time news, official reports, and social media discussions to identify ${n} potential issues related to: ${m} in ${c}.
${f?`TEMPORAL SCOPE: ${f}`:""}
${E}
Focus on high-value findings, discrepancies, and notable developments.
CRITICAL: Return ONLY a valid JSON array.
Each item MUST include: id, title, category, riskLevel ("LOW" | "MEDIUM" | "HIGH").
`},Oe=e=>{const{topic:r,monitorConfig:t,scope:n,existingContent:s,purpose:i,pack:a}=e,o=`Retrieve exactly: ${t.newsCount} items of type 'NEWS', ${t.socialCount} items of type 'SOCIAL', ${t.officialCount} items of type 'OFFICIAL'`,l=t.prioritySources.trim()?`PRIORITY: Prioritize ${t.prioritySources}.`:Y(n),c=v(n.defaultDateRange,t.dateRange),u=s.slice(0,20).join("; "),m=u?`CRITICAL EXCLUSION: Do NOT return items similar to: "${u}".`:"",f=a?`DOMAIN PACK: ${a.name}.`:"",h=i?`RUN PURPOSE: ${i.name}. ${i.promptDirective}`:"";return`CONTEXT: ${n.domainContext}
${f}
${h}

Search intelligence for: "${r}".
${o}
${l}
${c?`TEMPORAL SCOPE: ${c}`:""}
${m}
CRITICAL: Respond with ONLY a valid JSON array.
Items must include: id, type ("SOCIAL" | "NEWS" | "OFFICIAL"), sourceName, content, timestamp, sentiment ("NEGATIVE" | "NEUTRAL" | "POSITIVE"), threatLevel ("INFO" | "CAUTION" | "CRITICAL"), url (optional).`},ce=3,le=2e3,de=e=>new Promise(r=>setTimeout(r,e)),ve=async(e,r)=>{const t=r.retries??ce,n=r.delayMs??le;for(let s=0;s<=t;s+=1)try{return L({provider:r.provider,modelId:r.modelId,operation:r.operation,retryCount:s}),await e()}catch(i){if(i instanceof Error&&i.name==="AbortError")throw i;const a=H(r.provider,r.operation,i);if(L({provider:r.provider,modelId:r.modelId,operation:r.operation,retryCount:s,errorClass:a.code,message:a.message}),a.code==="MISSING_API_KEY"||a.code==="UNSUPPORTED_OPERATION"||a.code==="PARSE_ERROR"||s>=t)throw a;await de(n)}throw new _({code:"UPSTREAM_ERROR",provider:r.provider,operation:r.operation,message:"Retry loop exhausted unexpectedly."})},Ce=e=>{let r="";return{start(){var t;(t=e==null?void 0:e.onEvent)==null||t.call(e,{type:"START"})},push(t){var n;t&&(r+=t,(n=e==null?void 0:e.onEvent)==null||n.call(e,{type:"DELTA",delta:t,snapshot:r}))},complete(){var t;return(t=e==null?void 0:e.onEvent)==null||t.call(e,{type:"COMPLETE",snapshot:r}),r},getSnapshot(){return r}}},D=e=>{const r=e.split(/\r?\n/);let t="message";const n=[];for(const s of r)if(!(!s||s.startsWith(":"))){if(s.startsWith("event:")){t=s.slice(6).trim()||"message";continue}s.startsWith("data:")&&n.push(s.slice(5).trimStart())}return n.length===0?null:{event:t,data:n.join(`
`)}},Pe=async(e,r)=>{if(!e.body)throw new Error("UPSTREAM_ERROR: Streaming response body was empty.");const t=e.body.getReader(),n=new TextDecoder;let s="";const i=(a=!1)=>{const o=/\r?\n\r?\n/;let l=o.exec(s);for(;l;){const c=s.slice(0,l.index);s=s.slice(l.index+l[0].length);const u=D(c);u&&r(u),l=o.exec(s)}if(a&&s.trim().length>0){const c=D(s);c&&r(c),s=""}};for(;;){const{done:a,value:o}=await t.read();if(a)break;s+=n.decode(o,{stream:!0}),i()}s+=n.decode(),i(!0)},M=e=>{const r=typeof e=="string"?e.trim().toUpperCase():"";return r==="SOURCE"||r==="QUOTE"||r==="FINDING"||r==="DATA_POINT"||r==="TIMELINE_EVENT"||r==="METHOD"?r:"SOURCE"},ue=e=>Array.isArray(e)?e.map((r,t)=>{if(!r||typeof r!="object")return null;const n=r,s=p(n.title).trim(),i=p(n.summary??n.content??n.snippet??n.description??n.claim).trim();if(!s&&!i)return null;const a=Array.isArray(n.tags)?n.tags.filter(o=>typeof o=="string"&&o.trim().length>0):void 0;return{id:p(n.id).trim()||`evidence-${M(n.kind).toLowerCase()}-${t}`,kind:M(n.kind),title:s||i.slice(0,72),summary:i||s,quote:p(n.quote).trim()||void 0,sourceTitle:p(n.sourceTitle??n.source_name??n.source).trim()||void 0,sourceUrl:p(n.sourceUrl??n.url??n.uri).trim()||void 0,sectionId:p(n.sectionId).trim()||void 0,tags:a,metadata:n.metadata&&typeof n.metadata=="object"?n.metadata:void 0,order:typeof n.order=="number"?n.order:t}}).filter(r=>!!r):[],we=(e,r,t)=>{var P,w,b,R,U;const n=N(e.agendas),s=N(e.leads),i=N(e.followUps),a=p(e.summary).trim()||"Analysis pending...",o=p(e.methodology).trim()||void 0,c=[...ue(e.evidence),...t.extraEvidence||[]].sort((y,B)=>(y.order??0)-(B.order??0)),u=Array.isArray(e.sources)?I(e.sources.map(y=>({title:y.title,url:y.url,uri:y.uri}))):[],m=I(c.map(y=>({title:y.sourceTitle||y.title,url:y.sourceUrl}))),f=te([r,a,o||"",...s,...i].join(`
`)),h=J({leads:s,followUps:i}),A=X({keyFindings:e.keyFindings,sections:k({sections:e.sections,summary:a,agendas:n,leads:s,followUps:h,evidence:c,methodology:o,artifactType:t.artifactType}),legacyAgendas:n}),E=q(h),C=I([...t.extraSources||[],...u,...m,...f]),T=k({sections:e.sections,summary:a,agendas:n,leads:s,keyFindings:A,followUps:h,evidence:c,methodology:o,artifactType:t.artifactType}),S={provider:t.provider,modelId:t.modelId,generatedAt:new Date().toISOString(),requestId:t.requestId,warnings:(P=t.warnings)!=null&&P.length?t.warnings:void 0,citations:(w=t.citations)!=null&&w.length?t.citations:void 0,usage:t.usage,search:t.searchMetadata,metadata:t.extraMetadata};return{topic:t.topic,dateStr:new Date().toLocaleDateString(),summary:a,keyFindings:A,entities:re(e.entities),agendas:n,leads:E.length>0?E:s,followUps:h,sections:T,evidence:c,artifactType:t.artifactType,sources:C,provenance:S,rawText:r,packId:t.pack.id,purposeId:t.purpose.id,labelProfileId:t.labelProfileId,metadata:{packName:t.pack.name,purposeName:t.purpose.name,scopeId:t.scopeId,workspaceMode:t.pack.workspaceMode,warnings:t.warnings,...t.extraMetadata},config:{provider:t.provider,modelId:t.modelId,persona:(b=t.extraMetadata)==null?void 0:b.persona,searchDepth:(R=t.extraMetadata)==null?void 0:R.searchDepth,thinkingBudget:(U=t.extraMetadata)==null?void 0:U.thinkingBudget,scopeId:t.scopeId,scopeName:t.scopeName,packId:t.pack.id,packName:t.pack.name,purposeId:t.purpose.id,purposeName:t.purpose.name,artifactType:t.artifactType,labelProfileId:t.labelProfileId,generationMode:t.generationMode}}},me=e=>e.contextSnapshot.parts.sort((r,t)=>t.priority-r.priority).map(r=>`## ${r.title}
Kind: ${r.kind}
Priority: ${r.priority}
${r.content.trim()}`).join(`

`),z=e=>e==="tagged"?`
Return plain text using only these tags and no markdown fences:
<message>markdown message for the user</message>
<action>{"type":"MESSAGE","input":{"text":"..."},"rationale":"..."}</action>
<action>{"type":"PLACE_LINKED_CARD","input":{"refKind":"ARTIFACT","refId":"rep-1"},"rationale":"..."}</action>
<title>optional concise session title</title>

Rules:
- Emit zero or more <action> blocks, one JSON object per block.
- Every action JSON must include "type". Keep "input" and "rationale" optional.
- Only propose inspectable Sherlock board/workspace actions. Do not invent ids outside the provided context.
- If no board mutation is needed, still use <message> and you may omit <action> blocks.
`.trim():`
Return valid JSON with this shape:
{
  "message": "markdown message for the user",
  "actions": [
    {
      "type": "MESSAGE",
      "input": { "text": "..." },
      "rationale": "optional explanation"
    }
  ],
  "suggestedTitle": "optional concise session title"
}

Rules:
- "actions" must be an array.
- Every action object must include "type". Keep "input" and "rationale" optional.
- Only propose inspectable Sherlock board/workspace actions grounded in the provided context.
`.trim(),K=e=>`
You are Sherlock's research workspace board agent.

Stay grounded in the provided board context. Prefer Sherlock-aware actions tied to canonical records over generic whiteboard behavior.
Be explicit, auditable, and conservative. If the context is insufficient, say what is missing instead of inventing details.

Workspace
- Title: ${$(e.workspace)}
- Launch Topic: ${e.workspace.launchTopic||$(e.workspace)}
- Launch Angle: ${e.workspace.launchAngle||"None recorded"}
- Board: ${e.board.name}
- Pack: ${e.pack.name}
- Purpose: ${e.purpose.name}
- Presentation Mode: ${e.board.presentationMode?"ON":"OFF"}

Allowed action families for this planning pass:
- MESSAGE
- THINK
- UPDATE_TODO
- SET_VIEWPORT
- PLACE_LINKED_CARD
- MOVE_SHAPES
- ALIGN_SHAPES
- DISTRIBUTE_SHAPES
- GROUP_SELECTION
- CREATE_CONNECTOR
- CREATE_BOARD_NOTE
- CREATE_WORKSPACE_NOTE
- PROMOTE_EXCERPT
- ATTACH_ARTIFACT_SUMMARY
- CREATE_ARTIFACT_DRAFT
- APPEND_NOTE_TO_ARTIFACT
- CREATE_FOLLOW_UP_RUN
- SCHEDULE_FOLLOW_UP
- REVIEW_REGION

Board Context
${me(e)}
`.trim(),be=(e,r)=>[{role:"system",content:`${K(e)}

${z(r)}`},{role:"user",content:e.userRequest.trim()}],Re=(e,r)=>`
${K(e)}

User Request
${e.userRequest.trim()}

${z(r)}
`.trim(),F=(e,r)=>{var n;const t=e.match(new RegExp(`<${r}>([\\s\\S]*?)<\\/${r}>`,"i"));return((n=t==null?void 0:t[1])==null?void 0:n.trim())||""},j=e=>{if(!e||typeof e!="object"||Array.isArray(e))return null;const r=e;return typeof r.type!="string"||!r.type.trim()?null:{type:r.type,input:r.input&&typeof r.input=="object"&&!Array.isArray(r.input)?r.input:void 0,rationale:typeof r.rationale=="string"?r.rationale:void 0}},W=e=>{const r=e.matchAll(/<action>([\s\S]*?)<\/action>/gi),t=[];for(const n of r){const s=x(n[1]),i=j(s);i&&t.push(i)}return t},pe=e=>{const r=e.match(/<message>/i);if(!r||r.index===void 0)return"";const t=e.slice(r.index+r[0].length),n=t.search(/<\/message>/i);return(n>=0?t.slice(0,n):t).replace(/<action>[\s\S]*$/i,"").replace(/<title>[\s\S]*$/i,"").trimStart()},ge=(e,r,t)=>{const n=F(e,"message"),s=W(e),i=F(e,"title")||void 0;return!n&&s.length===0&&!i?null:{message:n||"No board-agent message generated.",actions:s,suggestedTitle:i,rawText:e,provider:r,modelId:t}},fe=(e,r,t)=>{const n=ge(e,r,t);if(n)return n;const s=x(e),i=s&&typeof s=="object"&&!Array.isArray(s)?s:{},a=Array.isArray(i.actions)?i.actions.map(c=>j(c)).filter(c=>!!c):[],o=p(i.message).trim()||e.trim(),l=p(i.suggestedTitle).trim()||void 0;return{message:o||"No board-agent message generated.",actions:a,suggestedTitle:l,rawText:e,provider:r,modelId:t}},Ue=(e,r,t)=>{let n="",s="",i=0;return{start(){var a;(a=t==null?void 0:t.onEvent)==null||a.call(t,{type:"START"})},push(a){var c,u,m;if(!a)return;n+=a,(c=t==null?void 0:t.onEvent)==null||c.call(t,{type:"RAW_DELTA",delta:a,snapshot:n});const o=pe(n);if(o.length>s.length){const f=o.slice(s.length);s=o,f&&((u=t==null?void 0:t.onEvent)==null||u.call(t,{type:"MESSAGE_DELTA",delta:f,snapshot:s}))}const l=W(n);for(;i<l.length;)(m=t==null?void 0:t.onEvent)==null||m.call(t,{type:"ACTION",action:l[i],index:i,snapshot:n}),i+=1},complete(){var o,l;const a=fe(n,e,r);if(i<a.actions.length)for(let c=i;c<a.actions.length;c+=1)(o=t==null?void 0:t.onEvent)==null||o.call(t,{type:"ACTION",action:a.actions[c],index:c,snapshot:n});return(l=t==null?void 0:t.onEvent)==null||l.call(t,{type:"COMPLETE",snapshot:n,response:a}),a}}},Le=(e,r)=>{const t=e.categories[1]||"General";return[{id:"1",title:`Notable development in ${t}`,category:t,timestamp:"10:42 AM",riskLevel:"HIGH"},{id:"2",title:"Emerging pattern detected",category:e.categories[2]||"Analysis",timestamp:"09:15 AM",riskLevel:"MEDIUM"},{id:"3",title:"New information surfaced",category:e.categories[0]||"General",timestamp:"08:30 AM",riskLevel:"HIGH"}].slice(0,r)},ke=e=>{const r=Date.now();return[{id:`sim-${r}-1`,type:"NEWS",sourceName:"News Source",content:`New developments regarding ${e}.`,timestamp:"5m ago",sentiment:"NEGATIVE",threatLevel:"CAUTION"},{id:`sim-${r}-2`,type:"SOCIAL",sourceName:"Social Media",content:`Discussion emerging about ${e}.`,timestamp:"12m ago",sentiment:"NEGATIVE",threatLevel:"CRITICAL"},{id:`sim-${r}-3`,type:"OFFICIAL",sourceName:"Official Source",content:"Related announcement published.",timestamp:"1h ago",sentiment:"NEUTRAL",threatLevel:"INFO"}]},Ee=()=>new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),$e=(e,r)=>ne(e,r.categories[0]||"General",Ee(),"feed"),De=e=>se(e,"sim"),Me=async(e,r)=>{try{return await e()}catch(t){if(t instanceof _&&t.code==="MISSING_API_KEY")throw t;return r()}};export{Me as a,Re as b,Ue as c,Te as d,Se as e,we as f,Ce as g,I as h,te as i,N as j,Ie as k,Le as l,Ne as m,fe as n,$e as o,ke as p,Oe as q,De as r,be as s,Pe as t,ve as w};
