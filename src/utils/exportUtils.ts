/**
 * Export utilities for Sherlock AI.
 * Provides pack-aware workspace and artifact exports in JSON, HTML, and Markdown.
 */

import type { Workspace, ChatMessage, ChatSession, Artifact, LabelProfile } from '../types';
import {
  getArtifactFollowUps,
  getArtifactKeyFindings,
  getFollowUpText,
  getKeyFindingText,
  getLabelProfileById,
} from '../domain';
import { buildThemeFontCssVars, DEFAULT_THEME_FONT_SETTINGS } from './themeFonts';

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

const getWorkspaceLabelProfile = (
  workspace?: Workspace,
  artifacts: Artifact[] = []
): LabelProfile => {
  return getLabelProfileById(
    workspace?.labelProfileId ||
      artifacts[0]?.labelProfileId ||
      artifacts[0]?.config?.labelProfileId
  );
};

const getArtifactLabelProfile = (artifact: Artifact, workspace?: Workspace): LabelProfile => {
  return getLabelProfileById(
    artifact.labelProfileId || artifact.config?.labelProfileId || workspace?.labelProfileId
  );
};

const getExportFollowUps = (artifact: Artifact) =>
  getArtifactFollowUps(artifact).map(getFollowUpText);

const getExportKeyFindings = (artifact: Artifact) =>
  getArtifactKeyFindings(artifact).map(getKeyFindingText);

const GOOGLE_FONTS_STYLESHEET_HREF =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Public+Sans:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Work+Sans:wght@400;500;600;700;800&display=swap';

const DEFAULT_EXPORT_FONT_VARS = buildThemeFontCssVars(DEFAULT_THEME_FONT_SETTINGS);

const getExportFontVar = (name: keyof typeof DEFAULT_EXPORT_FONT_VARS) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return DEFAULT_EXPORT_FONT_VARS[name];
  }

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || DEFAULT_EXPORT_FONT_VARS[name];
};

const buildExportHtmlStyles = () => `
:root {
  --export-font-ui: ${getExportFontVar('--font-sans')};
  --export-font-display: ${getExportFontVar('--font-display')};
  --export-font-label: ${getExportFontVar('--font-label')};
  --export-font-mono: ${getExportFontVar('--font-mono')};
  --export-font-weight-semibold: ${getExportFontVar('--font-weight-semibold')};
  --export-font-weight-bold: ${getExportFontVar('--font-weight-bold')};
  --export-font-weight-display: ${getExportFontVar('--font-weight-display')};
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
`;

export const exportWorkspaceAsJson = (workspace: Workspace, artifacts: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(workspace, artifacts);
  const data = {
    workspace,
    artifacts,
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${normalizeLabelToken(labelProfile.workspaceLabel)}_${workspace.id}_DATA.json`,
    'application/json'
  );
};

export const exportArtifactAsJson = (artifact: Artifact) => {
  const labelProfile = getArtifactLabelProfile(artifact);
  const data = {
    artifact,
    exportedAt: new Date().toISOString(),
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${normalizeLabelToken(labelProfile.artifactLabel)}_${artifact.id || 'unknown'}_DATA.json`,
    'application/json'
  );
};

