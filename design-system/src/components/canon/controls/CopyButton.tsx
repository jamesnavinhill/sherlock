import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from './Button';

export interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="toolbar"
      leadingIcon={<Copy size={14} />}
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
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}
