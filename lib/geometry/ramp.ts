import type { RampGeometry } from "@/types/geometry"

export function rampAngleRad(ramp: RampGeometry): number {
  return (ramp.angleDeg * Math.PI) / 180
}
