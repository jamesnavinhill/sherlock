import React from 'react';

import type { InvestigationLaunchRequest } from '@/types';
import type { InvestigationScope } from '@/types';
import { TemplateGallery } from './TemplateGallery';
import { buildLaunchRequestFromTemplate } from '@/components/features/Runs/runtimeConfigMapping';
import { loadSystemConfig } from '@/config/systemConfig';

interface SettingsTemplatesTabProps {
  customScopes: InvestigationScope[];
  onStartCase: (request: InvestigationLaunchRequest) => void;
}

export const SettingsTemplatesTab: React.FC<SettingsTemplatesTabProps> = ({
  customScopes,
  onStartCase,
}) => (
  <TemplateGallery
    onApply={(template) => {
      onStartCase(
        buildLaunchRequestFromTemplate({
          template,
          customScopes,
          fallbackConfig: loadSystemConfig(),
        })
      );
    }}
  />
);
