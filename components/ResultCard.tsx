"use client"

import { useTranslations } from "next-intl"
import type { CalculationResult } from "@/types/geometry"

type Props = {
  result: CalculationResult
}

export function ResultCard({ result }: Props) {
  const t = useTranslations("result")

  const tone =
    result.status === "success"
      ? "success"
      : result.status === "warning"
        ? "warning"
        : "danger"

  const icon =
    result.status === "success" ? "✓" : result.status === "warning" ? "!" : "×"

  const title =
    result.status === "success"
      ? t("successTitle")
      : result.status === "warning"
        ? t("warningTitle")
        : t("errorTitle")

  const body =
    result.status === "success"
      ? t("successBody")
      : result.status === "warning"
        ? t("warningBody")
        : t("errorBody", {
            missing: Math.abs(result.minimumClearanceCm).toFixed(1),
          })

  return (
    <section
      className={`rounded-xl border px-5 py-6 text-center tone-${tone}`}
      aria-live="polite"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold">
        {icon}
      </div>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-sm opacity-90">{body}</p>
      <dl className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="opacity-70">{t("minClearance")}</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {result.minimumClearanceCm.toFixed(1)} cm
          </dd>
        </div>
        <div>
          <dt className="opacity-70">{t("requiredMargin")}</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {result.safetyMarginCm.toFixed(1)} cm
          </dd>
        </div>
        <div>
          <dt className="opacity-70">{t("surplus")}</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {result.marginDifferenceCm.toFixed(1)} cm
          </dd>
        </div>
      </dl>
    </section>
  )
}
