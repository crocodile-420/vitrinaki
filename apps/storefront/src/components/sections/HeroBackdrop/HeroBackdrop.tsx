/**
 * Illustrated hero backdrop: a warmly lit Greek shop interior seen through a
 * large shop window, drawn in the style of the vitrinaki.gr logo.
 * Pure inline SVG + CSS, no images. Motion is disabled under reduced motion.
 * Desktop and mobile get their own compositions.
 */

const K = "#C0503C" // κεραμιδί
const B = "#265E8E" // μπλε

/* ---------- shared defs (ids are prefixed per instance) ---------- */
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f3a28" />
        <stop offset="0.5" stopColor="#3e3a27" />
        <stop offset="1" stopColor="#262619" />
      </linearGradient>
      <radialGradient id={`${p}lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFDCA0" stopOpacity="0.95" />
        <stop offset="0.3" stopColor="#F2A65A" stopOpacity="0.45" />
        <stop offset="1" stopColor="#E08A45" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${p}pool`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFC27A" stopOpacity="0.5" />
        <stop offset="1" stopColor="#FFC27A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c08a58" />
        <stop offset="0.35" stopColor="#9a6a40" />
        <stop offset="1" stopColor="#5e3c22" />
      </linearGradient>
      <pattern id={`${p}grain`} width="120" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 4 C30 3 60 6 120 4 M0 9 C40 10 80 8 120 10 M0 13 C30 12 90 14 120 13" stroke="#3d2614" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
      </pattern>
      <linearGradient id={`${p}glass`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="0.38" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
        <stop offset="0.53" stopColor="#fff" stopOpacity="0" />
        <stop offset="0.6" stopColor="#fff" stopOpacity="0.035" />
        <stop offset="0.66" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${p}shade`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.45" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <filter id={`${p}far`}><feGaussianBlur stdDeviation="3.5" /></filter>
      <filter id={`${p}soft`}><feGaussianBlur stdDeviation="1.4" /></filter>
    </defs>
  )
}

/* ---------- objects (origin = bottom centre, sits on shelf) ---------- */
type O = { x: number; y: number; s?: number }

function Shadow({ w }: { w: number }) {
  return <ellipse cx="0" cy="0" rx={w} ry={w * 0.12} fill="#000" opacity="0.35" />
}
// light from upper-left: highlight on left, shade on right
function Vase({ x, y, s = 1, fill = "#e2c9a6", dark = "#a8835c", stripe }: O & { fill?: string; dark?: string; stripe?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={30} />
      <path d="M-11 -66 h22 v6 c-2 2-3 5-2 8 c20 8 30 22 30 36 c0 10-7 16-15 16 h-28 c-8 0-15-6-15-16 c0-14 10-28 30-36 c1-3 0-6-2-8z" fill={fill} />
      <path d="M9 -52 c20 8 30 22 30 36 c0 10-7 16-15 16 h-10 c12-12 14-36-5-52z" fill={dark} opacity="0.75" />
      {stripe && <path d="M-29 -22 c18 4 40 4 58 0 v5 c-18 4-40 4-58 0z" fill={stripe} opacity="0.9" />}
      <path d="M-20 -38 c-6 9-7 20-2 28" stroke="#fff" strokeOpacity="0.45" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="-66" rx="11" ry="3" fill="#000" opacity="0.35" />
    </g>
  )
}
function Jug({ x, y, s = 1, fill = B }: O & { fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={26} />
      <path d="M18 -50 c14 0 16 22 2 26" stroke={fill} strokeWidth="5" fill="none" />
      <path d="M-14 -62 l-4 -6 h26 l4 6 c6 10 12 20 12 36 c0 16-8 26-24 26 s-24-10-24-26 c0-16 6-26 10-36z" fill={fill} />
      <path d="M6 -62 c6 10 12 20 12 36 c0 16-8 26-24 26 c16-6 22-40 12-62z" fill="#000" opacity="0.25" />
      <path d="M-16 -40 c-4 10-4 20 0 28" stroke="#fff" strokeOpacity="0.4" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M-18 -30 h34" stroke="#F7F2E8" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="4 4" />
    </g>
  )
}
function Bowls({ x, y, s = 1 }: O) {
  const c = ["#e9d6b8", K, "#2E4A37"]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={38} />
      {c.map((f, i) => (
        <g key={i} transform={`translate(0 ${-i * 13})`}>
          <path d="M-36 -14 h72 c-4 10-16 14-36 14 s-32-4-36-14z" fill={f} />
          <path d="M10 -14 h26 c-4 10-16 14-30 14 c4-4 4-10 4-14z" fill="#000" opacity="0.22" />
          <ellipse cx="0" cy="-14" rx="36" ry="3.5" fill="#fff" opacity="0.18" />
        </g>
      ))}
    </g>
  )
}
function Jar({ x, y, s = 1, honey = true, label = "ΜΕΛΙ" }: O & { honey?: boolean; label?: string }) {
  const body = honey ? "#D98A1E" : "#7d8a2a"
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={22} />
      {honey ? (
        <>
          <rect x="-15" y="-58" width="30" height="10" rx="2" fill="#7a5a2c" />
          <path d="M-15 -52 c-6 0-6 6-6 6 v-0 c-1 4 2 6 6 6" fill="#F7E7C8" opacity="0" />
          <path d="M-17 -46 c-10 0-14 6-14 14 v22 c0 6 4 10 10 10 h42 c6 0 10-4 10-10 v-22 c0-8-4-14-14-14z" fill={body} transform="scale(0.72 1)" />
          <rect x="-16" y="-48" width="32" height="6" rx="2" fill="#F7F2E8" opacity="0.9" />
          <rect x="-14" y="-32" width="28" height="16" rx="2" fill="#F7F2E8" />
          <text x="0" y="-20.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2E4A37" fontFamily="Georgia, serif">{label}</text>
          <path d="M-14 -42 v34" stroke="#FFE7B0" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
          <path d="M8 -44 v40" stroke="#6b3a08" strokeOpacity="0.35" strokeWidth="6" />
        </>
      ) : (
        <>
          <rect x="-4" y="-96" width="8" height="10" rx="1.5" fill="#2E4A37" />
          <path d="M-4 -86 h8 v18 c8 4 12 10 12 18 v50 h-32 v-50 c0-8 4-14 12-18z" fill={body} />
          <path d="M3 -70 c7 4 9 10 9 18 v52 h-7z" fill="#000" opacity="0.25" />
          <rect x="-12" y="-46" width="24" height="26" rx="2" fill="#F7F2E8" />
          <path d="M-8 -40 c6-4 12-4 16 0" stroke={K} strokeWidth="1.6" fill="none" />
          <text x="0" y="-27" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#2E4A37" fontFamily="Georgia, serif">{label}</text>
          <path d="M-9 -64 v54" stroke="#e9f0a8" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </g>
  )
}
function Bottle({ x, y, s = 1 }: O) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={20} />
      <rect x="-5" y="-94" width="10" height="10" rx="2" fill="#3a2414" />
      <path d="M-5 -84 h10 v14 c10 4 14 10 14 18 v52 h-38 v-52 c0-8 4-14 14-18z" fill="#B8641F" />
      <path d="M4 -68 c8 4 10 10 10 16 v52 h-9 z" fill="#5e2c0a" opacity="0.5" />
      <rect x="-12" y="-44" width="24" height="22" rx="2" fill="#F7E7C8" opacity="0.9" />
      <path d="M-11 -62 v54" stroke="#FFD9A0" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}
function Basket({ x, y, s = 1 }: O) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={44} />
      <path d="M-30 -46 c0-30 60-30 60 0" stroke="#8a5a2e" strokeWidth="5" fill="none" />
      <path d="M-42 -46 h84 l-8 46 h-68z" fill="#c8955a" />
      {[-36, -26, -16].map((yy) => (
        <path key={yy} d={`M-41 ${yy} h82`} stroke="#8a5a2e" strokeWidth="2" opacity="0.7" />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${-36 + i * 9} -46 l${-1 + i * 0.25} 46`} stroke="#8a5a2e" strokeWidth="1.4" opacity="0.5" />
      ))}
      <path d="M14 -46 h28 l-8 46 h-26z" fill="#000" opacity="0.2" />
      <rect x="-44" y="-50" width="88" height="7" rx="3" fill="#d9a86a" />
      <circle cx="-14" cy="-56" r="10" fill={K} /><circle cx="6" cy="-58" r="9" fill="#d9a03a" /><circle cx="-2" cy="-52" r="8" fill="#b84a36" />
    </g>
  )
}
function Textiles({ x, y, s = 1 }: O) {
  const c = [B, "#F2E6CF", K, "#2E4A37"]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={44} />
      {c.map((f, i) => (
        <g key={i} transform={`translate(${(i % 2) * 3} ${-i * 12})`}>
          <rect x="-42" y="-12" width="84" height="12" rx="5" fill={f} />
          <rect x="18" y="-12" width="24" height="12" rx="5" fill="#000" opacity="0.18" />
          <path d="M-38 -6 h70" stroke="#fff" strokeOpacity="0.25" strokeWidth="1" strokeDasharray="3 3" />
        </g>
      ))}
    </g>
  )
}
function Frame({ x, y, s = 1 }: O) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-4)`}>
      <Shadow w={30} />
      <rect x="-30" y="-84" width="60" height="80" rx="2" fill="#7a4e2a" />
      <rect x="-24" y="-78" width="48" height="68" fill="#F2E6CF" />
      <circle cx="6" cy="-56" r="8" fill="#E8A040" />
      <path d="M-24 -10 l14-24 l10 12 l10-16 l14 28z" fill={B} opacity="0.85" />
      <path d="M-24 -10 h48 v-6 c-14-4-30 2-48 0z" fill={B} />
      <rect x="18" y="-84" width="12" height="80" fill="#000" opacity="0.18" />
    </g>
  )
}
function Plant({ x, y, s = 1 }: O) {
  const leaves = [[-46, -148, -55], [-26, -172, -28], [2, -186, 4], [30, -166, 30], [50, -136, 58], [-40, -112, -72], [40, -104, 72], [-12, -146, -12], [16, -136, 16]]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Shadow w={40} />
      <g className="vkb-sway">
        {leaves.map(([lx, ly, r], i) => (
          <g key={i}>
            <path d={`M0 -58 Q${lx * 0.4} ${(ly - 58) / 2} ${lx} ${ly}`} stroke="#3c5a3f" strokeWidth="2.5" fill="none" />
            <ellipse cx={lx} cy={ly} rx="11" ry="30" transform={`rotate(${r} ${lx} ${ly})`} fill={i % 2 ? "#5b8a5a" : "#3d6a45"} />
            <path d={`M${lx} ${ly - 26} L${lx} ${ly + 26}`} transform={`rotate(${r} ${lx} ${ly})`} stroke="#b9d6a0" strokeOpacity="0.5" strokeWidth="1.2" />
          </g>
        ))}
      </g>
      <path d="M-40 -64 h80 l-8 64 h-64z" fill={K} />
      <path d="M12 -64 h28 l-8 64 h-22z" fill="#7d2e20" opacity="0.6" />
      <rect x="-44" y="-70" width="88" height="12" rx="3" fill="#d76c53" />
    </g>
  )
}
function Shelf({ x, y, w, p }: { x: number; y: number; w: number; p: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="16" rx="2" fill={`url(#${p}wood)`} />
      <rect x={x} y={y} width={w} height="16" rx="2" fill={`url(#${p}grain)`} />
      <rect x={x} y={y} width={w} height="2.5" fill="#f0c48e" opacity="0.55" />
      <rect x={x} y={y + 16} width={w} height="26" fill="#000" opacity="0.18" filter={`url(#${p}soft)`} />
      <path d={`M${x + 24} ${y + 16} l14 26 h8 l-10 -26z M${x + w - 46} ${y + 16} l14 26 h8 l-10 -26z`} fill="#4a2e18" />
    </g>
  )
}

