import type { PurposeProfile } from '../types';

export const PURPOSE_PROFILES: PurposeProfile[] = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    description: 'Investigate a topic thoroughly and surface risks, evidence, and follow-up work.',
    promptDirective:
      'Conduct a rigorous deep dive. Prioritize evidence-backed analysis, expose relevant risks, and generate actionable follow-up leads.',
    recommendedArtifactType: 'REPORT',
    defaultSectionKinds: ['EXECUTIVE_SUMMARY', 'ANOMALIES', 'LEADS', 'EVIDENCE'],
  },
  {
    id: 'latest-findings',
    name: 'Latest Findings',
    description: 'Summarize the most recent developments and important discoveries on a topic.',
    promptDirective:
      'Focus on the newest credible developments, summarize what changed, and capture the most important findings and open questions.',
    recommendedArtifactType: 'SYNTHESIS',
    defaultSectionKinds: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'IMPLICATIONS', 'NEXT_STEPS'],
  },
  {
    id: 'monitor',
    name: 'Monitor',
    description: 'Track an evolving topic and surface notable changes worth escalation.',
    promptDirective:
      'Monitor the topic for meaningful updates, emphasize fresh signals, and call out developments that deserve follow-up.',
    recommendedArtifactType: 'MONITOR_SNAPSHOT',
    defaultSectionKinds: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'TIMELINE', 'NEXT_STEPS'],
  },
  {
    id: 'trend-scan',
    name: 'Trend Scan',
    description: 'Scan for trends, patterns, market movement, or ecosystem changes.',
    promptDirective:
      'Identify the strongest directional trends, notable actors, and strategic implications across the topic landscape.',
    recommendedArtifactType: 'BRIEF',
    defaultSectionKinds: ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS', 'IMPLICATIONS', 'NEXT_STEPS'],
  },
  {
    id: 'synthesis',
    name: 'Synthesis',
    description: 'Aggregate multiple sources into a structured synthesis or comparison.',
    promptDirective:
      'Synthesize multiple sources into a coherent view, preserve uncertainty, and compare competing claims or perspectives where relevant.',
    recommendedArtifactType: 'SYNTHESIS',
    defaultSectionKinds: ['EXECUTIVE_SUMMARY', 'LITERATURE_REVIEW', 'KEY_FINDINGS', 'IMPLICATIONS'],
  },
];

const DEFAULT_PURPOSE_PROFILE = PURPOSE_PROFILES[0];

export const getPurposeProfileById = (id?: string): PurposeProfile => {
  return PURPOSE_PROFILES.find((profile) => profile.id === id) || DEFAULT_PURPOSE_PROFILE;
};
