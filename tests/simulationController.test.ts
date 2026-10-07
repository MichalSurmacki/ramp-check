import { Container, type Application } from "pixi.js"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { calculateRampClearance } from "@/lib/geometry"
import { destroyPixiApp } from "@/lib/pixi/createApp"
import {
  SimulationController,
  type SimLabels,
  type SimPhase,
} from "@/lib/pixi/simulationController"
import { DEFAULT_VALUES } from "@/types/geometry"

const labels: SimLabels = {
  entry: "wjazd",
  ramp: (a) => `rampa ${a}°`,
  exit: "zjazd",
  intrusion: (v) => `h = ${v}`,
  gap: (v) => `zapas ${v}`,
  hit: (v) => `uderzenie ${v}`,
}

function fakeApp(width = 560, height = 347) {
  return { stage: new Container(), screen: { width, height } } as unknown as Application
}

beforeAll(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  )
  vi.useFakeTimers({ toFake: ["setTimeout", "performance"] })
})

describe("destroyPixiApp", () => {
  it("does not release Pixi global resources shared with other instances", () => {
    const destroy = vi.fn()
    destroyPixiApp({ destroy } as unknown as Application)
    const [rendererOptions] = destroy.mock.calls[0]
    expect(rendererOptions).not.toBe(true)
    expect(rendererOptions).not.toMatchObject({ releaseGlobalResources: true })
  })
})

describe("SimulationController", () => {
  it("builds the scene without throwing", () => {
    const app = fakeApp()
    expect(() => new SimulationController(app, DEFAULT_VALUES, { labels })).not.toThrow()
    expect(app.stage.children.length).toBeGreaterThan(0)
  })

  it("plays through every phase", async () => {
    const phases: SimPhase[] = []
    const sim = new SimulationController(fakeApp(), DEFAULT_VALUES, {
      labels,
      onPhaseChange: (p) => phases.push(p),
    })
    const result = calculateRampClearance({
      vehicle: {
        wheelbaseCm: DEFAULT_VALUES.wheelbaseCm,
        clearanceCm: DEFAULT_VALUES.clearanceCm,
      },
      ramp: { angleDeg: DEFAULT_VALUES.rampAngleDeg },
      safetyMarginCm: DEFAULT_VALUES.safetyMarginCm,
    })
    const done = sim.play(result)
    await vi.advanceTimersByTimeAsync(10_000)
    await done
    expect(phases).toEqual(
      expect.arrayContaining(["idle", "approach", "critical", "descent", "done"]),
    )
    expect(phases.at(-1)).toBe("done")
  })
})
