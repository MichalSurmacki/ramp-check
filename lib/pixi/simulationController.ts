import { Container, type Application } from "pixi.js"
import type { CalculationResult, CalculatorState } from "@/types/geometry"
import { isValidState } from "@/lib/geometry"
import {
  createVehicleGraphics,
  type VehicleView,
  UNDERBODY_DEFAULT,
} from "./vehicleGraphics"
import { createRampGraphics, type RampView } from "./rampGraphics"
import { createClearanceGraphics, type ClearanceView } from "./clearanceGraphics"
import { poseFromRearContact, type Point } from "./rampSurface"
import { computeSceneLayout, type SceneLayout } from "./sceneLayout"

export type SimPhase = "idle" | "approach" | "critical" | "descent" | "done"

export type SimLabels = {
  entry: string
  ramp: (angleDeg: number) => string
  exit: string
  intrusion: (cm: string) => string
  gap: (cm: string) => string
  hit: (cm: string) => string
}

export type SimulationOptions = {
  labels: SimLabels
  onPhaseChange?: (phase: SimPhase) => void
}

const STATUS_COLOR = {
  success: 0x2f6b4f,
  warning: 0xb45309,
  error: 0xb91c1c,
} as const

/** Taller of intrusion / clearance is zoomed to about this many screen px. */
const CRITICAL_TARGET_PX = 60
const MAX_ZOOM = 8

export class SimulationController {
  private app: Application
  private scene = new Container()
  private vehicle: VehicleView
  private ramp: RampView
  private clearance: ClearanceView
  private state: CalculatorState
  private options: SimulationOptions
  private layout!: SceneLayout
  private animToken = 0

  constructor(
    app: Application,
    state: CalculatorState,
    options: SimulationOptions,
  ) {
    this.app = app
    this.state = state
    this.options = options

    this.ramp = createRampGraphics()
    this.vehicle = createVehicleGraphics()
    this.clearance = createClearanceGraphics()

    this.scene.addChild(this.ramp.root, this.vehicle.root)
    this.app.stage.addChild(this.scene, this.clearance.root)

    this.applyState()
    this.resetScene()
  }

  setOptions(options: Partial<SimulationOptions>) {
    this.options = { ...this.options, ...options }
    this.redrawRamp()
  }

  /** New inputs invalidate any running animation. */
  syncFromState(state: CalculatorState) {
    if (!isValidState(state)) return
    this.state = state
    this.animToken++
    this.applyState()
    this.resetScene()
  }

  async play(result: CalculationResult): Promise<void> {
    const token = ++this.animToken
    const alive = () => token === this.animToken
    this.resetScene()

    const { start, critical, end } = this.layout.rear
    const zoom = this.criticalZoom()

    this.setPhase("approach")
    await this.tween(token, 1600, (t) =>
      this.placeAtRearContact(lerp(start, critical, easeInOut(t))),
    )
    if (!alive()) return

    this.setPhase("critical")
    this.vehicle.setUnderbodyColor(STATUS_COLOR[result.status])
    await this.tween(token, 700, (t) => this.setCamera(easeInOut(t), zoom))
    if (!alive()) return

    this.showCriticalOverlay(result, critical)
    await wait(2000)
    if (!alive()) return

    this.clearance.hide()
    await this.tween(token, 600, (t) => this.setCamera(1 - easeInOut(t), zoom))
    if (!alive()) return

    this.setPhase("descent")
    await this.tween(token, 1600, (t) =>
      this.placeAtRearContact(lerp(critical, end, easeInOut(t))),
    )
    if (!alive()) return

    this.setPhase("done")
  }

  private applyState() {
    this.layout = computeSceneLayout(
      this.app.screen.width,
      this.app.screen.height,
      this.state,
    )
    this.vehicle.update({
      wheelbaseCm: this.state.wheelbaseCm,
      clearanceCm: this.state.clearanceCm,
      pxPerCm: this.layout.pxPerCm,
    })
    this.redrawRamp()
  }

