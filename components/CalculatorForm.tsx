"use client"

import { useTranslations } from "next-intl"
import type { CalculatorState } from "@/types/geometry"
import { VALIDATION } from "@/types/geometry"

type Props = {
  state: CalculatorState
  onChange: (patch: Partial<CalculatorState>) => void
  onSubmit: () => void
  onReset: () => void
  disabled?: boolean
}

export function CalculatorForm({
  state,
  onChange,
  onSubmit,
  onReset,
  disabled,
}: Props) {
  const t = useTranslations("form")
  const te = useTranslations("errors")

  const angleInvalid =
    state.rampAngleDeg < VALIDATION.angle.min ||
    state.rampAngleDeg > VALIDATION.angle.max
  const clearanceInvalid =
    state.clearanceCm < VALIDATION.clearance.min ||
    state.clearanceCm > VALIDATION.clearance.max
  const wheelbaseInvalid =
    state.wheelbaseCm < VALIDATION.wheelbase.min ||
    state.wheelbaseCm > VALIDATION.wheelbase.max
  const marginInvalid =
    state.safetyMarginCm < VALIDATION.safetyMargin.min ||
    state.safetyMarginCm > VALIDATION.safetyMargin.max

  const invalid =
    angleInvalid || clearanceInvalid || wheelbaseInvalid || marginInvalid

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!invalid) onSubmit()
      }}
    >
      <NumberField
        label={t("rampAngle")}
        unit={t("unitDeg")}
        value={state.rampAngleDeg}
        min={VALIDATION.angle.min}
        max={VALIDATION.angle.max}
        error={angleInvalid ? te("angle") : undefined}
        onChange={(v) => onChange({ rampAngleDeg: v })}
      />
      <NumberField
        label={t("clearance")}
        unit={t("unitCm")}
        help={t("clearanceHelp")}
        value={state.clearanceCm}
        min={VALIDATION.clearance.min}
        max={VALIDATION.clearance.max}
        error={clearanceInvalid ? te("clearance") : undefined}
        onChange={(v) => onChange({ clearanceCm: v })}
      />
      <NumberField
        label={t("wheelbase")}
        unit={t("unitCm")}
        help={t("wheelbaseHelp")}
        value={state.wheelbaseCm}
        min={VALIDATION.wheelbase.min}
        max={VALIDATION.wheelbase.max}
        error={wheelbaseInvalid ? te("wheelbase") : undefined}
        onChange={(v) => onChange({ wheelbaseCm: v })}
      />
      <NumberField
        label={t("safetyMargin")}
        unit={t("unitCm")}
        help={t("marginHelp")}
        value={state.safetyMarginCm}
        min={VALIDATION.safetyMargin.min}
        max={VALIDATION.safetyMargin.max}
        error={marginInvalid ? te("margin") : undefined}
        onChange={(v) => onChange({ safetyMarginCm: v })}
      />

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <button
          type="submit"
          disabled={disabled || invalid}
          className="min-h-12 flex-1 rounded-md bg-[var(--ink)] px-4 text-sm font-semibold tracking-wide text-[var(--paper)] transition hover:bg-[var(--ink-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("submit")}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="min-h-12 rounded-md border border-[var(--line)] bg-white/70 px-4 text-sm font-medium text-[var(--ink)]"
        >
          {t("reset")}
        </button>
      </div>
    </form>
  )
}

function NumberField({
  label,
  unit,
  help,
  value,
  min,
  max,
  error,
  onChange,
}: {
  label: string
  unit: string
  help?: string
  value: number
  min: number
  max: number
  error?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      {help ? (
        <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">{help}</span>
      ) : null}
      <span className="mt-1.5 flex min-h-12 items-stretch overflow-hidden rounded-md border border-[var(--line)] bg-white focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
        <input
          type="number"
          inputMode="decimal"
          className="w-full bg-transparent px-3 text-base text-[var(--ink)] outline-none"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step="any"
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <span className="flex items-center bg-[var(--paper-2)] px-3 text-sm text-[var(--ink-muted)]">
          {unit}
        </span>
      </span>
      {error ? (
        <span className="mt-1 block text-xs text-[var(--danger)]">{error}</span>
      ) : null}
    </label>
  )
}
