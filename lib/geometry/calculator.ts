import type {
  CalculationResult,
  CalculatorInput,
  CalculationStatus,
} from "@/types/geometry"
import {
  clearanceAtCrestCm,
  crestIntrusionCm,
  criticalAngleDeg,
} from "./collision"

/** Absorbs floating-point noise so exact boundary inputs classify stably. */
const EPSILON_CM = 1e-9

function statusFromClearance(
  minimumClearanceCm: number,
  safetyMarginCm: number,
): CalculationStatus {
  if (minimumClearanceCm < -EPSILON_CM) {
    return "error"
  }
  if (minimumClearanceCm < safetyMarginCm - EPSILON_CM) {
    return "warning"
  }
  return "success"
}

export function calculateRampClearance(
  input: CalculatorInput,
): CalculationResult {
  const { vehicle, ramp, safetyMarginCm } = input
  const crestIntrusion = crestIntrusionCm(vehicle, ramp)
  const minimumClearanceCm = clearanceAtCrestCm(vehicle, ramp)
  const status = statusFromClearance(minimumClearanceCm, safetyMarginCm)

  return {
    status,
    minimumClearanceCm,
    safetyMarginCm,
    marginDifferenceCm: minimumClearanceCm - safetyMarginCm,
    criticalAngleDeg: criticalAngleDeg(vehicle),
    collision: status === "error",
    crestIntrusionCm: crestIntrusion,
  }
}
