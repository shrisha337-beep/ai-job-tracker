import React from "react";

interface JTLogoProps {
  size?: number;
  className?: string;
}

export function JTLogo({ size = 28, className = "" }: JTLogoProps) {
  return (
    <div
      className={`inline-flex items-center justify-center bg-[#09090B] border border-[#27272A] shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Job Tracker Logo"
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* J Glyph with 45° chamfers */}
        <polygon
          points="16,36 30,22 48,22 48,34 34,34 34,64 48,64 48,46 56,46 56,72 42,86 24,86 16,78 16,56 26,56 26,74 34,76 40,72 40,64"
          fill="#FAFAFA"
        />
        {/* T Glyph with 45° chamfers */}
        <polygon
          points="52,22 84,22 94,32 94,44 82,44 82,34 74,34 74,86 62,86 62,34 52,34"
          fill="#FAFAFA"
        />
      </svg>
    </div>
  );
}
