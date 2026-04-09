import React from 'react';
import { MessageSquare, Pencil, Trash2, FileText } from 'lucide-react';

import type { ChatMessage, ChatSession } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import {
  CHROME_ACTION_BUTTON_CLASS,
  CHROME_NESTED_ITEM_ACTION_ROW_CLASS,
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_BUTTON_CLASS,
  CHROME_NESTED_ITEM_META_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  getRailAccordionClassName,
} from '@/components/ui/chrome';

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
}) => {
  return (
    <aside
      className={`${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:-translate-x-0 lg:border-r-0'} fixed inset-y-0 left-0 z-30 w-80 overflow-hidden border-r border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 lg:relative lg:z-0 lg:flex lg:flex-shrink-0 lg:flex-col lg:shadow-none ${leftPanelOpen ? 'lg:w-80' : 'lg:w-0'} backdrop-blur-md`}
    >
      <div className={CHROME_PANEL_HEADER_CLASS}>
        <div className="osint-eyebrow">Library</div>
        <h2 className="mt-1 osint-panel-title">{workspaceTitle || 'Workspace Chat'}</h2>
      </div>
      <div className={`${CHROME_RAIL_BODY_CLASS} bg-black/20`}>
        <Accordion
          title="Sessions"
          count={workspaceSessions.length}
          icon={MessageSquare}
          isOpen={leftPanelSections.sessions}
          onToggle={onToggleSessions}
          className={getRailAccordionClassName(leftPanelSections.sessions)}
          contentClassName={sectionScrollClassName}
        >
          <div className="space-y-2">
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
                    className={CHROME_NESTED_ITEM_BUTTON_CLASS}
                    data-active={activeSessionId === session.id}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectSession(session)}
                      className="w-full text-left"
                    >
                      <div className="osint-title-inline line-clamp-2 text-zinc-200">
                        {getSessionTitle(session)}
                      </div>
                      <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>
                        <span className="osint-meta-label">
                          {sessionGuidedState ? 'Guided' : 'Chat'}
                        </span>
                        <span className="osint-meta-label">{sessionMessageCount} messages</span>
                      </div>
                      <div className={CHROME_NESTED_ITEM_BODY_CLASS}>
                        Updated {formatDateTime(session.updatedAt)}
                      </div>
                    </button>
                    <div className={CHROME_NESTED_ITEM_ACTION_ROW_CLASS}>
                      <button
                        type="button"
                        onClick={() => onRenameSession(session)}
                        className={CHROME_ACTION_BUTTON_CLASS}
                      >
                        <Pencil className="h-4 w-4" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSession(session)}
                        className={`${CHROME_ACTION_BUTTON_CLASS} osint-danger-inline`}
                      >
                        <Trash2 className="h-4 w-4" />
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
          className={getRailAccordionClassName(leftPanelSections.workspace)}
          contentClassName={sectionScrollClassName}
        >
          <div className="space-y-2">
            <div className="osint-panel-item p-3">
              <p className={CHROME_NESTED_ITEM_BODY_CLASS}>
                {workspaceDescription || 'No workspace summary saved yet.'}
              </p>
            </div>
          </div>
        </Accordion>
      </div>
    </aside>
  );
};
