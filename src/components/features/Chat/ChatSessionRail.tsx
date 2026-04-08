import React from 'react';
import { MessageSquare, Pencil, Trash2, FileText } from 'lucide-react';

import type { ChatMessage, ChatSession } from '@/types';
import { Accordion } from '@/components/ui/Accordion';

interface ChatSessionRailProps {
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

export const ChatSessionRail: React.FC<ChatSessionRailProps> = ({
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
}) => (
  <aside
    className={`${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:-translate-x-0 lg:border-r-0'} fixed inset-y-0 left-0 z-30 w-80 overflow-hidden border-r border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 lg:relative lg:z-0 lg:flex lg:flex-shrink-0 lg:flex-col lg:shadow-none ${leftPanelOpen ? 'lg:w-80' : 'lg:w-0'} backdrop-blur-md`}
  >
    <div className="border-b border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="osint-panel-title">{workspaceTitle}</h2>
    </div>
    <div className="flex-1 overflow-y-auto bg-black/20 p-2 custom-scrollbar">
      <Accordion
        title="Sessions"
        count={workspaceSessions.length}
        icon={MessageSquare}
        isOpen={leftPanelSections.sessions}
        onToggle={onToggleSessions}
        contentClassName={sectionScrollClassName}
      >
        <div className="space-y-1">
          {workspaceSessions.length === 0 ? (
            <p className="osint-body-quiet px-2 py-1 italic">
              No chat history for this workspace yet.
            </p>
          ) : (
            workspaceSessions.map((session) => {
              const sessionGuidedState = getGuidedSessionState(session);
              const sessionMessageCount = chatMessagesBySessionId[session.id]?.length || 0;

              return (
                <div
                  key={session.id}
                  className={`border-l-2 ${
                    activeSessionId === session.id
                      ? 'border-osint-primary bg-zinc-900/50'
                      : 'border-transparent bg-zinc-900/20 hover:border-zinc-600'
                  }`}
                >
                  <button onClick={() => onSelectSession(session)} className="w-full px-2 py-2 text-left">
                    <div className="osint-body-small line-clamp-2">{getSessionTitle(session)}</div>
                    <div className="osint-meta-label mt-1">
                      {sessionGuidedState ? 'Guided' : 'Chat'} / {sessionMessageCount} messages
                    </div>
                    <div className="osint-body-quiet mt-1">{formatDateTime(session.updatedAt)}</div>
                  </button>
                  <div className="flex gap-3 px-2 pb-2">
                    <button
                      onClick={() => onRenameSession(session)}
                      className="osint-meta-label inline-flex items-center gap-1 transition hover:text-white"
                    >
                      <Pencil className="h-3 w-3" />
                      Rename
                    </button>
                    <button
                      onClick={() => onDeleteSession(session)}
                      className="osint-meta-label inline-flex items-center gap-1 osint-danger-inline"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Accordion>

      <Accordion
        title="Workspace Summary"
        icon={FileText}
        isOpen={leftPanelSections.workspace}
        onToggle={onToggleWorkspace}
        contentClassName={sectionScrollClassName}
      >
        <p className="osint-body-small px-2 py-1">
          {workspaceDescription || 'No workspace summary saved yet.'}
        </p>
      </Accordion>
    </div>
  </aside>
);
