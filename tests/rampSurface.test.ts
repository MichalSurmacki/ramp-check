import { describe, expect, it } from "vitest"
import {
  contactPair,
  poseFromRearContact,
  surfaceY,
  type RampSurface,
} from "@/lib/pixi/rampSurface"

const surface: RampSurface = {
  crestX: 120,
  crestY: 40,
  footX: 120 + 100 / Math.tan((15 * Math.PI) / 180),
  footY: 140, // ~1/3 of a 420px canvas, for example
  angleRad: (15 * Math.PI) / 180,
}

describe("rampSurface with lower flat", () => {
  it("keeps upper plateau height left of crest", () => {
    expect(surfaceY(surface, 40)).toBe(40)
    expect(surfaceY(surface, 120)).toBe(40)
  })

  it("descends on the slope", () => {
    const midX = (surface.crestX + surface.footX) / 2
    const y = surfaceY(surface, midX)
    expect(y).toBeGreaterThan(surface.crestY)
    expect(y).toBeLessThan(surface.footY)
  })

  it("stays flat on the lower plateau past the foot", () => {
    expect(surfaceY(surface, surface.footX + 50)).toBe(surface.footY)
  })

  it("places both contacts on upper plateau", () => {
    const { rear, front } = contactPair(surface, 20, 60)
    expect(rear.y).toBe(40)
    expect(front.y).toBe(40)
  })

  it("places both contacts on lower plateau", () => {
    const { rear, front } = contactPair(surface, surface.footX + 10, 50)
    expect(rear.y).toBeCloseTo(surface.footY, 5)
    expect(front.y).toBeCloseTo(surface.footY, 5)
    expect(front.x - rear.x).toBeCloseTo(50, 5)
  })

  it("keeps chord equal to wheelbase while straddling the crest", () => {
    const L = 60
    const { rear, front } = contactPair(surface, surface.crestX - L / 2, L)
    expect(front.x).toBeGreaterThan(surface.crestX)
    expect(Math.hypot(front.x - rear.x, front.y - rear.y)).toBeCloseTo(L, 6)
  })

  it("keeps chord equal to wheelbase across the foot", () => {
    const L = 60
    const { rear, front } = contactPair(surface, surface.footX - L / 2, L)
    expect(front.x).toBeGreaterThan(surface.footX)
    expect(Math.hypot(front.x - rear.x, front.y - rear.y)).toBeCloseTo(L, 6)
  })

  it("pose on lower flat has ~zero rotation", () => {
    const pose = poseFromRearContact(surface, surface.footX + 20, 60, 12)
    expect(pose.rotation).toBeCloseTo(0, 5)
    expect(pose.y).toBeCloseTo(surface.footY - 12, 5)
  })
})
