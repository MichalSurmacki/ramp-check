/** Real-world proportions (cm) used to draw the car to scale. */
export const VEHICLE_DIMENSIONS_CM = {
  wheelRadius: 32,
  /** Same at the front and the rear — the body is symmetric. */
  overhang: 90,
  roof: 140,
  /** Top of the lower body (bonnet / boot line). */
  beltline: 95,
} as const

/**
 * Symmetric two-box side-view outline in the car frame: origin at the axle
 * midpoint, +x toward the front, +y toward the ground (axle line at y = 0,
 * wheel contact line at y = wheel radius). Flat floor at `clearanceCm`;
 * a low body runs the full length, a shorter cabin sits on top.
 */
export function vehicleBodyPoints(
  wheelbaseCm: number,
  clearanceCm: number,
  pxPerCm: number,
): number[] {
  const D = VEHICLE_DIMENSIONS_CM
  const half = wheelbaseCm / 2
  const end = half + D.overhang
  const bumper = Math.max(clearanceCm, 35)
  const bumperTop = Math.max(bumper + 10, 75)
  const belt = Math.max(bumperTop + 10, D.beltline)
  const cabinBase = end * 0.62
  const roofEnd = end * 0.36
  const R = D.wheelRadius
  const outline: [number, number][] = [
    [-end, bumper],
    [-half, clearanceCm],
    [half, clearanceCm],
    [end, bumper],
    [end, bumperTop],
    [end - 20, belt],
    [cabinBase, belt],
    [roofEnd, D.roof],
    [-roofEnd, D.roof],
    [-cabinBase, belt],
    [-(end - 20), belt],
    [-end, bumperTop],
  ]
  return outline.flatMap(([x, height]) => [x * pxPerCm, (R - height) * pxPerCm])
}
