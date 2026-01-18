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
body { font-family: 'Courier New', Courier, monospace; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; background: #f4f4f5; }
.page { background: white; padding: 60px; box-shadow: 0 0 15px rgba(0,0,0,0.1); margin-bottom: 30px; }
.header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
.stamp { border: 3px solid #b91c1c; color: #b91c1c; padding: 5px 15px; font-weight: bold; font-size: 20px; transform: rotate(-2deg); display: inline-block; text-transform: uppercase; }
h1 { text-transform: uppercase; font-size: 28px; margin: 0 0 10px 0; letter-spacing: 2px; }
h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; color: #444; }
h3 { font-size: 16px; margin-bottom: 5px; background: #eee; padding: 5px; border-left: 4px solid #333; }
.meta { font-size: 12px; color: #666; margin-bottom: 30px; }
.report-section { margin-bottom: 50px; }
.entity-tag { display: inline-block; background: #eee; padding: 2px 6px; margin: 2px; font-size: 12px; border-radius: 3px; }
.entity-tag.person { background: #e0f2fe; color: #0369a1; }
.entity-tag.org { background: #f3e8ff; color: #7e22ce; }
.source-link { display: block; font-size: 12px; color: #0000aa; text-decoration: none; margin-bottom: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.footer { margin-top: 50px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
.stat-box { flex: 1; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; }
.stat-number { font-weight: bold; font-size: 24px; margin-bottom: 5px; }
.stat-label { font-size: 10px; text-transform: uppercase; color: #666; }
@media print {
  body { background: white; padding: 0; }
  .page { box-shadow: none; padding: 0; margin: 0; }
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
