export function ShadowMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="ShadowPay"
    >
      <defs>
        <linearGradient id="shadow-mark-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#A855F7" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
        <radialGradient id="shadow-mark-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#A855F7" stopOpacity="0.9" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke="url(#shadow-mark-grad)"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <circle
        cx="24"
        cy="24"
        r="13"
        stroke="url(#shadow-mark-grad)"
        strokeWidth="1"
        opacity="0.55"
      />
      <circle cx="24" cy="24" r="7.5" fill="url(#shadow-mark-core)" />
      <circle cx="24" cy="24" r="2.5" fill="white" opacity="0.85" />
    </svg>
  );
}