/* ---------- lamp ---------- */
function Lamp({ x, y, p, len = 120 }: { x: number; y: number; p: string; len?: number }) {
  return (
    <g>
      <ellipse className="vkb-glow" cx={x} cy={y + 120} rx="440" ry="380" fill={`url(#${p}lamp)`} />
      <path d={`M${x - 46} ${y + 6} L${x - 220} ${y + 520} H${x + 220} L${x + 46} ${y + 6}z`} fill="#FFD58A" opacity="0.05" />
      <g className="vkb-lamp" style={{ transformOrigin: `${x}px ${y - len}px` }}>
        <path d={`M${x} ${y - len} V${y - 48}`} stroke="#15150f" strokeWidth="3" />
        <path d={`M${x - 12} ${y - 48} h24 v14 h-24z`} fill="#1d4a70" />
        <path d={`M${x - 48} ${y} c0-26 20-36 48-36 s48 10 48 36z`} fill={B} />
        <path d={`M${x + 8} ${y - 36} c22 2 40 12 40 36 h-30 c0-14-4-28-10-36z`} fill="#000" opacity="0.22" />
        <path d={`M${x - 34} ${y - 12} c4-10 12-16 22-18`} stroke="#fff" strokeOpacity="0.4" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d={`M${x - 50} ${y} h100`} stroke="#183f60" strokeWidth="5" strokeLinecap="round" />
        <ellipse className="vkb-glow" cx={x} cy={y + 8} rx="40" ry="18" fill="#FFE2A0" opacity="0.7" filter={`url(#${p}soft)`} />
        <ellipse cx={x} cy={y + 5} rx="17" ry="9" fill="#FFF6DA" />
      </g>
    </g>
  )
}

