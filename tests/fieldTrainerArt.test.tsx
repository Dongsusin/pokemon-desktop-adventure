import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import { battleVenue } from '../src/renderer/battleGround'
import { ArenaTrainers } from '../src/renderer/ArenaTrainers'
import { FieldTrainerPortrait } from '../src/renderer/fieldTrainerArt'

const directory = 'assets/battle/field-trainers'
const rows = readFileSync(join(directory, 'SOURCES.md'), 'utf8').split(/\r?\n/)
  .filter(line => line.startsWith('| ') && line.split(' | ')[0].endsWith('.png'))
const originals = new Map(rows.map(line => {
  const [, file, , source, , hash] = line.split('|').map(cell => cell.trim())
  expect(source).toMatch(/https:\/\//)
  return [file, hash.replaceAll('`', '')]
}))

afterEach(() => vi.unstubAllGlobals())

it('ships the credited original transparent PNGs for the Champions Arena trainer roster', () => {
  expect(originals.size).toBe(242)
  expect(readdirSync(directory).filter(file => file.endsWith('.png')).sort()).toEqual([...originals.keys()].sort())
  for (const [file, hash] of originals) {
    const bytes = readFileSync(join(directory, file))
    expect(bytes.subarray(0, 8).toString('hex'), file).toBe('89504e470d0a1a0a')
    expect([4, 6].includes(bytes[25]) || bytes.includes(Buffer.from('tRNS')), file).toBe(true)
    expect(createHash('sha256').update(bytes).digest('hex'), file).toBe(hash)
  }
})

it('renders the same original opponent portraits in the map and battle and resolves each local venue', () => {
  vi.stubGlobal('document', { baseURI: 'file:///game/' })
  const used = new Set<string>()
  const checkedStages = new Set<string>()
  for (const region of regionOrder) {
    for (const trainer of fieldTrainersByRegion[region]) {
      const map = renderToStaticMarkup(<FieldTrainerPortrait trainer={trainer} />)
      const arena = renderToStaticMarkup(<ArenaTrainers trainer={trainer} avatar="female" commanding={false} />)
      const faces = [...map.matchAll(/<img[^>]+src="battle\/field-trainers\/([^"]+\.png)"/g)].map(match => match[1])
      const expectedPair = trainer.sprite === 'boss-proton-petrel' ? ['proton.png', 'petrel.png']
        : trainer.sprite === 'boss-ariana-archer' ? ['ariana.png', 'd-192.png'] : undefined
      expect(faces, trainer.id).toEqual(expectedPair ?? [trainer.sprite + '.png'])
      for (const face of faces) {
        expect(arena).toContain('src="battle/field-trainers/' + face + '"')
        used.add(face)
      }
      const stage = battleVenue(region, trainer)
      expect(stage.name).toBe(worldRegions[region].locationById[trainer.locationId].name)
      expect(stage.image).toBe('battle/field-venues/' + trainer.venue + '.png')
      if (!checkedStages.has(stage.image)) {
        const ground = readFileSync(join('assets', stage.image))
        expect([ground.readUInt32BE(16), ground.readUInt32BE(20)]).toEqual([600, 380])
        checkedStages.add(stage.image)
      }
    }
  }
  expect([...used].sort()).toEqual([...originals.keys()].sort())
})
