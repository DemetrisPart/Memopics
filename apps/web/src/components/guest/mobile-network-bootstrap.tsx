"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ensureMobileNetworkRoute,
  isMobileNetworkConfigured,
} from "@/lib/mobile-network";

export function MobileNetworkBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(() => !isMobileNetworkConfigured());

  useEffect(() => {
    if (!isMobileNetworkConfigured()) return;

    void (async () => {
      await ensureMobileNetworkRoute(pathname);
      setReady(true);
    })();
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-stone-400">
        Connecting…
      </div>
    );
  }

  return <>{children}</>;
}
