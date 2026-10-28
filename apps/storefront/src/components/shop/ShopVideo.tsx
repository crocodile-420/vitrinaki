// The owner's video introduction (profile.introVideo): a YouTube or Vimeo link
// plays in their player; an uploaded file plays in the browser's own player.
// Any other link becomes a plain button, so a page never shows a broken frame.

type Video = { kind: "embed"; src: string } | { kind: "file"; src: string } | { kind: "link"; src: string }

export function parseVideo(url: string): Video | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!/^https?:$/.test(parsed.protocol)) return null
  const host = parsed.hostname.replace(/^(www|m)\./, "")
  const id = (value: string | null | undefined) => (value && /^[\w-]{6,20}$/.test(value) ? value : "")
  if (host === "youtu.be" || host === "youtube.com" || host === "youtube-nocookie.com") {
    const path = parsed.pathname.split("/").filter(Boolean)
    const youtube = host === "youtu.be" ? id(path[0]) : id(parsed.searchParams.get("v")) || (["shorts", "embed", "live"].includes(path[0]) ? id(path[1]) : "")
    if (youtube) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${youtube}?rel=0` }
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeo = parsed.pathname.split("/").filter(Boolean).find((part) => /^\d{6,12}$/.test(part))
    if (vimeo) return { kind: "embed", src: `https://player.vimeo.com/video/${vimeo}` }
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname)) return { kind: "file", src: parsed.toString() }
  return { kind: "link", src: parsed.toString() }
}

export function ShopVideo({ url, title, accent, onAccent, linkLabel }: { url: string; title: string; accent: string; onAccent: string; linkLabel: string }) {
  const video = parseVideo(url)
  if (!video) return null
  if (video.kind === "link") {
    return (
      <a href={video.src} target="_blank" rel="noopener noreferrer" style={{ background: accent, color: onAccent }} className="vk-btn inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold">
        ▶ {linkLabel}
      </a>
    )
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {video.kind === "embed" ? (
        <iframe src={video.src} title={title} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />
      ) : (
        <video src={video.src} controls playsInline preload="metadata" className="h-full w-full object-contain" aria-label={title} />
      )}
    </div>
  )
}
