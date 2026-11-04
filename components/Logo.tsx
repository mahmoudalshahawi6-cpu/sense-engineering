type MarkProps = { className?: string; size?: number; title?: string };

export function LogoMark({ className, size = 38, title = "SENSE Engineering Digital Libraries" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id="edlLogoGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67e8f9" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M31 8c-8 0-14 4-16 10-4 1-7 5-7 9 0 3 1 5 3 7-1 2-2 4-2 6 0 5 4 9 9 10 1 3 4 6 8 6h5V8z"
          fill="#cbd5e1"
          stroke="#0f172a"
          strokeWidth="1.6"
        />
        <path
          d="M14 22c4 1 6 3 7 6M12 38c5 0 8 2 10 5M18 47c3-1 6 0 8 2"
          stroke="#0f172a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="21" cy="17" r="2.2" fill="#0f172a" />
        <circle cx="17" cy="27" r="2.2" fill="#0f172a" />
        <circle cx="24" cy="31" r="2.6" fill="#0f172a" />
        <circle cx="20" cy="40" r="2.2" fill="#0f172a" />
        <circle cx="26" cy="45" r="1.8" fill="#0f172a" />
        <circle cx="16" cy="33" r="1.6" fill="#0f172a" />
      </g>
      <path
        d="M33 8c8 0 14 4 16 10 4 1 7 5 7 9 0 3-1 5-3 7 1 2 2 4 2 6 0 5-4 9-9 10-1 3-4 6-8 6h-5V8z"
        fill="none"
        stroke="url(#edlLogoGrad)"
        strokeWidth="1.8"
      />
      <g stroke="url(#edlLogoGrad)" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M38 18h9M38 25h5l3 4h6M38 33h12M38 41h7l3 3h3M38 49h10" />
        <circle cx="49" cy="18" r="2" />
        <circle cx="52" cy="33" r="2" />
        <circle cx="50" cy="49" r="2" />
      </g>
      <rect x="31.2" y="14" width="2.6" height="38" fill="url(#edlLogoGrad)" opacity="0.5" />
    </svg>
  );
}

export function LogoCompact({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className ?? ""}`}>
      <span className="relative grid place-items-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 p-1.5 transition group-hover:border-cyan-300/60">
        <LogoMark size={38} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-black tracking-[0.12em] text-white sm:text-xl">
          SENSE
        </span>
        <span className="block text-[9px] font-semibold tracking-[0.12em] text-slate-400 sm:text-[10px]">
          ENGINEERING DIGITAL LIBRARIES
        </span>
      </span>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return <LogoCompact className={className} />;
}
