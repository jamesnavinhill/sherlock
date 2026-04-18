import React from 'react';
import { MessageSquare, FileText } from 'lucide-react';

import type { ChatMessage, ChatSession } from '@/types';
import { LibraryRailSections } from '@/components/features/LibraryRail/LibraryRailSections';
import { LibraryRailShell } from '@/components/features/LibraryRail/LibraryRailShell';
import type { LibraryRailSection } from '@/components/features/LibraryRail/libraryRailTypes';
import { CHROME_THIN_NESTED_ITEM_CLASS } from '@/components/ui/chrome';

interface ChatLibraryRailProps {
  activeSessionId: string | null;
  leftPanelOpen: boolean;
  leftPanelSections: {
    sessions: boolean;
    workspace: boolean;
  };
  workspaceDescription?: string;
  workspaceSessions: ChatSession[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  workspaceTitle: string;
  sectionScrollClassName: string;
  getGuidedSessionState: (session: ChatSession) => unknown;
  getSessionTitle: (session: ChatSession) => string;
  formatDateTime: (value: number) => string;
  onToggleSessions: () => void;
  onToggleWorkspace: () => void;
  onSelectSession: (session: ChatSession) => void;
  onRenameSession: (session: ChatSession) => void;
  onDeleteSession: (session: ChatSession) => void;
}

export const ChatLibraryRail: React.FC<ChatLibraryRailProps> = ({
  activeSessionId,
  leftPanelOpen,
  leftPanelSections,
  workspaceDescription,
  workspaceSessions,
  chatMessagesBySessionId,
  workspaceTitle,
  sectionScrollClassName,
  getGuidedSessionState,
  getSessionTitle,
  formatDateTime,
  onToggleSessions,
  onToggleWorkspace,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const sections: LibraryRailSection[] = [
    {
      id: 'sessions',
      title: 'Sessions',
      count: workspaceSessions.length,
      icon: MessageSquare,
      isOpen: leftPanelSections.sessions,
      onToggle: onToggleSessions,
      contentClassName: sectionScrollClassName,
      entries: workspaceSessions.map((session) => {
        const sessionGuidedState = getGuidedSessionState(session);
        const sessionMessageCount = chatMessagesBySessionId[session.id]?.length || 0;

        return {
          id: session.id,
          title: getSessionTitle(session),
          meta: (
            <>
              <span className="osint-meta-label">{sessionGuidedState ? 'Guided' : 'Chat'}</span>
              <span className="osint-meta-label">{sessionMessageCount} messages</span>
            </>
          ),
          description: `Updated ${formatDateTime(session.updatedAt)}`,
          onClick: () => onSelectSession(session),
          isActive: activeSessionId === session.id,
          actions: [
            {
              id: `${session.id}-rename`,
              label: 'Rename',
              onClick: () => onRenameSession(session),
            },
            {
              id: `${session.id}-delete`,
              label: 'Delete',
              onClick: () => onDeleteSession(session),
              className: 'osint-danger-inline',
            },
          ],
        };
      }),
      emptyState: (
        <p className="osint-body-quiet px-2 py-1 italic">No chat history for this workspace yet.</p>
      ),
    },
    {
      id: 'workspace',
      title: 'Workspace Summary',
      icon: FileText,
      isOpen: leftPanelSections.workspace,
      onToggle: onToggleWorkspace,
      contentClassName: sectionScrollClassName,
      content: (
        <div className="space-y-1">
          <div className={CHROME_THIN_NESTED_ITEM_CLASS}>
            <p className="osint-body-quiet text-zinc-500">
              {workspaceDescription || 'No workspace summary saved yet.'}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <LibraryRailShell
      isOpen={leftPanelOpen}
      title={workspaceTitle || 'Workspace Chat'}
    >
      <LibraryRailSections sections={sections} />
    </LibraryRailShell>
  );
};
