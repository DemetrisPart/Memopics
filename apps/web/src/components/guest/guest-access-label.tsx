import { cn } from "@/lib/utils";

type GuestAccessLabelProps = {
  variant?: "light" | "dark" | "cinematic";
  className?: string;
};

/** Green live indicator + guest entry hint (original + cinematic) */
export function GuestAccessLabel({
  variant = "light",
  className,
}: GuestAccessLabelProps) {
  const variantClass =
    variant === "cinematic"
      ? "guest-access-label-cinematic"
      : variant === "dark"
        ? "guest-access-label-dark"
        : "guest-access-label-light";

  return (
    <p className={cn("guest-access-label", variantClass, className)}>
      <span className="guest-access-dot" aria-hidden />
      Guest access — tap to join the story
    </p>
  );
}
