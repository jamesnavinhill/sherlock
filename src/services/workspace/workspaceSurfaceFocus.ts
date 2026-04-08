export interface NetworkEntityFocusRequest {
  workspaceId: string;
  entityName: string;
}

const NETWORK_ENTITY_FOCUS_EVENT = 'sherlock:network-focus-entity';

export const requestNetworkEntityFocus = (detail: NetworkEntityFocusRequest) => {
  window.dispatchEvent(
    new CustomEvent<NetworkEntityFocusRequest>(NETWORK_ENTITY_FOCUS_EVENT, { detail })
  );
};

export const addNetworkEntityFocusListener = (
  listener: (detail: NetworkEntityFocusRequest) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NetworkEntityFocusRequest>;
    if (!customEvent.detail) return;
    listener(customEvent.detail);
  };

  window.addEventListener(NETWORK_ENTITY_FOCUS_EVENT, handler);
  return () => window.removeEventListener(NETWORK_ENTITY_FOCUS_EVENT, handler);
};
