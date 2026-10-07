import { describe, expect, it } from "vitest"
import { calculateRampClearance } from "@/lib/geometry/calculator"
import type { CalculatorInput } from "@/types/geometry"

function input(partial?: {
  angle?: number
  clearance?: number
  wheelbase?: number
  margin?: number
}): CalculatorInput {
  return {
    vehicle: {
      wheelbaseCm: partial?.wheelbase ?? 270,
      clearanceCm: partial?.clearance ?? 12,
    },
    ramp: {
      angleDeg: partial?.angle ?? 15,
    },
    safetyMarginCm: partial?.margin ?? 5,
  }
}

describe("calculateRampClearance (flat underbody)", () => {
  it("returns success with large margin", () => {
    const result = calculateRampClearance(
      input({ angle: 5, clearance: 20, margin: 5 }),
    )
    expect(result.status).toBe("success")
    expect(result.minimumClearanceCm).toBeGreaterThanOrEqual(5)
    expect(result.collision).toBe(false)
  })

  it("returns success exactly on the margin boundary", () => {
    const angle = (2 * Math.atan(7 / 135) * 180) / Math.PI
    const result = calculateRampClearance(
      input({ angle, clearance: 12, margin: 5 }),
    )
    expect(result.minimumClearanceCm).toBeCloseTo(5, 5)
    expect(result.status).toBe("success")
  })

  it("returns warning when clearance is below margin but non-negative", () => {
    const result = calculateRampClearance(
      input({ angle: 10, clearance: 12, margin: 5 }),
    )
    expect(result.minimumClearanceCm).toBeGreaterThanOrEqual(0)
    expect(result.minimumClearanceCm).toBeLessThan(5)
    expect(result.status).toBe("warning")
  })

  it("returns error on collision", () => {
    const result = calculateRampClearance(
      input({ angle: 40, clearance: 5, margin: 5 }),
    )
    expect(result.minimumClearanceCm).toBeLessThan(0)
    expect(result.status).toBe("error")
    expect(result.collision).toBe(true)
  })

  it("matches (L/2) * tan(θ/2) intrusion", () => {
    const result = calculateRampClearance(
      input({ angle: 15, clearance: 12, wheelbase: 270 }),
    )
    const expected = 12 - (270 / 2) * Math.tan((7.5 * Math.PI) / 180)
    expect(result.minimumClearanceCm).toBeCloseTo(expected, 5)
  })

  it.each([5, 15, 30, 45])(
    "matches brute-force max intrusion of a rigid wheelbase at %d°",
    (deg) => {
      const L = 270
      const theta = (deg * Math.PI) / 180
      let best = 0
      for (let a = 0.05; a < L; a += 0.05) {
        const B = 2 * a * Math.cos(theta)
        const b = (-B + Math.sqrt(B * B - 4 * (a * a - L * L))) / 2
        best = Math.max(best, (a * b * Math.sin(theta)) / L)
      }
      const result = calculateRampClearance(
        input({ angle: deg, clearance: 100, wheelbase: L }),
      )
      expect(result.crestIntrusionCm).toBeCloseTo(best, 3)
    },
  )

  it("critical angle gives exactly zero clearance", () => {
    const { criticalAngleDeg } = calculateRampClearance(input())
    const atCritical = calculateRampClearance(input({ angle: criticalAngleDeg }))
    expect(atCritical.minimumClearanceCm).toBeCloseTo(0, 6)
  })

  it("treats margin 0 as success when clearance >= 0", () => {
    const result = calculateRampClearance(
      input({ angle: 10, clearance: 12, margin: 0 }),
    )
    expect(result.minimumClearanceCm).toBeGreaterThan(0)
    expect(result.status).toBe("success")
  })

  it("handles very small angle", () => {
    const result = calculateRampClearance(input({ angle: 0.1 }))
    expect(result.status).toBe("success")
  })

  it("handles large angle", () => {
    const result = calculateRampClearance(input({ angle: 45, clearance: 12 }))
    expect(result.minimumClearanceCm).toBeLessThan(0)
    expect(result.status).toBe("error")
  })

  it("longer wheelbase worsens clearance at same angle", () => {
    const short = calculateRampClearance(
      input({ angle: 12, wheelbase: 200, clearance: 12 }),
    )
    const long = calculateRampClearance(
      input({ angle: 12, wheelbase: 350, clearance: 12 }),
    )
    expect(long.minimumClearanceCm).toBeLessThan(short.minimumClearanceCm)
  })
})
