import React from 'react';

interface ExamirrorOfficialStampProps {
  className?: string;
  size?: number;
}

export const ExamirrorOfficialStamp: React.FC<ExamirrorOfficialStampProps> = ({
  className = '',
  size = 90
}) => {
  return (
    <div 
      className={`inline-block select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform rotate-[-8deg] drop-shadow-2xs opacity-90"
      >
        <defs>
          {/* Circular Text Path (Clockwise) */}
          <path
            id="examirror-stamp-text-path"
            d="M 100 16 A 84 84 0 1 1 99.9 16"
          />
        </defs>

        {/* 1. Outer Heavy Stamp Ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="#0047ba"
          strokeWidth="3.5"
          strokeDasharray="2000"
        />

        {/* 2. Middle Ring */}
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="#0047ba"
          strokeWidth="1.2"
        />

        {/* 3. Inner Boundary Ring for Emblem */}
        <circle
          cx="100"
          cy="100"
          r="58"
          stroke="#0047ba"
          strokeWidth="2"
        />

        {/* 4. Circular Text: EXAMIRROR EDUTECH PVT. LTD. */}
        <text
          fill="#0047ba"
          fontSize="14"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="2.8"
        >
          <textPath
            href="#examirror-stamp-text-path"
            startOffset="50%"
            textAnchor="middle"
          >
            ★ EXAMIRROR EDUTECH PVT. LTD. ★
          </textPath>
        </text>

        {/* 5. Center Examirror Logo Wings Emblem */}
        <g transform="translate(100, 100) scale(0.68) translate(-100, -100)">
          {/* Main 'M' Wings */}
          <path
            d="M 50 128 L 74 68 L 100 102 L 126 68 L 150 128"
            stroke="#0047ba"
            strokeWidth="8.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Open Book Pages */}
          <path
            d="M 68 114 L 100 96 L 132 114"
            stroke="#0047ba"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 72 124 L 100 108 L 128 124"
            stroke="#0047ba"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Vertical Spine / Antenna */}
          <line
            x1="100"
            y1="96"
            x2="100"
            y2="134"
            stroke="#0047ba"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Radio Waves / Signals above */}
          <circle cx="100" cy="56" r="5.5" fill="#0047ba" />
          <path
            d="M 86 46 C 94 40 106 40 114 46"
            stroke="#0047ba"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 76 36 C 90 26 110 26 124 36"
            stroke="#0047ba"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Bottom Baseline */}
          <line
            x1="60"
            y1="138"
            x2="140"
            y2="138"
            stroke="#0047ba"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};
