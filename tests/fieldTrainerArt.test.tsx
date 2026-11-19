import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import { regionOrder, worldRegions } from '../src/game/regions/world'
import { battleVenue } from '../src/renderer/battleGround'
import { ArenaTrainers } from '../src/renderer/ArenaTrainers'
import { fieldTrainerPortrait } from '../src/renderer/fieldTrainerArt'
import { VenuePreview } from '../src/renderer/VenuePreview'

afterEach(() => vi.unstubAllGlobals())

it('ships distinct credited character portraits and resolves their local battle terrain in the preview and arena', () => {
  vi.stubGlobal('document', { baseURI: 'file:///game/' })
  const portraits = new Map<string, string>()
  const stages = new Map<string, string>()
  const credits = readFileSync('assets/battle/field-trainers/SOURCES.md', 'utf8')
  for (const region of regionOrder) {
    for (const trainer of fieldTrainersByRegion[region]) {
      const portrait = fieldTrainerPortrait(trainer)
      const face = readFileSync(join('assets', portrait))
      expect(face.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(credits).toContain('| ' + trainer.sprite + '.png |')
      portraits.set(trainer.sprite, createHash('sha256').update(face).digest('hex'))
      const html = renderToStaticMarkup(<ArenaTrainers trainer={trainer} avatar="female" commanding={false} />)
      expect(html).toContain(portrait)
      expect(html).toContain('data-trainer-sprite="' + trainer.sprite + '"')
      const stage = battleVenue(region, trainer)
      expect(stage.name).toBe(worldRegions[region].locationById[trainer.locationId].name)
      expect(stage.image).toBe('battle/field-venues/' + trainer.venue + '.png')
      expect(renderToStaticMarkup(<VenuePreview region={region} trainer={trainer} />)).toContain(stage.image)
      const ground = readFileSync(join('assets', stage.image))
      expect([ground.readUInt32BE(16), ground.readUInt32BE(20)]).toEqual([600, 380])
      stages.set(stage.image, createHash('sha256').update(ground).digest('hex'))
    }
  }
  expect(new Set(portraits.values()).size).toBe(portraits.size)
  expect(new Set(stages.values()).size).toBe(stages.size)
})
