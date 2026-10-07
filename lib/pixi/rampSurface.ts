/**
 * Piecewise ramp surface in world pixels (Pixi: +y down).
 *
 * 1) Upper plateau  x <= crestX
 * 2) Slope          crestX < x < footX
 * 3) Lower plateau  x >= footX   (ramp ends here — visible exit)
 */

export type RampSurface = {
  crestX: number
  crestY: number
  footX: number
  footY: number
  angleRad: number
}

export type Point = { x: number; y: number }

export function surfaceY(surface: RampSurface, x: number): number {
  if (x <= surface.crestX) return surface.crestY
  if (x >= surface.footX) return surface.footY
  return surface.crestY + (x - surface.crestX) * Math.tan(surface.angleRad)
}

function dist(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * Given rear contact x, find front contact on the surface whose chord
 * (Euclidean) distance equals the wheelbase — the car is rigid.
 * The surface only descends, so chord length grows monotonically with
 * front x on [rearX, rearX + L], which makes bisection safe.
 */
export function contactPair(
  surface: RampSurface,
  rearContactX: number,
  wheelbasePx: number,
): { rear: Point; front: Point } {
  const L = wheelbasePx
  const rear: Point = { x: rearContactX, y: surfaceY(surface, rearContactX) }
  const at = (x: number): Point => ({ x, y: surfaceY(surface, x) })

  let lo = rearContactX
  let hi = rearContactX + L
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    if (dist(rear, at(mid)) < L) lo = mid
    else hi = mid
  }

  return { rear, front: at((lo + hi) / 2) }
}

/**
 * Axle-midpoint pose so both wheels sit on the surface (no penetration).
 */
export function poseFromRearContact(
  surface: RampSurface,
  rearContactX: number,
  wheelbasePx: number,
  wheelRadiusPx: number,
): { x: number; y: number; rotation: number; front: Point; rear: Point } {
  const { rear, front } = contactPair(surface, rearContactX, wheelbasePx)
  const dx = front.x - rear.x
  const dy = front.y - rear.y
  const len = Math.hypot(dx, dy) || 1
  const dirX = dx / len
  const dirY = dy / len
  let nx = -dirY
  let ny = dirX
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }

  const rearAxle = {
    x: rear.x + nx * wheelRadiusPx,
    y: rear.y + ny * wheelRadiusPx,
  }
  const frontAxle = {
    x: front.x + nx * wheelRadiusPx,
    y: front.y + ny * wheelRadiusPx,
  }

  return {
    x: (rearAxle.x + frontAxle.x) / 2,
    y: (rearAxle.y + frontAxle.y) / 2,
    rotation: Math.atan2(dirY, dirX),
    front,
    rear,
  }
}

/** Mid-underbody point in world space (flat floor between axles). */
export function underbodyMidWorld(
  pose: { x: number; y: number; rotation: number },
  towardGroundPx: number,
): Point {
  const c = Math.cos(pose.rotation)
  const s = Math.sin(pose.rotation)
  return {
    x: pose.x - towardGroundPx * s,
    y: pose.y + towardGroundPx * c,
  }
}
