import React from 'react';

import { EmptyState } from '@/components/ui/EmptyState';
import { DockPanel } from '@/components/system/layout/DockPanel';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import {
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_RAIL_BODY_CLASS,
} from '@/components/ui/chrome';
import { GlobalInspectorHeader } from './GlobalInspectorHeader';
import { GlobalInspectorSections } from './GlobalInspectorSections';
import { GlobalInspectorTabs } from './GlobalInspectorTabs';
import type {
  GlobalInspectorEmptyState,
  GlobalInspectorSection,
  GlobalInspectorTab,
} from './globalInspectorTypes';

interface GlobalInspectorPanelProps {
  isOpen: boolean;
  placement?: 'left' | 'right';
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  onClose?: () => void;
  tabs?: GlobalInspectorTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  tabsPlacement?: 'header' | 'section';
  actionItems?: InspectorActionItem[];
  actionRowLayout?: 'grid' | 'wrap';
  actionRowDensity?: 'default' | 'thin';
  actionRowGridColumns?: number;
  sections?: GlobalInspectorSection[];
  emptyState?: GlobalInspectorEmptyState;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  headerActionsPlacement?: 'top' | 'bottom';
  widthClassName?: string;
  widthValue?: string;
  overlayOnDesktop?: boolean;
  className?: string;
}

export const GlobalInspectorPanel: React.FC<GlobalInspectorPanelProps> = ({
  isOpen,
  placement = 'right',
  eyebrow,
  title,
  subtitle: _subtitle,
  headerIcon,
  headerActions,
  onClose,
  tabs = [],
  activeTabId,
  onTabChange,
  tabsPlacement = 'section',
  actionItems = [],
  actionRowLayout = 'grid',
  actionRowDensity = 'thin',
  actionRowGridColumns = 3,
  sections = [],
  emptyState,
  children,
  footer,
  headerActionsPlacement = 'bottom',
  widthClassName = 'w-[var(--osint-dock-width)]',
  widthValue = 'min(var(--osint-shell-rail-width),calc(100vw - 1rem))',
  overlayOnDesktop = false,
  className = '',
}) => {
  const tabControls =
    tabs.length > 0 && activeTabId && onTabChange ? (
      <GlobalInspectorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={onTabChange}
      />
    ) : null;
  const mergedHeaderActions =
    tabsPlacement === 'header' && tabControls ? (
      headerActions ? (
        <div className="flex w-full flex-col items-stretch gap-2">{tabControls}{headerActions}</div>
      ) : (
        <div className="w-full">{tabControls}</div>
      )
    ) : (
      headerActions
    );
  const bodyContent =
    children ?? (
      sections.length > 0 ? (
        <GlobalInspectorSections sections={sections} />
      ) : emptyState ? (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
          className="px-0 py-10"
          panelClassName="max-w-none px-6 py-8"
        />
      ) : null
    );

  return (
    <DockPanel
      isOpen={isOpen}
      placement={placement}
      tone="rail"
      widthClassName={widthClassName}
      widthValue={widthValue}
      overlayOnDesktop={overlayOnDesktop}
      className={className}
    >
      <GlobalInspectorHeader
        eyebrow={eyebrow}
        title={title}
        icon={headerIcon}
        onClose={onClose}
        actions={mergedHeaderActions}
        actionsPlacement={headerActionsPlacement}
      />

      {tabsPlacement === 'section' && tabControls ? (
        <div className="osint-panel-action-row px-4 py-2">
          {tabControls}
        </div>
      ) : null}

      {actionItems.length > 0 ? (
        <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
          <InspectorActionRow
            actions={actionItems}
            layout={actionRowLayout}
            showLabels={false}
            density={actionRowDensity}
            gridColumns={actionRowGridColumns}
          />
        </div>
      ) : null}

      <div className={CHROME_RAIL_BODY_CLASS}>{bodyContent}</div>
      {footer}
    </DockPanel>
  );
};
