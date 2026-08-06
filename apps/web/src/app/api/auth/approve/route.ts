import { type NextRequest } from "next/server";
import { proxyAuthPost } from "@/lib/server/auth-api-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return proxyAuthPost(request, "auth/approve", false);
}