/* ---------- olive tree / sprig ---------- */
const OLIVE_LEAF = ["#8FA58A", "#6E8B6A", "#A9BBA0", "#5d7a5a", "#B8C4B0"]
function leafCluster(cx: number, cy: number, n: number, spread: number, seed: number) {
  return Array.from({ length: n }).map((_, i) => {
    const a = ((i * 137.5 + seed * 47) % 360) * (Math.PI / 180)
    const r = spread * Math.sqrt(((i * 61 + seed * 13) % 100) / 100)
    const lx = cx + Math.cos(a) * r * 1.3
    const ly = cy + Math.sin(a) * r * 0.75
    const rot = ((i * 71 + seed * 29) % 120) - 60 + (Math.cos(a) > 0 ? 60 : -60)
    return <ellipse key={`${seed}-${i}`} cx={lx} cy={ly} rx="3.6" ry="17" transform={`rotate(${rot} ${lx} ${ly})`} fill={OLIVE_LEAF[(i + seed) % 5]} />
  })
}
function OliveTree({ x, y, s = 1 }: O) {
  const clusters: [number, number, number, number][] = [[-120, -390, 26, 46], [-40, -440, 30, 52], [60, -420, 28, 50], [130, -360, 22, 42], [-150, -310, 18, 36], [10, -350, 26, 48], [90, -300, 16, 34], [-80, -330, 20, 40]]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="80" ry="10" fill="#000" opacity="0.35" />
      {/* gnarled trunk */}
      <path d="M-14 -80 C-30 -140 10 -170 -6 -220 C-18 -260 -60 -280 -110 -330 M-6 -220 C10 -270 70 -300 60 -360 M-2 -200 C20 -260 -20 -330 -30 -420 M30 -280 C80 -300 110 -330 128 -350" stroke="#5b4630" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M-22 -80 C-40 -130 -6 -160 -18 -210 C-26 -240 4 -250 8 -210 C22 -170 -4 -140 14 -80z" fill="#6b5236" />
      <path d="M2 -80 C-4 -130 20 -160 6 -210 C14 -180 0 -140 14 -80z" fill="#3e2f1e" opacity="0.7" />
      <path d="M-16 -110 c4-10 2-20 6-30 M-10 -170 c-4 8-2 14 2 20" stroke="#a8875e" strokeWidth="2" opacity="0.6" fill="none" />
      <g className="vkb-sway-slow" style={{ transformOrigin: `${x}px ${y - 200 * s}px` }}>
        {clusters.map(([cx, cy, n, sp], i) => <g key={i}>{leafCluster(cx, cy, n, sp, i + 1)}</g>)}
        {[[-100, -380], [-90, -370], [70, -410], [120, -350], [-30, -430], [20, -340]].map(([ox, oy], i) => (
          <g key={i}>
            <ellipse cx={ox} cy={oy} rx="6" ry="8" transform={`rotate(-25 ${ox} ${oy})`} fill={i % 2 ? "#3b2a3a" : "#4a5a20"} />
            <ellipse cx={ox - 2} cy={oy - 3} rx="1.8" ry="2.6" fill="#fff" opacity="0.4" />
          </g>
        ))}
      </g>
      {/* terracotta planter */}
      <path d="M-70 -86 h140 l-16 86 h-108z" fill="#b35a42" />
      <path d="M-62 -60 h124" stroke="#8a3d2a" strokeWidth="3" opacity="0.6" />
      <path d="M-50 -40 c10-8 20 8 30 0 s20 8 30 0 s20 8 30 0" stroke="#F2E6CF" strokeWidth="2" fill="none" opacity="0.55" />
      <path d="M26 -86 h44 l-16 86 h-34z" fill="#5e2418" opacity="0.5" />
      <path d="M-58 -78 l-8 70" stroke="#fff" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" />
      <rect x="-78" y="-98" width="156" height="18" rx="5" fill="#cf7a5c" />
    </g>
  )
}
function OliveSprig({ x, y, s = 1, r = 0, flip = false }: O & { r?: number; flip?: boolean }) {
  const leaves: [number, number, number][] = [[40, 30, -30], [80, 52, 20], [120, 70, -40], [160, 96, 25], [200, 112, -35], [240, 140, 30], [280, 156, -20], [70, 20, -70], [150, 70, -75], [230, 118, -70], [310, 178, 10]]
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <g className="vkb-sway-slow">
        <path d="M0 0 C90 50 200 110 330 190" stroke="#4a3a24" strokeWidth="5" fill="none" strokeLinecap="round" />
        {leaves.map(([lx, ly, rr], i) => (
          <g key={i} transform={`rotate(${rr} ${lx} ${ly})`}>
            <path d={`M${lx} ${ly} c14-9 46-9 72 0 c-26 9-58 9-72 0z`} fill={["#4d6e45", "#7f9a72", "#3a5a36"][i % 3]} />
            <path d={`M${lx + 4} ${ly} h60`} stroke="#d2dfbc" strokeOpacity="0.5" strokeWidth="1.3" />
          </g>
        ))}
        {[[132, 92], [150, 106], [262, 160], [278, 176]].map(([ox, oy], i) => (
          <g key={i}>
            <ellipse cx={ox} cy={oy} rx="9" ry="12" transform={`rotate(-30 ${ox} ${oy})`} fill={i % 2 ? "#3b2a3a" : "#4b5a1e"} />
            <ellipse cx={ox - 3} cy={oy - 4} rx="2.5" ry="3.5" fill="#fff" opacity="0.4" />
          </g>
        ))}
      </g>
    </g>
  )
}
function OpenSign({ x, y, p }: { x: number; y: number; p: string }) {
  return (
    <g className="vkb-lamp" style={{ transformOrigin: `${x}px ${y - 50}px` }}>
      <path d={`M${x} ${y - 50} L${x - 40} ${y} M${x} ${y - 50} L${x + 40} ${y}`} stroke="#c9a46a" strokeWidth="2" />
      <circle cx={x} cy={y - 50} r="3" fill="#c9a46a" />
      <rect x={x - 62} y={y - 2} width="124" height="40" rx="8" fill="#F7F2E8" />
      <rect x={x - 56} y={y + 4} width="112" height="28" rx="5" fill="none" stroke={K} strokeWidth="1.5" />
      <text x={x} y={y + 24} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="3" fill="#2E4A37" fontFamily="Georgia, serif">ΑΝΟΙΧΤΑ</text>
      <rect x={x - 62} y={y - 2} width="124" height="40" rx="8" fill="#000" opacity="0.08" filter={`url(#${p}soft)`} />
    </g>
  )
}

