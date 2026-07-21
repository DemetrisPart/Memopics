type CoupleNamesHeadingProps = {
  groomName: string | null | undefined;
  brideName: string | null | undefined;
  fallback?: string;
  className?: string;
};

const ampersandClassName =
  "text-[0.45em] font-normal leading-none text-charcoal-900";

export function CoupleNamesHeading({
  groomName,
  brideName,
  fallback = "Our Event",
  className,
}: CoupleNamesHeadingProps) {
  const groom = groomName?.trim();
  const bride = brideName?.trim();

  if (!groom && !bride) {
    return <h1 className={`mx-auto w-full text-center ${className ?? ""}`}>{fallback}</h1>;
  }

  if (!groom || !bride) {
    return (
      <h1 className={`mx-auto w-full text-center ${className ?? ""}`}>
        {groom ?? bride}
      </h1>
    );
  }

  return (
    <h1 className={`mx-auto w-full max-w-full text-center ${className ?? ""}`}>
      <span className="mx-auto inline-flex w-fit max-w-full items-baseline justify-center gap-x-1.5 whitespace-nowrap">
        <span>{groom}</span>
        <span className={ampersandClassName} aria-hidden>
          &
        </span>
        <span>{bride}</span>
      </span>
    </h1>
  );
}
