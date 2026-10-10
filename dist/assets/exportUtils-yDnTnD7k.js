import{aR as T,bf as D,aN as O,aP as L,bg as N,bh as _}from"./index-CKzVDbUq.js";import{g as E}from"./labels-5NZmLU7q.js";const c=(t,e,o)=>{const n=new Blob([t],{type:o}),a=URL.createObjectURL(n),i=document.createElement("a");i.href=a,i.download=e,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(a)},p=t=>t.toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_+|_+$/g,""),v=(t,e=[])=>{var o,n,a;return E((t==null?void 0:t.labelProfileId)||((o=e[0])==null?void 0:o.labelProfileId)||((a=(n=e[0])==null?void 0:n.config)==null?void 0:a.labelProfileId))},y=(t,e)=>{var o;return E(t.labelProfileId||((o=t.config)==null?void 0:o.labelProfileId)||(e==null?void 0:e.labelProfileId))},m=t=>O(t).map(L),b=t=>T(t).map(D),A="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Public+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700;800&display=swap",w=N(_),g=t=>typeof window>"u"||typeof document>"u"?w[t]:window.getComputedStyle(document.documentElement).getPropertyValue(t).trim()||w[t],k=()=>`
:root {
  --export-font-ui: ${g("--font-sans")};
  --export-font-display: ${g("--font-display")};
  --export-font-label: ${g("--font-label")};
  --export-font-mono: ${g("--font-mono")};
  --export-font-weight-semibold: ${g("--font-weight-semibold")};
  --export-font-weight-bold: ${g("--font-weight-bold")};
  --export-font-weight-display: ${g("--font-weight-display")};
}
body { font-family: var(--export-font-ui); max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; background: #f4f4f5; line-height: 1.6; }
.page { background: white; padding: 60px; box-shadow: 0 0 15px rgba(0,0,0,0.1); margin-bottom: 30px; border-radius: 4px; }
.header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
.stamp { border: 3px solid #b91c1c; color: #b91c1c; padding: 5px 15px; font-family: var(--export-font-label); font-weight: var(--export-font-weight-bold); font-size: 20px; letter-spacing: 0.18em; transform: rotate(-2deg); display: inline-block; text-transform: uppercase; }
h1 { text-transform: uppercase; font-family: var(--export-font-display); font-size: 28px; margin: 0 0 10px 0; letter-spacing: 0.08em; font-weight: var(--export-font-weight-display); }
h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; color: #444; font-family: var(--export-font-label); font-weight: var(--export-font-weight-bold); letter-spacing: 0.14em; }
h3 { font-family: var(--export-font-ui); font-size: 16px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-left: 4px solid #0f172a; font-weight: var(--export-font-weight-semibold); }
.meta { font-size: 12px; color: #64748b; margin-bottom: 30px; font-family: var(--export-font-mono); }
.report-section { margin-bottom: 50px; }
.entity-tag { display: inline-block; background: #f1f5f9; padding: 4px 8px; margin: 2px; font-family: var(--export-font-ui); font-size: 11px; border-radius: 4px; font-weight: var(--export-font-weight-semibold); border: 1px solid #e2e8f0; }
.entity-tag.person { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
.entity-tag.org { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
.source-link { display: block; font-family: var(--export-font-ui); font-size: 12px; color: #2563eb; text-decoration: none; margin-bottom: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.footer { margin-top: 50px; font-family: var(--export-font-label); font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; text-transform: uppercase; letter-spacing: 0.14em; }
.stat-box { flex: 1; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center; }
.stat-number { font-family: var(--export-font-display); font-weight: var(--export-font-weight-display); font-size: 32px; margin-bottom: 5px; color: #0f172a; }
.stat-label { font-family: var(--export-font-label); font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: var(--export-font-weight-bold); letter-spacing: 0.14em; }
strong { font-weight: var(--export-font-weight-bold); }
@media print {
  body { background: white; padding: 0; margin: 0; }
  .page { box-shadow: none; padding: 40px; margin: 0; border: none; width: 100%; border-radius: 0; }
  .no-print { display: none; }
  .page-break { page-break-before: always; }
}
`,U=(t,e)=>{const o=v(t,e),n={workspace:t,artifacts:e,exportedAt:new Date().toISOString()};c(JSON.stringify(n,null,2),`${p(o.workspaceLabel)}_${t.id}_DATA.json`,"application/json")},R=t=>{const e=y(t),o={artifact:t,exportedAt:new Date().toISOString()};c(JSON.stringify(o,null,2),`${p(e.artifactLabel)}_${t.id||"unknown"}_DATA.json`,"application/json")},F=(t,e)=>{const o=v(t,e),n=p(o.workspaceLabel),a=p(o.artifactLabel),i=new Set,f=new Set,s=new Set;e.forEach(l=>{(l.entities||[]).forEach(d=>{const r=typeof d=="string"?d:d.name,S=typeof d=="string"?"UNKNOWN":d.type;s.add(r),S==="PERSON"&&i.add(r),S==="ORGANIZATION"&&f.add(r)})});const u=e.flatMap(l=>l.sources||[]),x=Array.from(s).map(l=>{let d="entity-tag",r="";return i.has(l)?(d+=" person",r="[P] "):f.has(l)&&(d+=" org",r="[O] "),`<span class="${d}">${r}${l}</span>`}).join(""),h=e.map((l,d)=>`
    <div class="page page-break">
      <div class="report-section">
        <h3>${o.artifactLabel.toUpperCase()} #${d+1}: ${l.topic}</h3>
        <div class="meta">DATE: ${l.dateStr||"Unknown"} | ${a} ID: ${l.id||"N/A"}</div>

        <div style="margin-bottom: 20px;">
          <strong>Summary:</strong><br/>
          ${l.summary}
        </div>

        ${b(l).length>0?`
        <div style="margin-bottom: 20px;">
          <strong>Key Findings:</strong>
          <ul>
            ${b(l).map(r=>`<li>${r}</li>`).join("")}
          </ul>
        </div>`:""}

        ${m(l).length>0?`
        <div style="margin-bottom: 20px;">
          <strong>${o.followUpLabel}:</strong>
          <ul>
            ${m(l).map(r=>`<li>${r}</li>`).join("")}
          </ul>
        </div>`:""}

        ${l.sources&&l.sources.length>0?`
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #ccc;">
          <strong>Source Evidence:</strong>
          ${l.sources.map(r=>`<a href="${r.url}" class="source-link" target="_blank">[LINK] ${r.title}</a>`).join("")}
        </div>`:""}
      </div>
    </div>
  `).join(""),$=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${n}: ${t.title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="${A}" rel="stylesheet" />
      <style>${k()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${t.title}</h1>
            <div class="meta">
              ${n} ID: ${t.id}<br/>
              INITIATED: ${t.dateOpened}<br/>
              STATUS: ${t.status}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Overview</h2>
        <p>${t.description||"No description provided."}</p>

        <div style="display: flex; gap: 20px; margin-top: 30px;">
          <div class="stat-box">
            <div class="stat-number">${e.length}</div>
            <div class="stat-label">${o.artifactLabelPlural}</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${s.size}</div>
            <div class="stat-label">Identified Entities</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${u.length}</div>
            <div class="stat-label">Verified Sources</div>
          </div>
        </div>

        <h2>Entity Index</h2>
        <div>${x}</div>
      </div>

      ${h}

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;c($,`${n}_${t.id}_DOSSIER.html`,"text/html")},M=(t,e)=>{const o=y(t,e),n=p(o.workspaceLabel),a=p(o.artifactLabel),i=(t.entities||[]).map(s=>{const u=typeof s=="string"?s:s.name,x=typeof s=="string"?"UNKNOWN":s.type;let h="entity-tag",$="";return x==="PERSON"?(h+=" person",$="[P] "):x==="ORGANIZATION"&&(h+=" org",$="[O] "),`<span class="${h}">${$}${u}</span>`}).join(""),f=`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${a}: ${t.topic}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="${A}" rel="stylesheet" />
      <style>${k()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${t.topic}</h1>
            <div class="meta">
              ${e?`${n}: ${e.title}<br/>`:""}
              DATE: ${t.dateStr||"Unknown"}<br/>
              ${a} ID: ${t.id||"N/A"}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Summary</h2>
        <p>${t.summary}</p>

        ${b(t).length>0?`
        <h2>Key Findings</h2>
        <ul>
          ${b(t).map(s=>`<li>${s}</li>`).join("")}
        </ul>`:""}

        ${m(t).length>0?`
        <h2>${o.followUpLabel}</h2>
        <ul>
          ${m(t).map(s=>`<li>${s}</li>`).join("")}
        </ul>`:""}

        <h2>Identified Entities</h2>
        <div>${i||"<em>No entities detected.</em>"}</div>

        ${t.sources&&t.sources.length>0?`
        <h2>Source Evidence</h2>
        <div>
          ${t.sources.map(s=>`<a href="${s.url}" class="source-link" target="_blank">[LINK] ${s.title}</a>`).join("")}
        </div>`:""}
      </div>

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;c(f,`${a}_${t.id||"unknown"}_DOSSIER.html`,"text/html")},I=(t,e,o)=>{var a;const n=p(e.artifactLabel);return`
### ${o!==void 0?`${n} #${o+1}: `:""}${t.topic}
**Date:** ${t.dateStr||"Unknown"} | **${n} ID:** ${t.id||"N/A"}

#### Executive Summary
${t.summary}

${b(t).length?`#### Key Findings
${b(t).map(i=>`- ${i}`).join(`
`)}`:""}

${m(t).length?`#### ${e.followUpLabel}
${m(t).map(i=>`- ${i}`).join(`
`)}`:""}

#### Entities Detected
${(t.entities||[]).map(i=>`\`${typeof i=="string"?i:i.name}\` (${typeof i=="string"?"UNKNOWN":i.type})`).join(", ")||"*No entities detected.*"}

${(a=t.sources)!=null&&a.length?`#### Sources
${t.sources.map(i=>`- [${i.title}](${i.url})`).join(`
`)}`:""}

---
`},z=(t,e)=>{const o=v(t,e),n=p(o.workspaceLabel),a=`
# ${n} DOSSIER: ${t.title}
**${n} ID:** ${t.id}
**Initiated:** ${t.dateOpened}
**Status:** ${t.status}

## Executive Overview
${t.description||"No description provided."}

## ${o.artifactLabelPlural}
${e.map((i,f)=>I(i,o,f)).join(`
`)}

---
*Generated by Sherlock on ${new Date().toLocaleDateString()}*
`;c(a.trim(),`${n}_${t.id}_DOSSIER.md`,"text/markdown")},H=t=>{const e=y(t),o=p(e.artifactLabel),n=`
# ${o}: ${t.topic}

${I(t,e)}

*Generated by Sherlock on ${new Date().toLocaleDateString()}*
`;c(n.trim(),`${o}_${t.id||"unknown"}_DOSSIER.md`,"text/markdown")},P=t=>{var n;const e=t.role==="assistant"?"Sherlock":t.role==="user"?"User":t.role==="system"?"System":"Tool",o=(n=t.citations)!=null&&n.length?`

Citations: ${t.citations.join(", ")}`:"";return`## ${e}

${t.content}${o}`},K=(t,e,o)=>{const n={session:t,workspace:o,messages:e,exportedAt:new Date().toISOString()};c(JSON.stringify(n,null,2),`CHAT_SESSION_${t.id}_DATA.json`,"application/json")},G=(t,e,o)=>{const n=`
# Chat Session: ${t.title}

${o?`**Workspace:** ${o.title}
`:""}**Session ID:** ${t.id}
**Status:** ${t.status}

${e.map(a=>P(a)).join(`

---

`)}

---
*Generated by Sherlock on ${new Date().toLocaleDateString()}*
`;c(n.trim(),`CHAT_SESSION_${t.id}.md`,"text/markdown")};export{U as a,F as b,M as c,H as d,z as e,R as f,G as g,K as h};
