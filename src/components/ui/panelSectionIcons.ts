import {
  AlertTriangle,
  FileText,
  Lightbulb,
  Link2,
  Radio,
  Users,
} from 'lucide-react';

export const PANEL_SECTION_ICONS = {
  artifacts: FileText,
  entities: Users,
  followUps: Lightbulb,
  keyFindings: AlertTriangle,
  signals: Radio,
  sources: Link2,
} as const;
