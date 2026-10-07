"use client"

import { useTransition } from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing, type AppLocale } from "@/i18n/routing"

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <div
      role="group"
      aria-label="Language / Język"
      className={`inline-flex rounded-full border border-[var(--line)] bg-white/70 p-1 shadow-sm backdrop-blur ${isPending ? "opacity-60" : ""}`}
    >
      {routing.locales.map((code) => {
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            disabled={active || isPending}
            onClick={() =>
              startTransition(() => router.replace(pathname, { locale: code }))
            }
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
              active
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "cursor-pointer text-[var(--ink-muted)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
