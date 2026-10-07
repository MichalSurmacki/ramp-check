import type { RampGeometry, VehicleGeometry } from "@/types/geometry"
import { rampAngleRad } from "./ramp"

/**
 * Flat underbody model, rigid wheelbase (axle chord = L).
 *
 * Maximum crest intrusion while straddling occurs when both contacts are
 * equidistant from the crest:
 *   intrusion = (L / 2) * tan(θ / 2)
 */
export function crestIntrusionCm(
  vehicle: VehicleGeometry,
  ramp: RampGeometry,
): number {
  const L = vehicle.wheelbaseCm
  const theta = rampAngleRad(ramp)
  return Math.max(0, (L / 2) * Math.tan(theta / 2))
}

/**
 * Distance from the crest to each wheel contact in the worst-case
 * (symmetric) straddle: a = L / (2 * cos(θ / 2)).
 */
export function straddleContactDistanceCm(
  vehicle: VehicleGeometry,
  ramp: RampGeometry,
): number {
  return vehicle.wheelbaseCm / (2 * Math.cos(rampAngleRad(ramp) / 2))
}

export function clearanceAtCrestCm(
  vehicle: VehicleGeometry,
  ramp: RampGeometry,
): number {
  return vehicle.clearanceCm - crestIntrusionCm(vehicle, ramp)
}

/**
 * Angle (deg) at which flat-underbody clearance would be exactly 0:
 * tan(θ / 2) = 2 * clearance / L
 */
export function criticalAngleDeg(vehicle: VehicleGeometry): number {
  const L = vehicle.wheelbaseCm
  if (L <= 1e-9) {
    return 90
  }
  if (vehicle.clearanceCm <= 0) {
    return 0
  }
  return (2 * Math.atan((2 * vehicle.clearanceCm) / L) * 180) / Math.PI
}
