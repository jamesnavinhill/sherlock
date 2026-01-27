/**
 * Export Utilities for Sherlock OSINT Platform
 * Provides functions for exporting cases and reports as JSON or styled HTML
 */

import { Case, InvestigationReport, Entity, Source } from '../types';

// ============================================================================
// CORE DOWNLOAD HELPER
// ============================================================================

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ============================================================================
// JSON EXPORTS
// ============================================================================

/**
 * Export a full case with all reports as JSON
 */
export const exportCaseAsJson = (caseObj: Case, reports: InvestigationReport[]) => {
  const data = {
    case: caseObj,
    reports: reports,
    exportedAt: new Date().toISOString()
  };
  downloadFile(JSON.stringify(data, null, 2), `CASE_${caseObj.id}_DATA.json`, 'application/json');
};

/**
 * Export a single report as JSON
 */
export const exportReportAsJson = (report: InvestigationReport) => {
  const data = {
    report: report,
    exportedAt: new Date().toISOString()
  };
  downloadFile(JSON.stringify(data, null, 2), `REPORT_${report.id || 'unknown'}_DATA.json`, 'application/json');
};

// ============================================================================
// HTML EXPORTS
// ============================================================================

const HTML_STYLES = `
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; background: #f4f4f5; line-height: 1.6; }
.page { background: white; padding: 60px; box-shadow: 0 0 15px rgba(0,0,0,0.1); margin-bottom: 30px; border-radius: 4px; }
.header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
.stamp { border: 3px solid #b91c1c; color: #b91c1c; padding: 5px 15px; font-weight: bold; font-size: 20px; transform: rotate(-2deg); display: inline-block; text-transform: uppercase; font-family: 'Courier New', Courier, monospace; }
h1 { text-transform: uppercase; font-size: 28px; margin: 0 0 10px 0; letter-spacing: 2px; font-weight: 800; }
h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; color: #444; font-weight: 700; }
h3 { font-size: 16px; margin-bottom: 15px; background: #f8fafc; padding: 10px; border-left: 4px solid #0f172a; font-weight: 700; }
.meta { font-size: 12px; color: #64748b; margin-bottom: 30px; font-family: 'Courier New', Courier, monospace; }
.report-section { margin-bottom: 50px; }
.entity-tag { display: inline-block; background: #f1f5f9; padding: 4px 8px; margin: 2px; font-size: 11px; border-radius: 4px; font-weight: 500; border: 1px solid #e2e8f0; }
.entity-tag.person { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
.entity-tag.org { background: #faf5ff; color: #7e22ce; border-color: #f3e8ff; }
.source-link { display: block; font-size: 12px; color: #2563eb; text-decoration: none; margin-bottom: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; text-transform: uppercase; letter-spacing: 1px; }
.stat-box { flex: 1; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center; }
.stat-number { font-weight: 800; font-size: 32px; margin-bottom: 5px; color: #0f172a; }
.stat-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 1px; }
@media print {
  body { background: white; padding: 0; margin: 0; }
  .page { box-shadow: none; padding: 40px; margin: 0; border: none; width: 100%; border-radius: 0; }
  .no-print { display: none; }
  .page-break { page-break-before: always; }
}
`;

/**
 * Export a full case with all reports as styled HTML dossier
 */
