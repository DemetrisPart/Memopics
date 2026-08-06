import { requireAuth } from "@/lib/api/server-fetch";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  await requireAuth();
  return children;
}
