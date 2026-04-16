import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Button, type ButtonVariant } from './Button';

export interface CopyButtonProps {
  text: string;
  variant?: ButtonVariant;
}

export function CopyButton({ text, variant = 'toolbar' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const label = copied ? 'Copied to clipboard' : 'Copy to clipboard';

  return (
    <Button
      variant={variant}
      leadingIcon={<Copy size={14} />}
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? 'Copied' : null}
    </Button>
  );
}
