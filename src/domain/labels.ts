import type { LabelProfile } from '../types';

export const LABEL_PROFILES: LabelProfile[] = [
  {
    id: 'investigation',
    workspaceLabel: 'Case',
    workspaceLabelPlural: 'Cases',
    artifactLabel: 'Report',
    artifactLabelPlural: 'Reports',
    detailViewLabel: 'Operation View',
    followUpLabel: 'Investigative Leads',
    anomalyLabel: 'Anomalies',
    signalLabel: 'Signals',
    archiveLabel: 'Case Files',
  },
  {
    id: 'research',
    workspaceLabel: 'Project',
    workspaceLabelPlural: 'Projects',
    artifactLabel: 'Artifact',
    artifactLabelPlural: 'Artifacts',
    detailViewLabel: 'Research Workspace',
    followUpLabel: 'Follow-up Questions',
    anomalyLabel: 'Key Findings',
    signalLabel: 'Sources',
    archiveLabel: 'Project Archive',
  },
  {
    id: 'monitoring',
    workspaceLabel: 'Monitor',
    workspaceLabelPlural: 'Monitors',
    artifactLabel: 'Brief',
    artifactLabelPlural: 'Briefs',
    detailViewLabel: 'Monitor Workspace',
    followUpLabel: 'Next Steps',
    anomalyLabel: 'Notable Developments',
    signalLabel: 'Signals',
    archiveLabel: 'Monitor Archive',
  },
  {
    id: 'briefing',
    workspaceLabel: 'Workspace',
    workspaceLabelPlural: 'Workspaces',
    artifactLabel: 'Briefing',
    artifactLabelPlural: 'Briefings',
    detailViewLabel: 'Briefing View',
    followUpLabel: 'Recommendations',
    anomalyLabel: 'Highlights',
    signalLabel: 'Sources',
    archiveLabel: 'Briefing Archive',
  },
];

const DEFAULT_LABEL_PROFILE = LABEL_PROFILES[0];

export const getLabelProfileById = (id?: string): LabelProfile => {
  return LABEL_PROFILES.find((profile) => profile.id === id) || DEFAULT_LABEL_PROFILE;
};
