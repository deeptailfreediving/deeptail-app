// 선 아이콘 모음 (장식용: aria-hidden)
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const HomeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 11l8-7 8 7v9H4z" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
export const CalendarIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
export const CapIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M3 8l9-4 9 4-9 4-9-4z" />
    <path d="M7 10v5c0 1.5 2.2 3 5 3s5-1.5 5-3v-5" />
  </svg>
);
export const UserIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
export const PhotoIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M21 16l-5-5-8 8" />
  </svg>
);
export const ChatIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 5h16v11H9l-5 4V5z" />
    <path d="M8 9h8M8 12h5" />
  </svg>
);
export const PlayIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M10 9.5v5l4.5-2.5L10 9.5z" />
  </svg>
);
export const LockIcon = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const ChevronIcon = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const BackIcon = ({ className }: P) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const PoolIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 15V5a2 2 0 0 1 4 0M17 15V5a2 2 0 0 0-4 0" />
    <path d="M7 9h10M7 12h10" />
    <path d="M3 18c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0" />
  </svg>
);
export const EarIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M7 10a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.5" />
    <path d="M10 10a2 2 0 0 1 4 0c0 1.5-1.5 2-1.5 3.5" />
  </svg>
);
