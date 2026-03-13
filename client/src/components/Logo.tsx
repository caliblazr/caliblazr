interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 40, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle cx="32" cy="32" r="30" fill="url(#logoGrad2)" opacity="0.15" />
        <circle cx="32" cy="32" r="30" stroke="url(#logoGrad1)" strokeWidth="2" fill="none" />

        {/* Inner syncing circles (lifecycle symbol) */}
        <circle cx="32" cy="32" r="18" fill="url(#logoGrad2)" opacity="0.3" />

        {/* Upward arrow / growth symbol */}
        <path
          d="M32 44 L32 22 M32 22 L24 30 M32 22 L40 30"
          stroke="url(#logoGrad1)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logoGlow)"
        />

        {/* Orbit dots */}
        <circle cx="32" cy="10" r="3" fill="#818cf8" filter="url(#logoGlow)" />
        <circle cx="54" cy="32" r="3" fill="#c084fc" filter="url(#logoGlow)" />
        <circle cx="32" cy="54" r="3" fill="#f472b6" filter="url(#logoGlow)" />
        <circle cx="10" cy="32" r="3" fill="#818cf8" filter="url(#logoGlow)" />

        {/* Connecting orbit arc (partial ellipse) */}
        <ellipse cx="32" cy="32" r="22" ry="8" stroke="#818cf8" strokeWidth="1.5"
          fill="none" opacity="0.4" strokeDasharray="4 3" transform="rotate(-30 32 32)" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className="font-bold text-white"
            style={{
              fontSize: size * 0.45,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            LifeSync
          </span>
          <span
            className="text-slate-400 uppercase tracking-widest"
            style={{ fontSize: size * 0.18 }}
          >
            AI
          </span>
        </div>
      )}
    </div>
  );
}
