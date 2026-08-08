import { DashboardBearerShell } from "@/components/auth/dashboard-bearer-shell";
import { getAuthUserOrNull } from "@/lib/api/server-fetch";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getAuthUserOrNull();

  // Normal browsers: HttpOnly cookies work → SSR dashboard.
  // Mobile Preview iframe: cookies blocked → Bearer shell from sessionStorage.
  if (!user) {
    return <DashboardBearerShell />;
  }

  return children;
}
