import type {
  ArtifactType,
  CaseTemplate,
  DomainPack,
  InvestigationReport,
  InvestigationScope,
  LabelProfile,
  PurposeProfile,
} from '../types';
import { getLabelProfileById } from './labels';
import { getDomainPackForScope } from './packs';
import { getPurposeProfileById } from './purposes';

export interface StarterPromptTemplate {
  id: string;
  name: string;
  description: string;
  topic: string;
  hypothesis?: string;
  prioritySources?: string;
  purposeId: string;
  artifactType: ArtifactType;
}

export interface TaskSetupCopy {
  title: string;
  scopeStepLabel: string;
  scopeDescription: string;
  purposeLabel: string;
  purposeDescription: string;
  targetLabel: string;
  targetPlaceholder: string;
  angleLabel: string;
  angleDescription: string;
  anglePlaceholder: string;
  entityLabel: string;
  entityDescription: string;
  sourceLabel: string;
  sourceDescription: string;
  sourcePlaceholder: string;
  configHint: string;
  executeLabel: string;
  templateLabel: string;
}

export const stripLegacyWorkspacePrefix = (title: string): string =>
  title.replace(/^Operation:\s*/i, '').trim();

export const resolveDomainPresentation = (options: {
  scope?: InvestigationScope;
  report?: InvestigationReport | null;
  purposeId?: string;
  labelProfileId?: string;
}) => {
  const scope = options.scope;
  const pack =
    scope
      ? getDomainPackForScope(scope)
      : getDomainPackForScope(undefined);
  const report = options.report;
  const purpose = getPurposeProfileById(
    options.purposeId || report?.purposeId || report?.config?.purposeId || pack.defaultPurposeId
  );
  const labelProfile = getLabelProfileById(
    options.labelProfileId
      || report?.labelProfileId
      || report?.config?.labelProfileId
      || pack.labelProfileId
  );

  return { pack, purpose, labelProfile };
};

export const getTaskSetupCopy = (
  pack: DomainPack,
  purpose: PurposeProfile,
  labelProfile: LabelProfile
): TaskSetupCopy => {
  const baseCopy: TaskSetupCopy = {
    title: `Initialize ${labelProfile.workspaceLabel}`,
    scopeStepLabel: 'Pack',
    scopeDescription: 'Choose the domain pack that should shape sources, tone, and defaults.',
    purposeLabel: 'Purpose',
    purposeDescription: 'Choose the run intent. This sets the prompt objective and output shape.',
    targetLabel: `${labelProfile.workspaceLabel} Target`,
    targetPlaceholder: 'Describe the topic, question, or subject to analyze.',
    angleLabel: 'Working Angle',
    angleDescription: 'Add optional direction so the run knows what to emphasize.',
    anglePlaceholder: 'Describe the lens, hypothesis, or comparison to prioritize.',
    entityLabel: 'Key Entities',
    entityDescription: 'Seed people, organizations, concepts, or sources worth tracking early.',
    sourceLabel: 'Priority Sources',
    sourceDescription: 'List domains, publications, authors, handles, or repositories to prioritize.',
    sourcePlaceholder: 'openai.com, sec.gov, arxiv.org, @agency_handle',
    configHint: 'This run inherits your global defaults. Values below only override this run.',
    executeLabel: 'Launch Run',
    templateLabel: 'Store as reusable launch template',
  };

  switch (purpose.id) {
    case 'latest-findings':
      return {
        ...baseCopy,
        title: `Initialize ${labelProfile.artifactLabel}`,
        targetLabel: 'Latest Findings Topic',
        targetPlaceholder: 'What topic, company, field, or policy area needs a current update?',
        angleLabel: 'What Changed',
        angleDescription: 'Call out the angle, timeframe, or stakeholder you care about most.',
        anglePlaceholder: 'Focus on changes since the last quarter, newest studies, or recent releases.',
        executeLabel: 'Generate Update',
      };
    case 'monitor':
      return {
        ...baseCopy,
        title: `Initialize ${labelProfile.workspaceLabel}`,
        targetLabel: 'Monitoring Target',
        targetPlaceholder: 'What should Sherlock watch for ongoing changes or escalation?',
        angleLabel: 'Monitoring Lens',
        angleDescription: 'Describe the change conditions, risks, or signals that matter most.',
        anglePlaceholder: 'Escalate regulatory deadlines, notable releases, or fresh risk signals.',
        entityLabel: 'Tracked Nodes',
        sourceLabel: 'Watched Sources',
        executeLabel: 'Start Monitor',
      };
    case 'synthesis':
      return {
        ...baseCopy,
        title: `Initialize ${labelProfile.artifactLabel}`,
        targetLabel: 'Synthesis Topic',
        targetPlaceholder: 'What question or domain needs a structured synthesis?',
        angleLabel: 'Synthesis Goal',
        angleDescription: 'Explain the comparison, frame, or decision this synthesis should support.',
        anglePlaceholder: 'Compare approaches, summarize consensus, or reconcile competing claims.',
        entityLabel: 'Core Concepts',
        executeLabel: 'Build Synthesis',
      };
    case 'trend-scan':
      return {
        ...baseCopy,
        title: `Initialize ${labelProfile.artifactLabel}`,
        targetLabel: 'Trend Scan Target',
        targetPlaceholder: 'What landscape, market, or field should Sherlock scan?',
        angleLabel: 'Scanning Lens',
        angleDescription: 'Add a commercial, technical, or policy angle to sharpen the scan.',
        anglePlaceholder: 'Focus on competitive movement, adoption patterns, or strategic shifts.',
        executeLabel: 'Scan Trends',
      };
    default:
      if (pack.workspaceMode === 'INVESTIGATION') {
        return {
          ...baseCopy,
          targetLabel: 'Investigation Target',
          targetPlaceholder: 'Enter the subject, entity, or question to investigate.',
          angleLabel: 'Working Hypothesis',
          angleDescription: 'Capture what you suspect so the run can test it directly.',
          anglePlaceholder: 'Example: shell entities may be masking related-party transfers.',
          executeLabel: 'Execute Task',
        };
      }

      return baseCopy;
  }
};

