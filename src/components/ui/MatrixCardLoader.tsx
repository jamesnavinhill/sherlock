import React from 'react';
import { SkeletonPulse } from './SkeletonLoaders';
import { SystemStatusBeacon } from './SystemStatusBeacon';

export const MatrixCardLoader = ({ active }: { active: boolean }) => {
  return (
    <div className="osint-raised-surface flex h-full min-h-[17rem] flex-col gap-4 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <SkeletonPulse className="h-5 w-16 rounded-none" />
        <SkeletonPulse className="h-3 w-20 rounded-none" />
      </div>
      <div className="space-y-3">
        <SkeletonPulse className="h-5 w-4/5 rounded-none" />
        <SkeletonPulse className="h-3 w-full rounded-none" />
        <SkeletonPulse className="h-3 w-11/12 rounded-none" />
        <SkeletonPulse className="h-3 w-3/4 rounded-none" />
      </div>
      <div className="flex flex-1 items-center">
        <div className="w-full border border-zinc-800 bg-zinc-950/50 px-4 py-8">
          <SystemStatusBeacon active={active} />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
        <SkeletonPulse className="h-3 w-16 rounded-none" />
        <SkeletonPulse className="h-3 w-24 rounded-none" />
      </div>
    </div>
  );
};
