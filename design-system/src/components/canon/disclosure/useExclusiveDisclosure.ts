import { useState } from 'react';

export function useExclusiveDisclosure<T extends string>(initialOpen: T | null) {
  const [openId, setOpenId] = useState<T | null>(initialOpen);

  return {
    openId,
    isOpen: (id: T) => openId === id,
    toggle: (id: T) => setOpenId((current) => (current === id ? null : id)),
    setOpenId,
  };
}
