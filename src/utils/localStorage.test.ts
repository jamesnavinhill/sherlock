import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearApiKeyPromptDismissed,
  hasDismissedApiKeyPrompt,
  markApiKeyPromptDismissed,
} from './localStorage';

describe('api key prompt local storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks dismissal state for the browse-without-key prompt', () => {
    expect(hasDismissedApiKeyPrompt()).toBe(false);

    markApiKeyPromptDismissed();
    expect(hasDismissedApiKeyPrompt()).toBe(true);

    clearApiKeyPromptDismissed();
    expect(hasDismissedApiKeyPrompt()).toBe(false);
  });
});
