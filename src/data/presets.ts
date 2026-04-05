/**
 * Built-in Investigation Scope Presets
 *
 * Each preset defines domain context, personas, categories, and sources
 * for a specific type of investigation.
 */

import type { InvestigationScope, PersonaDefinition } from '../types';

// --- PERSONA DEFINITIONS ---

const GOVERNMENT_FRAUD_PERSONAS: PersonaDefinition[] = [
  {
    id: 'forensic-accountant',
    label: 'Forensic Accountant',
    instruction:
      'You are a world-class forensic accountant and OSINT investigator. Focus on financial discrepancies, money trails, contract irregularities, and regulatory violations. Your tone is professional and evidence-based. Prioritize quantifiable findings.',
  },
  {
    id: 'watchdog-journalist',
    label: 'Watchdog Journalist',
    instruction:
      'You are an award-winning investigative journalist specializing in government accountability. Focus on public interest, uncovering corruption, verifying sources with extreme rigor, and following the money. Your tone is objective but compelling.',
  },
  {
    id: 'intel-analyst',
    label: 'Intelligence Analyst',
    instruction:
      'You are a senior intelligence analyst with government watchdog experience. Focus on connecting disparate data points, identifying patterns of waste and abuse, and assessing systemic risks. Your tone is clinical and classified.',
  },
];

const CORPORATE_DD_PERSONAS: PersonaDefinition[] = [
  {
    id: 'compliance-analyst',
    label: 'Compliance Analyst',
    instruction:
      'You are a senior compliance analyst specializing in corporate due diligence. Focus on regulatory filings, litigation history, beneficial ownership, sanctions exposure, and ESG risks. Your tone is thorough and risk-focused.',
  },
  {
    id: 'ma-researcher',
    label: 'M&A Researcher',
    instruction:
      'You are an M&A due diligence specialist. Focus on financial health, leadership backgrounds, market positioning, competitive landscape, and hidden liabilities. Your tone is analytical and investment-focused.',
  },
  {
    id: 'corporate-investigator',
    label: 'Corporate Investigator',
    instruction:
      'You are a private corporate investigator. Focus on executive backgrounds, corporate connections, fraud indicators, and reputational risks. Your tone is direct and evidence-based.',
  },
];

const GEOPOLITICAL_PERSONAS: PersonaDefinition[] = [
  {
    id: 'geopolitical-analyst',
    label: 'Geopolitical Analyst',
    instruction:
      'You are a senior geopolitical analyst at a leading think tank. Focus on international relations, power dynamics, economic implications, and strategic forecasting. Your tone is academic yet accessible.',
  },
  {
    id: 'osint-investigator',
    label: 'OSINT Investigator',
    instruction:
      'You are an open-source intelligence investigator specializing in conflict analysis. Focus on verifying claims, geolocating events, tracking actors, and exposing disinformation. Your tone is methodical and evidence-based.',
  },
  {
    id: 'risk-advisor',
    label: 'Political Risk Advisor',
    instruction:
      'You are a political risk advisor for multinational organizations. Focus on country risk, regulatory changes, sanctions implications, and scenario planning. Your tone is strategic and business-oriented.',
  },
];

const CYBERSECURITY_PERSONAS: PersonaDefinition[] = [
  {
    id: 'threat-hunter',
    label: 'Threat Hunter',
    instruction:
      'You are a senior threat intelligence analyst. Focus on IOCs, TTPs, attribution, and threat actor profiling. Use MITRE ATT&CK framework where applicable. Your tone is technical and precise.',
  },
  {
    id: 'security-researcher',
    label: 'Security Researcher',
    instruction:
      'You are a vulnerability researcher and security analyst. Focus on CVEs, exploit analysis, attack surface assessment, and remediation guidance. Your tone is technical but actionable.',
  },
  {
    id: 'incident-responder',
    label: 'Incident Responder',
    instruction:
      'You are a DFIR specialist. Focus on forensic artifacts, timeline reconstruction, lateral movement, and containment strategies. Your tone is urgent and methodical.',
  },
];

