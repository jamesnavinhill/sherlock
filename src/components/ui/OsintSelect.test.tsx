import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OsintSelect } from './OsintSelect';

describe('OsintSelect', () => {
  it('opens the menu and commits a clicked option', () => {
    const onChange = vi.fn();

    render(
      <OsintSelect
        ariaLabel="Workspace"
        value="alpha"
        onChange={onChange}
        triggerClassName="px-3 py-2 font-mono text-xs"
        options={[
          { value: 'alpha', label: 'Alpha Workspace' },
          { value: 'beta', label: 'Beta Workspace' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Workspace' }));
    fireEvent.click(screen.getByRole('option', { name: 'Beta Workspace' }));

    expect(onChange).toHaveBeenCalledWith('beta');
    expect(screen.queryByRole('option', { name: 'Beta Workspace' })).not.toBeInTheDocument();
  });

  it('supports keyboard navigation and skips disabled options', () => {
    const onChange = vi.fn();

    render(
      <OsintSelect
        ariaLabel="Provider"
        value="openai"
        onChange={onChange}
        triggerClassName="px-3 py-2 font-mono text-xs"
        options={[
          { value: 'openai', label: 'OpenAI' },
          { value: 'planned', label: 'Planned Provider', disabled: true },
          { value: 'anthropic', label: 'Anthropic' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Provider' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('option', { name: 'OpenAI' }), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('option', { name: 'Anthropic' }), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('anthropic');
  });
});