const STARTER_LIBRARY: Record<string, StarterPromptTemplate[]> = {
  'open-investigation': [
    {
      id: 'starter-open-dossier',
      name: 'Entity Dossier',
      description: 'Build a broad baseline dossier on a person, company, or organization.',
      topic: '[Entity or organization name]',
      hypothesis: 'Surface the most relevant relationships, risks, and open questions.',
      purposeId: 'deep-dive',
      artifactType: 'REPORT',
    },
    {
      id: 'starter-open-update',
      name: 'Latest Developments',
      description: 'Summarize the newest developments around a topic without assuming fraud or wrongdoing.',
      topic: '[Topic or event]',
      hypothesis: 'Focus on what changed recently, who is involved, and what deserves follow-up.',
      purposeId: 'latest-findings',
      artifactType: 'SYNTHESIS',
    },
  ],
  'government-fraud': [
    {
      id: 'starter-gov-contract',
      name: 'Contract Review',
      description: 'Review a contract, grant, or vendor for red flags and unusual spending patterns.',
      topic: '[Agency, program, vendor, or contract vehicle]',
      hypothesis: 'Test for concentrated awards, conflicts, shell entities, or weak oversight.',
      prioritySources: 'usaspending.gov, sam.gov, gao.gov, justice.gov',
      purposeId: 'deep-dive',
      artifactType: 'REPORT',
    },
    {
      id: 'starter-gov-watch',
      name: 'Oversight Watch',
      description: 'Monitor a program area for new audits, enforcement, or accountability signals.',
      topic: '[Program, agency, or spending category]',
      hypothesis: 'Escalate new audits, inspector general findings, or procurement anomalies.',
      prioritySources: 'ignet.gov, usaspending.gov, sec.gov, propublica.org',
      purposeId: 'monitor',
      artifactType: 'MONITOR_SNAPSHOT',
    },
  ],
  'corporate-due-diligence': [
    {
      id: 'starter-dd-risk',
      name: 'Company Risk Brief',
      description: 'Assess a company for hidden liabilities, litigation, and reputational risk.',
      topic: '[Company name]',
      hypothesis: 'Focus on ownership, litigation, enforcement, and leadership history.',
      prioritySources: 'sec.gov, opencorporates.com, courtlistener.com, reuters.com',
      purposeId: 'deep-dive',
      artifactType: 'REPORT',
    },
    {
      id: 'starter-dd-compare',
      name: 'Peer Comparison',
      description: 'Compare a target company against competitors or acquisition alternatives.',
      topic: '[Target company] vs [peer or peer set]',
      hypothesis: 'Compare regulatory posture, market position, and leadership credibility.',
      purposeId: 'synthesis',
      artifactType: 'COMPARISON',
    },
  ],
  'scientific-research': [
    {
      id: 'starter-science-findings',
      name: 'Latest Evidence Review',
      description: 'Summarize the newest credible evidence on a question or intervention.',
      topic: '[Intervention, condition, or research question]',
      hypothesis: 'Focus on strong evidence, study quality, and what changed recently.',
      prioritySources: 'pubmed.ncbi.nlm.nih.gov, scholar.google.com, nature.com',
      purposeId: 'latest-findings',
      artifactType: 'SYNTHESIS',
    },
    {
      id: 'starter-science-compare',
      name: 'Study Comparison',
      description: 'Compare methods, results, and limitations across multiple studies.',
      topic: '[Study area, method, or competing hypothesis]',
      hypothesis: 'Explain consensus, disagreement, and limitations across the literature.',
      prioritySources: 'pubmed.ncbi.nlm.nih.gov, arxiv.org, semanticscholar.org',
      purposeId: 'synthesis',
      artifactType: 'COMPARISON',
    },
  ],
  'ai-technology-landscape': [
    {
      id: 'starter-ai-scan',
      name: 'Landscape Scan',
      description: 'Scan a product category, model class, or platform segment for movement.',
      topic: '[Model category, product segment, or company set]',
      hypothesis: 'Track launches, capabilities, distribution moves, and benchmark positioning.',
      prioritySources: 'openai.com, anthropic.com, huggingface.co, techcrunch.com',
      purposeId: 'trend-scan',
      artifactType: 'BRIEF',
    },
    {
      id: 'starter-ai-update',
      name: 'Release Update',
      description: 'Capture what changed in a fast-moving AI or infrastructure area.',
      topic: '[Company, model family, or infrastructure topic]',
      hypothesis: 'Highlight concrete releases, benchmark deltas, and strategic implications.',
      prioritySources: 'openai.com, deepmind.google, paperswithcode.com, theinformation.com',
      purposeId: 'latest-findings',
      artifactType: 'BRIEF',
    },
  ],
  'policy-regulation': [
    {
      id: 'starter-policy-watch',
      name: 'Policy Watch',
      description: 'Monitor a rulemaking area, agency, or jurisdiction for meaningful changes.',
      topic: '[Rulemaking topic, agency, or jurisdiction]',
      hypothesis: 'Focus on what changed, who is affected, and what must be tracked next.',
      prioritySources: 'federalregister.gov, congress.gov, ftc.gov, sec.gov',
      purposeId: 'monitor',
      artifactType: 'MONITOR_SNAPSHOT',
    },
    {
      id: 'starter-policy-brief',
      name: 'Impact Brief',
      description: 'Summarize a policy issue with implications for stakeholders or operators.',
      topic: '[Policy issue, proposed rule, or enforcement area]',
      hypothesis: 'Explain stakeholder impact, timelines, implementation risk, and open questions.',
      purposeId: 'latest-findings',
      artifactType: 'BRIEF',
    },
  ],
};

