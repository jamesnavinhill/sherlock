import type { Artifact, Entity, Headline, Source } from '@/types';

interface NetworkGraphDossierData {
  entities: Entity[];
  headlines: Headline[];
  leads: string[];
  reports: Artifact[];
  sources: Source[];
}

export const buildNetworkGraphDossierData = ({
  filterCaseId,
  headlines,
  reports,
}: {
  filterCaseId?: string | null;
  headlines: Headline[];
  reports: Artifact[];
}): NetworkGraphDossierData => {
  if (!filterCaseId) {
    return {
      reports: [],
      headlines: [],
      leads: [],
      sources: [],
      entities: [],
    };
  }

  const activeReports =
    filterCaseId === 'ALL' ? reports : reports.filter((report) => report.caseId === filterCaseId);
  const activeHeadlines =
    filterCaseId === 'ALL' ? headlines : headlines.filter((headline) => headline.caseId === filterCaseId);

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

  return {
    reports: activeReports,
    headlines: activeHeadlines,
    leads: allLeads,
    sources: Array.from(sourceMap.values()),
    entities: Array.from(entityMap.values()),
  };
};
