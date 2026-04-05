import React, { useCallback } from 'react';
import {
  DefaultColorStyle,
  DefaultStylePanel,
  getDefaultColorTheme,
  TldrawUiButton,
  TldrawUiButtonIcon,
  TldrawUiPopover,
  TldrawUiPopoverContent,
  TldrawUiPopoverTrigger,
  type TLDefaultColorStyle,
  type TLUiStylePanelProps,
  useEditor,
  useRelevantStyles,
} from 'tldraw';

export const CompactStylePanel: React.FC<TLUiStylePanelProps> = () => {
  const editor = useEditor();
  const relevantStyles = useRelevantStyles();
  const color = relevantStyles?.get(DefaultColorStyle);
  const theme = getDefaultColorTheme({ isDarkMode: editor.user.getIsDarkMode() });
  const currentColor = (
    color?.type === 'shared' ? theme[color.value as TLDefaultColorStyle] : theme.black
  ).solid;

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
            style={{ color: currentColor }}
            title="Styles"
          >
            <TldrawUiButtonIcon icon={color?.type === 'mixed' ? 'mixed' : 'blob'} />
          </TldrawUiButton>
        </TldrawUiPopoverTrigger>
        <TldrawUiPopoverContent side="bottom" align="end">
          <DefaultStylePanel isMobile />
        </TldrawUiPopoverContent>
      </TldrawUiPopover>
    </div>
  );
};
