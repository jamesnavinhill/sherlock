/**
 * Export utilities for Sherlock AI.
 * Provides pack-aware workspace and artifact exports in JSON, HTML, and Markdown.
 */

import type { Workspace, ChatMessage, ChatSession, Artifact, LabelProfile } from '../types';
import { getLabelProfileById } from '../domain';

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const normalizeLabelToken = (label: string) =>
  label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getWorkspaceLabelProfile = (caseObj?: Workspace, reports: Artifact[] = []): LabelProfile => {
  return getLabelProfileById(
    caseObj?.labelProfileId || reports[0]?.labelProfileId || reports[0]?.config?.labelProfileId
  );
};

const getArtifactLabelProfile = (report: Artifact, caseObj?: Workspace): LabelProfile => {
  return getLabelProfileById(
    report.labelProfileId || report.config?.labelProfileId || caseObj?.labelProfileId
  );
};

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

export const exportCaseAsJson = (caseObj: Workspace, reports: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(caseObj, reports);
  const data = {
    case: caseObj,
    reports,
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${normalizeLabelToken(labelProfile.workspaceLabel)}_${caseObj.id}_DATA.json`,
    'application/json'
  );
};

export const exportReportAsJson = (report: Artifact) => {
  const labelProfile = getArtifactLabelProfile(report);
  const data = {
    report,
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${normalizeLabelToken(labelProfile.artifactLabel)}_${report.id || 'unknown'}_DATA.json`,
    'application/json'
  );
};

export const exportCaseAsHtml = (caseObj: Workspace, reports: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(caseObj, reports);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  const people = new Set<string>();
  const organizations = new Set<string>();
  const allEntityNames = new Set<string>();

  reports.forEach((report) => {
    (report.entities || []).forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      allEntityNames.add(name);
      if (type === 'PERSON') people.add(name);
      if (type === 'ORGANIZATION') organizations.add(name);
    });
  });

  const allSources = reports.flatMap((report) => report.sources || []);

  const entityTagsHtml = Array.from(allEntityNames)
    .map((entityName) => {
      let className = 'entity-tag';
      let prefix = '';
      if (people.has(entityName)) {
        className += ' person';
        prefix = '[P] ';
      } else if (organizations.has(entityName)) {
        className += ' org';
        prefix = '[O] ';
      }
      return `<span class="${className}">${prefix}${entityName}</span>`;
    })
    .join('');

  const reportsHtml = reports
    .map(
      (report, idx) => `
    <div class="page page-break">
      <div class="report-section">
        <h3>${labelProfile.artifactLabel.toUpperCase()} #${idx + 1}: ${report.topic}</h3>
        <div class="meta">DATE: ${report.dateStr || 'Unknown'} | ${artifactToken} ID: ${report.id || 'N/A'}</div>

        <div style="margin-bottom: 20px;">
          <strong>Summary:</strong><br/>
          ${report.summary}
        </div>

        ${
          report.agendas && report.agendas.length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <strong>Key Findings:</strong>
          <ul>
            ${report.agendas.map((agenda) => `<li>${agenda}</li>`).join('')}
          </ul>
        </div>`
            : ''
        }

        ${
          report.leads && report.leads.length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <strong>${labelProfile.followUpLabel}:</strong>
          <ul>
            ${report.leads.map((lead) => `<li>${lead}</li>`).join('')}
          </ul>
        </div>`
            : ''
        }

        ${
          report.sources && report.sources.length > 0
            ? `
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #ccc;">
          <strong>Source Evidence:</strong>
          ${report.sources.map((source) => `<a href="${source.url}" class="source-link" target="_blank">[LINK] ${source.title}</a>`).join('')}
        </div>`
            : ''
        }
      </div>
    </div>
  `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${workspaceToken}: ${caseObj.title}</title>
      <style>${HTML_STYLES}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${caseObj.title}</h1>
            <div class="meta">
              ${workspaceToken} ID: ${caseObj.id}<br/>
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
            <div class="stat-label">${labelProfile.artifactLabelPlural}</div>
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

  downloadFile(htmlContent, `${workspaceToken}_${caseObj.id}_DOSSIER.html`, 'text/html');
};

