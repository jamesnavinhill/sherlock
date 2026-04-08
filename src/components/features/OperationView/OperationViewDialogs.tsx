import React from 'react';

import type {
  Artifact,
  InvestigationLaunchRequest,
  InvestigationRunConfig,
  InvestigationScope,
  SystemConfig,
} from '@/types';
import { ModalShell } from '@/components/ui/ModalShell';
import { RunSetupModal } from '../Runs/RunSetupModal';

interface LeadToAnalyzeState {
  text: string;
  sourceFollowUpId?: string;
  context?: { topic: string; summary: string };
  inheritedConfig?: Partial<SystemConfig>;
  inheritedScopeId?: string;
  inheritedDateRange?: InvestigationRunConfig['dateRangeOverride'];
  parentArtifactId?: string;
}

interface OperationViewDialogsProps {
  leadToAnalyze: LeadToAnalyzeState | null;
  report: Artifact | null;
  isNewCaseModalOpen: boolean;
  showSaveTemplateModal: boolean;
  templateName: string;
  onTemplateNameChange: (value: string) => void;
  onCloseLeadDialog: () => void;
  onCloseNewCaseDialog: () => void;
  onCloseSaveTemplateDialog: () => void;
  onDeepDive: (request: InvestigationLaunchRequest) => void;
  onStartNewCase: (request: InvestigationLaunchRequest) => void;
  onExecuteSaveTemplate: () => void;
  resolveScope: (scopeId?: string) => InvestigationScope | undefined;
}

export const OperationViewDialogs: React.FC<OperationViewDialogsProps> = ({
  leadToAnalyze,
  report,
  isNewCaseModalOpen,
  showSaveTemplateModal,
  templateName,
  onTemplateNameChange,
  onCloseLeadDialog,
  onCloseNewCaseDialog,
  onCloseSaveTemplateDialog,
  onDeepDive,
  onStartNewCase,
  onExecuteSaveTemplate,
  resolveScope,
}) => (
  <>
    {leadToAnalyze && report ? (
      <RunSetupModal
        initialTopic={leadToAnalyze.text}
        initialContext={leadToAnalyze.context}
        initialScopeId={leadToAnalyze.inheritedScopeId}
        initialConfigOverride={leadToAnalyze.inheritedConfig}
        initialDateRangeOverride={leadToAnalyze.inheritedDateRange}
        inheritanceHint="Inherited from parent report. Change settings below to override this run."
        onCancel={onCloseLeadDialog}
        onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
          onDeepDive({
            topic,
            parentContext: leadToAnalyze.context,
            configOverride: {
              ...(leadToAnalyze.inheritedConfig || {}),
              ...(configOverride || {}),
            },
            preseededEntities,
            scope: scope || resolveScope(leadToAnalyze.inheritedScopeId),
            dateRangeOverride: dateRange || leadToAnalyze.inheritedDateRange,
            launchSource: 'OPERATION_LEAD_MODAL',
            sourceFollowUpId: leadToAnalyze.sourceFollowUpId,
            parentArtifactId: leadToAnalyze.parentArtifactId,
          });
          onCloseLeadDialog();
        }}
      />
    ) : null}

    {isNewCaseModalOpen ? (
      <RunSetupModal
        initialTopic=""
        onCancel={onCloseNewCaseDialog}
        onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
          onStartNewCase({
            topic,
            configOverride,
            preseededEntities,
            scope,
            dateRangeOverride: dateRange,
            launchSource: 'OPERATION_NEW_CASE',
          });
          onCloseNewCaseDialog();
        }}
      />
    ) : null}

    {showSaveTemplateModal ? (
      <ModalShell
        title="Save As Protocol Template"
        description="Capture the current investigation target as a reusable protocol template."
        onClose={onCloseSaveTemplateDialog}
        widthClassName="max-w-md"
        footer={
          <div className="flex gap-3">
            <button
              onClick={onCloseSaveTemplateDialog}
              className="flex-1 border border-zinc-800 py-2 osint-meta-label text-zinc-500 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onExecuteSaveTemplate}
              className="osint-button-primary flex-1 py-2 osint-meta-label-strong"
            >
              Save Protocol
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block osint-meta-label">Protocol Name</label>
            <input
              type="text"
              value={templateName}
              onChange={(event) => onTemplateNameChange(event.target.value)}
              placeholder="e.g., Financial Audit Protocol"
              className="w-full border border-zinc-800 bg-black p-3 osint-body-small text-white outline-none transition-colors focus:border-osint-primary"
              autoFocus
            />
          </div>
          <div className="border border-zinc-800 bg-zinc-800/50 p-3">
            <div className="mb-1 osint-meta-label">Investigation Target</div>
            <div className="truncate osint-meta-value text-zinc-300">&quot;{report?.topic}&quot;</div>
          </div>
        </div>
      </ModalShell>
    ) : null}
  </>
);
