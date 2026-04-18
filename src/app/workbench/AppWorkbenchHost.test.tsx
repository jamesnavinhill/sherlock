import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';

import { AppWorkbenchHost } from './AppWorkbenchHost';
import { AppWorkbenchHostProvider } from './AppWorkbenchHostProvider';
import { useAppWorkbenchHost, useRegisterAppWorkbenchPanel } from './useAppWorkbenchHost';

const RegisteredWorkbench = () => {
  const panel = React.useMemo(
    () => ({
      id: 'settings-theme-workbench',
      title: 'Theme Workspace',
      description: 'Shared utility panel content.',
      defaultOpen: true,
      content: <div>Theme Summary Body</div>,
    }),
    []
  );

  useRegisterAppWorkbenchPanel(panel);

  return null;
};

const WorkbenchControls = () => {
  const { hasPanel, isOpen, placement, toggleWorkbench } = useAppWorkbenchHost();

  return (
    <div>
      <div>{hasPanel ? 'available' : 'missing'}</div>
      <div>{isOpen ? 'open' : 'closed'}</div>
      <div>{placement}</div>
      <button type="button" onClick={toggleWorkbench}>
        Toggle Host
      </button>
    </div>
  );
};

describe('AppWorkbenchHost', () => {
  it('opens registered workbench content by default and exposes right placement', () => {
    render(
      <AppWorkbenchHostProvider>
        <RegisteredWorkbench />
        <WorkbenchControls />
        <AppWorkbenchHost />
      </AppWorkbenchHostProvider>
    );

    expect(screen.getByText('available')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('right')).toBeInTheDocument();
    expect(screen.getByText('Theme Workspace')).toBeInTheDocument();

    const panel = screen.getByText('Theme Summary Body').closest('aside');
    expect(panel).toHaveAttribute('data-placement', 'right');
    expect(panel).toHaveAttribute('data-state', 'open');
  });

  it('toggles visibility and updates placement through the shared host chrome', () => {
    render(
      <AppWorkbenchHostProvider>
        <RegisteredWorkbench />
        <WorkbenchControls />
        <AppWorkbenchHost />
      </AppWorkbenchHostProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Host' }));
    expect(screen.getByText('closed')).toBeInTheDocument();

    let panel = screen.getByText('Theme Summary Body').closest('aside');
    expect(panel).toHaveAttribute('data-state', 'closed');

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Host' }));
    expect(screen.getByText('open')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dock workbench left' }));
    expect(screen.getByText('left')).toBeInTheDocument();

    panel = screen.getByText('Theme Summary Body').closest('aside');
    expect(panel).toHaveAttribute('data-placement', 'left');
  });
});
