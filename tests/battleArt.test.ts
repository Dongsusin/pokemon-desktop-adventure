import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { pokemonForms } from '../src/game/forms'

type Strip = [number, number, number, number, number, number, number[], number?, number?]
type Atlas = { idle: Strip; columns?: number } & Partial<Record<'walk' | 'attack' | 'charge' | 'shoot' | 'hurt', Strip>>
const metadata: Record<string, Atlas> = JSON.parse(readFileSync('src/renderer/battle-atlases.json', 'utf8'))
const spriteDir = 'assets/battle/sprites'

describe('offline trainer battle artwork', () => {
  it('supplies a distinct animated sheet for every supported species and regional form', () => {
    const keys = [...Object.values(species).map(mon => String(mon.pokedexNumber)), ...Object.keys(pokemonForms)]
    expect(Object.keys(metadata).sort()).toEqual(keys.sort())
    expect(readdirSync(spriteDir).sort()).toEqual(keys.map(k => k + '.png').sort())
  })
  it('keeps every directional frame and impact marker inside its shipped sheet', () => {
    for (const [key, atlas] of Object.entries(metadata)) {
      const png = readFileSync(join(spriteDir, key + '.png'))
      const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
      for (const [name, strip] of Object.entries(atlas)) {
        if (typeof strip === 'number') continue
        const [y, w, h, , , rows, durations, hit, back] = strip
        const columns = atlas.columns ?? durations.length
        const lines = atlas.columns ? Math.ceil(durations.length / columns) : rows
        const total = durations.reduce((sum: number, t: number) => sum + t, 0)
        const inside = w > 0 && h > 0 && w * columns <= width && y >= 0 && y + h * lines <= height
        const markers = hit === undefined || (back !== undefined && hit >= 0 && back >= hit && back <= total)
        if (!inside || !markers || total < 1) throw Error('Invalid ' + key + '/' + name + ' sprite strip')
      }
    }
  })
})