export const exportCaseAsHtml = (caseObj: Case, reports: InvestigationReport[]) => {
  // Aggregate entities with type info
  const people = new Set<string>();
  const orgs = new Set<string>();
  const allEntityNames = new Set<string>();

  reports.forEach(r => {
    (r.entities || []).forEach(e => {
      const name = typeof e === 'string' ? e : e.name;
      const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
      allEntityNames.add(name);
      if (type === 'PERSON') people.add(name);
      if (type === 'ORGANIZATION') orgs.add(name);
    });
  });

  const allSources = reports.flatMap(r => r.sources || []);

  const entityTagsHtml = Array.from(allEntityNames).map(e => {
    let className = 'entity-tag';
    let prefix = '';
    if (people.has(e)) { className += ' person'; prefix = '[P] '; }
    else if (orgs.has(e)) { className += ' org'; prefix = '[O] '; }
    return `<span class="${className}">${prefix}${e}</span>`;
  }).join('');

  const reportsHtml = reports.map((report, idx) => `
    <div class="page page-break">
      <div class="report-section">
        <h3>REPORT #${idx + 1}: ${report.topic}</h3>
        <div class="meta">DATE: ${report.dateStr || 'Unknown'} | ID: ${report.id || 'N/A'}</div>
        
        <div style="margin-bottom: 20px;">
          <strong>Summary:</strong><br/>
          ${report.summary}
        </div>

        ${report.agendas && report.agendas.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <strong>Key Findings:</strong>
          <ul>
            ${report.agendas.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>` : ''}

        ${report.leads && report.leads.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <strong>Investigative Leads:</strong>
          <ul>
            ${report.leads.map(l => `<li>${l}</li>`).join('')}
          </ul>
        </div>` : ''}
        
        ${report.sources && report.sources.length > 0 ? `
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #ccc;">
          <strong>Source Evidence:</strong>
          ${report.sources.map(s => `<a href="${s.url}" class="source-link" target="_blank">[LINK] ${s.title}</a>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>DOSSIER: ${caseObj.title}</title>
      <style>${HTML_STYLES}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${caseObj.title}</h1>
            <div class="meta">
              CASE ID: ${caseObj.id}<br/>
              INITIATED: ${caseObj.dateOpened}<br/>
              STATUS: ${caseObj.status}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Overview</h2>
        <p>${caseObj.description || 'No description provided.'}</p>
        
        <div style="display: flex; gap: 20px; margin-top: 30px;">
          <div class="stat-box">
            <div class="stat-number">${reports.length}</div>
            <div class="stat-label">Intelligence Reports</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${allEntityNames.size}</div>
            <div class="stat-label">Identified Entities</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">${allSources.length}</div>
            <div class="stat-label">Verified Sources</div>
          </div>
        </div>

        <h2>Entity Index</h2>
        <div>${entityTagsHtml}</div>
      </div>

      ${reportsHtml}

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, `CASE_${caseObj.id}_DOSSIER.html`, 'text/html');
};

/**
 * Export a single report as styled HTML
 */
export const exportReportAsHtml = (report: InvestigationReport, caseObj?: Case) => {
  const entityTagsHtml = (report.entities || []).map(e => {
    const name = typeof e === 'string' ? e : e.name;
    const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
    let className = 'entity-tag';
    let prefix = '';
    if (type === 'PERSON') { className += ' person'; prefix = '[P] '; }
    else if (type === 'ORGANIZATION') { className += ' org'; prefix = '[O] '; }
    return `<span class="${className}">${prefix}${name}</span>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>REPORT: ${report.topic}</title>
      <style>${HTML_STYLES}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${report.topic}</h1>
            <div class="meta">
              ${caseObj ? `CASE: ${caseObj.title}<br/>` : ''}
              DATE: ${report.dateStr || 'Unknown'}<br/>
              REPORT ID: ${report.id || 'N/A'}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Summary</h2>
        <p>${report.summary}</p>

        ${report.agendas && report.agendas.length > 0 ? `
        <h2>Key Findings</h2>
        <ul>
          ${report.agendas.map(a => `<li>${a}</li>`).join('')}
        </ul>` : ''}

        ${report.leads && report.leads.length > 0 ? `
        <h2>Investigative Leads</h2>
        <ul>
          ${report.leads.map(l => `<li>${l}</li>`).join('')}
        </ul>` : ''}

        <h2>Identified Entities</h2>
        <div>${entityTagsHtml || '<em>No entities detected.</em>'}</div>

        ${report.sources && report.sources.length > 0 ? `
        <h2>Source Evidence</h2>
        <div>
          ${report.sources.map(s => `<a href="${s.url}" class="source-link" target="_blank">[LINK] ${s.title}</a>`).join('')}
        </div>` : ''}
      </div>

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, `REPORT_${report.id || 'unknown'}_DOSSIER.html`, 'text/html');
};

// ============================================================================
// MARKDOWN EXPORTS
// ============================================================================

const formatReportMarkdown = (report: InvestigationReport, idx?: number) => {
  return `
### ${idx !== undefined ? `REPORT #${idx + 1}: ` : ''}${report.topic}
**Date:** ${report.dateStr || 'Unknown'} | **ID:** ${report.id || 'N/A'}

#### Executive Summary
${report.summary}

${report.agendas?.length ? `#### Key Findings
${report.agendas.map(a => `- ${a}`).join('\n')}` : ''}

${report.leads?.length ? `#### Investigative Leads
${report.leads.map(l => `- ${l}`).join('\n')}` : ''}

#### Entities Detected
${(report.entities || []).map(e => `\`${typeof e === 'string' ? e : e.name}\` (${typeof e === 'string' ? 'UNKNOWN' : e.type})`).join(', ') || '*No entities detected.*'}

${report.sources?.length ? `#### Sources
${report.sources.map(s => `- [${s.title}](${s.url})`).join('\n')}` : ''}

---
`;
};

/**
 * Export a full case with all reports as Markdown
 */
export const exportCaseAsMarkdown = (caseObj: Case, reports: InvestigationReport[]) => {
  const markdownContent = `
# CASE DOSSIER: ${caseObj.title}
**Case ID:** ${caseObj.id}
**Initiated:** ${caseObj.dateOpened}
**Status:** ${caseObj.status}

## Executive Overview
${caseObj.description || 'No description provided.'}

## Investigation Activity
${reports.map((r, i) => formatReportMarkdown(r, i)).join('\n')}

---
*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(markdownContent.trim(), `CASE_${caseObj.id}_DOSSIER.md`, 'text/markdown');
};

/**
 * Export a single report as Markdown
 */
export const exportReportAsMarkdown = (report: InvestigationReport) => {
  const markdownContent = `
# REPORT: ${report.topic}

${formatReportMarkdown(report)}

*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(markdownContent.trim(), `REPORT_${report.id || 'unknown'}_DOSSIER.md`, 'text/markdown');
};
