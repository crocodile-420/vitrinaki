"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

// The entrance to the Premium category: a page cut into pieces of smoked glass
// (three.js). The pieces drift, lean towards the pointer and glow under it.
// Opening shatters them towards the camera and the gallery behind shows
// through; closing flies them back. The copy is drawn once into a canvas and
// printed on the pieces, so the page reads whole while it is in one piece.
// Without WebGL, or with reduced motion, an HTML panel stands in.

export type GlassCopy = {
  brand: string
  nav: string[]
  start: string
  eyebrow: string
  title: [string, string]
  sub: string[]
  subPhone: string[]
  open: string
  startLink: string
  footLeft: string
  footRight: string
}

type Props = {
  copy: GlassCopy
  open: boolean
  onOpen: () => void
  onStart: () => void
  // The pieces finished flying out ("open") or back together ("closed").
  onSettled: (state: "open" | "closed") => void
}

type Hit = { k: "nav" | "start" | "open" | "link"; i?: number; x: number; y: number; w: number; h: number }

type Fly = { x: number; y: number; z: number; ax: THREE.Vector3; ang: number }

type Piece = {
  nav: boolean
  g: THREE.Group
  glass: THREE.Mesh
  print: THREE.Mesh
  mat: THREE.MeshPhysicalMaterial
  c: [number, number]
  half: number
  st: { z: number; vz: number; rx: number; vrx: number; ry: number; vry: number }
  hv: number
  fly: Fly | null
}

type Controller = { shatter: () => void; reassemble: () => void }

const BG = 0x050507
const FONT = "Inter, Commissioner, system-ui, sans-serif"

// Corners of the page grid, as fractions of the panel below the nav bar.
// T*/B* sit on the top and bottom edges, J* are the inner joints.
const P0: Record<string, [number, number]> = {
  tAB: [0.22, 0], tBC: [0.515, 0], tCE: [0.84, 0], bAD: [0.34, 1], bDE: [0.865, 1],
  J0: [0.385, 0.72], J1: [0.48, 0.62], J2: [0.716, 0.49],
}
const CELLS = [
  ["TL", "tAB", "J0", "bAD", "BL"],
  ["tAB", "tBC", "J1", "J0"],
  ["tBC", "tCE", "J2", "J1"],
  ["J0", "J1", "J2", "bDE", "bAD"],
  ["tCE", "TR", "BR", "bDE", "J2"],
]

function webglUsable() {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  try {
    const c = document.createElement("canvas")
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}

// Each edge moved inwards by d, so neighbouring pieces leave a thin gap.
function inset(P: [number, number][], d: number): [number, number][] {
  const n = P.length
  const c = P.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0])
  const L = P.map((a, i) => {
    const b = P[(i + 1) % n]
    const ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1
    let nx = -ey / l, ny = ex / l
    if ((c[0] - a[0]) * nx + (c[1] - a[1]) * ny < 0) { nx = -nx; ny = -ny }
    return [a[0] + nx * d, a[1] + ny * d, ex, ey]
  })
  return L.map((l, i) => {
    const m = L[(i - 1 + n) % n]
    const cr = m[2] * l[3] - m[3] * l[2]
    if (Math.abs(cr) < 1e-9) return [l[0], l[1]] as [number, number]
    const t = ((l[0] - m[0]) * l[3] - (l[1] - m[1]) * l[2]) / cr
    return [m[0] + m[2] * t, m[1] + m[3] * t] as [number, number]
  })
}

function roundedShape(Q: [number, number][], r: number, c: [number, number]) {
  const s = new THREE.Shape(), n = Q.length
  for (let i = 0; i < n; i++) {
    const p = Q[i], a = Q[(i - 1 + n) % n], b = Q[(i + 1) % n]
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1])
    const rr = Math.min(r, 0.4 * la, 0.4 * lb)
    const p1 = [p[0] + ((a[0] - p[0]) / la) * rr - c[0], p[1] + ((a[1] - p[1]) / la) * rr - c[1]]
    const p2 = [p[0] + ((b[0] - p[0]) / lb) * rr - c[0], p[1] + ((b[1] - p[1]) / lb) * rr - c[1]]
    if (!i) s.moveTo(p1[0], p1[1])
    else s.lineTo(p1[0], p1[1])
    s.quadraticCurveTo(p[0] - c[0], p[1] - c[1], p2[0], p2[1])
  }
  s.closePath()
  return s
}

