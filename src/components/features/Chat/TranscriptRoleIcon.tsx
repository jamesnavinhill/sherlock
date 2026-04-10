import React from 'react';

import { AppIcon } from '@/lib/appIcons';

interface TranscriptRoleIconProps {
  role: 'assistant' | 'user';
}

export const TranscriptRoleIcon: React.FC<TranscriptRoleIconProps> = ({ role }) => {
  if (role === 'assistant') {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px]">
        <img
          src="/logo-dark.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-[1.9] object-contain"
        />
      </span>
    );
  }

  return (
    <AppIcon
      iconId="user"
      className="h-4 w-4 shrink-0 text-osint-primary"
      size={16}
      strokeWidth={1.9}
    />
  );
};