export const getStarterTemplates = (
  pack: DomainPack,
  purpose?: PurposeProfile
): StarterPromptTemplate[] => {
  const packTemplates = STARTER_LIBRARY[pack.id] || STARTER_LIBRARY['open-investigation'] || [];
  if (!purpose) return packTemplates;

  const purposeMatches = packTemplates.filter((template) => template.purposeId === purpose.id);
  if (purposeMatches.length > 0) {
    return [...purposeMatches, ...packTemplates.filter((template) => template.purposeId !== purpose.id)];
  }

  return packTemplates;
};

export const buildLaunchRequestFromTemplate = (
  template: CaseTemplate,
  scope?: InvestigationScope
) => {
  const { pack, purpose, labelProfile } = resolveDomainPresentation({
    scope,
    purposeId: template.config.purposeId || template.purposeId,
    labelProfileId: template.config.labelProfileId || template.labelProfileId,
  });

  return {
    topic: template.topic,
    configOverride: template.config,
    scope,
    packId: template.config.packId || template.packId || pack.id,
    purposeId: template.config.purposeId || template.purposeId || purpose.id,
    artifactType: template.config.artifactType || template.artifactType || purpose.recommendedArtifactType,
    labelProfileId:
      template.config.labelProfileId || template.labelProfileId || labelProfile.id,
  };
};
