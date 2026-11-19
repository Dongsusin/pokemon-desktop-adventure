import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { isSpeciesMotionSupported } from '../src/game/motionEligibility'
import { fieldTeamVariant, fieldTrainerById, fieldTrainersByRegion } from '../src/game/regions/fieldTrainers'
import source from '../src/game/regions/champions-arena-roster.json'
import canonical from '../src/game/regions/canonical-field-teams.json'
import { regionOrder, worldRegions } from '../src/game/regions/world'

const all = Object.values(fieldTrainersByRegion).flat()
const regular = all.filter(t => /^[sabcd]-\d{3}$/.test(t.sourceId))

describe('Champions Arena AI opponents', () => {
  it('maps all original IDs once and includes the human boss duos and Factory opponent', () => {
    expect(source.regularRosterSha256).toBe('38e11534a3556e9d290b3dcbe0d70b193791e210d37be5536fcfde6537fb4e6a')
    expect(regular).toHaveLength(238)
    expect(Object.fromEntries(['S','A','B','C','D'].map(tier => [tier, regular.filter(t => t.tier === tier).length])))
      .toEqual({ S: 25, A: 14, B: 68, C: 87, D: 44 })
    expect(all).toHaveLength(241)
    expect(new Set(all.map(t => t.sourceId))).toEqual(new Set(source.trainers.map(t => t.id)))
    expect(all.flatMap(t => t.teams.slice(0,t.arenaTeamCount))).toHaveLength(721)
    expect(regular.flatMap(t => t.teams.slice(0, 3)).flat()).toHaveLength(3950)
    expect(all.flatMap(t => t.teams.slice(0,t.arenaTeamCount)).flat()).toHaveLength(3983)
    expect(fieldTrainerById['__proto__']).toBeUndefined()
    expect(fieldTrainerById['field-kanto-hiker']).toBeUndefined()
    expect(fieldTrainerById['field-kanto-ash']?.name).toBe('지우')
    expect(fieldTrainerById['field-kanto-rocket-duo']?.arenaTeamCount).toBe(4)
    expect(fieldTrainerById['field-kanto-giovanni']?.arenaTeamCount).toBe(4)
    expect(all.find(t=>t.sourceId === 'boss-proton-petrel')?.name).toBe('랜스 / 란다')
    expect(all.find(t=>t.sourceId === 'boss-ariana-archer')?.name).toBe('아테나 / 아폴로')
    expect(all.find(t=>t.sourceId === 'factory-clown')?.teams.map(t => t.length)).toEqual([3, 3, 3])
  })

  it('preserves every playable source member, form, and order in every team of every trainer', () => {
    const bySource = new Map(source.trainers.map(t => [t.id, t]))
    for (const id of regionOrder) {
      const region = worldRegions[id], placed = fieldTrainersByRegion[id]
      expect(new Set(placed.map(t => t.locationId)).size).toBe(placed.length)
      for (const trainer of placed) {
        expect(region.locationById[trainer.locationId], trainer.name).toBeDefined()
        expect(fieldTrainerById[trainer.id]).toBe(trainer)
        expect(trainer.sprite).toBe(trainer.sourceId)
        const original = bySource.get(trainer.sourceId)!
        expect(trainer.name).toBe(original.name)
        expect(trainer.arenaTeamCount).toBe(original.teams.length)
        for (const [index, team] of trainer.teams.slice(0,trainer.arenaTeamCount).entries()) {
          expect(team.length).toBeGreaterThan(0)
          expect(team.length).toBeLessThanOrEqual(6)
          expect(team.map(({speciesId, formId}) => [speciesId, formId]))
            .toEqual(original.teams[index].map(member => [member.speciesId, 'formId' in member ? member.formId : undefined]))
          expect(team.map(m => m.plan)).toEqual(original.teams[index].map(m => m.plan))
          for (const member of team) {
            expect(species[member.speciesId], trainer.name).toBeDefined()
            expect(isSpeciesMotionSupported(member.speciesId, member.formId), trainer.name).toBe(true)
            const rankLevels = { D: 15, C: 30, B: 45, A: 65, S: 85 }
            expect(member.level).toBe(trainer.tier && index < 3 ? rankLevels[trainer.tier] : 90)
          }
        }
      }
    }
  })

  it('builds the default from each sourced party in order and excludes species or forms without dedicated motions', () => {
    const entries: Record<string, { source: string; team: { speciesId: string; formId?: string }[] }> = canonical
    const fallback: string[] = []
    for (const trainer of all) {
      const record = entries[trainer.sourceId]
      const playable = record?.team.filter(m => isSpeciesMotionSupported(m.speciesId, m.formId)) ?? []
      if (record) expect(record.source).toMatch(/^https:\/\//)
      if (playable.length) {
        expect(trainer.defaultTeamNumber).toBe(trainer.arenaTeamCount + 1)
        expect(trainer.team.map(m => [m.speciesId, m.formId])).toEqual(playable.map(m => [m.speciesId, m.formId]))
      } else {
        fallback.push(trainer.sourceId)
        expect(trainer.team).toBe(trainer.teams[0])
      }
    }
    expect(fallback.sort()).toEqual(['c-183', 'd-205', 'd-206', 'factory-clown'])
    expect(all.find(t => t.sourceId === 'd-193')?.team.map(m => m.speciesId)).toEqual(['ekans', 'meowth', 'koffing'])
    expect(all.find(t => t.sourceId === 's-001')?.team.map(m => m.speciesId)).toEqual(['pikachu', 'lapras', 'snorlax', 'venusaur', 'charizard', 'blastoise'])
    expect(all.find(t => t.sourceId === 'd-234')?.team.some(m => m.formId === 'gastrodon-east')).toBe(true)
  })

  it('selects one-based teams by identity without mutating another variant or accepting fractional indexes', () => {
    const ash = fieldTrainerById['field-kanto-ash']!
    expect(fieldTeamVariant(ash)).toBe(ash)
    expect(ash.teams[0].map(m => m.speciesId)).toEqual(['pikachu','melmetal','exploud','charizard','greninja','sceptile'])
    const second = fieldTeamVariant(ash, 2)!
    expect(second).toBe(fieldTeamVariant(ash, 2))
    expect(second.team).toBe(ash.teams[1])
    expect(second.team).toContainEqual(expect.objectContaining({ speciesId: 'ninetales', formId: 'ninetales-alola' }))
    expect(ash.team.map(m => m.speciesId)).toEqual(['pikachu','gengar','lucario','dragonite','dracovish'])
    for (const n of [0, -1, 1.5, ash.teams.length + 1, NaN]) expect(fieldTeamVariant(ash, n)).toBeUndefined()
  })
})
