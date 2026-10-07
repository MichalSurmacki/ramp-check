"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Application } from "pixi.js"
import { useTranslations } from "next-intl"
import type { CalculationResult, CalculatorState } from "@/types/geometry"
import { createPixiApp, destroyPixiApp } from "@/lib/pixi/createApp"
import {
  SimulationController,
  type SimLabels,
  type SimPhase,
} from "@/lib/pixi/simulationController"

type Props = {
  state: CalculatorState
  onPhaseChange?: (phase: SimPhase) => void
  playToken: number
  lastResult: CalculationResult | null
}

export function SimulationCanvas({
  state,
  onPhaseChange,
  playToken,
  lastResult,
}: Props) {
  const t = useTranslations("sim")
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const simRef = useRef<SimulationController | null>(null)
  const phaseRef = useRef(onPhaseChange)

  const labels = useMemo<SimLabels>(
    () => ({
      entry: t("entry"),
      ramp: (angleDeg) => t("ramp", { angle: Number(angleDeg.toFixed(1)) }),
      exit: t("exit"),
      intrusion: (cm) => t("intrusion", { value: cm }),
      gap: (cm) => t("gap", { value: cm }),
      hit: (cm) => t("hit", { value: cm }),
    }),
    [t],
  )
  const labelsRef = useRef(labels)
  const stateRef = useRef(state)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    phaseRef.current = onPhaseChange
    stateRef.current = state
  })

  useEffect(() => {
    labelsRef.current = labels
    simRef.current?.setOptions({ labels })
  }, [labels])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false

    const boot = async () => {
      const width = host.clientWidth || 360
      const height = Math.max(240, Math.round(width * 0.62))
      const app = await createPixiApp(width, height)
      // Strict Mode mounts twice: a stale instance must never touch the DOM.
      if (cancelled) {
        destroyPixiApp(app)
        return
      }
      host.replaceChildren(app.canvas)
      appRef.current = app
      simRef.current = new SimulationController(app, stateRef.current, {
        labels: labelsRef.current,
        onPhaseChange: (p) => phaseRef.current?.(p),
      })
    }

    boot().catch((error: unknown) => {
      console.error("Simulation failed to start", error)
      if (!cancelled) setFailed(true)
    })

    return () => {
      cancelled = true
      destroyPixiApp(appRef.current)
      appRef.current = null
      simRef.current = null
    }
  }, [])

  useEffect(() => {
    simRef.current?.syncFromState(state)
  }, [state])

  useEffect(() => {
    if (playToken <= 0 || !lastResult) return
    void simRef.current?.play(lastResult)
  }, [playToken, lastResult])

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[#f3f0ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div ref={hostRef} className="min-h-[240px] w-full" />
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[var(--danger)]">
          {t("failed")}
        </p>
      ) : null}
    </div>
  )
}
