"use client";

/**
 * Bầu trời ambient — hiệu ứng nền sống động, thuần CSS (60fps, 0KB bundle):
 *
 * 1. Quầng sáng thở — ambient gradient dịch chuyển cực chậm
 * 2. Mây trôi      — khối mềm blur lớn phía sau
 * 3. Sao lấp lánh  — chỉ dark mode
 * 4. Vân topo      — đường lượn mờ đáy (chất bản đồ lưu trữ)
 * 5. Bụi ánh sáng  — hạt xanh trôi nổi
 * 6. Lông vũ trôi  — lông vũ nhỏ rơi lượn chậm
 * 7. Luồng gió     — đường cong mảnh trôi ngang
 */

/* ---------- Mây ---------- */

function Cloud({
  top,
  w,
  h,
  dur,
  delay,
  opacity,
}: {
  top: string;
  w: number;
  h: number;
  dur: number;
  delay: number;
  opacity: string;
}) {
  return (
    <div
      className="cloud-drift absolute"
      style={
        {
          top,
          width: `${w}px`,
          height: `${h}px`,
          "--cloud-dur": `${dur}s`,
          animationDelay: `${-delay}s`,
          opacity,
          // radial-gradient vốn đã mềm — KHÔNG dùng filter: blur(28px)
          // vì animate phần tử đang blur xé GPU, rơi dưới 60fps trên máy yếu
          background:
            "radial-gradient(50% 60% at 30% 55%, currentColor, transparent 70%), radial-gradient(45% 70% at 68% 45%, currentColor, transparent 72%)",
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}

/* ---------- Bụi ánh sáng ---------- */

function Dust({
  top,
  left,
  size,
  delay,
  dur,
}: {
  top: string;
  left: string;
  size: number;
  delay: number;
  dur: number;
}) {
  return (
    <span
      className="dust-float absolute rounded-full"
      style={
        {
          top,
          left,
          width: size,
          height: size,
          background: "currentColor",
          "--dust-dur": `${dur}s`,
          "--dust-o": 0.4,
          animationDelay: `${-delay}s`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}

/* ---------- Vân topo ---------- */

function TopoContours() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[42%] w-full text-current"
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      style={{ opacity: 0.05 }}
    >
      <path d="M0 240 C 180 200, 340 280, 520 246 C 700 212, 860 286, 1040 252 C 1120 236, 1170 244, 1200 240" stroke="currentColor" strokeWidth="1.4" />
      <path d="M0 268 C 200 232, 360 306, 540 272 C 720 240, 880 310, 1060 276 C 1130 262, 1170 268, 1200 266" stroke="currentColor" strokeWidth="1.4" />
      <path d="M0 292 C 190 262, 350 326, 530 296 C 710 268, 900 330, 1080 300 C 1140 290, 1180 292, 1200 290" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/* ---------- Lông vũ trôi ---------- */

const FEATHER_PATH =
  "M8 0 C 11.5 3, 11.5 8, 8 11 C 4.5 8, 4.5 3, 8 0 Z M8 1.2 L 8 14 M5.5 4 L 8 5.5 L 10.5 4 M5.8 6.5 L 8 7.8 L 10.2 6.5 M6.2 9 L 8 10.2 L 9.8 9";

function Feather({
  top,
  left,
  size,
  delay,
  dur,
  opacity,
}: {
  top: string;
  left: string;
  size: number;
  delay: number;
  dur: number;
  opacity: string;
}) {
  return (
    <div
      className="feather-fall absolute"
      style={
        {
          top,
          left,
          "--feather-dur": `${dur}s`,
          animationDelay: `${-delay}s`,
          opacity,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <svg
        width={size}
        height={(size * 14) / 8}
        viewBox="0 0 8 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={FEATHER_PATH} />
      </svg>
    </div>
  );
}

/* ---------- Sao lấp lánh — chỉ dark mode ---------- */

function Star({
  top,
  left,
  size,
  delay,
  dur,
}: {
  top: string;
  left: string;
  size: number;
  delay: number;
  dur: number;
}) {
  return (
    <span
      className="star-twinkle absolute rounded-full bg-current"
      style={
        {
          top,
          left,
          width: size,
          height: size,
          "--star-dur": `${dur}s`,
          animationDelay: `${-delay}s`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}

/* ---------- Luồng gió ---------- */

const GUST_PATHS = [
  "M0 40 C 120 10, 260 70, 400 38 C 520 12, 640 60, 760 34",
  "M40 90 C 180 62, 320 118, 460 88 C 580 62, 700 108, 820 84",
  "M10 140 C 140 112, 280 168, 420 138 C 540 112, 660 158, 780 132",
];

function Gust({
  top,
  scale,
  dur,
  delay,
  opacity,
}: {
  top: string;
  scale: number;
  dur: number;
  delay: number;
  opacity: string;
}) {
  return (
    <div
      className="gust-drift absolute"
      style={
        {
          top,
          "--gust-scale": scale,
          "--gust-o": opacity,
          "--gust-dur": `${dur}s`,
          animationDelay: `${-delay}s`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <svg
        width={800 * scale}
        height={170 * scale}
        viewBox="0 0 820 170"
        fill="none"
        aria-hidden="true"
      >
        {GUST_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="2 10"
            opacity={0.8 - i * 0.22}
          />
        ))}
      </svg>
    </div>
  );
}

/* ---------- Quầng sáng thở ---------- */

function BreathingGlow() {
  return (
    <div
      className="glow-breathe absolute"
      aria-hidden="true"
      style={{
        background:
          "radial-gradient(42rem 26rem at 26% 30%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 65%), radial-gradient(36rem 22rem at 76% 62%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 68%)",
      }}
    />
  );
}

/* ---------- Bầu trời chính ---------- */

export function SkyAmbient({ dense = false }: { dense?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden text-current"
      aria-hidden="true"
    >
      {/* Lớp 1: Quầng sáng thở */}
      <BreathingGlow />

      {/* Lớp 2: Mây trôi */}
      <Cloud top="8%" w={420} h={120} dur={130} delay={40} opacity="0.10" />
      <Cloud top="26%" w={360} h={100} dur={105} delay={70} opacity="0.08" />
      {dense && <Cloud top="55%" w={520} h={140} dur={150} delay={15} opacity="0.07" />}

      {/* Lớp 3: Sao lấp lánh — chỉ dark mode */}
      <div className="stars-layer">
        <Star top="12%" left="18%" size={2} delay={0} dur={4.2} />
        <Star top="6%" left="42%" size={3} delay={1.4} dur={5.1} />
        <Star top="20%" left="66%" size={2} delay={2.8} dur={3.8} />
        <Star top="9%" left="86%" size={2} delay={0.7} dur={4.6} />
        <Star top="30%" left="8%" size={3} delay={3.5} dur={5.4} />
        <Star top="16%" left="52%" size={2} delay={4.4} dur={4} />
        <Star top="28%" left="78%" size={2} delay={1.9} dur={5.7} />
        <Star top="4%" left="60%" size={2} delay={2.2} dur={4.9} />
        {dense && (
          <>
            <Star top="38%" left="34%" size={2} delay={0.9} dur={4.4} />
            <Star top="34%" left="58%" size={3} delay={3.1} dur={5.2} />
            <Star top="42%" left="88%" size={2} delay={2.5} dur={4.1} />
            <Star top="46%" left="14%" size={2} delay={1.1} dur={5.6} />
          </>
        )}
      </div>

      {/* Lớp 4: Vân topo đáy */}
      <TopoContours />

      {/* Lớp 5: Bụi ánh sáng */}
      <Dust top="22%" left="26%" size={5} delay={0} dur={9} />
      <Dust top="14%" left="58%" size={4} delay={2.4} dur={11} />
      <Dust top="38%" left="12%" size={6} delay={4.8} dur={8} />
      <Dust top="52%" left="44%" size={4} delay={1.6} dur={12} />
      <Dust top="8%" left="80%" size={5} delay={3.2} dur={10} />
      <Dust top="64%" left="70%" size={4} delay={5.5} dur={9.5} />
      <Dust top="46%" left="86%" size={5} delay={0.8} dur={11.5} />
      {dense && (
        <>
          <Dust top="30%" left="68%" size={4} delay={2.1} dur={10.5} />
          <Dust top="74%" left="30%" size={5} delay={4.4} dur={8.5} />
          <Dust top="18%" left="40%" size={3} delay={6.2} dur={12.5} />
        </>
      )}

      {/* Lớp 6: Lông vũ trôi */}
      <Feather top="14%" left="12%" size={14} delay={0} dur={26} opacity="0.35" />
      <Feather top="30%" left="64%" size={11} delay={9} dur={31} opacity="0.28" />
      <Feather top="48%" left="82%" size={13} delay={17} dur={28} opacity="0.30" />
      <Feather top="62%" left="26%" size={10} delay={5} dur={34} opacity="0.26" />
      <Feather top="22%" left="90%" size={12} delay={22} dur={30} opacity="0.30" />
      {dense && (
        <>
          <Feather top="70%" left="54%" size={12} delay={12} dur={32} opacity="0.26" />
          <Feather top="40%" left="38%" size={10} delay={25} dur={29} opacity="0.24" />
          <Feather top="78%" left="10%" size={11} delay={3} dur={35} opacity="0.22" />
        </>
      )}

      {/* Lớp 7: Luồng gió trôi ngang */}
      <Gust top="18%" scale={1} dur={46} delay={8} opacity="0.06" />
      <Gust top="54%" scale={0.8} dur={58} delay={26} opacity="0.05" />
      <Gust top="78%" scale={1.2} dur={52} delay={40} opacity="0.05" />
      {dense && <Gust top="36%" scale={0.9} dur={64} delay={14} opacity="0.05" />}
    </div>
  );
}