const easeIn3 = (t: number) => t * t * t
const easeOutBack = (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)

function mountGlass(
  host: HTMLDivElement,
  copy: GlassCopy,
  ev: { open: () => void; start: () => void; settled: (s: "open" | "closed") => void },
  startOpen: boolean
): { ctl: Controller; dispose: () => void } {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.setClearColor(BG, 1)
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%"
  host.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 0.42
  const key = new THREE.DirectionalLight(0xe4ecff, 1.6)
  key.position.set(-700, 900, 1000)
  scene.add(key)
  const cam = new THREE.PerspectiveCamera(30, 1, 10, 30000)
  const block = new THREE.Group()
  scene.add(block)

  // Shared by every piece: pointer position, glow strength, scale.
  const U = { uP: { value: new THREE.Vector3(1e5, 1e5, 0) }, uG: { value: 0 }, uS: { value: 1 } }
  const mkMat = () => {
    const m = new THREE.MeshPhysicalMaterial({
      color: 0x17171b, roughness: 0.36, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.12,
      specularIntensity: 0.7, iridescence: 0.55, iridescenceIOR: 1.3, iridescenceThicknessRange: [250, 650], envMapIntensity: 1,
    })
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U)
      sh.vertexShader = "varying vec3 vW;\n" + sh.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvW=(modelMatrix*vec4(transformed,1.0)).xyz;"
      )
      sh.fragmentShader = "uniform vec3 uP;uniform float uG;uniform float uS;varying vec3 vW;\n" + sh.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\nfloat gd=distance(vW,uP)/(300.0*uS);totalEmissiveRadiance+=vec3(.42,.37,.62)*.22*exp(-1.6*gd*gd)*uG;"
      )
    }
    m.customProgramCacheKey = () => "vk-glass"
    return m
  }

  const cv = document.createElement("canvas")
  const ctx = cv.getContext("2d")!
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  const printMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })

  let W = 0, H = 0, bw = 1, bh = 1, S = 1, navH = 56, ph = 1, portrait = false, phone = false
  let hits: Hit[] = []

  const drift: Record<string, { px: number; py: number; a: number; b: number }> = {}
  Object.keys(P0).forEach((k) => {
    drift[k] = { px: 10 + Math.random() * 10, py: 12 + Math.random() * 8, a: Math.random() * 6.28, b: Math.random() * 6.28 }
  })

  const pieces: Piece[] = []
  const mkPiece = (nav: boolean) => {
    const g = new THREE.Group(), mat = mkMat()
    const glass = new THREE.Mesh(new THREE.BufferGeometry(), mat)
    const print = new THREE.Mesh(new THREE.BufferGeometry(), printMat)
    print.renderOrder = 2
    g.add(glass, print)
    block.add(g)
    const p: Piece = { nav, g, glass, print, mat, c: [0, 0], half: 1, st: { z: 0, vz: 0, rx: 0, vrx: 0, ry: 0, vry: 0 }, hv: 0, fly: null }
    glass.userData.p = p
    print.userData.p = p
    pieces.push(p)
  }
  mkPiece(true)
  CELLS.forEach(() => mkPiece(false))

  const build = (p: Piece, P: [number, number][]) => {
    const Q = inset(P, 7 * S), n = Q.length
    const c = Q.reduce((a, q) => [a[0] + q[0] / n, a[1] + q[1] / n], [0, 0]) as [number, number]
    p.c = c
    const sh = roundedShape(Q, 20 * S, c)
    const eg = new THREE.ExtrudeGeometry(sh, { depth: 13 * S, bevelEnabled: true, bevelThickness: 2.6 * S, bevelSize: 2.6 * S, bevelSegments: 3, curveSegments: 5 })
    const pg = new THREE.ShapeGeometry(sh, 5)
    // The print's UVs map into the whole page, so each piece shows its own part of it.
    const pos = pg.attributes.position, uv = pg.attributes.uv
    for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + c[0] + bw / 2) / bw, (pos.getY(k) + c[1] + bh / 2) / bh)
    uv.needsUpdate = true
    p.glass.geometry.dispose()
    p.print.geometry.dispose()
    p.glass.geometry = eg
    p.print.geometry = pg
    p.print.position.z = 15.6 * S + 0.5
    p.half = Math.max(...Q.map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])))
  }

  let ptrN: [number, number] | null = null
  const cellPoints = (t: number) => {
    const o: Record<string, [number, number]> = { TL: [0, 0], TR: [1, 0], BL: [0, 1], BR: [1, 1] }
    for (const k in P0) {
      let [x, y] = P0[k]
      const h = drift[k], joint = k[0] === "J"
      x += 0.03 * Math.sin((t * 6.283) / h.px + h.a)
      if (joint) y += 0.05 * Math.sin((t * 6.283) / h.py + h.b)
      if (ptrN) {
        const dx = x - ptrN[0], dy = y - ptrN[1], d = Math.hypot(dx, dy)
        if (d < 0.6 && d > 1e-4) {
          const f = 0.05 * (1 - d / 0.6)
          x += (dx / d) * f
          if (joint) y += (dy / d) * f
        }
      }
      if (!joint) x = Math.min(0.95, Math.max(0.05, x))
      else {
        x = Math.min(0.92, Math.max(0.08, x))
        y = Math.min(0.92, Math.max(0.08, y))
      }
      o[k] = [x, y]
    }
    return o
  }
  const toWorld = ([u, v]: [number, number]): [number, number] => {
    if (portrait) [u, v] = [v, u]
    return [-bw / 2 + u * bw, bh / 2 - navH - v * ph]
  }
  const buildCells = (t: number) => {
    const o = cellPoints(t)
    CELLS.forEach((cl, i) => build(pieces[i + 1], cl.map((k) => toWorld(o[k]))))
  }
  const buildNav = () => build(pieces[0], [[-bw / 2, bh / 2], [bw / 2, bh / 2], [bw / 2, bh / 2 - navH], [-bw / 2, bh / 2 - navH]])

  // The page printed on the glass.
  const ui = { open: false, link: false, start: false, nav: -1 }
  const font = (w: number, s: number) => `${w} ${s}px ${FONT}`
  const spaced = (g: CanvasRenderingContext2D, px: number) => {
    if ("letterSpacing" in g) (g as any).letterSpacing = `${px}px`
  }
  const draw = () => {
    const dpr = Math.max(1.5, Math.min(2, window.devicePixelRatio || 1))
    cv.width = Math.round(bw * dpr)
    cv.height = Math.round(bh * dpr)
    const g = ctx
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, bw, bh)
    hits = []
    const s2 = Math.max(S, 0.62), pad = Math.max(34 * S, 18), cy = navH / 2
    g.textBaseline = "middle"

    g.fillStyle = "#b9abff"
    g.beginPath()
    g.roundRect(pad, cy - 8 * s2, 16 * s2, 16 * s2, 4 * s2)
    g.fill()
    g.fillStyle = "#e9e9ee"
    g.font = font(600, 17 * s2)
    g.fillText(copy.brand, pad + 26 * s2, cy)

    g.font = font(500, 14 * s2)
    if (!phone) {
      const gap = 34 * s2
      let x = bw / 2 - (copy.nav.reduce((a, t) => a + g.measureText(t).width, 0) + gap * (copy.nav.length - 1)) / 2
      copy.nav.forEach((t, i) => {
        const w = g.measureText(t).width
        g.fillStyle = ui.nav === i ? "#fff" : "rgba(255,255,255,.6)"
        g.fillText(t, x, cy)
        hits.push({ k: "nav", i, x, y: cy - 12, w, h: 24 })
        x += w + gap
      })
    }
    g.font = font(600, 14 * s2)
    const sw = g.measureText(copy.start).width
    g.fillStyle = ui.start ? "#fff" : "rgba(255,255,255,.85)"
    g.fillText(copy.start, bw - pad - sw, cy)
    hits.push({ k: "start", x: bw - pad - sw, y: cy - 12, w: sw, h: 24 })

    const y0 = navH, lx = Math.max(bw * 0.06, 22)
    g.textBaseline = "alphabetic"
    const es = Math.max(11 * S, 10)
    g.font = font(500, es)
    spaced(g, es * 0.2)
    g.fillStyle = "rgba(255,255,255,.38)"
    g.fillText(copy.eyebrow, lx, y0 + ph * 0.135)
    spaced(g, 0)

    const hs = phone ? Math.min(bw * 0.118, ph * 0.1) : Math.min(bw * 0.078, ph * 0.2)
    const hy = y0 + ph * 0.135 + hs * 1.15
    g.font = font(500, hs)
    spaced(g, -0.045 * hs)
    const gr = g.createLinearGradient(0, hy - hs, 0, hy + hs * 1.1)
    gr.addColorStop(0, "#dcdce0")
    gr.addColorStop(1, "#bdbdc3")
    g.fillStyle = gr
    g.fillText(copy.title[0], lx, hy)
    g.fillText(copy.title[1], lx, hy + hs * 0.97)
    spaced(g, 0)

    const ss = Math.max(17 * S, 13), sy = hy + hs * 0.97 + ss * 2.4
    g.font = font(400, ss)
    g.fillStyle = "rgba(255,255,255,.55)"
    ;(phone ? copy.subPhone : copy.sub).forEach((t, i) => g.fillText(t, lx, sy + i * ss * 1.45))

    const lines = (phone ? copy.subPhone : copy.sub).length
    const by = sy + ss * 1.45 * (lines - 1) + ss * 2.2, bs = Math.max(14 * S, 13)
    g.font = font(600, bs)
    const btw = Math.max(116 * S, g.measureText(copy.open).width + 32 * s2), bh2 = Math.max(40 * S, 34)
    g.fillStyle = ui.open ? "#b9abff" : "#ececf0"
    g.beginPath()
    g.roundRect(lx, by, btw, bh2, 6 * s2)
    g.fill()
    g.fillStyle = "#111"
    g.textBaseline = "middle"
    g.fillText(copy.open, lx + (btw - g.measureText(copy.open).width) / 2, by + bh2 / 2)
    hits.push({ k: "open", x: lx, y: by, w: btw, h: bh2 })

    g.font = font(500, bs)
    const rw = g.measureText(copy.startLink).width
    const linkOnNext = phone && lx + btw + 24 * s2 + rw > bw - lx
    const rx = linkOnNext ? lx : lx + btw + 24 * s2, ry = linkOnNext ? by + bh2 * 1.9 : by + bh2 / 2
    g.fillStyle = "#fff"
    g.fillText(copy.startLink, rx, ry)
    if (ui.link) g.fillRect(rx, ry + bs * 0.75, rw, 1.2)
    hits.push({ k: "link", x: rx - 6, y: ry - bh2 / 2, w: rw + 12, h: bh2 })

    g.textBaseline = "alphabetic"
    const fs = Math.max(11 * S, 10)
    g.font = font(400, fs)
    g.fillStyle = "rgba(255,255,255,.34)"
    const fy = bh - Math.max(28 * S, 16)
    g.fillText(copy.footLeft, lx, fy)
    if (!phone) g.fillText(copy.footRight, bw - lx - g.measureText(copy.footRight).width, fy)
    tex.needsUpdate = true
  }

  const layout = () => {
    W = host.clientWidth
    H = host.clientHeight
    if (!W || !H) return false
    renderer.setSize(W, H, false)
    cam.aspect = W / H
    cam.position.set(0, 0, H / 2 / Math.tan((15 * Math.PI) / 180))
    cam.updateProjectionMatrix()
    phone = W < 700
    portrait = H > W * 1.05
    const mx = phone ? 16 : W * 0.055, my = phone ? 16 : H * 0.085
    bw = W - 2 * mx
    bh = H - 2 * my
    S = bw / 1730
    if (phone) S = Math.max(S, 0.42)
    U.uS.value = S
    navH = Math.max(bh * 0.108, phone ? 50 : 56)
    ph = bh - navH
    buildNav()
    buildCells(performance.now() / 1000)
    draw()
    return true
  }

  // Motion: "rest" whole, "out" shattering, "gone" shattered, "in" coming back.
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2()
  const eu = new THREE.Euler(), qa = new THREE.Quaternion(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), tmp = new THREE.Vector3()
  let ptr = { in: false, x: 0, y: 0 }
  const tilt = { x: 0, y: 0 }
  let glow = 0, mode: "rest" | "out" | "gone" | "in" = startOpen ? "gone" : "in", t0 = performance.now() + 250
  let running = false, visible = true, raf = 0, lastBuild = 0, lastT = performance.now()
  let hov: Piece | null = null, curHit: Hit | undefined

  const genFly = () => pieces.forEach((p) => {
    const L = Math.hypot(p.c[0], p.c[1]) || 1, o = (260 + Math.random() * 320) * S
    p.fly = {
      x: (p.c[0] / L) * o + (Math.random() - 0.5) * 160 * S,
      y: (p.c[1] / L) * o - (200 + Math.random() * 200) * S,
      z: (420 + Math.random() * 380) * S,
      ax: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
      ang: 2 + Math.random() * 1.6,
    }
  })
  const amount = (i: number, now: number) => {
    if (mode === "rest") return 0
    if (mode === "gone") return 1
    const stagger = mode === "out" ? 0.045 : 0.03
    const l = Math.min(1, Math.max(0, (now - t0) / 1000 - i * stagger) / 0.72)
    return mode === "out" ? easeIn3(l) : 1 - easeOutBack(l)
  }

  const hitAt = (u: number, v: number) => {
    const x = u * bw, y = (1 - v) * bh
    return hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)
  }
  const setUi = (h: Hit | undefined) => {
    const o = h?.k === "open", l = h?.k === "link", s = h?.k === "start", n = h?.k === "nav" ? h.i ?? -1 : -1
    if (o !== ui.open || l !== ui.link || s !== ui.start || n !== ui.nav) {
      ui.open = o; ui.link = l; ui.start = s; ui.nav = n
      draw()
    }
  }

  const frame = () => {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    const k = 1 - Math.exp(-dt / 0.3)
    const tx = ptr.in ? ptr.x * 7 - 1.2 : -1.2, ty = ptr.in ? -ptr.y * 5.5 + 0.8 : 0.8
    tilt.x += (tx - tilt.x) * k
    tilt.y += (ty - tilt.y) * k
    block.rotation.set((tilt.y * Math.PI) / 180, (tilt.x * Math.PI) / 180, 0)
    block.updateMatrixWorld()

    let hit: THREE.Intersection | null = null
    curHit = undefined
    if (ptr.in) {
      m2.set(ptr.x, ptr.y)
      ray.setFromCamera(m2, cam)
      const found = ray.intersectObjects(pieces.map((p) => p.print), false)
      if (found.length) {
        hit = found[0]
        U.uP.value.copy(hit.point)
      } else if (ray.ray.intersectPlane(plane, tmp)) U.uP.value.copy(tmp)
      const lp = block.worldToLocal(U.uP.value.clone())
      const nu = (lp.x + bw / 2) / bw, nv = (bh / 2 - navH - lp.y) / ph
      ptrN = lp.y < bh / 2 - navH ? (portrait ? [nv, nu] : [nu, nv]) : null
    }
    glow += ((ptr.in && mode === "rest" ? 1 : 0) - glow) * Math.min(1, dt * 5)
    U.uG.value = glow
    hov = mode === "rest" && hit ? (hit.object.userData.p as Piece) : null
    if (hov && hit?.uv) curHit = hitAt(hit.uv.x, hit.uv.y)
    setUi(mode === "rest" ? curHit : undefined)
    host.style.cursor = mode === "rest" && (hov || curHit) ? "pointer" : "default"
    if (now - lastBuild > 22 && mode !== "gone") {
      lastBuild = now
      buildCells(now / 1000)
    }

    let done = true
    pieces.forEach((p, i) => {
      const s = p.st, on = p === hov
      let tz = 0, trx = 0, tr_y = 0
      if (on && hit) {
        tz = (p.nav ? 32 : 50) * S
        const lp = p.g.worldToLocal(hit.point.clone()), hh = p.half || 1
        tr_y = Math.max(-1, Math.min(1, lp.x / hh)) * 0.24
        trx = -Math.max(-1, Math.min(1, lp.y / hh)) * 0.24 * (p.nav ? 0.4 : 1)
      }
      // Springs, two half steps per frame.
      for (let n = 0; n < 2; n++) {
        const h = dt / 2
        s.vz += (170 * (tz - s.z) - 19 * s.vz) * h; s.z += s.vz * h
        s.vrx += (170 * (trx - s.rx) - 19 * s.vrx) * h; s.rx += s.vrx * h
        s.vry += (170 * (tr_y - s.ry) - 19 * s.vry) * h; s.ry += s.vry * h
      }
      p.hv += ((on ? 1 : 0) - p.hv) * Math.min(1, dt * 8)
      p.mat.iridescence = 0.55 + 0.45 * p.hv
      p.mat.envMapIntensity = 1 + 0.9 * p.hv
      const e = amount(i, now)
      const f = p.fly ?? { x: 0, y: 0, z: 0, ax: new THREE.Vector3(0, 0, 1), ang: 0 }
      if ((mode === "out" && e < 1) || (mode === "in" && e > 0.0001)) done = false
      p.g.position.set(p.c[0] + f.x * e, p.c[1] + f.y * e - 240 * S * e * e, s.z + f.z * e)
      eu.set(s.rx, s.ry, 0)
      p.g.quaternion.setFromEuler(eu).multiply(qa.setFromAxisAngle(f.ax, f.ang * e))
      p.g.visible = e < 0.999
    })
    // The dark backdrop clears with the first piece, so the gallery shows through.
    renderer.setClearColor(BG, 1 - amount(0, now))
    renderer.render(scene, cam)
    if (done) {
      if (mode === "out") {
        mode = "gone"
        ev.settled("open")
        running = false
      } else if (mode === "in") {
        mode = "rest"
        ev.settled("closed")
      }
    }
  }

  const start = () => {
    if (running || mode === "gone" || !visible) return
    if (!layout()) {
      raf = requestAnimationFrame(start)
      return
    }
    if (mode === "in" && !pieces[0].fly) genFly()
    running = true
    lastT = performance.now()
    frame()
  }
  const stop = () => {
    running = false
    cancelAnimationFrame(raf)
  }

  const ctl: Controller = {
    shatter() {
      if (mode !== "rest" && mode !== "in") return
      if (!running) layout()
      genFly()
      mode = "out"
      t0 = performance.now()
      hov = null
      start()
    },
    reassemble() {
      if (mode !== "gone" && mode !== "out") return
      if (mode === "gone") genFly()
      mode = "in"
      t0 = performance.now() + 150
      start()
    },
  }

  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect()
    ptr = { in: true, x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) }
  }
  const onLeave = () => {
    ptr.in = false
    ptrN = null
  }
  // The whole glass is the door: any click opens, except the start links.
  // Picked at the click itself: on touch there is no hover, and a hover from
  // a frame ago may sit on another button.
  const hitUnder = (e: MouseEvent) => {
    const r = host.getBoundingClientRect()
    m2.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1))
    ray.setFromCamera(m2, cam)
    const uv = ray.intersectObjects(pieces.map((p) => p.print), false)[0]?.uv
    return uv ? hitAt(uv.x, uv.y) : undefined
  }
  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a,button") || mode !== "rest") return
    const h = hitUnder(e)
    if (h?.k === "start" || h?.k === "link") ev.start()
    else ev.open()
  }
  host.addEventListener("pointermove", onMove)
  host.addEventListener("pointerleave", onLeave)
  host.addEventListener("click", onClick)

  const ro = new ResizeObserver(() => {
    if (running) layout()
  })
  ro.observe(host)
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else stop()
  })
  io.observe(host)

  const fontsReady = document.fonts ? document.fonts.load(`500 40px Inter`).catch(() => undefined) : Promise.resolve()
  let disposed = false
  fontsReady.then(() => {
    if (disposed) return
    if (startOpen) {
      layout()
      renderer.setClearColor(BG, 0)
      renderer.clear()
    } else start()
  })

  return {
    ctl,
    dispose() {
      disposed = true
      stop()
      ro.disconnect()
      io.disconnect()
      host.removeEventListener("pointermove", onMove)
      host.removeEventListener("pointerleave", onLeave)
      host.removeEventListener("click", onClick)
      pieces.forEach((p) => {
        p.glass.geometry.dispose()
        p.print.geometry.dispose()
        p.mat.dispose()
      })
      printMat.dispose()
      tex.dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export function GlassEntrance({ copy, open, onOpen, onStart, onSettled }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const ctl = useRef<Controller | null>(null)
  const ev = useRef({ open: onOpen, start: onStart, settled: onSettled })
  ev.current = { open: onOpen, start: onStart, settled: onSettled }
  const openRef = useRef(open)
  openRef.current = open
  const [gl, setGl] = useState<boolean | null>(null)

  useEffect(() => setGl(webglUsable()), [])

  useEffect(() => {
    if (!gl || !host.current) return
    let mounted: ReturnType<typeof mountGlass>
    try {
      mounted = mountGlass(host.current, copy, {
        open: () => ev.current.open(),
        start: () => ev.current.start(),
        settled: (s) => ev.current.settled(s),
      }, openRef.current)
    } catch {
      setGl(false)
      return
    }
    ctl.current = mounted.ctl
    return () => {
      ctl.current = null
      mounted.dispose()
    }
  }, [gl, copy])

  useEffect(() => {
    if (gl === false) {
      onSettled(open ? "open" : "closed")
      return
    }
    if (open) ctl.current?.shatter()
    else ctl.current?.reassemble()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gl])

  if (gl === false) {
    return (
      <div className={`absolute inset-0 grid grid-rows-[auto_1fr] gap-3.5 bg-[#050507] p-4 transition-opacity duration-300 sm:p-8 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <div className="flex items-center justify-between rounded-[20px] bg-gradient-to-br from-[#1d1d22] to-[#121215] px-6 py-4 text-sm text-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]">
          <b className="text-white">{copy.brand}</b>
          <button type="button" onClick={onStart} className="font-semibold text-white/85 hover:text-white">{copy.start}</button>
        </div>
        <div className="flex flex-col justify-center gap-4 rounded-[20px] bg-gradient-to-br from-[#1d1d22] to-[#121215] px-7 py-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]">
          <small className="text-[11px] tracking-[0.2em] text-white/40">{copy.eyebrow}</small>
          <h1 className="bg-gradient-to-b from-[#dcdce0] to-[#bdbdc3] bg-clip-text text-[clamp(44px,7.8vw,120px)] font-medium leading-[0.97] tracking-[-0.045em] text-transparent">
            {copy.title[0]}<br />{copy.title[1]}
          </h1>
          <p className="max-w-[56ch] leading-relaxed text-white/55">{copy.sub.join(" ")}</p>
          <div className="flex flex-wrap items-center gap-5">
            <button type="button" onClick={onOpen} className="rounded-md bg-[#ececf0] px-4 py-2.5 font-semibold text-[#111] hover:bg-[#b9abff]">{copy.open}</button>
            <button type="button" onClick={onStart} className="text-white hover:underline">{copy.startLink}</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={host} className={`absolute inset-0 touch-pan-y overflow-hidden ${open ? "pointer-events-none" : ""}`}>
      {/* The glass is drawn on a canvas; these give keyboard and screen reader users the same two doors. */}
      <h1 className="sr-only">{copy.title.join(" ")}</h1>
      <div className="absolute bottom-4 left-4 z-10 flex gap-3">
        <button type="button" onClick={onOpen} className="sr-only rounded-md bg-[#ececf0] px-4 py-2.5 text-sm font-semibold text-[#111] focus:not-sr-only">{copy.open}</button>
        <button type="button" onClick={onStart} className="sr-only rounded-md px-4 py-2.5 text-sm text-white focus:not-sr-only">{copy.startLink}</button>
      </div>
    </div>
  )
}
