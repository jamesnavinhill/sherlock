import { Bot, LoaderCircle, Radar, Send, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

import { AccordionSection, useDisclosureSet } from './disclosure';
import { Badge, Button, cx } from './controls';
import { EmptyStateCard } from './surfaces';

interface ComposerAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
}

interface ComposerContextTag {
  id: string;
  label: string;
  meta?: string;
}

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  busy?: boolean;
  leadingActions?: ComposerAction[];
  contextTags?: ComposerContextTag[];
  footerNote?: ReactNode;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  busy = false,
  leadingActions = [],
  contextTags = [],
  footerNote,
}: ChatComposerProps) {
  return (
    <form
      className="ds-chat-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="ds-chat-composer-input"
      />

      {contextTags.length > 0 ? (
        <div className="ds-chat-context-row">
          {contextTags.map((tag) => (
            <span key={tag.id} className="ds-chat-context-chip">
              <span className="truncate">{tag.label}</span>
              {tag.meta ? <span className="ds-chat-context-meta">{tag.meta}</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="ds-chat-composer-footer">
        <div className="ds-toolbar-inline ds-wrap">
          {leadingActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              leadingIcon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
        <Button
          type="submit"
          variant="primary"
          leadingIcon={busy ? <LoaderCircle size={16} className="ds-spin" /> : <Send size={16} />}
          disabled={busy || !value.trim()}
        >
          {busy ? 'Sending' : 'Send'}
        </Button>
      </div>
      {footerNote ? <div className="ds-body-quiet">{footerNote}</div> : null}
    </form>
  );
}

interface TranscriptSection {
  id: string;
  label: string;
  meta?: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
}

interface TranscriptAction {
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

interface ChatTranscriptProps {
  messages: TranscriptMessage[];
  emptyTitle?: string;
  emptyDescription?: string;
}

const roleIcon = (role: TranscriptMessage['role'], status: TranscriptMessage['status']) => {
  if (status === 'streaming') {
    return <LoaderCircle size={16} className="ds-spin" />;
  }

  if (role === 'assistant') {
    return <Bot size={16} />;
  }

  if (role === 'system') {
    return <Radar size={16} />;
  }

  return <UserRound size={16} />;
};

export function ChatTranscript({
  messages,
  emptyTitle = 'No conversation yet',
  emptyDescription = 'Use the composer to seed a transcript, preview disclosure sections, and verify the canon conversation layout.',
}: ChatTranscriptProps) {
  const defaultOpenSections = messages.flatMap((message) =>
    (message.sections ?? [])
      .filter((section) => section.defaultOpen)
      .map((section) => `${message.id}:${section.id}`)
  );
  const disclosures = useDisclosureSet<string>(defaultOpenSections);

  if (messages.length === 0) {
    return (
      <EmptyStateCard
        icon={<Bot size={22} />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="ds-chat-transcript">
      {messages.map((message) => (
        <article
          key={message.id}
          className="ds-transcript-message"
          data-role={message.role}
          data-status={message.status ?? 'idle'}
        >
          <div className="ds-transcript-head">
            <div className="ds-transcript-role">
              {roleIcon(message.role, message.status)}
              <span>{message.role === 'assistant' ? 'Canon' : message.role}</span>
            </div>
            {message.meta ? <span className="ds-body-quiet">{message.meta}</span> : null}
          </div>

          <div className="ds-transcript-body">{message.body}</div>

          {message.tags?.length ? (
            <div className="ds-chip-grid">
              {message.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          {message.sections?.length ? (
            <div className="ds-stack">
              {message.sections.map((section) => {
                const disclosureId = `${message.id}:${section.id}`;

                return (
                  <AccordionSection
                    key={section.id}
                    title={section.label}
                    meta={section.meta}
                    isOpen={disclosures.isOpen(disclosureId)}
                    onToggle={() => disclosures.toggle(disclosureId)}
                    compact
                  >
                    <div className="ds-body-quiet">{section.content}</div>
                  </AccordionSection>
                );
              })}
            </div>
          ) : null}

          {message.actions?.length ? (
            <div className={cx('ds-toolbar-inline', 'ds-wrap')}>
              {message.actions.map((action) => (
                <Button
                  key={action.id}
                  variant="toolbar"
                  size="sm"
                  leadingIcon={action.icon}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
