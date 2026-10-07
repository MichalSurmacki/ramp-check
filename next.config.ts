import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  // The sandbox dev server is reached from the host via a forwarded
  // 127.0.0.1 port; without this the HMR websocket is rejected.
  allowedDevOrigins: ["127.0.0.1"],
}

export default withNextIntl(nextConfig)
