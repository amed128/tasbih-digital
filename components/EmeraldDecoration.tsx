"use client";

import { useTasbihStore } from "@/store/tasbihStore";

export function EmeraldDecoration() {
  const theme = useTasbihStore((s) => s.preferences.theme);
  if (theme !== "emerald") return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <svg
        viewBox="0 0 390 844"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="emeraldGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#0E0802" stopOpacity="1" />
            <stop offset="40%"  stopColor="#3D2506" stopOpacity="1" />
            <stop offset="60%"  stopColor="#4A2E07" stopOpacity="1" />
            <stop offset="100%" stopColor="#0E0802" stopOpacity="1" />
          </linearGradient>
        </defs>

        <g fill="none" stroke="url(#emeraldGold)" opacity="0.55">
          {/* ── Left vine stem ── */}
          <path
            d="M22,0 C22,60 62,72 52,132 C42,192 10,200 22,264 C34,328 74,332 62,396 C50,460 16,466 24,530 C32,594 72,598 60,662 C48,726 14,732 24,800 C34,868 68,872 58,940"
            strokeWidth="1.3"
          />
          {/* Left leaf sprays */}
          <path d="M46,48  C62,36 74,50 60,64  C46,78  34,66  46,48Z"  strokeWidth=".8"/>
          <path d="M24,140 C40,126 54,138 44,154 C34,170 18,160 24,140Z" strokeWidth=".8"/>
          <path d="M52,232 C68,218 82,230 70,248 C58,266 42,256 52,232Z" strokeWidth=".8"/>
          <path d="M28,332 C44,316 60,326 50,346 C40,366 22,356 28,332Z" strokeWidth=".8"/>
          <path d="M54,424 C70,408 86,420 74,440 C62,460 44,450 54,424Z" strokeWidth=".8"/>
          <path d="M26,524 C42,508 58,520 46,540 C34,560 18,548 26,524Z" strokeWidth=".8"/>
          <path d="M56,616 C72,600 88,612 76,632 C64,652 46,642 56,616Z" strokeWidth=".8"/>
          <path d="M28,714 C44,698 60,710 48,730 C36,750 20,740 28,714Z" strokeWidth=".8"/>
          <path d="M54,808 C70,792 84,804 72,824 C60,844 44,834 54,808Z" strokeWidth=".8"/>

          {/* ── Right vine stem (mirrored) ── */}
          <path
            d="M368,0 C368,60 328,72 338,132 C348,192 380,200 368,264 C356,328 316,332 328,396 C340,460 374,466 366,530 C358,594 318,598 330,662 C342,726 376,732 366,800 C356,868 322,872 332,940"
            strokeWidth="1.3"
          />
          {/* Right leaf sprays */}
          <path d="M344,48  C328,36 316,50 330,64  C344,78  356,66  344,48Z"  strokeWidth=".8"/>
          <path d="M366,140 C350,126 336,138 346,154 C356,170 372,160 366,140Z" strokeWidth=".8"/>
          <path d="M338,232 C322,218 308,230 320,248 C332,266 348,256 338,232Z" strokeWidth=".8"/>
          <path d="M362,332 C346,316 330,326 340,346 C350,366 368,356 362,332Z" strokeWidth=".8"/>
          <path d="M336,424 C320,408 304,420 316,440 C328,460 346,450 336,424Z" strokeWidth=".8"/>
          <path d="M364,524 C348,508 332,520 344,540 C356,560 372,548 364,524Z" strokeWidth=".8"/>
          <path d="M334,616 C318,600 302,612 314,632 C326,652 344,642 334,616Z" strokeWidth=".8"/>
          <path d="M362,714 C346,698 330,710 342,730 C354,750 370,740 362,714Z" strokeWidth=".8"/>
          <path d="M336,808 C320,792 306,804 318,824 C330,844 346,834 336,808Z" strokeWidth=".8"/>

          {/* ── Cross connectors ── */}
          <path d="M52,132 C130,114 195,122 195,122 C195,122 262,114 338,132" strokeWidth=".55" strokeDasharray="2,5"/>
          <path d="M22,264 C110,246 195,254 195,254 C195,254 280,246 368,264" strokeWidth=".55" strokeDasharray="2,5"/>
          <path d="M62,396 C140,378 195,386 195,386 C195,386 252,378 328,396" strokeWidth=".55" strokeDasharray="2,5"/>
          <path d="M24,530 C110,512 195,520 195,520 C195,520 280,512 366,530" strokeWidth=".55" strokeDasharray="2,5"/>
          <path d="M60,662 C140,644 195,652 195,652 C195,652 252,644 330,662" strokeWidth=".55" strokeDasharray="2,5"/>

          {/* ── Diamond accents at mid-spans ── */}
          <path d="M155,198 L168,211 L181,198 L168,185Z" strokeWidth=".7"/>
          <path d="M209,198 L222,211 L235,198 L222,185Z" strokeWidth=".7"/>
          <path d="M155,460 L168,473 L181,460 L168,447Z" strokeWidth=".7"/>
          <path d="M209,460 L222,473 L235,460 L222,447Z" strokeWidth=".7"/>
          <path d="M155,592 L168,605 L181,592 L168,579Z" strokeWidth=".7"/>
          <path d="M209,592 L222,605 L235,592 L222,579Z" strokeWidth=".7"/>

          {/* ── Central medallion (mid-screen ~y=422) ── */}
          <g transform="translate(195,422)">
            <circle cx="0" cy="0" r="40" strokeWidth=".9"/>
            <circle cx="0" cy="0" r="28" strokeWidth=".6"/>
            <circle cx="0" cy="0" r="14" strokeWidth=".5"/>
            {/* 10-point star */}
            <polygon
              points="0,-40 10.4,-21 33.8,-21 18.1,-8 23.5,18 0,6 -23.5,18 -18.1,-8 -33.8,-21 -10.4,-21"
              strokeWidth="1"
            />
            {/* spokes */}
            <line x1="0" y1="-40" x2="0" y2="40" strokeWidth=".4"/>
            <line x1="-40" y1="0" x2="40" y2="0" strokeWidth=".4"/>
            <line x1="-28.3" y1="-28.3" x2="28.3" y2="28.3" strokeWidth=".4"/>
            <line x1="28.3" y1="-28.3" x2="-28.3" y2="28.3" strokeWidth=".4"/>
            <circle cx="0" cy="0" r="5" strokeWidth=".8"/>
          </g>

          {/* ── Top & bottom hair lines ── */}
          <line x1="0" y1="18" x2="390" y2="18" strokeWidth=".4" strokeDasharray="1,4" opacity=".5"/>
          <line x1="0" y1="826" x2="390" y2="826" strokeWidth=".4" strokeDasharray="1,4" opacity=".5"/>
        </g>
      </svg>
    </div>
  );
}
