import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species, starterIds } from '../src/game/catalog'
import {
  alolaChampionForStarter, alolaGymTrainerByLocationId, alolaGymTrainers, alolaLeagueTrainers, alolaTrainerById,
} from '../src/game/regions/alolaCampaign'

describe('Pokémon Sun island challenge', () => {
  it('uses the eleven story milestones, native crystal order and the Sun totem aura stages', () => {
    expect(alolaGymTrainers.map(t => t.badge)).toEqual([
      '노말Z', '격투Z', '물Z', '불꽃Z', '풀Z', '바위Z', '전기Z', '고스트Z', '악Z', '땅Z', '드래곤Z',
    ])
    const totems = alolaGymTrainers.filter(t => t.trialKind === 'totem')
    expect(totems.map(t => [t.team[0].speciesId, t.team[0].level, t.totemAura?.stat, t.totemAura?.stages])).toEqual([
      ['gumshoos', 12, 'defense', 1], ['wishiwashi', 20, 'defense', 1], ['salazzle', 22, 'spDefense', 1],
      ['lurantis', 24, 'speed', 2], ['vikavolt', 29, 'all', 1], ['mimikyu', 33, 'all', 1], ['kommo-o', 45, 'all', 1],
    ])
    expect(totems.every(t => t.team.length === 1)).toBe(true)
    expect(totems[1].team[0].formId).toBe('wishiwashi-school')
    const kahunas = alolaGymTrainers.filter(t => t.trialKind === 'kahuna')
    expect(kahunas.map(t => [t.name, t.team.length, t.team.at(-1)?.level])).toEqual([
      ['할라', 3, 15], ['라이치', 3, 27], ['나누', 3, 39], ['하푸우', 4, 48],
    ])
    expect(kahunas[1].team[2].formId).toBe('lycanroc-midnight')
    expect(kahunas[3].team[1].formId).toBe('gastrodon-east')
    expect(alolaGymTrainers.slice(-2).map(t => t.locationId)).toEqual(['vast-poni-canyon-entrance', 'vast-poni-canyon'])
    for (const trainer of alolaGymTrainers) expect(alolaGymTrainerByLocationId[trainer.locationId]).toBe(trainer)
    const sheet = readFileSync('assets/maps/alola/gym-badges.png')
    expect([sheet.readUInt32BE(16), sheet.readUInt32BE(20)]).toEqual([16, alolaGymTrainers.length * 32])
  })

  it('registers first-challenge Elite Four parties and preserves their separate grand trial IDs', () => {
    const elites = alolaLeagueTrainers.filter(t => t.role === 'elite')
    expect(elites.map(t => t.name)).toEqual(['할라', '라이치', '아세로라', '카일리'])
    expect(elites.map(t => t.team.at(-1)?.speciesId)).toEqual(['crabominable', 'lycanroc', 'palossand', 'toucannon'])
    for (const elite of elites) expect(elite.team.map(member => member.level)).toEqual([54, 54, 54, 54, 55])
    expect(elites[1].team[4].formId).toBe('lycanroc-midnight')
    const all = [...alolaGymTrainers, ...alolaLeagueTrainers]
    expect(new Set(all.map(t => t.id)).size).toBe(16)
    for (const trainer of all) {
      expect(alolaTrainerById[trainer.id]).toBe(trainer)
      expect(trainer.team.every(member => Object.hasOwn(species, member.speciesId))).toBe(true)
    }
  })

  it('gives Kukui his native final starter for all 27 partner lines including their evolutions', () => {
    const aces: Record<string, string> = { grass: 'incineroar', fire: 'primarina', water: 'decidueye' }
    for (const starter of starterIds) {
      let partner: string | undefined = starter
      while (partner) {
        const kukui = alolaChampionForStarter(partner)
        expect(kukui).toMatchObject({ id: 'alola-kukui', name: '쿠쿠이', role: 'champion' })
        expect(kukui.team.map(member => [member.speciesId, member.level])).toEqual([
          ['lycanroc', 57], ['ninetales', 56], ['braviary', 56], ['magnezone', 56], ['snorlax', 56],
          [aces[species[starter].types[0]], 58],
        ])
        partner = species[partner].evolvesTo?.speciesId
      }
    }
  })
})
