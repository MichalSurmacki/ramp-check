import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "./LanguageSwitcher"

export async function Header() {
  const t = await getTranslations("header")

  return (
    <header className="relative overflow-hidden border-b border-[var(--line)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#f6d6c6_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_#d9e4f0_0%,_transparent_50%)]" />
      <div className="relative mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-8 sm:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
            {t("brand")}
          </p>
          <p className="mt-2 max-w-md text-base text-[var(--ink-muted)] sm:text-lg">
            {t("tagline")}
          </p>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  )
}
