import { Bot, LoaderCircle, Radar, UserRound } from 'lucide-react';

import { Badge } from '../controls/Badge';
import { Button } from '../controls/Button';
import { AccordionSection } from '../disclosure/AccordionSection';
import { useDisclosureSet } from '../disclosure/useDisclosureSet';
import { EmptyStateCard } from '../surfaces/EmptyStateCard';
import { Text } from '../typography';
import { cx } from '../utils/cx';
import type { TranscriptMessage } from './types';

export interface ChatTranscriptProps {
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
            {message.meta ? (
              <Text as="span" variant="quiet">
                {message.meta}
              </Text>
            ) : null}
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
                    <Text as="div" variant="quiet">
                      {section.content}
                    </Text>
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
