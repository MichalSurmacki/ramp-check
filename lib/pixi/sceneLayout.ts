import type { CalculatorState } from "@/types/geometry"
import type { RampSurface } from "./rampSurface"
import { VEHICLE_DIMENSIONS_CM } from "./vehicleDimensions"

export type SceneLayout = RampSurface & {
  pxPerCm: number
  plateauPx: number
  /** Rear-contact x for: start of entry, worst-case straddle, rest on exit. */
  rear: { start: number; critical: number; end: number }
}

/** Horizontal share of the canvas given to the slope before height limits. */
const SLOPE_RUN_SHARE = 0.38
export const EDGE_PAD_PX = 12
export const BOTTOM_PAD_PX = 28

/**
 * Entry plateau, slope and exit plateau are always on screen. The slope
 * keeps the true angle: if the drop does not fit vertically, the run is
 * shortened instead of flattening the slope. Plateaus are wide enough to
 * hold the whole car, so it starts and ends fully visible.
 */
export function computeSceneLayout(
  width: number,
  height: number,
  state: Pick<CalculatorState, "rampAngleDeg" | "wheelbaseCm">,
): SceneLayout {
  const D = VEHICLE_DIMENSIONS_CM
  const θ = (state.rampAngleDeg * Math.PI) / 180
  const carLenCm = state.wheelbaseCm + 2 * D.overhang

  const run0 = width * SLOPE_RUN_SHARE
  const plateau0 = (width - run0) / 2
  const pxPerCm = Math.min(
    (plateau0 - 2 * EDGE_PAD_PX) / carLenCm,
    (height * 0.4) / D.roof,
  )
  const crestY = Math.max(height * 0.28, D.roof * pxPerCm + 20)
  const maxDrop = Math.max(8, height - BOTTOM_PAD_PX - crestY)
  const run = Math.min(run0, maxDrop / Math.tan(θ))
  const crestX = (width - run) / 2
  const footX = crestX + run

  const wheelbasePx = state.wheelbaseCm * pxPerCm
  const overhangPx = D.overhang * pxPerCm
  const carLenPx = carLenCm * pxPerCm

  return {
    crestX,
    crestY,
    footX,
    footY: crestY + run * Math.tan(θ),
    angleRad: θ,
    pxPerCm,
    plateauPx: crestX,
    rear: {
      start: EDGE_PAD_PX + overhangPx,
      critical: crestX - wheelbasePx / (2 * Math.cos(θ / 2)),
      end: footX + (crestX - carLenPx) / 2 + overhangPx,
    },
  }
}
