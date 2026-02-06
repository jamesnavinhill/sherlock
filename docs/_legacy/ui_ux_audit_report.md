# Sherlock UI/UX Audit & Remediation Report

**Date:** January 27, 2026
**Status:** Audit Complete // Remediation Pending Approval

## Executive Summary

A comprehensive audit was conducted to investigate reported UI/UX issues involving component visibility, accent color functionality, modal styling, and system stability. The root causes have been identified as a combination of disconnected state logic (Accent Slider), aggressive transparency/opacity styles (Icons), and potential null-reference crashes (Live Monitor).

A detailed fix plan is outlined below. No code changes have been applied yet.

---

## 1. Visibility Issues (Hover-Only Elements)

### Issue A: Buttons & Empty States Invisible until Hover

**Components:**

- "Start New Case" button (Empty State)
- "New Case" button (Toolbar/Header)
- "Full Spectrum" button (ReportViewer)

**Observation:** usage of `bg-osint-primary` and `text-black` creates buttons that are invisible or "black on black" until hovered.
**Root Cause:**
The CSS variable `--osint-primary` is derived from the `themeColor` state in `App.tsx`. However, the **Accent Slider** in Settings is **disconnected** from this `themeColor` state. When the app loads, if `themeColor` is uninitialized, invalid, or defaults to a dark value without the user realizing, `var(--osint-primary)` resolves to a dark/transparent color.
The `AccentPicker` updates `accentSettings` state, but this state is **never applied** to the document's CSS variables, rendering the color logic broken.

**Remediation Plan:**

1. **Connect Accent Slider:** Update `App.tsx` (or `Settings/index.tsx`) to ensure that `onAccentChange` immediately updates the `--osint-primary` CSS variable and the persisted `themeColor`.
2. **Robust Fallback:** In `index.css`, ensure `--osint-primary` has a high-visibility fallback color (Zinc-200) even if the variable fails to load.

### Issue B: Case Dossier Icon Visibility

**Components:**

- Case Card Icons in `Archives.tsx`
- Dossier Panel Icons

**Root Cause:**
The "Folder" icon in the `Archives` case card has a hardcoded class `opacity-5 group-hover:opacity-10`.

- **Code:** `className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 ..."`
- 5% opacity is effectively invisible on standard displays and monitors with lower contrast ratios.

**Remediation Plan:**

1. **Increase Opacity:** Change default opacity from `opacity-5` to `opacity-20` or `opacity-30` to ensure the icon is visible as a subtle watermark without requiring hover.

---

## 2. Functional & Styling Issues

### Issue C: Custom Accent Slider Not Working

**Components:**

- `Settings/index.tsx`
- `App.tsx`

**Root Cause:**
As noted in Issue A, `App.tsx` manages `accentSettings` but does not trigger a side-effect to update `themeColor` or the DOM. The distinct separation between "Theme Color" (a hex string) and "Accent Settings" (HSL/OKLCH values) has resulted in the slider being purely cosmetic within the Settings panel.

**Remediation Plan:**

1. **Unified State Logic:** Modify `handleAccentChange` in `App.tsx` to automatically generate the hex color string from the new accent settings and apply it to `themeColor`, syncing the visual system immediately.

### Issue D: Live Monitor Black Screen (Crash)

**Components:**

- `LiveMonitor/index.tsx`
- `services/gemini.ts`

**Root Cause:**
The reported "reading 'length' of undefined" error occurs during the data fetch cycle.

1. `getLiveIntel` attempts to parse JSON from the AI model.
2. If the model returns an empty response or invalid JSON, the error handling might return `undefined` or a malformed object instead of a rigorous empty array.
3. In `LiveMonitor.tsx`, `const uniqueNewIntel = newIntel.filter(...)` or checks on `uniqueNewIntel.length` fail if `newIntel` is corrupted.

**Remediation Plan:**

1. **Fail-Safe Service:** Update `getLiveIntel` in `gemini.ts` to **guarantee** an array return type `[]` even in cataclysmic failure modes (JSON parse error, API 500, etc.).
2. **Guard Clauses:** Add optional chaining (`?.`) checks in `LiveMonitor.tsx` before accessing `.length` or `.filter`.

### Issue E: Notification Redundancy

