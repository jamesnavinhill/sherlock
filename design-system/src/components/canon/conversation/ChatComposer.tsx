import { LoaderCircle, Send } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../controls/Button';
import { Text } from '../typography';
import type { ComposerAction, ComposerContextTag } from './types';

export interface ChatComposerProps {
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
      <div className="ds-chat-composer-shell">
        <div className="ds-chat-composer-body">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="ds-chat-composer-input"
          />
        </div>

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
      </div>
      {footerNote ? (
        <div className="ds-chat-composer-note">
          <Text as="span" variant="quiet">
            {footerNote}
          </Text>
        </div>
      ) : null}
    </form>
  );
}
