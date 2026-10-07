import { describe, expect, it } from "vitest"
import { calculateRampClearance, straddleScene } from "@/lib/geometry"

const cases = [5, 15, 30, 45].flatMap((angle) =>
  [4, 12, 40].map((clearance) => ({ angle, clearance })),
)

describe.each(cases)("straddle scene $angle°, c=$clearance cm", ({ angle, clearance }) => {
  const L = 270
  const θ = (angle * Math.PI) / 180
  const scene = straddleScene({
    wheelbaseCm: L,
    clearanceCm: clearance,
    angleDeg: angle,
    wheelRadiusCm: 32,
  })
  const result = calculateRampClearance({
    vehicle: { wheelbaseCm: L, clearanceCm: clearance },
    ramp: { angleDeg: angle },
    safetyMarginCm: 0,
  })

  it("puts the rear wheel on the entry plateau and the front on the slope", () => {
    expect(scene.rear.y).toBe(0)
    expect(scene.rear.x).toBeLessThan(0)
    expect(scene.front.y / scene.front.x).toBeCloseTo(Math.tan(θ), 9)
  })

  it("keeps the wheelbase rigid and pitches the car by θ/2", () => {
    const { rear, front } = scene
    expect(Math.hypot(front.x - rear.x, front.y - rear.y)).toBeCloseTo(L, 9)
    expect(scene.pitchRad).toBeCloseTo(θ / 2, 12)
  })

  it("raises the crest above the chord by the calculator's intrusion", () => {
    expect(Math.hypot(scene.chordFoot.x, scene.chordFoot.y)).toBeCloseTo(
      result.crestIntrusionCm,
      9,
    )
  })

  it("shows an overlap exactly when the calculator reports a hit", () => {
    expect(scene.overlap !== null).toBe(result.status === "error")
    for (const p of scene.overlap?.filter((p) => p.x !== 0) ?? []) {
      const toP = { x: p.x - scene.floor.x, y: p.y - scene.floor.y }
      expect(toP.x * scene.dir.y - toP.y * scene.dir.x).toBeCloseTo(0, 9)
    }
  })
})