**Components:**

- `App.tsx` (`addToast` calls)
- `Sidebar.tsx` (Task list)

**Observation:**
Users see a "Task Started" toast popup at the bottom right, while simultaneously seeing the task appear in the Sidebar Ops/Task Viewer.

**Remediation Plan:**

1. **User Preference:** Add a "Quiet Mode" or "Disable Notifications" toggle in Settings -> General.
2. **Selective Suppression:** Remove `addToast` calls specifically for "Investigation Started" and "Investigation Complete" events, relying on the Sidebar's visual cues (spinners/checkmarks) as the primary feedback mechanism. Toasts should be reserved for **Errors** and **System Alerts** only.

### Issue F: Finder (Global Search) Background Transparency

**Components:**

- `GlobalSearch.tsx`

**Observation:**
The Global Search modal uses `bg-black/80` (80% opacity), making it significantly more transparent than the "Wizard" (`TaskSetupModal`) or "Scanner Config" (`SettingsPanel`) which use opaque branded colors (`bg-osint-panel` / `#09090b`).

**Remediation Plan:**

1. **Standardize Style:** Update `GlobalSearch.tsx` to use `bg-osint-panel` and `border-zinc-800` to match the design system of other modal surfaces.

---

### Issue F: Finder (Global Search) Background Transparency

**Components:**

- `GlobalSearch.tsx`

**Observation:**
The Global Search modal uses `bg-black/80` (80% opacity), making it significantly more transparent than the "Wizard" (`TaskSetupModal`) or "Scanner Config" (`SettingsPanel`) which use opaque branded colors (`bg-osint-panel` / `#09090b`).

**Remediation Plan:**

1. **Standardize Style:** Update `GlobalSearch.tsx` to use `bg-osint-panel` and `border-zinc-800` to match the design system of other modal surfaces.

---

## 3. Data Persistence Issues (CRITICAL)

### Issue G: Cases Not Persisting Across Sessions

**Components:**

- `store/caseStore.ts`
- `services/db/repositories/CaseRepository.ts`

**Root Cause:**
The application's state management (`caseStore.ts`) retrieves data from the database upon initialization (`initializeStore`) but **fails to write back to the database** when new data is created.
The `archiveReport` action updates the local Zustand state (`set({ archives, cases })`) but does not call `CaseRepository.createReport()` or `CaseRepository.createCase()`. This means all new investigations exist only in RAM and are lost when the page is refreshed or closed.

**Additional Findings (Global Persistence Failure):**
Further audit reveals that similar failures exist for:

- **Tasks**: `addTask`, `completeTask`, `failTask` only update local state.
- **Scopes**: Custom scopes added via UI are not saved to DB.
- **Templates**: No database table exists for templates.
- **Manual Graph Data**: Manual nodes/links added to graphs are not persisted.

**Remediation Plan:**

1. **Schema Updates**: Add missing tables (`templates`, `manual_nodes`, `manual_links`) to `schema.ts` and `migrations_sql.ts`.
2. **Repository Creation**: Create `TemplateRepository` and `ManualDataRepository`.
3. **Comprehensive Wiring**: Update `caseStore.ts` to explicitly call the appropriate Repository `create`/`update`/`delete` methods for ALL state-changing actions (Tasks, Scopes, Templates, Cases, Reports, Manual Data).
4. **Add Error Handling**: Ensure these database calls are wrapped in try/catch blocks.

---

## 4. Pending Questions for User

1. **Notifications:** Would you prefer to completely disable all notifications (including errors) via a "Quiet Mode" toggle, or should we just programmatically remove the specific "Task Started/Finished" toasts?
2. **Default Accent:** Do you have a preferred default accent color (Hex Code) that should be enforced if the user's configuration is reset or invalid? (Currently defaults to Zinc-200 Light Gray).

## 4. Next Steps

Upon your approval, I can proceed with the **Remediation Phase**. The work will be executed in the following order:

1. **Fix Critical Crash:** Live Monitor safety guards.
2. **Fix Styling Core:** Connect Accent Slider & Fix CSS Variables (Solves invisible buttons).
3. **Fix Visual Polish:** Update Global Search transparency and Icon opacity.
4. **Fix UX Noise:** Adjust notification logic.

*End of Report*
