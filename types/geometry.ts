export type VehicleGeometry = {
  wheelbaseCm: number
  /**
   * Flat underbody clearance: distance from ground to the flat
   * chassis underside between the axles (when on level ground).
   */
  clearanceCm: number
}

export type RampGeometry = {
  angleDeg: number
}

export type CalculatorInput = {
  vehicle: VehicleGeometry
  ramp: RampGeometry
  safetyMarginCm: number
}

export type CalculationStatus = "success" | "warning" | "error"

export type CalculationResult = {
  status: CalculationStatus
  minimumClearanceCm: number
  safetyMarginCm: number
  marginDifferenceCm: number
  criticalAngleDeg: number
  collision: boolean
  /** Crest intrusion into chassis space [cm] */
  crestIntrusionCm: number
}

export type CalculatorState = {
  rampAngleDeg: number
  clearanceCm: number
  wheelbaseCm: number
  safetyMarginCm: number
}

export const DEFAULT_VALUES: CalculatorState = {
  rampAngleDeg: 19,
  clearanceCm: 12,
  wheelbaseCm: 270,
  safetyMarginCm: 5,
}

export const VALIDATION = {
  angle: { min: 0.1, max: 45 },
  clearance: { min: 0.1, max: 50 },
  wheelbase: { min: 100, max: 500 },
  safetyMargin: { min: 0, max: 50 },
} as const