export const exportWorkspaceAsHtml = (workspace: Workspace, artifacts: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(workspace, artifacts);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  const people = new Set<string>();
  const organizations = new Set<string>();
  const allEntityNames = new Set<string>();

  artifacts.forEach((artifact) => {
    (artifact.entities || []).forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      allEntityNames.add(name);
      if (type === 'PERSON') people.add(name);
      if (type === 'ORGANIZATION') organizations.add(name);
    });
  });

  const allSources = artifacts.flatMap((artifact) => artifact.sources || []);

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

  const artifactsHtml = artifacts
    .map(
      (artifact, idx) => `
    <div class="page page-break">
      <div class="report-section">
        <h3>${labelProfile.artifactLabel.toUpperCase()} #${idx + 1}: ${artifact.topic}</h3>
        <div class="meta">DATE: ${artifact.dateStr || 'Unknown'} | ${artifactToken} ID: ${artifact.id || 'N/A'}</div>

        <div style="margin-bottom: 20px;">
          <strong>Summary:</strong><br/>
          ${artifact.summary}
        </div>

        ${
          getExportKeyFindings(artifact).length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <strong>Key Findings:</strong>
          <ul>
            ${getExportKeyFindings(artifact).map((finding) => `<li>${finding}</li>`).join('')}
          </ul>
        </div>`
            : ''
        }

        ${
          getExportFollowUps(artifact).length > 0
            ? `
        <div style="margin-bottom: 20px;">
          <strong>${labelProfile.followUpLabel}:</strong>
          <ul>
            ${getExportFollowUps(artifact).map((followUp) => `<li>${followUp}</li>`).join('')}
          </ul>
        </div>`
            : ''
        }

        ${
          artifact.sources && artifact.sources.length > 0
            ? `
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px dashed #ccc;">
          <strong>Source Evidence:</strong>
          ${artifact.sources.map((source) => `<a href="${source.url}" class="source-link" target="_blank">[LINK] ${source.title}</a>`).join('')}
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
      <title>${workspaceToken}: ${workspace.title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="${GOOGLE_FONTS_STYLESHEET_HREF}" rel="stylesheet" />
      <style>${buildExportHtmlStyles()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${workspace.title}</h1>
            <div class="meta">
              ${workspaceToken} ID: ${workspace.id}<br/>
              INITIATED: ${workspace.dateOpened}<br/>
              STATUS: ${workspace.status}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Overview</h2>
        <p>${workspace.description || 'No description provided.'}</p>

        <div style="display: flex; gap: 20px; margin-top: 30px;">
          <div class="stat-box">
            <div class="stat-number">${artifacts.length}</div>
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

      ${artifactsHtml}

      <div class="footer">
        GENERATED BY SHERLOCK AI // ${new Date().toLocaleDateString()} // CLASSIFIED
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, `${workspaceToken}_${workspace.id}_DOSSIER.html`, 'text/html');
};

export const exportArtifactAsHtml = (artifact: Artifact, workspace?: Workspace) => {
  const labelProfile = getArtifactLabelProfile(artifact, workspace);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  const entityTagsHtml = (artifact.entities || [])
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
      <title>${artifactToken}: ${artifact.topic}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="${GOOGLE_FONTS_STYLESHEET_HREF}" rel="stylesheet" />
      <style>${buildExportHtmlStyles()}</style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div>
            <h1>${artifact.topic}</h1>
            <div class="meta">
              ${workspace ? `${workspaceToken}: ${workspace.title}<br/>` : ''}
              DATE: ${artifact.dateStr || 'Unknown'}<br/>
              ${artifactToken} ID: ${artifact.id || 'N/A'}
            </div>
          </div>
          <div class="stamp">Sherlock Confidential</div>
        </div>

        <h2>Executive Summary</h2>
        <p>${artifact.summary}</p>

        ${
          getExportKeyFindings(artifact).length > 0
            ? `
        <h2>Key Findings</h2>
        <ul>
          ${getExportKeyFindings(artifact).map((finding) => `<li>${finding}</li>`).join('')}
        </ul>`
            : ''
        }

        ${
          getExportFollowUps(artifact).length > 0
            ? `
        <h2>${labelProfile.followUpLabel}</h2>
        <ul>
          ${getExportFollowUps(artifact).map((followUp) => `<li>${followUp}</li>`).join('')}
        </ul>`
            : ''
        }

        <h2>Identified Entities</h2>
        <div>${entityTagsHtml || '<em>No entities detected.</em>'}</div>

        ${
          artifact.sources && artifact.sources.length > 0
            ? `
        <h2>Source Evidence</h2>
        <div>
          ${artifact.sources.map((source) => `<a href="${source.url}" class="source-link" target="_blank">[LINK] ${source.title}</a>`).join('')}
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

  downloadFile(
    htmlContent,
    `${artifactToken}_${artifact.id || 'unknown'}_DOSSIER.html`,
    'text/html'
  );
};

const formatArtifactMarkdown = (artifact: Artifact, labelProfile: LabelProfile, idx?: number) => {
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);

  return `
### ${idx !== undefined ? `${artifactToken} #${idx + 1}: ` : ''}${artifact.topic}
**Date:** ${artifact.dateStr || 'Unknown'} | **${artifactToken} ID:** ${artifact.id || 'N/A'}

#### Executive Summary
${artifact.summary}

${
  getExportKeyFindings(artifact).length
    ? `#### Key Findings
${getExportKeyFindings(artifact).map((finding) => `- ${finding}`).join('\n')}`
    : ''
}

${
  getExportFollowUps(artifact).length
    ? `#### ${labelProfile.followUpLabel}
${getExportFollowUps(artifact).map((followUp) => `- ${followUp}`).join('\n')}`
    : ''
}

#### Entities Detected
${(artifact.entities || []).map((entity) => `\`${typeof entity === 'string' ? entity : entity.name}\` (${typeof entity === 'string' ? 'UNKNOWN' : entity.type})`).join(', ') || '*No entities detected.*'}

${
  artifact.sources?.length
    ? `#### Sources
${artifact.sources.map((source) => `- [${source.title}](${source.url})`).join('\n')}`
    : ''
}

---
`;
};

export const exportWorkspaceAsMarkdown = (workspace: Workspace, artifacts: Artifact[]) => {
  const labelProfile = getWorkspaceLabelProfile(workspace, artifacts);
  const workspaceToken = normalizeLabelToken(labelProfile.workspaceLabel);
  const markdownContent = `
# ${workspaceToken} DOSSIER: ${workspace.title}
**${workspaceToken} ID:** ${workspace.id}
**Initiated:** ${workspace.dateOpened}
**Status:** ${workspace.status}

## Executive Overview
${workspace.description || 'No description provided.'}

## ${labelProfile.artifactLabelPlural}
${artifacts.map((artifact, idx) => formatArtifactMarkdown(artifact, labelProfile, idx)).join('\n')}

---
*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(
    markdownContent.trim(),
    `${workspaceToken}_${workspace.id}_DOSSIER.md`,
    'text/markdown'
  );
};

export const exportArtifactAsMarkdown = (artifact: Artifact) => {
  const labelProfile = getArtifactLabelProfile(artifact);
  const artifactToken = normalizeLabelToken(labelProfile.artifactLabel);
  const markdownContent = `
# ${artifactToken}: ${artifact.topic}

${formatArtifactMarkdown(artifact, labelProfile)}

*Generated by Sherlock AI on ${new Date().toLocaleDateString()}*
`;

  downloadFile(
    markdownContent.trim(),
    `${artifactToken}_${artifact.id || 'unknown'}_DOSSIER.md`,
    'text/markdown'
  );
};

const formatChatMessageMarkdown = (message: ChatMessage) => {
  const heading =
    message.role === 'assistant'
      ? 'Sherlock'
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