const COMPETITIVE_INTEL_PERSONAS: PersonaDefinition[] = [
  {
    id: 'market-analyst',
    label: 'Market Analyst',
    instruction:
      'You are a competitive intelligence analyst. Focus on market positioning, product strategy, pricing, partnerships, and growth signals. Your tone is strategic and business-focused.',
  },
  {
    id: 'tech-scout',
    label: 'Technology Scout',
    instruction:
      'You are a technology scout tracking innovation and emerging players. Focus on patents, technical capabilities, talent acquisition, and R&D investments. Your tone is forward-looking.',
  },
];

const OPEN_INVESTIGATION_PERSONAS: PersonaDefinition[] = [
  {
    id: 'general-investigator',
    label: 'General Investigator',
    instruction:
      'You are a versatile OSINT investigator. Adapt your approach to the subject matter. Focus on verifying information, connecting entities, and developing leads. Your tone is professional and thorough.',
  },
  {
    id: 'journalist',
    label: 'Journalist',
    instruction:
      'You are an investigative journalist. Focus on public interest, source verification, and compelling narratives backed by evidence. Your tone is objective but engaging.',
  },
  {
    id: 'researcher',
    label: 'Academic Researcher',
    instruction:
      'You are an academic researcher. Focus on comprehensive literature review, primary sources, and systematic analysis. Your tone is scholarly and well-cited.',
  },
];

const SCIENTIFIC_RESEARCH_PERSONAS: PersonaDefinition[] = [
  {
    id: 'literature-analyst',
    label: 'Literature Analyst',
    instruction:
      'You are a rigorous research analyst. Focus on recent findings, study quality, reproducibility, and open questions. Your tone is evidence-based and precise.',
  },
  {
    id: 'scientific-scout',
    label: 'Scientific Scout',
    instruction:
      'You are a scientific scout tracking the newest work in a field. Focus on what is new, what matters, and where the field is moving next. Your tone is concise and current.',
  },
  {
    id: 'methods-reviewer',
    label: 'Methods Reviewer',
    instruction:
      'You are a methods-oriented reviewer. Focus on methodology, limitations, sample quality, and whether conclusions are supported by the evidence. Your tone is skeptical and structured.',
  },
];

const AI_TECH_PERSONAS: PersonaDefinition[] = [
  {
    id: 'ai-landscape-analyst',
    label: 'AI Landscape Analyst',
    instruction:
      'You are an AI landscape analyst. Focus on model releases, benchmark movement, ecosystem shifts, infrastructure changes, and strategic implications. Your tone is sharp and practical.',
  },
  {
    id: 'technical-researcher',
    label: 'Technical Researcher',
    instruction:
      'You are a technical researcher tracking emerging systems. Focus on architecture details, capabilities, tradeoffs, and implementation signals. Your tone is technical and grounded.',
  },
  {
    id: 'industry-strategist',
    label: 'Industry Strategist',
    instruction:
      'You are a strategist following AI and technology markets. Focus on competition, product direction, partnerships, and long-term positioning. Your tone is strategic and high signal.',
  },
];

const POLICY_REGULATION_PERSONAS: PersonaDefinition[] = [
  {
    id: 'policy-analyst',
    label: 'Policy Analyst',
    instruction:
      'You are a policy analyst. Focus on regulatory developments, policy intent, enforcement posture, and downstream effects for stakeholders. Your tone is neutral and well-structured.',
  },
  {
    id: 'regulatory-monitor',
    label: 'Regulatory Monitor',
    instruction:
      'You are a regulatory monitor. Focus on what changed, who it affects, timelines, and where more guidance is likely to emerge. Your tone is current and operational.',
  },
  {
    id: 'public-affairs-researcher',
    label: 'Public Affairs Researcher',
    instruction:
      'You are a public affairs researcher. Focus on institutions, public statements, implementation realities, and competing stakeholder positions. Your tone is contextual and balanced.',
  },
];

