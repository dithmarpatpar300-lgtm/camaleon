"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTransmuteRoute, releaseHeavySession } from "@/lib/transmutation/release-heavy-session";

type TransmutationRouteLifecycleProps = {
  recycleWorker: () => void;
};

/**
 * When navigation leaves any /transmute/* route, recycle the Wasm worker and
 * reset auxiliary session state so large ArrayBuffers and linear memory are released.
 */
export function TransmutationRouteLifecycle({
  recycleWorker,
}: TransmutationRouteLifecycleProps) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev !== pathname) {
      if (isTransmuteRoute(prev)) {
        void releaseHeavySession();
        recycleWorker();
      }
      prevPathRef.current = pathname;
    }
  }, [pathname, recycleWorker]);

  return null;
}
