import { renderToStaticMarkup } from "react-dom/server"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it } from "vitest"
import { ClearanceExplainer } from "@/components/ClearanceExplainer"
import { calculateRampClearance } from "@/lib/geometry"
import type { CalculatorState } from "@/types/geometry"
import messages from "@/messages/pl.json"

function render(state: CalculatorState) {
  const result = calculateRampClearance({
    vehicle: { wheelbaseCm: state.wheelbaseCm, clearanceCm: state.clearanceCm },
    ramp: { angleDeg: state.rampAngleDeg },
    safetyMarginCm: state.safetyMarginCm,
  })
  const html = renderToStaticMarkup(
    <NextIntlClientProvider locale="pl" messages={messages}>
      <ClearanceExplainer state={state} result={result} />
    </NextIntlClientProvider>,
  )
  return { html, result }
}

const cases = [0.1, 5, 15, 45].flatMap((rampAngleDeg) =>
  [0.1, 12, 100].flatMap((clearanceCm) =>
    [100, 500].map((wheelbaseCm) => ({
      rampAngleDeg,
      clearanceCm,
      wheelbaseCm,
      safetyMarginCm: 5,
    })),
  ),
)

describe("ClearanceExplainer", () => {
  it.each(cases)(
    "renders finite geometry for %o",
    (state) => {
      const { html, result } = render(state)
      expect(html).not.toMatch(/NaN|Infinity/)
      expect(html.match(/<svg/g)).toHaveLength(2)
      const overlapShown = html.includes('fill="var(--danger)" fill-opacity="0.55"')
      expect(overlapShown).toBe(result.status === "error")
    },
  )
})
