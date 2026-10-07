"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { CalculatorForm } from "@/components/CalculatorForm"
import { ClearanceExplainer } from "@/components/ClearanceExplainer"
import { ResultCard } from "@/components/ResultCard"
import { SimulationCanvas } from "@/components/SimulationCanvas"
import { Disclaimer } from "@/components/Disclaimer"
import { calculateRampClearance, isValidState } from "@/lib/geometry"
import {
  DEFAULT_VALUES,
  type CalculationResult,
  type CalculatorState,
} from "@/types/geometry"
import type { SimPhase } from "@/lib/pixi/simulationController"

export function RampCheckApp() {
  const t = useTranslations()
  const [state, setState] = useState<CalculatorState>(DEFAULT_VALUES)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [playToken, setPlayToken] = useState(0)
  const [phase, setPhase] = useState<SimPhase>("idle")

  const preview = useMemo(
    () => (isValidState(state) ? calculate(state) : null),
    [state],
  )

  const phaseLabel =
    phase === "done" && result
      ? t(`sim.done.${result.status}`)
      : t(`sim.phase.${phase === "done" ? "idle" : phase}`)

  const onChange = (patch: Partial<CalculatorState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }

  const onSubmit = () => {
    setResult(calculate(state))
    setPlayToken((n) => n + 1)
  }

  const onReset = () => {
    setState(DEFAULT_VALUES)
    setResult(null)
    setPlayToken(0)
    setPhase("idle")
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">
        <CalculatorForm
          state={state}
          onChange={onChange}
          onSubmit={onSubmit}
          onReset={onReset}
        />
        <ClearanceExplainer state={state} result={preview} />
      </div>

      <div className="space-y-4 lg:sticky lg:top-4">
        <SimulationCanvas
          state={state}
          onPhaseChange={setPhase}
          playToken={playToken}
          lastResult={result}
        />
        <p className="text-xs text-[var(--ink-muted)]">{phaseLabel}</p>

        {result ? <ResultCard result={result} /> : null}
      </div>

      <div className="space-y-6 lg:col-span-2">
        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard title={t("info.howTitle")} body={t("info.howBody")} />
          <InfoCard
            title={t("info.clearanceTitle")}
            body={t("info.clearanceBody")}
          />
        </section>
        <Disclaimer />
      </div>
    </div>
  )
}

function calculate(state: CalculatorState): CalculationResult {
  return calculateRampClearance({
    vehicle: {
      wheelbaseCm: state.wheelbaseCm,
      clearanceCm: state.clearanceCm,
    },
    ramp: { angleDeg: state.rampAngleDeg },
    safetyMarginCm: state.safetyMarginCm,
  })
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-white/60 p-4">
      <h3 className="font-[family-name:var(--font-display)] text-lg">{title}</h3>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">{body}</p>
    </article>
  )
}
