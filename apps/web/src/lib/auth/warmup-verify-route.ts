/** Pre-compile auth finish/verify routes during waiting (avoids dev HMR interrupt). */
export async function warmupAuthRoutes(): Promise<void> {
  try {
    await Promise.all([
      fetch("/api/auth/finish?warmup=1", { cache: "no-store" }),
      fetch("/api/auth/verify?warmup=1", { cache: "no-store" }),
    ]);
  } catch {
    // Non-fatal — routes compile on first real sign-in attempt.
  }
}

/** @deprecated Use warmupAuthRoutes */
export const warmupVerifyRoute = warmupAuthRoutes;
