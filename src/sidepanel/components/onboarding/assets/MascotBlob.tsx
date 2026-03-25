interface MascotBlobProps {
  size?: number;
  color?: string;
}

/**
 * Static blob mascot. Will be replaced with a logo later.
 */
export default function MascotBlob({ size = 80, color = 'var(--accent)' }: MascotBlobProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 50 12 C 62 8 80 15 84 30 C 88 45 80 62 68 72 C 56 82 40 82 30 72 C 20 62 16 45 20 30 C 24 15 38 8 50 12 Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.08"
      />
      <circle cx="41" cy="44" r="2.5" fill={color} />
      <circle cx="59" cy="44" r="2.5" fill={color} />
      <path
        d="M 42 54 Q 50 60 58 54"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
