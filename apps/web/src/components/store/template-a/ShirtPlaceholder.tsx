export function ShirtPlaceholder({
  fill,
  className = "h-[78%] w-[78%]",
}: {
  fill: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden>
      <path
        fill={fill}
        d="M70 38 32 62l16 24 16-10v106c0 6 6 12 14 12h44c8 0 14-6 14-12V76l16 10 16-24-38-24-7 9c-5-8-12-13-21-13s-16 5-21 13l-7-9Z"
      />
      <path
        fill={fill}
        fillOpacity="0.55"
        d="M88 40c4 11 8 16 12 16s8-5 12-16l-6 8c-2 4-4 6-6 6s-4-2-6-6l-6-8Z"
      />
      <path fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" d="M100 56v128" />
    </svg>
  );
}
