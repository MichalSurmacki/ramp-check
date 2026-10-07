"use client"

import { useTranslations } from "next-intl"

export function Disclaimer() {
  const t = useTranslations()
  return (
    <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{t("disclaimer")}</p>
  )
}
