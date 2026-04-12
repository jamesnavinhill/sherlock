import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders the shared grid background and routes CTA clicks through', () => {
    const onGetStarted = vi.fn();

    render(
      <LandingPage themeMode="dark" onToggleTheme={vi.fn()} onGetStarted={onGetStarted} />
    );

    expect(screen.getByTestId('landing-dot-grid-background')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /open workspace/i })[0]);

    expect(onGetStarted).toHaveBeenCalledTimes(1);
  });
});
