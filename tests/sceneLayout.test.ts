import { describe, expect, it } from "vitest"
import { crestIntrusionCm } from "@/lib/geometry"
import { contactPair } from "@/lib/pixi/rampSurface"
import {
  BOTTOM_PAD_PX,
  computeSceneLayout,
} from "@/lib/pixi/sceneLayout"
import { VEHICLE_DIMENSIONS_CM as D } from "@/lib/pixi/vehicleDimensions"

const canvases = [
  [360, 240],
  [560, 347],
  [800, 496],
] as const
const angles = [0.1, 5, 15, 30, 45]
const wheelbases = [100, 270, 500]

const cases = canvases.flatMap(([w, h]) =>
  angles.flatMap((angle) =>
    wheelbases.map((wheelbase) => ({ w, h, angle, wheelbase })),
  ),
)

describe.each(cases)(
  "scene layout $w×$h, $angle°, L=$wheelbase cm",
  ({ w, h, angle, wheelbase }) => {
    const layout = computeSceneLayout(w, h, {
      rampAngleDeg: angle,
      wheelbaseCm: wheelbase,
    })
    const { crestX, crestY, footX, footY, pxPerCm, rear } = layout
    const wheelbasePx = wheelbase * pxPerCm
    const frontOverhangPx = D.overhang * pxPerCm
    const rearOverhangPx = D.overhang * pxPerCm

    it("draws the slope at the true angle", () => {
      const drawn = (Math.atan2(footY - crestY, footX - crestX) * 180) / Math.PI
      expect(drawn).toBeCloseTo(angle, 6)
    })

    it("keeps entry, slope and exit inside the canvas", () => {
      expect(crestX).toBeGreaterThan(0)
      expect(footX).toBeGreaterThan(crestX)
      expect(footX).toBeLessThan(w)
      expect(footY).toBeLessThanOrEqual(h - BOTTOM_PAD_PX + 1e-6)
      expect(crestY - D.roof * pxPerCm).toBeGreaterThan(0)
    })

    it("starts with the whole car on the entry plateau", () => {
      expect(rear.start - rearOverhangPx).toBeGreaterThanOrEqual(0)
      expect(rear.start + wheelbasePx + frontOverhangPx).toBeLessThanOrEqual(
        crestX,
      )
    })

    it("ends with the whole car on the exit plateau", () => {
      expect(rear.end - rearOverhangPx).toBeGreaterThanOrEqual(footX)
      expect(rear.end + wheelbasePx + frontOverhangPx).toBeLessThanOrEqual(w)
    })

    it("critical pose straddles the crest with the calculator's intrusion", () => {
      const { rear: r, front: f } = contactPair(layout, rear.critical, wheelbasePx)
      expect(r.x).toBeLessThan(crestX)
      expect(f.x).toBeGreaterThan(crestX)
      expect(f.x).toBeLessThan(footX)
      expect(Math.hypot(f.x - r.x, f.y - r.y)).toBeCloseTo(wheelbasePx, 6)

      const crossZ = (f.x - r.x) * (crestY - r.y) - (f.y - r.y) * (crestX - r.x)
      const crestToChordPx = Math.abs(crossZ) / wheelbasePx
      const expectedPx =
        crestIntrusionCm(
          { wheelbaseCm: wheelbase, clearanceCm: 0 },
          { angleDeg: angle },
        ) * pxPerCm
      expect(crestToChordPx).toBeCloseTo(expectedPx, 4)
    })
  },
)
