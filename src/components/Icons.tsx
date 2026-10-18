interface IconProps {
  className?: string;
}

export function IconToday({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.2v4.2l2.6 1.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlan({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="5" width="15" height="14.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.8v2.8M16 3.8v2.8M4.5 9.2h15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function IconCabinet({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="5" y="10.5" width="14" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconGroceries({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8.5h12l-1 10.2a1.5 1.5 0 0 1-1.5 1.3H8.5A1.5 1.5 0 0 1 7 18.7L6 8.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 8.4V7a3 3 0 0 1 6 0v1.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
