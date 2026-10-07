"use client"

import { useTranslations } from "next-intl"
import {
  straddleContactDistanceCm,
  straddleScene,
  type StraddleScene,
  type Vec,
} from "@/lib/geometry"
import {
  VEHICLE_DIMENSIONS_CM,
  vehicleBodyPoints,
} from "@/lib/pixi/vehicleDimensions"
import type { CalculationResult, CalculatorState } from "@/types/geometry"

type Props = {
  state: CalculatorState
  /** Live result for the current inputs; null when inputs are invalid. */
  result: CalculationResult | null
}

type Box = { x: number; y: number; w: number; h: number }

const TONE_COLOR = {
  success: "var(--success)",
  warning: "var(--warning)",
  error: "var(--danger)",
} as const

/** Far enough to run past any viewBox edge (cm). */
const FAR = 10_000

function fmt(value: number, digits = 1) {
  return Number(value.toFixed(digits)).toString()
}

const add = (a: Vec, b: Vec, k = 1): Vec => ({ x: a.x + b.x * k, y: a.y + b.y * k })

function toPoints(points: Vec[]) {
  return points.map((p) => `${p.x},${p.y}`).join(" ")
}

export function ClearanceExplainer({ state, result }: Props) {
  const t = useTranslations("explain")

  if (!result) {
    return (
      <section className="rounded-xl border border-[var(--line)] bg-white/60 p-4">
        <h3 className="font-[family-name:var(--font-display)] text-lg">
          {t("title")}
        </h3>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{t("invalid")}</p>
      </section>
    )
  }

  const L = state.wheelbaseCm
  const c = state.clearanceCm
  const h = result.crestIntrusionCm
  const θ = (state.rampAngleDeg * Math.PI) / 180
  const halfAngle = state.rampAngleDeg / 2
  const a = straddleContactDistanceCm(
    { wheelbaseCm: L, clearanceCm: c },
    { angleDeg: state.rampAngleDeg },
  )
  const tone = TONE_COLOR[result.status]
  const hit = result.status === "error"

  const scene = straddleScene({
    wheelbaseCm: L,
    clearanceCm: c,
    angleDeg: state.rampAngleDeg,
    wheelRadiusCm: VEHICLE_DIMENSIONS_CM.wheelRadius,
  })
  const body = bodyWorldPoints(scene, L, c)
  const slopeDir = { x: Math.cos(θ), y: Math.sin(θ) }

  const xs = body.map((p) => p.x)
  const ys = body.map((p) => p.y)
  const overviewMinX = Math.min(...xs) - 20
  const overviewMinY = Math.min(...ys) - 20
  const overview: Box = {
    x: overviewMinX,
    y: overviewMinY,
    w: Math.max(...xs) + 20 - overviewMinX,
    h: Math.max(...ys, scene.front.y) + 70 - overviewMinY,
  }
  const overviewFont = overview.w / 26

  const tallest = Math.max(h, c)
  const m = tallest * 0.8 + 3
  const detailCenter = add(scene.chordFoot, scene.up, tallest / 2)
  const detail: Box = {
    x: detailCenter.x - 2 * m,
    y: detailCenter.y - m,
    w: 4 * m,
    h: 2 * m,
  }
  const detailFont = detail.w / 28
  const zoom = overview.w / detail.w

  const cBase = add(scene.chordFoot, scene.dir, -1.3 * m)
  const cTop = add(cBase, scene.up, c)
  const higher = h > c ? { x: 0, y: 0 } : scene.floor
  const gapLabelAt = add(higher, scene.up, detailFont * 1.1)

  const verdict =
    result.status === "error"
      ? t("verdictError")
      : result.status === "warning"
        ? t("verdictWarning", { margin: fmt(state.safetyMarginCm) })
        : t("verdictSuccess", { margin: fmt(state.safetyMarginCm) })

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white/60 p-4">
      <h3 className="font-[family-name:var(--font-display)] text-lg">
        {t("title")}
      </h3>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">{t("lead")}</p>

      <svg
        viewBox={`${overview.x} ${overview.y} ${overview.w} ${overview.h}`}
        className="mt-3 w-full"
        role="img"
        aria-label={t("overviewLabel")}
      >
        <SceneShapes
          scene={scene}
          body={body}
          slopeDir={slopeDir}
          tone={tone}
          wheelbase={L}
          crestMarkerR={overviewFont * 0.3}
        />
        <rect
          x={detail.x}
          y={detail.y}
          width={detail.w}
          height={detail.h}
          fill="none"
          stroke="var(--accent)"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={overview.x + (0 - overview.x) / 2}
          y={overviewFont * 1.6}
          textAnchor="middle"
          fontSize={overviewFont}
          fontWeight={600}
          fill="var(--ink-soft)"
        >
          {t("entry")}
        </text>
        <text
          x={slopeDir.x * a * 1.1}
          y={slopeDir.y * a * 1.1 + overviewFont * 1.8}
          fontSize={overviewFont}
          fontWeight={600}
          fill="var(--accent)"
        >
          {t("ramp", { angle: fmt(state.rampAngleDeg) })}
        </text>
      </svg>

      <p className="mt-3 text-xs font-semibold text-[var(--ink-muted)]">
        {t("zoom", { k: fmt(zoom) })}
      </p>
      <svg
        viewBox={`${detail.x} ${detail.y} ${detail.w} ${detail.h}`}
        className="mt-1 w-full rounded-md border border-dashed border-[var(--accent)]"
        role="img"
        aria-label={t("zoomLabel")}
      >
        <SceneShapes
          scene={scene}
          body={body}
          slopeDir={slopeDir}
          tone={tone}
          wheelbase={L}
          crestMarkerR={detailFont * 0.22}
        />
        <line
          x1={scene.chordFoot.x - scene.dir.x * 3 * m}
          y1={scene.chordFoot.y - scene.dir.y * 3 * m}
          x2={scene.chordFoot.x + scene.dir.x * 3 * m}
          y2={scene.chordFoot.y + scene.dir.y * 3 * m}
          stroke="var(--ink-muted)"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
        />
        <Dimension
          from={scene.chordFoot}
          to={{ x: 0, y: 0 }}
          color="var(--accent)"
          label={`h = ${fmt(h)} cm`}
          labelAt={add(add(scene.chordFoot, scene.up, h / 2), scene.dir, detailFont * 0.6)}
          anchor="start"
          fontSize={detailFont}
        />
        <Dimension
          from={cBase}
          to={cTop}
          color="var(--ink)"
          label={`c = ${fmt(c)} cm`}
          labelAt={add(add(cBase, scene.up, c / 2), scene.dir, -detailFont * 0.6)}
          anchor="end"
          fontSize={detailFont}
        />
        <line
          x1={0}
          y1={0}
          x2={scene.floor.x}
          y2={scene.floor.y}
          stroke={tone}
          strokeWidth={4}
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={gapLabelAt.x}
          y={gapLabelAt.y}
          textAnchor="middle"
          fontSize={detailFont}
          fontWeight={700}
          fill={tone}
          stroke="white"
          strokeWidth={detailFont * 0.2}
          paintOrder="stroke"
        >
          {hit
            ? t("overlapLabel", { value: fmt(-result.minimumClearanceCm) })
            : t("gapLabel", { value: fmt(result.minimumClearanceCm) })}
        </text>
        <text
          x={add(scene.chordFoot, scene.dir, 1.3 * m).x}
          y={add(scene.chordFoot, scene.dir, 1.3 * m).y + detailFont * 1.3}
          textAnchor="middle"
          fontSize={detailFont * 0.85}
          fill="var(--ink-muted)"
        >
          {t("wheelLine")}
        </text>
      </svg>

      <ol className="mt-3 space-y-2 text-sm">
        <Step n={1} text={t("step1")} formula={t("step1Formula", { L: fmt(L), halfAngle: fmt(halfAngle, 2), a: fmt(a) })} />
        <Step n={2} text={t("step2")} formula={t("step2Formula", { halfL: fmt(L / 2), halfAngle: fmt(halfAngle, 2), h: fmt(h) })} />
        <Step n={3} text={t("step3")} formula={t("step3Formula", { c: fmt(c), h: fmt(h), clearance: fmt(result.minimumClearanceCm) })} />
      </ol>

      <p
        className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold tone-${hit ? "danger" : result.status}`}
      >
        {verdict}
      </p>
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        {t("critical", { angle: fmt(result.criticalAngleDeg) })}
      </p>
    </section>
  )
}

/** Car body outline rotated into world space (cm). */
function bodyWorldPoints(scene: StraddleScene, L: number, c: number): Vec[] {
  const flat = vehicleBodyPoints(L, c, 1)
  const cos = Math.cos(scene.pitchRad)
  const sin = Math.sin(scene.pitchRad)
  const out: Vec[] = []
  for (let i = 0; i < flat.length; i += 2) {
    const x = flat[i]
    const y = flat[i + 1]
    out.push({
      x: scene.axleMid.x + x * cos - y * sin,
      y: scene.axleMid.y + x * sin + y * cos,
    })
  }
  return out
}

/** Chord foot is the chord midpoint: both contacts are `a` from the crest. */
function SceneShapes({
  scene,
  body,
  slopeDir,
  tone,
  wheelbase,
  crestMarkerR,
}: {
  scene: StraddleScene
  body: Vec[]
  slopeDir: Vec
  tone: string
  wheelbase: number
  crestMarkerR: number
}) {
  const R = VEHICLE_DIMENSIONS_CM.wheelRadius
  const rampFill = [
    { x: -FAR, y: FAR },
    { x: -FAR, y: 0 },
    { x: 0, y: 0 },
    { x: slopeDir.x * FAR, y: slopeDir.y * FAR },
    { x: slopeDir.x * FAR, y: FAR },
  ]
  const wheelCenters = [scene.rear, scene.front].map((p) => add(p, scene.up, R))
  const floorFrom = add(scene.floor, scene.dir, -wheelbase / 2)
  const floorTo = add(scene.floor, scene.dir, wheelbase / 2)

  return (
    <g>
      <polygon points={toPoints(rampFill)} fill="#dcd5c8" />
      <polyline
        points={toPoints([{ x: -FAR, y: 0 }, { x: 0, y: 0 }])}
        fill="none"
        stroke="#57534e"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={toPoints([{ x: 0, y: 0 }, { x: slopeDir.x * FAR, y: slopeDir.y * FAR }])}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        points={toPoints(body)}
        fill="#1f2933"
        fillOpacity={0.22}
        stroke="#1f2933"
        strokeOpacity={0.6}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {scene.overlap ? (
        <polygon points={toPoints(scene.overlap)} fill="var(--danger)" fillOpacity={0.55} />
      ) : null}
      <line
        x1={floorFrom.x}
        y1={floorFrom.y}
        x2={floorTo.x}
        y2={floorTo.y}
        stroke={tone}
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {wheelCenters.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={R} fill="#111827" />
          <circle cx={p.x} cy={p.y} r={R * 0.45} fill="#9ca3af" />
        </g>
      ))}
      <line
        x1={scene.rear.x}
        y1={scene.rear.y}
        x2={scene.front.x}
        y2={scene.front.y}
        stroke="var(--ink-muted)"
        strokeDasharray="5 4"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={0} cy={0} r={crestMarkerR} fill="#e85d4c" />
    </g>
  )
}

function Step({ n, text, formula }: { n: number; text: string; formula: string }) {
  return (
    <li className="flex gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2)] text-xs font-semibold">
        {n}
      </span>
      <span>
        <span className="text-[var(--ink)]">{text}</span>
        <code className="mt-0.5 block text-xs text-[var(--ink-soft)]">{formula}</code>
      </span>
    </li>
  )
}

function Dimension({
  from,
  to,
  color,
  label,
  labelAt,
  anchor,
  fontSize,
}: {
  from: Vec
  to: Vec
  color: string
  label: string
  labelAt: Vec
  anchor: "start" | "end"
  fontSize: number
}) {
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {[from, to].map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={fontSize * 0.18} fill={color} />
      ))}
      <text
        x={labelAt.x}
        y={labelAt.y + fontSize * 0.35}
        textAnchor={anchor}
        fontSize={fontSize}
        fontWeight={600}
        fill={color}
        stroke="white"
        strokeWidth={fontSize * 0.2}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  )
}
