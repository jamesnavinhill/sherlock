# Sherlock Agent Source Directory

> [!NOTE]
> This document provides a curated directory of official data sources for Sherlock OSINT investigations. Sources can be prioritized per-investigation via the "Priority Sources" field in the investigation wizard or monitor configuration.

---

## Federal Data Sources

### Grants & Spending

| Source | Description | URL |
|--------|-------------|-----|
| **USASpending.gov** | Federal grants, contracts, and spending data (API available) | <https://www.usaspending.gov/> |
| **Grants.gov** | Federal grant opportunities and awards | <https://www.grants.gov/> |
| **Treasury Fiscal Data** | Federal revenue, spending, and debt data | <https://fiscaldata.treasury.gov/> |
| **Data.gov** | Federal open data catalog | <https://data.gov/> |

### Loans & Business

| Source | Description | URL |
|--------|-------------|-----|
| **SBA Data Store** | PPP, EIDL, 7(a), and 504 loan data (FOIA releases) | <https://data.sba.gov/> |
| **SAM.gov** | Entity registration, exclusions, contract awards | <https://sam.gov/> |
| **FPDS** | Federal procurement data system | <https://www.fpds.gov/> |

### Campaign Finance

| Source | Description | URL |
|--------|-------------|-----|
| **FEC.gov** | Federal campaign finance and contributions | <https://www.fec.gov/data/> |

---

## Healthcare Sources

| Source | Description | URL |
|--------|-------------|-----|
| **HHS OIG Exclusions** | Excluded healthcare providers (LEIE database) | <https://oig.hhs.gov/exclusions/> |
| **CMS Provider Data** | Nursing homes, hospitals, healthcare facilities | <https://data.cms.gov/provider-data/> |

---

## Welfare & Housing

| Source | Description | URL |
|--------|-------------|-----|
| **USDA SNAP Retailers** | Authorized SNAP retailers | <https://www.fns.usda.gov/snap/retailer-locator> |
| **USDA Disqualified Stores** | SNAP-disqualified retailers | <https://www.fns.usda.gov/snap/disqualifications/list> |
| **HUD Data Portal** | Housing assistance, Section 8, public housing | <https://data.hud.gov/> |

---

## Oversight & Enforcement

| Source | Description | URL |
|--------|-------------|-----|
| **DOJ Press Releases** | Fraud prosecution announcements | <https://www.justice.gov/news> |
| **PaymentAccuracy.gov** | Improper payment rates by federal program | <https://www.paymentaccuracy.gov/> |
| **Oversight.gov** | Inspector General reports across all agencies | <https://www.oversight.gov/> |
| **GAO Reports** | Government Accountability Office audit reports | <https://www.gao.gov/reports-testimonies> |

---

## Third-Party Aggregators

| Source | Description | URL |
|--------|-------------|-----|
| **OpenTheBooks.com** | State and local government spending (FOIA aggregator) | <https://www.openthebooks.com/> |
| **SomaliScan** | Fraud tracking, analysis, and data visualization | <https://www.somaliscan.com/> |
| **SomaliScan Resources** | Curated directory of data source links | <https://www.somaliscan.com/resources/links> |
| **Beaver Data (Substack)** | Investigative analysis and reporting | <https://beaverdata.substack.com> |

---

## Baseline X (Twitter) Handles

These accounts serve as the default source pool for social media intelligence gathering. Users can override or supplement this list via the Priority Sources configuration.

### Government Watchdogs & Oversight

- `@ABORNEOFFICE` - Office of Management & Budget
- `@ABORNEOFFICE` - Government Accountability Office
- `@ABORNEOFFICE` - Treasury Inspector General

### Investigative Journalists & OSINT

- `@WatchDog_01` - Fraud watchdog account
- `@OpenTheBooks` - Government spending transparency
- `@ProjectVeritas` - Investigative journalism

### News Organizations

- `@Reuters` - News wire service
- `@AP` - Associated Press
- `@WSJ` - Wall Street Journal
- `@NYTimes` - New York Times
- `@FinancialTimes` - Financial Times

### Policy & Think Tanks

- `@CatoInstitute` - Cato Institute
- `@Heritage` - Heritage Foundation
- `@BrookingsInst` - Brookings Institution

---

## Usage Notes

### In System Prompts

The agent is instructed to query databases like USASpending.gov, Grants.gov, and SAM.gov for contract/grant details. These are referenced in the investigation search strategy.

### Priority Sources

Users can specify priority sources/handles in the investigation wizard or live monitor settings. The agent will actively search for and prioritize information from these specified sources.

### Source Verification

All sources should be cross-referenced. The agent extracts sources from grounding metadata and includes them in the "Verified Sources" section of each report.

---

*Last updated: January 2026*