/* ---------- compositions ---------- */
function DesktopScene() {
  const p = "vd-"
  return (
    <svg className="absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <Defs p={p} />
      <rect width="1440" height="900" fill={`url(#${p}wall)`} />
      <path d="M840 780 V340 a170 170 0 0 1 340 0 V780z" fill="#1c2216" opacity="0.5" />
      <rect y="780" width="1440" height="120" fill="#241c12" />
      <rect y="780" width="1440" height="5" fill="#8a6038" opacity="0.6" />

      {/* far blurred niche shelves */}
      <g filter={`url(#${p}far)`} opacity="0.5">
        <rect x="870" y="450" width="280" height="10" fill={`url(#${p}wood)`} />
        <Vase x={910} y={450} s={0.6} />
        <Jar x={970} y={450} s={0.7} />
        <Jug x={1040} y={450} s={0.6} />
        <Bowls x={1110} y={450} s={0.6} />
        <rect x="870" y="620" width="280" height="10" fill={`url(#${p}wood)`} />
        <Basket x={930} y={620} s={0.6} />
        <Vase x={1020} y={620} s={0.7} fill={K} dark="#7d2e20" />
        <Textiles x={1100} y={620} s={0.6} />
      </g>

      <ellipse cx="300" cy="520" rx="420" ry="320" fill={`url(#${p}pool)`} />
      <Lamp x={700} y={210} p={p} len={180} />

      {/* left wall shelves behind headline (kept calm) */}
      <g opacity="0.78">
        <Shelf x={30} y={270} w={400} p={p} />
        <Vase x={80} y={270} s={0.9} stripe={B} />
        <Frame x={160} y={270} s={0.9} />
        <Jar x={240} y={270} s={1} />
        <Jar x={280} y={270} s={0.85} />
        <Bowls x={360} y={270} s={0.9} />
        <Shelf x={30} y={500} w={400} p={p} />
        <Textiles x={90} y={500} />
        <Bottle x={180} y={500} s={0.9} />
        <Jar x={230} y={500} honey={false} label="ΕΛΑΙΟΛΑΔΟ" />
        <Jug x={300} y={500} s={1} />
        <Vase x={380} y={500} s={0.8} fill={K} dark="#7d2e20" />
        <Shelf x={30} y={720} w={400} p={p} />
        <Plant x={100} y={720} s={0.8} />
        <Basket x={220} y={720} />
        <Vase x={330} y={720} s={1.1} stripe={K} />
      </g>

      {/* right shelves behind demo, with lamp light pooling */}
      <ellipse cx="1240" cy="420" rx="240" ry="140" fill={`url(#${p}pool)`} />
      <Shelf x={1150} y={360} w={300} p={p} />
      <Jug x={1200} y={360} s={1} />
      <Jar x={1260} y={360} />
      <Frame x={1340} y={360} />
      <Vase x={1410} y={360} s={0.9} stripe={B} />
      <Shelf x={1150} y={580} w={300} p={p} />
      <Bowls x={1210} y={580} />
      <Textiles x={1300} y={580} />
      <Jar x={1390} y={580} honey={false} label="ΕΛΑΙΟΛΑΔΟ" />

      <OpenSign x={1376} y={96} p={p} />

      {/* olive tree framing the right edge */}
      <OliveTree x={1395} y={880} s={1.05} />
      <OliveTree x={712} y={892} s={0.62} />

      <rect width="1440" height="900" fill={`url(#${p}glass)`} />
      <g fill="none" stroke={B}>
        <rect x="-10" y="40" width="1460" height="890" rx="28" strokeWidth="26" opacity="0.9" />
        <path d="M1000 40 V900" strokeWidth="12" opacity="0.55" />
      </g>
      <path d="M0 53 H1440" stroke="#1d4a70" strokeWidth="4" opacity="0.8" />

      <OliveSprig x={-40} y={700} s={1.1} r={-20} />
    </svg>
  )
}

