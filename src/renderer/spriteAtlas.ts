import atlasData from './battle-atlases.json?raw'

// Sheet offset, crop dimensions, ground anchor, rows, frame times (60 Hz), hit and return ticks.
export type SpriteStrip = [number, number, number, number, number, number, number[], number?, number?]
export type SpriteAtlas = { idle: SpriteStrip; walk: SpriteStrip; attack: SpriteStrip } &
  Partial<Record<'hurt' | 'charge' | 'shoot', SpriteStrip>>
const catalog: Record<string, SpriteAtlas> = JSON.parse(atlasData)

export const spriteAtlasKey = (dex: number, formId?: string) => formId ?? String(dex)
export const spriteAtlas = (key: string) => catalog[key]
export const spriteSheetUrl = (key: string) => new URL('battle/sprites/' + key + '.png', document.baseURI).href
export const spriteExtent = (atlas: SpriteAtlas) => Math.max(16, atlas.idle[1], atlas.idle[2])

export function spriteFrameIndex(durations: number[], ticks: number) {
  let frame = 0
  while (frame < durations.length - 1 && ticks >= durations[frame]) ticks -= durations[frame++]
  return frame
}
