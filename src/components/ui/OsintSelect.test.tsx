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
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: 'Beta Workspace' }));

    expect(onChange).toHaveBeenCalledWith('beta');
    expect(screen.queryByRole('option', { name: 'Beta Workspace' })).not.toBeInTheDocument();
  });

  it('keeps the legacy menu chrome available for workbench selectors', () => {
    render(
      <OsintSelect
        ariaLabel="Theme background pattern"
        value="alpha"
        onChange={vi.fn()}
        menuStyle="legacy"
        triggerClassName="px-3 py-2 font-mono text-xs"
        options={[
          { value: 'alpha', label: 'Alpha Workspace' },
          { value: 'beta', label: 'Beta Workspace' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Theme background pattern' }));

    expect(screen.queryByText('Theme background pattern')).not.toBeInTheDocument();
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

  it('marks active and selected options so shared accent menu styling can apply', () => {
    render(
      <OsintSelect
        ariaLabel="Workspace"
        value="alpha"
        onChange={vi.fn()}
        triggerClassName="px-3 py-2 font-mono text-xs"
        options={[
          { value: 'alpha', label: 'Alpha Workspace' },
          { value: 'beta', label: 'Beta Workspace' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Workspace' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(screen.getByRole('option', { name: 'Alpha Workspace' })).toHaveAttribute(
      'data-active',
      'true'
    );
    expect(screen.getByRole('option', { name: 'Alpha Workspace' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('auto-places portalled menus above the trigger when there is not enough space below', () => {
    const onChange = vi.fn();

    render(
      <OsintSelect
        ariaLabel="Font Family"
        value="alpha"
        onChange={onChange}
        triggerClassName="px-3 py-2 font-mono text-xs"
        portalledMenu
        options={[
          { value: 'alpha', label: 'Alpha Workspace' },
          { value: 'beta', label: 'Beta Workspace' },
        ]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Font Family' });
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 480,
    });

    Object.defineProperty(trigger.parentElement as HTMLDivElement, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 430,
          bottom: 462,
          left: 24,
          right: 224,
          width: 200,
          height: 32,
        }) as DOMRect,
    });

    fireEvent.click(trigger);

    const menu = screen.getByRole('listbox');
    expect(menu).toHaveStyle({ transform: 'translateY(-100%)' });

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });
});
