import type { ReactNode } from 'react';

export interface ComposerAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface ComposerContextTag {
  id: string;
  label: string;
  meta?: string;
}

export interface TranscriptSection {
  id: string;
  label: string;
  meta?: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
}

export interface TranscriptAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export interface TranscriptMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  body: ReactNode;
  meta?: ReactNode;
  tags?: string[];
  status?: 'idle' | 'streaming';
  sections?: TranscriptSection[];
  actions?: TranscriptAction[];
}
