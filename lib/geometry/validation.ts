import { VALIDATION, type CalculatorState } from "@/types/geometry"

function inRange(value: number, range: { min: number; max: number }) {
  return Number.isFinite(value) && value >= range.min && value <= range.max
}

export function isValidState(state: CalculatorState): boolean {
  return (
    inRange(state.rampAngleDeg, VALIDATION.angle) &&
    inRange(state.clearanceCm, VALIDATION.clearance) &&
    inRange(state.wheelbaseCm, VALIDATION.wheelbase) &&
    inRange(state.safetyMarginCm, VALIDATION.safetyMargin)
  )
}
