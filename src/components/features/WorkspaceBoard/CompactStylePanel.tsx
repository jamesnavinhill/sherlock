import React, { useCallback } from 'react';
import {
  DefaultStylePanel,
  TldrawUiButton,
  TldrawUiButtonIcon,
  TldrawUiPopover,
  TldrawUiPopoverContent,
  TldrawUiPopoverTrigger,
  type TLUiStylePanelProps,
  useEditor,
  useRelevantStyles,
} from 'tldraw';

export const CompactStylePanel: React.FC<TLUiStylePanelProps> = () => {
  const editor = useEditor();
  const relevantStyles = useRelevantStyles();

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        editor.updateInstanceState({ isChangingStyle: false });
      }
    },
    [editor]
  );

  return (
    <div className="pointer-events-auto mr-3 mt-3">
      <TldrawUiPopover id="board-style-menu" onOpenChange={handleOpenChange}>
        <TldrawUiPopoverTrigger>
          <TldrawUiButton
            type="tool"
            aria-label="Board styles"
            data-testid="board-style-menu.button"
            style={{ color: 'var(--osint-primary)' }}
            title="Styles"
          >
            <TldrawUiButtonIcon icon="blob" />
          </TldrawUiButton>
        </TldrawUiPopoverTrigger>
        <TldrawUiPopoverContent side="bottom" align="end">
          <DefaultStylePanel isMobile />
        </TldrawUiPopoverContent>
      </TldrawUiPopover>
    </div>
  );
};
