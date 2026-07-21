import { cn } from "@/lib/utils";

type SquareThumbFrameProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Square thumbnail shell safe on iOS Safari, Android WebView, and desktop browsers.
 * Uses padding-top (not aspect-ratio with absolute-only children) so grid/flex
 * cells keep a real height and overlay controls stay clipped to each tile.
 */
export function SquareThumbFrame({ children, className }: SquareThumbFrameProps) {
  return (
    <div className={cn("min-w-0 overflow-hidden", className)}>
      <div className="relative w-full pt-[100%]">
        <div className="absolute inset-0 isolate overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
