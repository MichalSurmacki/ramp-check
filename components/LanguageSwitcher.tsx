"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()

  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)]">
      <span className="sr-only">Language / Język</span>
      <select
        className="rounded-md border border-[var(--line)] bg-white/80 px-2 py-1 text-[var(--ink)]"
        value={locale}
        onChange={(e) => {
          router.replace(pathname, { locale: e.target.value as AppLocale })
        }}
        aria-label="Language / Język"
      >
        <option value="pl">PL</option>
        <option value="en">EN</option>
      </select>
    </label>
  )
}
