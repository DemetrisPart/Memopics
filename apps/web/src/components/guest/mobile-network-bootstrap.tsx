"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ensureMobileNetworkRoute,
  hasCachedNetworkProbe,
  isMobileNetworkConfigured,
} from "@/lib/mobile-network";

export function MobileNetworkBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(() => {
    if (!isMobileNetworkConfigured()) return true;
    return hasCachedNetworkProbe();
  });

  useEffect(() => {
    if (!isMobileNetworkConfigured()) return;

    void (async () => {
      await ensureMobileNetworkRoute(pathname);
      setReady(true);
    })();
  }, [pathname]);

  return (
    <>
      {children}
      {!ready ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ivory-50/90 text-stone-400"
          aria-live="polite"
        >
          Connecting…
        </div>
      ) : null}
    </>
  );
}
