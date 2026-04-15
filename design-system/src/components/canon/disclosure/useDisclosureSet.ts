import { useState } from 'react';

export function useDisclosureSet<T extends string>(initialOpen: T[] = []) {
  const [openItems, setOpenItems] = useState<T[]>(initialOpen);

  return {
    openItems,
    isOpen: (id: T) => openItems.includes(id),
    toggle: (id: T) =>
      setOpenItems((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      ),
    setOpenItems,
  };
}
