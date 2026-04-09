import React from 'react';

import {
  CHROME_PANEL_TAB_ROW_CLASS,
  getChromePanelTabButtonClass,
} from '@/components/ui/chrome';
import type { GlobalInspectorTab } from './globalInspectorTypes';

interface GlobalInspectorTabsProps {
  activeTabId: string;
  density?: 'default' | 'thin';
  onTabChange: (tabId: string) => void;
  tabs: GlobalInspectorTab[];
}

export const GlobalInspectorTabs: React.FC<GlobalInspectorTabsProps> = ({
  activeTabId,
  density = 'thin',
  onTabChange,
  tabs,
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className={CHROME_PANEL_TAB_ROW_CLASS}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={tab.disabled}
          onClick={() => onTabChange(tab.id)}
          className={`${getChromePanelTabButtonClass(activeTabId === tab.id, density)} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
