import React from 'react';
import { Globe } from '@/components/ui/globe';

export default function FloatingGlobeWidget() {
  return (
    <div className="fixed -bottom-36 -right-36 lg:-bottom-44 lg:-right-44 xl:-bottom-40 xl:-right-40 z-10 hidden md:block pointer-events-auto select-none">
      {/* Clean Full-Size 3D Globe with zero shadow/shading artifacts */}
      <div className="relative w-[480px] h-[480px] lg:w-[560px] lg:h-[560px] xl:w-[640px] xl:h-[640px] flex items-center justify-center">
        <Globe className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}
