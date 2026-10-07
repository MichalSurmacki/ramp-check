export type Vec = { x: number; y: number }

export type StraddleScene = {
  rear: Vec
  front: Vec
  /** Unit vector along the wheel-contact chord, rear → front. */
  dir: Vec
  /** Unit normal to the chord pointing away from the ground. */
  up: Vec
  axleMid: Vec
  /** Car pitch (nose down), radians. */
  pitchRad: number
  /** Projection of the crest onto the chord. */
  chordFoot: Vec
  /** Underbody point directly above the crest. */
  floor: Vec
  /** Ramp area poking through the floor, or null when there is no hit. */
  overlap: Vec[] | null
}

const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k })
const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x

/**
 * Worst-case pose in world units (+y down): crest at the origin, entry
 * plateau along -x, slope descending at θ toward +x. The rear wheel stands
 * on the plateau, the front wheel on the slope, both at distance
 * a = L / (2·cos(θ/2)) from the crest.
 */
export function straddleScene(opts: {
  wheelbaseCm: number
  clearanceCm: number
  angleDeg: number
  wheelRadiusCm: number
}): StraddleScene {
  const θ = (opts.angleDeg * Math.PI) / 180
  const L = opts.wheelbaseCm
  const a = L / (2 * Math.cos(θ / 2))
  const crest: Vec = { x: 0, y: 0 }
  const slopeDir: Vec = { x: Math.cos(θ), y: Math.sin(θ) }

  const rear: Vec = { x: -a, y: 0 }
  const front = add(crest, slopeDir, a)
  const dir: Vec = { x: Math.cos(θ / 2), y: Math.sin(θ / 2) }
  const up: Vec = { x: Math.sin(θ / 2), y: -Math.cos(θ / 2) }

  const mid: Vec = { x: (rear.x + front.x) / 2, y: (rear.y + front.y) / 2 }
  const axleMid = add(mid, up, opts.wheelRadiusCm)

  const intrusion = (L / 2) * Math.tan(θ / 2)
  const chordFoot = add(crest, up, -intrusion)
  const floor = add(chordFoot, up, opts.clearanceCm)

  let overlap: Vec[] | null = null
  if (opts.clearanceCm < intrusion) {
    const onPlateau = add(floor, dir, (crest.y - floor.y) / dir.y)
    const toFloor = { x: floor.x - crest.x, y: floor.y - crest.y }
    const u = cross(toFloor, dir) / cross(slopeDir, dir)
    overlap = [onPlateau, crest, add(crest, slopeDir, u)]
  }

  return {
    rear,
    front,
    dir,
    up,
    axleMid,
    pitchRad: θ / 2,
    chordFoot,
    floor,
    overlap,
  }
}
