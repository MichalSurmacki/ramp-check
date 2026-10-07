import { Application } from "pixi.js"

export async function createPixiApp(
  width: number,
  height: number,
): Promise<Application> {
  const app = new Application()
  await app.init({
    width,
    height,
    background: 0xf3f0ea,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  })
  return app
}

/**
 * Never pass `true` as the renderer option: in Pixi v8 that also calls
 * `GlobalResourceRegistry.release()`, which clears pools shared by every
 * Application on the page (batcher, texture and text canvas pools) and
 * silently breaks the instance that is still mounted.
 */
export function destroyPixiApp(app: Application | null) {
  if (!app) return
  app.destroy({ removeView: true }, { children: true, texture: true })
}