function MobileScene() {
  const p = "vm-"
  return (
    <div className="absolute inset-0 lg:hidden">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 10 10">
        <defs>
          <linearGradient id="vm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2f3a28" />
            <stop offset="1" stopColor="#262619" />
          </linearGradient>
        </defs>
        <rect width="10" height="10" fill="url(#vm-bg)" />
      </svg>
      {/* top: lamp + sign + olive sprig */}
      <svg className="absolute inset-x-0 top-0 h-[520px] w-full" viewBox="0 0 390 520" preserveAspectRatio="xMaxYMin slice">
        <Defs p={p} />
        <Lamp x={300} y={150} p={p} len={130} />
        <OliveSprig x={-20} y={50} s={0.55} r={-10} />
        <rect x="-6" y="40" width="402" height="600" rx="18" fill="none" stroke={B} strokeWidth="10" opacity="0.8" />
      </svg>
      {/* right edge: shelves peeking out behind the copy */}
      <svg className="absolute right-0 top-[440px] h-[420px] w-[210px] opacity-80" viewBox="0 0 210 420" preserveAspectRatio="xMaxYMin meet">
        <Defs p={`${p}r-`} />
        <ellipse cx="160" cy="140" rx="180" ry="180" fill={`url(#${p}r-pool)`} />
        <Shelf x={40} y={170} w={190} p={`${p}r-`} />
        <Jar x={80} y={170} />
        <Jug x={130} y={170} s={0.9} />
        <Vase x={185} y={170} s={0.9} stripe={B} />
        <Shelf x={40} y={350} w={190} p={`${p}r-`} />
        <Basket x={95} y={350} s={0.9} />
        <Jar x={165} y={350} honey={false} label="ΕΛΑΙΟΛΑΔΟ" />
        <OliveSprig x={250} y={250} s={0.5} r={30} flip />
      </svg>
    </div>
  )
}

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="vk-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#1a2e21]">
      <style>{`
        @keyframes vkb-breathe { 0%,100% { opacity:.82 } 50% { opacity:1 } }
        @keyframes vkb-sway { 0%,100% { transform:rotate(-1.2deg) } 50% { transform:rotate(1.2deg) } }
        @keyframes vkb-swing { 0%,100% { transform:rotate(-.7deg) } 50% { transform:rotate(.7deg) } }
        .vk-backdrop .vkb-glow { animation: vkb-breathe 7s ease-in-out infinite }
        .vk-backdrop .vkb-sway { animation: vkb-sway 9s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 100% }
        .vk-backdrop .vkb-sway-slow { animation: vkb-sway 13s ease-in-out infinite; transform-box: fill-box; transform-origin: 0% 0% }
        .vk-backdrop .vkb-lamp { animation: vkb-swing 8s ease-in-out infinite; transform-box: view-box }
        @media (prefers-reduced-motion: reduce) {
          .vk-backdrop .vkb-glow, .vk-backdrop .vkb-sway, .vk-backdrop .vkb-sway-slow, .vk-backdrop .vkb-lamp { animation: none }
        }
      `}</style>

      <DesktopScene />
      <MobileScene />

      {/* Awning edge: scallops at fixed pixel size; quieter on mobile */}
      <svg className="absolute inset-x-0 top-0 h-[46px] w-full opacity-50 lg:opacity-90" aria-hidden="true">
        <defs>
          <pattern id="vkb-awn" width="80" height="46" patternUnits="userSpaceOnUse">
            <rect width="40" height="30" fill="#3d6249" />
            <rect x="40" width="40" height="30" fill={K} />
            <path d="M0 30 h40 a20 14 0 0 1 -40 0z" fill="#3d6249" />
            <path d="M40 30 h40 a20 14 0 0 1 -40 0z" fill={K} />
            <path d="M0 30 h80" stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="46" fill="url(#vkb-awn)" className="max-lg:[transform:translateY(-14px)]" />
        <rect width="100%" height="5" fill="#1f3326" />
      </svg>

      {/* Legibility: κυπαρισσί gradient behind the copy */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,46,33,0.93)_0%,rgba(26,46,33,0.84)_34%,rgba(26,46,33,0.35)_52%,rgba(26,46,33,0.08)_100%)] max-lg:bg-[linear-gradient(90deg,rgba(26,46,33,0.9)_0%,rgba(26,46,33,0.78)_55%,rgba(26,46,33,0.5)_100%)]" />
      <div className="vk-grain absolute inset-0 opacity-[0.1]" />
    </div>
  )
}
