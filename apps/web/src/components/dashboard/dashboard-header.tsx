"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/dashboard-client";
import { saveRememberedEmail } from "@/lib/auth/remembered-email";
import type { AuthUser } from "@/lib/api/types";

type DashboardHeaderProps = {
  user: AuthUser;
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  useEffect(() => {
    if (user.email) saveRememberedEmail(user.email);
  }, [user.email]);

  const handleLogout = async () => {
    if (user.email) saveRememberedEmail(user.email);
    try {
      await logout();
    } finally {
      router.push("/auth/login");
      router.refresh();
    }
  };

  return (
    <header className="border-b border-stone-200 bg-white px-4 py-3 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-charcoal-900">Momeva</p>
          <p className="text-xs text-stone-400">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="text-sm font-medium text-stone-400 hover:text-charcoal-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