export const exportReportAsHtml = (report: Artifact, caseObj?: Workspace) => {
  const labelProfile = getArtifactLabelProfile(report, caseObj);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  const entityTagsHtml = (report.entities || [])
    .map((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      let className = 'entity-tag';
      let prefix = '';
      if (type === 'PERSON') {
        className += ' person';
        prefix = '[P] ';
      } else if (type === 'ORGANIZATION') {
        className += ' org';
        prefix = '[O] ';
      }
      return `<span class="${className}">${prefix}${name}</span>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${artifactToken}: ${report.topic}</title>
      <style>${HTML_STYLES}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${report.topic}</h1>
            <div class="meta">
              ${caseObj ? `${workspaceToken}: ${caseObj.title}<br/>` : ''}
              DATE: ${report.dateStr || 'Unknown'}<br/>
              ${artifactToken} ID: ${report.id || 'N/A'}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Summary</h2>
        <p>${report.summary}</p>

        ${
          report.agendas && report.agendas.length > 0
            ? `
        <h2>Key Findings</h2>
        <ul>
          ${report.agendas.map((agenda) => `<li>${agenda}</li>`).join('')}
        </ul>`
            : ''
        }

        ${
          report.leads && report.leads.length > 0
            ? `
        <h2>${labelProfile.followUpLabel}</h2>
        <ul>
          ${report.leads.map((lead) => `<li>${lead}</li>`).join('')}
        </ul>`
            : ''
        }

        <h2>Identified Entities</h2>
        <div>${entityTagsHtml || '<em>No entities detected.</em>'}</div>

        ${
          report.sources && report.sources.length > 0
            ? `
        <h2>Source Evidence</h2>
        <div>
          ${report.sources.map((source) => `<a href="${source.url}" class="source-link" target="_blank">[LINK] ${source.title}</a>`).join('')}
        </div>`
            : ''
        }
      </div>

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, `${artifactToken}_${report.id || 'unknown'}_DOSSIER.html`, 'text/html');
};

const formatReportMarkdown = (report: Artifact, labelProfile: LabelProfile, idx?: number) => {
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  return `
### ${idx !== undefined ? `${artifactToken} #${idx + 1}: ` : ''}${report.topic}
**Date:** ${report.dateStr || 'Unknown'} | **${artifactToken} ID:** ${report.id || 'N/A'}

#### Executive Summary
${report.summary}

${
  report.agendas?.length
    ? `#### Key Findings
${report.agendas.map((agenda) => `- ${agenda}`).join('\n')}`
    : ''
}

${
  report.leads?.length
    ? `#### ${labelProfile.followUpLabel}
${report.leads.map((lead) => `- ${lead}`).join('\n')}`
    : ''
}

#### Entities Detected
${(report.entities || []).map((entity) => `\`${typeof entity === 'string' ? entity : entity.name}\` (${typeof entity === 'string' ? 'UNKNOWN' : entity.type})`).join(', ') || '*No entities detected.*'}

${
  report.sources?.length
    ? `#### Sources
${report.sources.map((source) => `- [${source.title}](${source.url})`).join('\n')}`
    : ''
}

---
`;
};

export const exportCaseAsMarkdown = (caseObj: Workspace, reports: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(caseObj, reports);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const markdownContent = `
# ${workspaceToken} DOSSIER: ${caseObj.title}
**${workspaceToken} ID:** ${caseObj.id}
**Initiated:** ${caseObj.dateOpened}
**Status:** ${caseObj.status}

## Executive Overview
${caseObj.description || 'No description provided.'}

## ${labelProfile.artifactLabelPlural}
${reports.map((report, idx) => formatReportMarkdown(report, labelProfile, idx)).join('\n')}

---
*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(
    markdownContent.trim(),
    `${workspaceToken}_${caseObj.id}_DOSSIER.md`,
    'text/markdown'
  );
};

export const exportReportAsMarkdown = (report: Artifact) => {
  const labelProfile = getArtifactLabelProfile(report);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);
  const markdownContent = `
# ${artifactToken}: ${report.topic}

${formatReportMarkdown(report, labelProfile)}

*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(
    markdownContent.trim(),
    `${artifactToken}_${report.id || 'unknown'}_DOSSIER.md`,
    'text/markdown'
  );
};

const formatChatMessageMarkdown = (message: ChatMessage) => {
  const heading =
    message.role === 'assistant'
      ? 'Assistant'
      : message.role === 'user'
        ? 'User'
        : message.role === 'system'
          ? 'System'
          : 'Tool';
  const citations = message.citations?.length
    ? `\n\nCitations: ${message.citations.join(', ')}`
    : '';

  return `## ${heading}\n\n${message.content}${citations}`;
};

export const exportChatSessionAsJson = (
  session: ChatSession,
  messages: ChatMessage[],
  workspace?: Workspace
) => {
  const data = {
    session,
    workspace,
    messages,
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `CHAT_SESSION_${session.id}_DATA.json`,
    'application/json'
  );
};

export const exportChatSessionAsMarkdown = (
  session: ChatSession,
  messages: ChatMessage[],
  workspace?: Workspace
) => {
  const markdownContent = `
# Chat Session: ${session.title}

${workspace ? `**Workspace:** ${workspace.title}\n` : ''}**Session ID:** ${session.id}
**Status:** ${session.status}

${messages.map((message) => formatChatMessageMarkdown(message)).join('\n\n---\n\n')}

---
*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(markdownContent.trim(), `CHAT_SESSION_${session.id}.md`, 'text/markdown');
};
