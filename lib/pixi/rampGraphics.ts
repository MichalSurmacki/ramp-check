import { Container, Graphics, Text } from "pixi.js"

export type RampLabels = {
  entry: string
  ramp: string
  exit: string
}

export type RampView = {
  root: Container
  /** All coordinates in world (canvas) pixels. */
  redraw: (opts: {
    crestX: number
    crestY: number
    footX: number
    footY: number
    width: number
    height: number
    angleRad: number
    labels: RampLabels
  }) => void
}

const RAMP_FILL = 0xdcd5c8
const PLATEAU_STROKE = 0x57534e
const SLOPE_STROKE = 0xc45c26
const TIP_COLOR = 0xe85d4c
const GUIDE_COLOR = 0x78716c

function makeLabel(color: number) {
  const text = new Text({
    text: "",
    style: {
      fontFamily: "IBM Plex Sans, Segoe UI, sans-serif",
      fontSize: 12,
      fontWeight: "600",
      fill: color,
    },
  })
  text.anchor.set(0.5, 0)
  return text
}

/** Entry plateau → slope → exit plateau, each drawn and labelled separately. */
export function createRampGraphics(): RampView {
  const root = new Container()
  const fill = new Graphics()
  const edges = new Graphics()
  const guides = new Graphics()
  const entryLabel = makeLabel(PLATEAU_STROKE)
  const rampLabel = makeLabel(SLOPE_STROKE)
  const exitLabel = makeLabel(PLATEAU_STROKE)
  root.addChild(fill, guides, edges, entryLabel, rampLabel, exitLabel)

  const redraw: RampView["redraw"] = ({
    crestX,
    crestY,
    footX,
    footY,
    width,
    height,
    angleRad,
    labels,
  }) => {
    const left = -width
    const right = 2 * width
    const bottom = height * 3

    fill.clear()
    fill.poly([
      left, bottom,
      left, crestY,
      crestX, crestY,
      footX, footY,
      right, footY,
      right, bottom,
    ])
    fill.fill({ color: RAMP_FILL })

    edges.clear()
    edges.moveTo(left, crestY)
    edges.lineTo(crestX, crestY)
    edges.stroke({ width: 3, color: PLATEAU_STROKE })
    edges.moveTo(footX, footY)
    edges.lineTo(right, footY)
    edges.stroke({ width: 3, color: PLATEAU_STROKE })
    edges.moveTo(crestX, crestY)
    edges.lineTo(footX, footY)
    edges.stroke({ width: 3, color: SLOPE_STROKE })
    for (const [x, y] of [
      [crestX, crestY],
      [footX, footY],
    ]) {
      edges.moveTo(x, y - 7)
      edges.lineTo(x, y + 7)
      edges.stroke({ width: 2, color: PLATEAU_STROKE })
    }
    edges.circle(crestX, crestY, 4)
    edges.fill({ color: TIP_COLOR })

    guides.clear()
    const arcR = 30
    for (let x = crestX; x < crestX + arcR + 16; x += 8) {
      guides.moveTo(x, crestY)
      guides.lineTo(Math.min(x + 4, crestX + arcR + 16), crestY)
    }
    guides.stroke({ width: 1, color: GUIDE_COLOR })
    guides.arc(crestX, crestY, arcR, 0, angleRad)
    guides.stroke({ width: 1.5, color: SLOPE_STROKE })

    entryLabel.text = labels.entry
    entryLabel.position.set(crestX / 2, crestY + 8)

    rampLabel.text = labels.ramp
    rampLabel.anchor.set(0, 1)
    rampLabel.position.set(crestX + 10, crestY - 4)

    exitLabel.text = labels.exit
    exitLabel.position.set((footX + width) / 2, footY + 8)
  }

  return { root, redraw }
}
