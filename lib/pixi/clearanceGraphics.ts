import { Container, Graphics, Text } from "pixi.js"
import type { Point } from "./rampSurface"

export type CriticalOverlay = {
  /** Screen-space points (overlay is not affected by camera zoom). */
  rear: Point
  front: Point
  crest: Point
  /** Projection of the crest onto the wheel-contact chord. */
  chordFoot: Point
  /** Underbody point directly above the crest. */
  floor: Point
  intrusionLabel: string
  gapLabel: string
  color: number
  hit: boolean
}

export type ClearanceView = {
  root: Container
  show: (overlay: CriticalOverlay) => void
  hide: () => void
}

const CHORD_COLOR = 0x57534e
const INTRUSION_COLOR = 0xc45c26

function makeText() {
  return new Text({
    text: "",
    style: {
      fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
      fontSize: 13,
      fontWeight: "700",
      fill: 0x0f172a,
      stroke: { color: 0xf3f0ea, width: 4 },
    },
  })
}

function dashed(g: Graphics, a: Point, b: Point, dash = 6, gap = 4) {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (len < 1e-6) return
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  for (let d = 0; d < len; d += dash + gap) {
    const e = Math.min(len, d + dash)
    g.moveTo(a.x + ux * d, a.y + uy * d)
    g.lineTo(a.x + ux * e, a.y + uy * e)
  }
}

export function createClearanceGraphics(): ClearanceView {
  const root = new Container()
  root.visible = false

  const lines = new Graphics()
  const intrusionText = makeText()
  const gapText = makeText()
  root.addChild(lines, intrusionText, gapText)

  const show = (o: CriticalOverlay) => {
    root.visible = true
    lines.clear()

    dashed(lines, o.rear, o.front)
    lines.stroke({ width: 2, color: CHORD_COLOR })
    for (const p of [o.rear, o.front]) {
      lines.circle(p.x, p.y, 4)
      lines.fill({ color: CHORD_COLOR })
    }

    lines.moveTo(o.chordFoot.x, o.chordFoot.y)
    lines.lineTo(o.crest.x, o.crest.y)
    lines.stroke({ width: 3, color: INTRUSION_COLOR })

    lines.moveTo(o.crest.x, o.crest.y)
    lines.lineTo(o.floor.x, o.floor.y)
    lines.stroke({ width: 4, color: o.color })

    lines.circle(o.crest.x, o.crest.y, o.hit ? 9 : 5)
    lines.stroke({ width: 2, color: o.color })

    intrusionText.text = o.intrusionLabel
    intrusionText.style.fill = INTRUSION_COLOR
    intrusionText.anchor.set(0, 0.5)
    intrusionText.position.set(o.crest.x + 14, o.crest.y + 22)

    gapText.text = o.gapLabel
    gapText.style.fill = o.color
    gapText.anchor.set(1, 0.5)
    const top = Math.min(o.crest.y, o.floor.y)
    gapText.position.set(o.crest.x - 14, top - 20)
  }

  const hide = () => {
    root.visible = false
  }

  return { root, show, hide }
}