  private redrawRamp() {
    if (!this.layout) return
    const { labels } = this.options
    const { crestX, crestY, footX, footY, angleRad } = this.layout
    this.ramp.redraw({
      crestX,
      crestY,
      footX,
      footY,
      angleRad,
      width: this.app.screen.width,
      height: this.app.screen.height,
      labels: {
        entry: labels.entry,
        ramp: labels.ramp(this.state.rampAngleDeg),
        exit: labels.exit,
      },
    })
  }

  private wheelbasePx() {
    return this.state.wheelbaseCm * this.layout.pxPerCm
  }

  private criticalZoom() {
    const { pxPerCm } = this.layout
    const tallestPx =
      Math.max(
        this.state.clearanceCm,
        (this.state.wheelbaseCm / 2) * Math.tan(this.layout.angleRad / 2),
      ) * pxPerCm
    const fitCar =
      (0.85 * this.app.screen.width) /
      (this.wheelbasePx() + 2 * this.vehicle.wheelRadiusPx())
    return clamp(Math.min(CRITICAL_TARGET_PX / tallestPx, fitCar), 1, MAX_ZOOM)
  }

  /** t = 0: full view; t = 1: zoomed on the crest. */
  private setCamera(t: number, zoom: number) {
    const { crestX, crestY } = this.layout
    const s = lerp(1, zoom, t)
    const sx = lerp(crestX, this.app.screen.width / 2, t)
    const sy = lerp(crestY, this.app.screen.height * 0.62, t)
    this.scene.scale.set(s)
    this.scene.position.set(sx - crestX * s, sy - crestY * s)
  }

  private showCriticalOverlay(result: CalculationResult, rearX: number) {
    const pose = this.placeAtRearContact(rearX)
    const { crestX, crestY, pxPerCm } = this.layout
    const dx = pose.front.x - pose.rear.x
    const dy = pose.front.y - pose.rear.y
    const len = Math.hypot(dx, dy) || 1
    const dir = { x: dx / len, y: dy / len }
    const up = { x: dir.y, y: -dir.x }
    const along = (crestX - pose.rear.x) * dir.x + (crestY - pose.rear.y) * dir.y
    const chordFoot = {
      x: pose.rear.x + dir.x * along,
      y: pose.rear.y + dir.y * along,
    }
    const floorPx = this.state.clearanceCm * pxPerCm
    const floor = {
      x: chordFoot.x + up.x * floorPx,
      y: chordFoot.y + up.y * floorPx,
    }

    const toScreen = (p: Point) => this.scene.toGlobal(p)
    const hit = result.status === "error"
    const { labels } = this.options
    this.clearance.show({
      rear: toScreen(pose.rear),
      front: toScreen(pose.front),
      crest: toScreen({ x: crestX, y: crestY }),
      chordFoot: toScreen(chordFoot),
      floor: toScreen(floor),
      intrusionLabel: labels.intrusion(result.crestIntrusionCm.toFixed(1)),
      gapLabel: hit
        ? labels.hit((-result.minimumClearanceCm).toFixed(1))
        : labels.gap(result.minimumClearanceCm.toFixed(1)),
      color: STATUS_COLOR[result.status],
      hit,
    })
  }

  private placeAtRearContact(rearContactX: number) {
    const pose = poseFromRearContact(
      this.layout,
      rearContactX,
      this.wheelbasePx(),
      this.vehicle.wheelRadiusPx(),
    )
    this.vehicle.setPose(pose.x, pose.y, pose.rotation)
    return pose
  }

  private resetScene() {
    this.setCamera(0, 1)
    this.clearance.hide()
    this.vehicle.setUnderbodyColor(UNDERBODY_DEFAULT)
    this.placeAtRearContact(this.layout.rear.start)
    this.setPhase("idle")
  }

  private setPhase(phase: SimPhase) {
    this.options.onPhaseChange?.(phase)
  }

  private tween(
    token: number,
    durationMs: number,
    onUpdate: (t: number) => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now()
      const tick = () => {
        if (token !== this.animToken) {
          resolve()
          return
        }
        const t = Math.min(1, (performance.now() - start) / durationMs)
        onUpdate(t)
        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(tick)
    })
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
