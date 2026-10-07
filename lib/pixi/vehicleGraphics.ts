import { Container, Graphics } from "pixi.js"
import { VEHICLE_DIMENSIONS_CM, vehicleBodyPoints } from "./vehicleDimensions"

export type VehicleView = {
  root: Container
  /** Redraw to scale; all heights are measured from the wheel contact line. */
  update: (opts: {
    wheelbaseCm: number
    clearanceCm: number
    pxPerCm: number
  }) => void
  setUnderbodyColor: (color: number) => void
  /** Place axle midpoint; rotation in radians (Pixi: +y down). */
  setPose: (x: number, y: number, rotationRad: number) => void
  wheelRadiusPx: () => number
}

const BODY_COLOR = 0x1f2933
const WHEEL = 0x111827
const RIM = 0x9ca3af
export const UNDERBODY_DEFAULT = 0xe85d4c

/**
 * Side-view car facing +x (right). Origin at axle midpoint; front axle at
 * +half, rear at -half. Flat underbody between the axles at `clearance`.
 */
export function createVehicleGraphics(): VehicleView {
  const root = new Container()
  const body = new Graphics()
  const underbody = new Graphics()
  const wheels = new Graphics()
  root.addChild(body, underbody, wheels)

  let dims = { half: 40, R: 10, clearancePx: 4 }
  let underbodyColor = UNDERBODY_DEFAULT

  function drawUnderbody() {
    const { half, R, clearancePx } = dims
    underbody.clear()
    underbody.moveTo(-half, R - clearancePx)
    underbody.lineTo(half, R - clearancePx)
    underbody.stroke({ width: Math.max(2, R * 0.25), color: underbodyColor })
  }

  const view: VehicleView = {
    root,
    update: ({ wheelbaseCm, clearanceCm, pxPerCm }) => {
      const half = (wheelbaseCm / 2) * pxPerCm
      const R = VEHICLE_DIMENSIONS_CM.wheelRadius * pxPerCm
      dims = { half, R, clearancePx: clearanceCm * pxPerCm }

      body.clear()
      body.poly(vehicleBodyPoints(wheelbaseCm, clearanceCm, pxPerCm))
      body.fill({ color: BODY_COLOR })

      wheels.clear()
      for (const x of [-half, half]) {
        wheels.circle(x, 0, R)
        wheels.fill({ color: WHEEL })
        wheels.circle(x, 0, R * 0.45)
        wheels.fill({ color: RIM })
      }

      drawUnderbody()
    },
    setUnderbodyColor: (color) => {
      underbodyColor = color
      drawUnderbody()
    },
    setPose: (x, y, rotationRad) => {
      root.x = x
      root.y = y
      root.rotation = rotationRad
    },
    wheelRadiusPx: () => dims.R,
  }

  return view
}
