import type { Artifact, Entity, Headline, KeyFinding, Source } from '@/types';

interface NetworkGraphDossierData {
  entities: Entity[];
  findings: Array<{
    finding: KeyFinding;
    reportId?: string;
    reportTopic: string;
  }>;
  headlines: Headline[];
  leads: string[];
  reports: Artifact[];
  sources: Source[];
}

export const buildNetworkGraphDossierData = ({
  filterWorkspaceId,
  headlines,
  reports,
}: {
  filterWorkspaceId?: string | null;
  headlines: Headline[];
  reports: Artifact[];
}): NetworkGraphDossierData => {
  if (!filterWorkspaceId) {
    return {
      reports: [],
      headlines: [],
      leads: [],
      sources: [],
      entities: [],
      findings: [],
    };
  }

  const activeReports =
    filterWorkspaceId === 'ALL'
      ? reports
      : reports.filter((report) => report.workspaceId === filterWorkspaceId);
  const activeHeadlines =
    filterWorkspaceId === 'ALL'
      ? headlines
      : headlines.filter((headline) => headline.workspaceId === filterWorkspaceId);

  const allLeads = Array.from(new Set(activeReports.flatMap((report) => report.leads || [])));

  const sourceMap = new Map<string, Source>();
  activeReports
    .flatMap((report) => report.sources || [])
    .forEach((source) => {
      if (!sourceMap.has(source.url)) {
        sourceMap.set(source.url, source);
      }
    });

  const entityMap = new Map<string, Entity>();
  activeReports
    .flatMap((report) => report.entities || [])
    .forEach((entity) => {
      const name = typeof entity === 'string' ? entity : entity.name;
      const type = typeof entity === 'string' ? 'UNKNOWN' : entity.type;
      if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
        entityMap.set(name, typeof entity === 'string' ? { name, type: 'UNKNOWN' } : entity);
      }
    });

  const findings = activeReports.flatMap((report) =>
    (report.keyFindings || []).map((finding) => ({
      finding,
      reportId: report.id,
      reportTopic: report.topic,
    }))
  );

  return {
    reports: activeReports,
    headlines: activeHeadlines,
    leads: allLeads,
    sources: Array.from(sourceMap.values()),
    entities: Array.from(entityMap.values()),
    findings,
  };
};
