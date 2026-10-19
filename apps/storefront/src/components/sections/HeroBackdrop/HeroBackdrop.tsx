/**
 * Illustrated hero backdrop: a softly lit Greek shop interior seen through a
 * large shop window, drawn in the style of the vitrinaki.gr logo.
 * Pure inline SVG + CSS, no images. Motion is disabled under reduced motion.
 */

const G = "#2E4A37" // κυπαρισσί
const K = "#C0503C" // κεραμιδί
const B = "#265E8E" // μπλε

function Vase({ x, y, s = 1, fill = "#D9B48A", shade = "#B98E63", neck = 0.35 }: { x: number; y: number; s?: number; fill?: string; shade?: string; neck?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M${-14 * neck * 2} -64 h${28 * neck * 2} l-2 10 c18 6 30 22 30 38 c0 10-6 16-14 16 h-28 c-8 0-14-6-14-16 c0-16 12-32 30-38 z`} fill={fill} />
      <path d="M8 -46 c14 8 20 20 20 30 c0 10-6 16-14 16 h-6 c8-10 10-30 0-46 z" fill={shade} opacity="0.7" />
      <path d="M-18 -30 c-4 8-4 16 0 22" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Bottle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-5" y="-92" width="10" height="10" rx="2" fill="#5a3a22" />
      <path d="M-5 -82 h10 v14 c10 4 14 10 14 18 v50 h-38 v-50 c0-8 4-14 14-18 z" fill="#B8641F" />
      <path d="M4 -66 c8 4 10 10 10 16 v50 h-8 v-60 z" fill="#7a3d12" opacity="0.55" />
      <rect x="-12" y="-42" width="24" height="22" rx="2" fill="#F7E7C8" opacity="0.85" />
      <path d="M-11 -60 v52" stroke="#FFD9A0" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const leaves = [
    [-50, -150, -60], [-30, -175, -30], [0, -190, 0], [28, -172, 28], [52, -140, 55],
    [-42, -110, -70], [40, -105, 70], [-14, -150, -12], [16, -140, 14],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="vkb-sway" style={{ transformOrigin: `${x}px ${y - 60 * s}px` }}>
        {leaves.map(([lx, ly, r], i) => (
          <g key={i}>
            <path d={`M0 -58 Q${lx * 0.4} ${(ly - 58) / 2} ${lx} ${ly}`} stroke="#3c5a3f" strokeWidth="2.5" fill="none" />
            <ellipse cx={lx} cy={ly} rx="11" ry="30" transform={`rotate(${r} ${lx} ${ly})`} fill={i % 2 ? "#4d7a52" : "#3d6a45"} />
            <path d={`M${lx} ${ly - 26} L${lx} ${ly + 26}`} transform={`rotate(${r} ${lx} ${ly})`} stroke="#9fbf8f" strokeOpacity="0.5" strokeWidth="1.2" />
          </g>
        ))}
      </g>
      <path d="M-40 -64 h80 l-8 64 h-64 z" fill={K} />
      <path d="M10 -64 h30 l-8 64 h-22 z" fill="#8f3526" opacity="0.6" />
      <rect x="-44" y="-70" width="88" height="12" rx="3" fill="#d4664f" />
    </g>
  )
}

function Box({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return (
    <g>
      <rect x={x} y={y - h} width={w} height={h} rx="3" fill={fill} />
      <rect x={x + w * 0.62} y={y - h} width={w * 0.38} height={h} rx="3" fill="#000" opacity="0.15" />
      <path d={`M${x + w / 2 - 4} ${y - h} v${h}`} stroke="#F7E7C8" strokeOpacity="0.55" strokeWidth="3" />
    </g>
  )
}

function OliveSprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  const leaves: [number, number, number][] = [
    [40, 30, -30], [80, 52, 20], [120, 70, -40], [160, 96, 25], [200, 112, -35],
    [240, 140, 30], [280, 156, -20], [70, 20, -70], [150, 70, -75], [230, 118, -70], [310, 178, 10],
  ]
  return (
    <svg viewBox="0 0 360 240" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <g className="vkb-sway-slow" style={{ transformOrigin: "0px 0px" }}>
        <path d="M0 0 C90 50 200 110 330 190" stroke="#4a3a24" strokeWidth="5" fill="none" strokeLinecap="round" />
        {leaves.map(([x, y, r], i) => (
          <g key={i} transform={`rotate(${r} ${x} ${y})`}>
            <path d={`M${x} ${y} c14-10 46-10 70 0 c-24 10-56 10-70 0z`} fill={i % 3 === 0 ? "#3d5f3a" : i % 3 === 1 ? "#557a45" : "#2f4b30"} />
            <path d={`M${x + 4} ${y} h58`} stroke="#c7d6a8" strokeOpacity="0.45" strokeWidth="1.3" />
          </g>
        ))}
        {[[132, 92], [150, 104], [262, 160], [276, 174]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="9" ry="12" transform={`rotate(-30 ${x} ${y})`} fill="#3b4a1c" />
            <ellipse cx={x - 3} cy={y - 4} rx="2.5" ry="3.5" fill="#d9e0a6" opacity="0.5" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="vk-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#1a2e21]">
      <style>{`
        @keyframes vkb-breathe { 0%,100% { opacity:.85; transform:scale(1) } 50% { opacity:1; transform:scale(1.06) } }
        @keyframes vkb-sway { 0%,100% { transform:rotate(-1.4deg) } 50% { transform:rotate(1.4deg) } }
        @keyframes vkb-swing { 0%,100% { transform:rotate(-.8deg) } 50% { transform:rotate(.8deg) } }
        .vk-backdrop .vkb-glow { animation: vkb-breathe 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center }
        .vk-backdrop .vkb-sway { animation: vkb-sway 9s ease-in-out infinite; transform-box: view-box }
        .vk-backdrop .vkb-sway-slow { animation: vkb-sway 12s ease-in-out infinite; transform-box: view-box }
        .vk-backdrop .vkb-lamp { animation: vkb-swing 8s ease-in-out infinite; transform-box: view-box; transform-origin: 700px 0px }
        @media (prefers-reduced-motion: reduce) {
          .vk-backdrop .vkb-glow, .vk-backdrop .vkb-sway, .vk-backdrop .vkb-sway-slow, .vk-backdrop .vkb-lamp { animation: none }
        }
      `}</style>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="vkb-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3a3424" />
            <stop offset="0.55" stopColor="#4a3f2a" />
            <stop offset="1" stopColor="#2a2a1d" />
          </linearGradient>
          <radialGradient id="vkb-lampglow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFD58A" stopOpacity="0.9" />
            <stop offset="0.35" stopColor="#F2A65A" stopOpacity="0.4" />
            <stop offset="1" stopColor="#F2A65A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vkb-warm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#E8A866" stopOpacity="0.4" />
            <stop offset="1" stopColor="#E8A866" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="vkb-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8754a" />
            <stop offset="1" stopColor="#6e4628" />
          </linearGradient>
          <linearGradient id="vkb-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.07" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="vkb-blur-far"><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="vkb-blur-soft"><feGaussianBlur stdDeviation="1.2" /></filter>
        </defs>

        {/* Back wall + warm floor light */}
        <rect width="1440" height="900" fill="url(#vkb-wall)" />
        <path d="M0 0 H1440 V900 H0z" fill={G} opacity="0.35" />
        {/* Wainscot / arch niche on the back wall */}
        <path d="M820 760 V330 a170 170 0 0 1 340 0 V760z" fill="#2c2a1c" opacity="0.45" />
        <rect y="770" width="1440" height="130" fill="#2a2216" />
        <rect y="770" width="1440" height="6" fill="#7a5532" opacity="0.6" />

        {/* Far layer: blurred shelves deep in the room */}
        <g filter="url(#vkb-blur-far)" opacity="0.55">
          <rect x="860" y="430" width="280" height="10" fill="url(#vkb-wood)" />
          <Vase x={900} y={430} s={0.6} fill="#c9a37c" shade="#9c7650" />
          <Bottle x={960} y={430} s={0.55} />
          <Box x={1010} y={430} w={50} h={40} fill="#8a5a3a" />
          <Vase x={1100} y={430} s={0.55} fill={B} shade="#183f60" neck={0.25} />
          <rect x="860" y="600" width="280" height="10" fill="url(#vkb-wood)" />
          <Box x={880} y={600} w={60} h={46} fill="#a06a3e" />
          <Vase x={990} y={600} s={0.7} fill="#e2c9a6" shade="#b99b74" />
          <Bottle x={1060} y={600} s={0.6} />
          <Vase x={1110} y={600} s={0.5} fill={K} shade="#8f3526" neck={0.25} />
        </g>

        {/* Lamp glow */}
        <ellipse className="vkb-glow" cx="700" cy="230" rx="460" ry="400" fill="url(#vkb-lampglow)" />
        <ellipse cx="1000" cy="520" rx="420" ry="300" fill="url(#vkb-warm)" />

        {/* Pendant lamp */}
        <g className="vkb-lamp">
          <path d="M700 50 V122" stroke="#1b1b14" strokeWidth="3" />
          <path d="M655 170 a45 45 0 0 1 90 0 z" fill={B} />
          <path d="M688 122 h24 v14 h-24z" fill="#1d4a70" />
          <path d="M668 150 a34 34 0 0 1 20 -18" stroke="#fff" strokeOpacity="0.3" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M652 170 h96" stroke="#183f60" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="700" cy="174" rx="18" ry="10" fill="#FFF1C9" />
          <ellipse className="vkb-glow" cx="700" cy="180" rx="44" ry="22" fill="#FFE2A0" opacity="0.55" filter="url(#vkb-blur-soft)" />
          <path d="M660 176 L560 520 H840 L740 176z" fill="#FFD58A" opacity="0.06" />
        </g>

        {/* Left wall shelving (sits behind the headline, low contrast) */}
        <g opacity="0.75">
          <rect x="40" y="250" width="360" height="14" rx="2" fill="url(#vkb-wood)" />
          <rect x="40" y="470" width="360" height="14" rx="2" fill="url(#vkb-wood)" />
          <rect x="40" y="690" width="360" height="14" rx="2" fill="url(#vkb-wood)" />
          <Vase x={90} y={250} s={0.9} fill="#d9b48a" shade="#a57d55" />
          <Box x={150} y={250} w={60} h={50} fill="#8a5a3a" />
          <Bottle x={250} y={250} s={0.8} />
          <Vase x={330} y={250} s={0.7} fill={B} shade="#183f60" neck={0.25} />
          <Box x={60} y={470} w={50} h={64} fill="#a8724a" />
          <Vase x={170} y={470} s={1.1} fill="#e8d3b4" shade="#bba07c" />
          <Bottle x={250} y={470} s={0.9} />
          <Bottle x={290} y={470} s={0.7} />
          <Vase x={350} y={470} s={0.8} fill={K} shade="#8f3526" neck={0.22} />
          <Plant x={110} y={690} s={0.8} />
          <Box x={200} y={690} w={70} h={44} fill="#9a663e" />
          <Vase x={320} y={690} s={0.85} fill="#c9a37c" shade="#9c7650" />
        </g>

        {/* Right-hand shelf behind the demo */}
        <g>
          <rect x="1180" y="340" width="260" height="14" rx="2" fill="url(#vkb-wood)" />
          <path d="M1200 354 l20 30 h6 l-16 -30z" fill="#5a3a22" />
          <Vase x={1220} y={340} s={1} fill="#e2c9a6" shade="#b99b74" />
          <Bottle x={1290} y={340} s={0.95} />
          <Box x={1330} y={340} w={70} h={56} fill="#a8724a" />
          <rect x="1180" y="560" width="260" height="14" rx="2" fill="url(#vkb-wood)" />
          <Vase x={1230} y={560} s={1.2} fill={B} shade="#183f60" neck={0.25} />
          <Box x={1290} y={560} w={56} h={70} fill="#8a5a3a" />
          <Vase x={1390} y={560} s={0.9} fill={K} shade="#8f3526" neck={0.22} />
        </g>

        {/* Large potted olive tree, foreground-ish, between text and demo */}
        <g transform="translate(700 770)">
          <path d="M0 -70 C-6 -160 18 -240 -8 -330 M0 -150 C30 -200 60 -230 90 -300 M-4 -220 C-40 -260 -70 -280 -100 -330" stroke="#4a3a24" strokeWidth="7" fill="none" strokeLinecap="round" />
          <g className="vkb-sway" style={{ transformOrigin: "700px 500px" }}>
            {Array.from({ length: 38 }).map((_, i) => {
              const a = (i * 137.5) % 360
              const rr = 30 + ((i * 53) % 110)
              const cx = Math.cos((a * Math.PI) / 180) * rr * 1.2
              const cy = -320 + Math.sin((a * Math.PI) / 180) * rr * 0.55
              return <ellipse key={i} cx={cx} cy={cy} rx="7" ry="22" transform={`rotate(${a} ${cx} ${cy})`} fill={["#3d5f3a", "#557a45", "#6f8f5a", "#2f4b30"][i % 4]} opacity="0.95" />
            })}
          </g>
          <path d="M-60 -80 h120 l-14 80 h-92z" fill="#b5654a" />
          <path d="M20 -80 h40 l-14 80 h-32z" fill="#7d3a28" opacity="0.6" />
          <rect x="-66" y="-90" width="132" height="16" rx="4" fill="#cf7a5c" />
        </g>

        {/* Window glass reflection */}
        <rect width="1440" height="900" fill="url(#vkb-glass)" />

        {/* Shop-window frame (blue, like the logo) */}
        <g fill="none" stroke={B}>
          <rect x="-10" y="40" width="1460" height="890" rx="28" strokeWidth="26" opacity="0.9" />
          <path d="M1000 40 V900" strokeWidth="14" opacity="0.6" />
        </g>
        <path d="M0 53 H1440" stroke="#1d4a70" strokeWidth="4" opacity="0.8" />

      </svg>


      {/* Awning edge: subtle scallops, fixed pixel size at every width */}
      <svg className="absolute inset-x-0 top-0 h-[46px] w-full" aria-hidden="true">
        <defs>
          <pattern id="vkb-awn" width="80" height="46" patternUnits="userSpaceOnUse">
            <rect width="40" height="30" fill="#3d6249" />
            <rect x="40" width="40" height="30" fill={K} />
            <path d="M0 30 h40 a20 14 0 0 1 -40 0z" fill="#3d6249" />
            <path d="M40 30 h40 a20 14 0 0 1 -40 0z" fill={K} />
            <path d="M0 30 h80" stroke="#000" strokeOpacity="0.12" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="46" fill="url(#vkb-awn)" opacity="0.9" />
        <rect width="100%" height="5" fill="#1f3326" />
      </svg>

      {/* Olive branches framing corners */}
      <OliveSprig className="absolute -left-6 bottom-0 w-[260px] translate-y-[38%] -rotate-[60deg] opacity-80 sm:w-[340px]" />
      <OliveSprig flip className="absolute -right-4 top-10 hidden w-[300px] opacity-90 lg:block" />

      {/* Legibility: κυπαρισσί gradient from the left, darker on mobile */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,46,33,0.93)_0%,rgba(26,46,33,0.82)_32%,rgba(26,46,33,0.4)_52%,rgba(26,46,33,0.15)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(26,46,33,0.35)_0%,rgba(26,46,33,0.85)_22%,rgba(26,46,33,0.88)_60%,rgba(26,46,33,0.72)_100%)]" />
      <div className="vk-grain absolute inset-0 opacity-[0.12]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a2e21]/80 to-transparent" />
    </div>
  )
}