// --- BUILT-IN SCOPE PRESETS ---

export const BUILTIN_SCOPES: InvestigationScope[] = [
  {
    id: 'government-fraud',
    name: 'Government Fraud',
    description:
      'Investigate federal spending, grants, contracts, and potential waste, fraud, or abuse in government programs.',
    domainContext:
      'You are investigating potential fraud, waste, and abuse in U.S. government spending, federal grants, and public contracts. Focus on financial irregularities, overbilling, no-bid contracts, and misuse of taxpayer funds.',
    investigationObjective:
      'Identify financial discrepancies, suspicious contracts, conflicts of interest, and evidence of misappropriation of public funds.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [
      {
        name: 'Primary Databases',
        sources: [
          { label: 'USASpending.gov', url: 'https://usaspending.gov' },
          { label: 'SAM.gov', url: 'https://sam.gov' },
          { label: 'FEC.gov', url: 'https://fec.gov' },
          { label: 'FPDS', url: 'https://fpds.gov' },
        ],
      },
      {
        name: 'Oversight & Audits',
        sources: [
          { label: 'GAO.gov', url: 'https://gao.gov' },
          { label: 'Inspector General Reports', url: 'https://ignet.gov' },
          { label: 'FOIA.gov', url: 'https://foia.gov' },
        ],
      },
      {
        name: 'Watchdog Organizations',
        sources: [
          { label: 'OpenSecrets', url: 'https://opensecrets.org' },
          { label: 'ProPublica', url: 'https://propublica.org' },
          { label: 'GovTrack', url: 'https://govtrack.us' },
          { label: 'POGO', url: 'https://pogo.org' },
        ],
      },
      {
        name: 'Legal & Court Records',
        sources: [
          { label: 'PACER', url: 'https://pacer.uscourts.gov' },
          { label: 'DOJ Press Releases', url: 'https://justice.gov/news' },
        ],
      },
    ],
    categories: [
      'Finance',
      'Healthcare',
      'Defense',
      'Education',
      'Infrastructure',
      'Grants',
      'Contracts',
    ],
    personas: GOVERNMENT_FRAUD_PERSONAS,
    defaultPersona: 'forensic-accountant',
    icon: '🎯',
    isBuiltIn: true,
    workspaceMode: 'INVESTIGATION',
    labelProfileId: 'investigation',
    supportedPurposeIds: ['deep-dive', 'monitor', 'synthesis'],
    defaultPurposeId: 'deep-dive',
    defaultArtifactType: 'REPORT',
  },
  {
    id: 'corporate-due-diligence',
    name: 'Corporate Due Diligence',
    description:
      'Research companies for M&A, investment, or compliance purposes. Uncover risks, litigation, and leadership issues.',
    domainContext:
      'You are conducting corporate due diligence research. Focus on company financials, regulatory filings, litigation history, executive backgrounds, beneficial ownership, and potential compliance or reputational risks.',
    investigationObjective:
      'Assess corporate health, identify hidden liabilities, verify leadership claims, and uncover regulatory or legal risks.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [
      {
        name: 'Regulatory Filings',
        sources: [
          { label: 'SEC EDGAR', url: 'https://sec.gov/edgar' },
          {
            label: 'State SOS Databases',
            url: 'https://en.wikipedia.org/wiki/Secretary_of_state_(U.S._state_government)',
          },
          { label: 'OpenCorporates', url: 'https://opencorporates.com' },
        ],
      },
      {
        name: 'Business Intelligence',
        sources: [
          { label: 'Crunchbase', url: 'https://crunchbase.com' },
          { label: 'LinkedIn', url: 'https://linkedin.com' },
          { label: 'Bloomberg', url: 'https://bloomberg.com' },
          { label: 'Reuters', url: 'https://reuters.com' },
        ],
      },
      {
        name: 'Legal Records',
        sources: [
          { label: 'PACER', url: 'https://pacer.uscourts.gov' },
          { label: 'CourtListener', url: 'https://courtlistener.com' },
          { label: 'Westlaw/LexisNexis', url: 'https://legal.thomsonreuters.com' },
        ],
      },
      {
        name: 'News & Analysis',
        sources: [
          { label: 'Financial Times', url: 'https://ft.com' },
          { label: 'Wall Street Journal', url: 'https://wsj.com' },
          { label: 'The Information', url: 'https://theinformation.com' },
        ],
      },
    ],
    categories: ['Finance', 'Legal', 'Leadership', 'M&A', 'Compliance', 'ESG', 'Market Position'],
    personas: CORPORATE_DD_PERSONAS,
    defaultPersona: 'compliance-analyst',
    icon: '🏢',
    isBuiltIn: true,
    workspaceMode: 'DUE_DILIGENCE',
    labelProfileId: 'investigation',
    supportedPurposeIds: ['deep-dive', 'synthesis', 'trend-scan'],
    defaultPurposeId: 'deep-dive',
    defaultArtifactType: 'REPORT',
  },
  {
    id: 'geopolitical-analysis',
    name: 'Geopolitical Analysis',
    description:
      'Analyze international relations, conflicts, sanctions, and political developments across regions.',
    domainContext:
      'You are conducting geopolitical analysis. Focus on international relations, power dynamics, conflicts, sanctions, trade policies, and their implications for various stakeholders.',
    investigationObjective:
      'Understand geopolitical dynamics, assess risks, track actors and alliances, and forecast potential developments.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [
      {
        name: 'Government Sources',
        sources: [
          { label: 'U.S. State Department', url: 'https://state.gov' },
          { label: 'United Nations', url: 'https://un.org' },
          { label: 'European External Action Service', url: 'https://eeas.europa.eu' },
        ],
      },
      {
        name: 'Think Tanks',
        sources: [
          { label: 'CSIS', url: 'https://csis.org' },
          { label: 'Council on Foreign Relations', url: 'https://cfr.org' },
          { label: 'Brookings Institution', url: 'https://brookings.edu' },
          { label: 'Atlantic Council', url: 'https://atlanticcouncil.org' },
          { label: 'RAND Corporation', url: 'https://rand.org' },
        ],
      },
      {
        name: 'OSINT & Verification',
        sources: [
          { label: 'Bellingcat', url: 'https://bellingcat.com' },
          { label: 'SIPRI', url: 'https://sipri.org' },
          { label: 'Crisis Group', url: 'https://crisisgroup.org' },
        ],
      },
      {
        name: 'News & Analysis',
        sources: [
          { label: 'Foreign Affairs', url: 'https://foreignaffairs.com' },
          { label: 'The Economist', url: 'https://economist.com' },
          { label: 'Foreign Policy', url: 'https://foreignpolicy.com' },
        ],
      },
    ],
    categories: [
      'Geopolitics',
      'Military',
      'Diplomacy',
      'Trade',
      'Sanctions',
      'Conflict',
      'Energy',
    ],
    personas: GEOPOLITICAL_PERSONAS,
    defaultPersona: 'geopolitical-analyst',
    icon: '🌐',
    isBuiltIn: true,
    workspaceMode: 'INVESTIGATION',
    labelProfileId: 'investigation',
    supportedPurposeIds: ['deep-dive', 'monitor', 'synthesis'],
    defaultPurposeId: 'deep-dive',
    defaultArtifactType: 'REPORT',
  },
  {
    id: 'cybersecurity-research',
    name: 'Cybersecurity Research',
    description:
      'Research threats, vulnerabilities, APT groups, and security incidents in the cyber domain.',
    domainContext:
      'You are conducting cybersecurity research. Focus on threat actors, vulnerabilities, attack techniques, indicators of compromise, and security incidents. Use technical precision and reference frameworks like MITRE ATT&CK.',
    investigationObjective:
      'Identify threats, analyze attack patterns, attribute malicious activity, and provide actionable security intelligence.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [
      {
        name: 'Vulnerability Databases',
        sources: [
          { label: 'NVD (NIST)', url: 'https://nvd.nist.gov' },
          { label: 'CVE.org', url: 'https://cve.org' },
          { label: 'Exploit-DB', url: 'https://exploit-db.com' },
        ],
      },
      {
        name: 'Threat Intelligence',
        sources: [
          { label: 'MITRE ATT&CK', url: 'https://attack.mitre.org' },
          { label: 'CISA Advisories', url: 'https://cisa.gov/uscert' },
          { label: 'VirusTotal', url: 'https://virustotal.com' },
          { label: 'AlienVault OTX', url: 'https://otx.alienvault.com' },
        ],
      },
      {
        name: 'Security News',
        sources: [
          { label: 'KrebsOnSecurity', url: 'https://krebsonsecurity.com' },
          { label: 'SecurityWeek', url: 'https://securityweek.com' },
          { label: 'The Hacker News', url: 'https://thehackernews.com' },
          { label: 'BleepingComputer', url: 'https://bleepingcomputer.com' },
        ],
      },
      {
        name: 'Research & Vendors',
        sources: [
          { label: 'Mandiant', url: 'https://mandiant.com' },
          { label: 'CrowdStrike Blog', url: 'https://crowdstrike.com/blog' },
          { label: 'Microsoft Security', url: 'https://microsoft.com/security/blog' },
        ],
      },
    ],
    categories: [
      'Cybersecurity',
      'Malware',
      'APT',
      'Vulnerabilities',
      'Incidents',
      'Infrastructure',
      'Ransomware',
    ],
    personas: CYBERSECURITY_PERSONAS,
    defaultPersona: 'threat-hunter',
    icon: '🔒',
    isBuiltIn: true,
    workspaceMode: 'INVESTIGATION',
    labelProfileId: 'investigation',
    supportedPurposeIds: ['deep-dive', 'monitor', 'synthesis'],
    defaultPurposeId: 'deep-dive',
    defaultArtifactType: 'REPORT',
  },
  {
    id: 'competitive-intelligence',
    name: 'Competitive Intelligence',
    description: 'Research competitors, market trends, product strategies, and industry dynamics.',
    domainContext:
      'You are conducting competitive intelligence research. Focus on market positioning, product strategies, pricing, partnerships, funding, talent moves, and technology developments.',
    investigationObjective:
      'Understand competitive landscape, identify market opportunities, track competitor moves, and inform strategic decisions.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [
      {
        name: 'Business Intelligence',
        sources: [
          { label: 'Crunchbase', url: 'https://crunchbase.com' },
          { label: 'PitchBook', url: 'https://pitchbook.com' },
          { label: 'CB Insights', url: 'https://cbinsights.com' },
        ],
      },
      {
        name: 'Tech News',
        sources: [
          { label: 'TechCrunch', url: 'https://techcrunch.com' },
          { label: 'The Verge', url: 'https://theverge.com' },
          { label: 'Ars Technica', url: 'https://arstechnica.com' },
          { label: 'Wired', url: 'https://wired.com' },
        ],
      },
      {
        name: 'Patents & IP',
        sources: [
          { label: 'Google Patents', url: 'https://patents.google.com' },
          { label: 'USPTO', url: 'https://uspto.gov' },
          { label: 'PatentsView', url: 'https://patentsview.org' },
        ],
      },
      {
        name: 'Product & Market',
        sources: [
          { label: 'Product Hunt', url: 'https://producthunt.com' },
          { label: 'G2', url: 'https://g2.com' },
          { label: 'Gartner', url: 'https://gartner.com' },
        ],
      },
    ],
    categories: ['Tech', 'Finance', 'Product', 'Marketing', 'Funding', 'M&A', 'Talent'],
    personas: COMPETITIVE_INTEL_PERSONAS,
    defaultPersona: 'market-analyst',
    icon: '📊',
    isBuiltIn: true,
    workspaceMode: 'RESEARCH',
    labelProfileId: 'research',
    supportedPurposeIds: ['trend-scan', 'latest-findings', 'synthesis'],
    defaultPurposeId: 'trend-scan',
    defaultArtifactType: 'BRIEF',
  },
  {
    id: 'scientific-research',
    name: 'Scientific Research',
    description:
      'Research the latest scientific findings, compare studies, and surface the strongest evidence and open questions.',
    domainContext:
      'You are conducting cross-domain scientific research. Focus on recent papers, review articles, preprints, reputable institutions, and evidence quality. Compare findings carefully and preserve uncertainty where appropriate.',
    investigationObjective:
      'Summarize the latest credible findings, highlight methodological quality, identify consensus and disagreement, and surface meaningful open questions.',
    defaultDateRange: { strategy: 'RELATIVE', relativeYears: 3 },
    suggestedSources: [
      {
        name: 'Literature Databases',
        sources: [
          { label: 'Google Scholar', url: 'https://scholar.google.com' },
          { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov' },
          { label: 'arXiv', url: 'https://arxiv.org' },
          { label: 'Semantic Scholar', url: 'https://semanticscholar.org' },
        ],
      },
      {
        name: 'Journals & Reviews',
        sources: [
          { label: 'Nature', url: 'https://nature.com' },
          { label: 'Science', url: 'https://science.org' },
          { label: 'Cell Press', url: 'https://cell.com' },
          { label: 'PLOS', url: 'https://plos.org' },
        ],
      },
      {
        name: 'Institutions',
        sources: [
          { label: 'NIH', url: 'https://nih.gov' },
          { label: 'WHO', url: 'https://who.int' },
          { label: 'CDC', url: 'https://cdc.gov' },
        ],
      },
    ],
    categories: [
      'Biology',
      'Medicine',
      'Climate',
      'Physics',
      'Psychology',
      'Public Health',
      'Methods',
    ],
    personas: SCIENTIFIC_RESEARCH_PERSONAS,
    defaultPersona: 'literature-analyst',
    icon: '🧪',
    isBuiltIn: true,
    workspaceMode: 'RESEARCH',
    labelProfileId: 'research',
    supportedPurposeIds: ['latest-findings', 'synthesis', 'deep-dive'],
    defaultPurposeId: 'latest-findings',
    defaultArtifactType: 'SYNTHESIS',
  },
  {
    id: 'ai-technology-landscape',
    name: 'AI & Technology Landscape',
    description:
      'Track the latest developments across AI, ML, infrastructure, product launches, and ecosystem shifts.',
    domainContext:
      'You are researching the AI and technology landscape. Focus on model releases, product launches, capabilities, benchmarks, infrastructure, talent moves, funding, and ecosystem strategy.',
    investigationObjective:
      'Identify meaningful technological developments, compare capabilities and positioning, and explain why the latest changes matter.',
    defaultDateRange: { strategy: 'RELATIVE', relativeYears: 2 },
    suggestedSources: [
      {
        name: 'Labs & Vendors',
        sources: [
          { label: 'OpenAI', url: 'https://openai.com' },
          { label: 'Anthropic', url: 'https://anthropic.com' },
          { label: 'Google DeepMind', url: 'https://deepmind.google' },
          { label: 'Meta AI', url: 'https://ai.meta.com' },
        ],
      },
      {
        name: 'Research & Community',
        sources: [
          { label: 'arXiv', url: 'https://arxiv.org' },
          { label: 'Hugging Face', url: 'https://huggingface.co' },
          { label: 'Papers with Code', url: 'https://paperswithcode.com' },
        ],
      },
      {
        name: 'Industry Coverage',
        sources: [
          { label: 'The Information', url: 'https://theinformation.com' },
          { label: 'TechCrunch', url: 'https://techcrunch.com' },
          { label: 'Semafor', url: 'https://semafor.com' },
        ],
      },
    ],
    categories: ['AI', 'ML', 'Models', 'Infrastructure', 'Agents', 'Open Source', 'Industry'],
    personas: AI_TECH_PERSONAS,
    defaultPersona: 'ai-landscape-analyst',
    icon: '🤖',
    isBuiltIn: true,
    workspaceMode: 'RESEARCH',
    labelProfileId: 'research',
    supportedPurposeIds: ['trend-scan', 'latest-findings', 'synthesis'],
    defaultPurposeId: 'trend-scan',
    defaultArtifactType: 'BRIEF',
  },
  {
    id: 'policy-regulation',
    name: 'Policy & Regulation',
    description:
      'Monitor policy developments, enforcement signals, and regulatory shifts across jurisdictions.',
    domainContext:
      'You are tracking policy and regulation. Focus on official statements, agency guidance, legislation, rulemaking, enforcement, and cross-jurisdictional differences.',
    investigationObjective:
      'Surface meaningful policy changes, clarify who is affected, explain implications, and identify follow-up developments to monitor.',
    defaultDateRange: { strategy: 'RELATIVE', relativeYears: 2 },
    suggestedSources: [
      {
        name: 'Government Sources',
        sources: [
          { label: 'Federal Register', url: 'https://federalregister.gov' },
          { label: 'Congress.gov', url: 'https://congress.gov' },
          { label: 'EUR-Lex', url: 'https://eur-lex.europa.eu' },
        ],
      },
      {
        name: 'Agencies & Regulators',
        sources: [
          { label: 'FTC', url: 'https://ftc.gov' },
          { label: 'SEC', url: 'https://sec.gov' },
          { label: 'CISA', url: 'https://cisa.gov' },
        ],
      },
      {
        name: 'Analysis',
        sources: [
          { label: 'Brookings', url: 'https://brookings.edu' },
          { label: 'CSIS', url: 'https://csis.org' },
          { label: 'Lawfare', url: 'https://lawfaremedia.org' },
        ],
      },
    ],
    categories: [
      'Regulation',
      'Legislation',
      'Enforcement',
      'Compliance',
      'AI Policy',
      'Privacy',
      'Security',
    ],
    personas: POLICY_REGULATION_PERSONAS,
    defaultPersona: 'policy-analyst',
    icon: '🏛️',
    isBuiltIn: true,
    workspaceMode: 'MONITORING',
    labelProfileId: 'monitoring',
    supportedPurposeIds: ['monitor', 'latest-findings', 'synthesis'],
    defaultPurposeId: 'monitor',
    defaultArtifactType: 'MONITOR_SNAPSHOT',
  },
  {
    id: 'open-investigation',
    name: 'Open Investigation',
    description:
      'General-purpose investigation with no domain constraints. Define your own sources and approach.',
    domainContext:
      'You are conducting an open-ended investigation. Adapt your approach based on the subject matter. Be thorough, verify information from multiple sources, and develop actionable leads.',
    investigationObjective:
      'Investigate the subject comprehensively, verify claims, identify key entities and connections, and surface relevant findings.',
    defaultDateRange: { strategy: 'NONE' },
    suggestedSources: [],
    categories: ['All', 'News', 'Social', 'Official', 'Legal', 'Financial', 'Technical'],
    personas: OPEN_INVESTIGATION_PERSONAS,
    defaultPersona: 'general-investigator',
    icon: '🔍',
    isBuiltIn: true,
    workspaceMode: 'INVESTIGATION',
    labelProfileId: 'investigation',
    supportedPurposeIds: ['deep-dive', 'synthesis', 'latest-findings'],
    defaultPurposeId: 'deep-dive',
    defaultArtifactType: 'REPORT',
  },
];

// Default scope for new users
export const DEFAULT_SCOPE_ID = 'open-investigation';

// Helper to get a scope by ID
export const getScopeById = (id: string): InvestigationScope | undefined => {
  return BUILTIN_SCOPES.find((s) => s.id === id);
};

// Helper to get all available scopes (built-in + custom)
export const getAllScopes = (customScopes: InvestigationScope[] = []): InvestigationScope[] => {
  return [...BUILTIN_SCOPES, ...customScopes.filter((cs) => !cs.isBuiltIn)];
};
