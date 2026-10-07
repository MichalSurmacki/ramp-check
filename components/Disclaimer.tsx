"use client"

import { useTranslations } from "next-intl"

export function Disclaimer() {
  const t = useTranslations()
  return (
    <p
      role="note"
      className="tone-warning flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold leading-relaxed"
    >
      <span>{t("disclaimer")}</span>
    </p>
  )
}
