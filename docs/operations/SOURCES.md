# Investigation Source Directory

This catalog aligns with built-in investigation scopes in `src/data/presets.ts`.

Use these sources as seed inputs for:

- investigation wizard `Priority Sources`
- Finder scanner source hints
- Live Monitor source targeting

## Government Fraud

- USASpending: <https://usaspending.gov>
- SAM.gov: <https://sam.gov>
- FEC: <https://fec.gov>
- FPDS: <https://fpds.gov>
- GAO: <https://gao.gov>
- IGNET: <https://ignet.gov>
- FOIA.gov: <https://foia.gov>
- OpenSecrets: <https://opensecrets.org>
- ProPublica: <https://propublica.org>
- GovTrack: <https://govtrack.us>
- POGO: <https://pogo.org>
- PACER: <https://pacer.uscourts.gov>
- DOJ News: <https://justice.gov/news>

## Corporate Due Diligence

- SEC EDGAR: <https://sec.gov/edgar>
- OpenCorporates: <https://opencorporates.com>
- Crunchbase: <https://crunchbase.com>
- LinkedIn: <https://linkedin.com>
- Bloomberg: <https://bloomberg.com>
- Reuters: <https://reuters.com>
- CourtListener: <https://courtlistener.com>
- Financial Times: <https://ft.com>
- Wall Street Journal: <https://wsj.com>
- The Information: <https://theinformation.com>

## Geopolitical Analysis

- U.S. State Department: <https://state.gov>
- United Nations: <https://un.org>
- EEAS: <https://eeas.europa.eu>
- CSIS: <https://csis.org>
- CFR: <https://cfr.org>
- Brookings: <https://brookings.edu>
- Atlantic Council: <https://atlanticcouncil.org>
- RAND: <https://rand.org>
- Bellingcat: <https://bellingcat.com>
- SIPRI: <https://sipri.org>
- Crisis Group: <https://crisisgroup.org>
- Foreign Affairs: <https://foreignaffairs.com>
- The Economist: <https://economist.com>
- Foreign Policy: <https://foreignpolicy.com>

## Cybersecurity Research

- NVD: <https://nvd.nist.gov>
- CVE: <https://cve.org>
- Exploit-DB: <https://exploit-db.com>
- MITRE ATT&CK: <https://attack.mitre.org>
- CISA US-CERT: <https://cisa.gov/uscert>
- VirusTotal: <https://virustotal.com>
- OTX: <https://otx.alienvault.com>
- KrebsOnSecurity: <https://krebsonsecurity.com>
- SecurityWeek: <https://securityweek.com>
- The Hacker News: <https://thehackernews.com>
- BleepingComputer: <https://bleepingcomputer.com>
- Mandiant: <https://mandiant.com>
- CrowdStrike Blog: <https://crowdstrike.com/blog>
- Microsoft Security Blog: <https://microsoft.com/security/blog>

## Competitive Intelligence

- Crunchbase: <https://crunchbase.com>
- PitchBook: <https://pitchbook.com>
- CB Insights: <https://cbinsights.com>
- TechCrunch: <https://techcrunch.com>
- The Verge: <https://theverge.com>
- Ars Technica: <https://arstechnica.com>
- Wired: <https://wired.com>
- Google Patents: <https://patents.google.com>
- USPTO: <https://uspto.gov>
- PatentsView: <https://patentsview.org>
- Product Hunt: <https://producthunt.com>
- G2: <https://g2.com>
- Gartner: <https://gartner.com>

## Open Investigation

Open Investigation is intentionally unconstrained and does not ship with a fixed source list.

## Notes

- These are guidance sources, not enforced allowlists.
- Provider output still requires human verification and cross-checking.
- Keep source additions aligned with `src/data/presets.ts` to avoid prompt/doc drift.
