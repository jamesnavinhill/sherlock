export const OMNIBOX_FOCUS_EVENT = 'sherlock:omnibox-focus';

export const requestOmniboxFocus = () => {
  window.dispatchEvent(new CustomEvent(OMNIBOX_FOCUS_EVENT));
};
