import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species, starterIds } from '../src/game/catalog'
import type { KantoTrainer } from '../src/game/regions/kantoCampaign'
import {
  paldeaGymTrainers, paldeaLeagueTrainers, paldeaGymTrainerByLocationId,
  paldeaNemona, paldeaTrainerById, paldeaTrainerForStarter,
} from '../src/game/regions/paldeaCampaign'

const roster = (trainer: KantoTrainer) => trainer.team.map(member => [species[member.speciesId].pokedexNumber, member.level])

describe('Pokémon Scarlet Victory Road', () => {
  it('registers the eight gym rewards and reserves the Mesagoza duel for after the Champion Assessment', () => {
    expect(paldeaGymTrainers.map(t => t.badge)).toEqual([
      '체육관 배지: 벌레', '체육관 배지: 풀', '체육관 배지: 전기', '체육관 배지: 물',
      '체육관 배지: 노말', '체육관 배지: 고스트', '체육관 배지: 에스퍼', '체육관 배지: 얼음',
    ])
    expect(paldeaGymTrainers.map(t => t.locationId)).toEqual([
      'cortondo', 'artazon', 'levincia', 'cascarrafa', 'medali', 'montenevera', 'alfornada', 'glaseado-gym',
    ])
    expect(paldeaLeagueTrainers.map(t => t.name)).toEqual(['칠리', '뽀삐', '청목', '팔자크', '테사'])
    expect(paldeaLeagueTrainers.every(t => t.locationId === 'paldea-pokemon-league')).toBe(true)
    expect(paldeaLeagueTrainers.filter(t => t.role === 'champion').map(t => t.id)).toEqual(['paldea-geeta'])
    expect(paldeaNemona.locationId).toBe('mesagoza')
    for (const t of paldeaGymTrainers) expect(paldeaGymTrainerByLocationId[t.locationId]).toBe(t)
    const all = [...paldeaGymTrainers, ...paldeaLeagueTrainers, paldeaNemona]
    expect(new Set(all.map(t => t.id)).size).toBe(all.length)
    for (const t of all) expect(paldeaTrainerById[t.id]).toBe(t)
    const sheet = readFileSync('assets/maps/paldea/gym-badges.png')
    expect([sheet.readUInt32BE(16), sheet.readUInt32BE(20)]).toEqual([16, 256])
  })

  it('uses the first-challenge party, form and Ace Tera Type for each Leader and League opponent', () => {
    const trainers = [...paldeaGymTrainers, ...paldeaLeagueTrainers]
    expect(trainers.map(roster)).toEqual([
      [[919,14], [917,14], [216,15]],
      [[548,16], [928,16], [185,17]],
      [[940,23], [939,23], [404,23], [429,24]],
      [[976,29], [961,29], [740,30]],
      [[775,35], [982,35], [398,36]],
      [[354,41], [778,41], [972,41], [849,42]],
      [[981,44], [282,44], [956,44], [671,45]],
      [[873,47], [614,47], [975,47], [334,48]],
      [[340,57], [323,57], [232,57], [51,57], [980,58]],
      [[879,58], [462,58], [437,58], [823,58], [959,59]],
      [[357,59], [741,59], [334,59], [398,59], [973,60]],
      [[715,60], [612,60], [691,60], [841,60], [998,61]],
      [[956,61], [673,61], [976,61], [713,61], [983,61], [970,62]],
    ])
    expect(trainers.map(t => t.team.at(-1)?.teraType)).toEqual([
      'bug', 'grass', 'electric', 'water', 'normal', 'ghost', 'psychic', 'ice',
      'ground', 'steel', 'flying', 'dragon', 'rock',
    ])
    for (const t of trainers) expect(t.team.slice(0, -1).every(m => !m.teraType)).toBe(true)
    expect(paldeaGymTrainers[5].team.at(-1)?.formId).toBe('toxtricity-low-key')
    expect(paldeaLeagueTrainers[2].team[1].formId).toBe('oricorio-pom-pom')
    expect(paldeaGymTrainers[4].team[1].formId).toBeUndefined()
  })

  it('gives Nemona the weaker Paldea starter and its Tera Type for all player starter families', () => {
    const starterAces: Record<string, readonly [string, string]> = {
      grass: ['quaquaval', 'water'], fire: ['meowscarada', 'grass'], water: ['skeledirge', 'fire'],
    }
    for (const first of starterIds) {
      const [speciesId, teraType] = starterAces[species[first].types[0]]
      let partner: string | undefined = first
      while (partner) {
        const t = paldeaTrainerForStarter(paldeaNemona, partner)
        expect(roster(t).slice(0, -1)).toEqual([[745, 65], [706, 65], [982, 65], [968, 65], [923, 65]])
        expect(t.team[2].formId).toBe('dudunsparce-three-segment')
        expect(t.team.slice(0, -1).every(m => !m.teraType)).toBe(true)
        expect(t.team.at(-1)).toEqual({ speciesId, level: 66, teraType })
        partner = species[partner].evolvesTo?.speciesId
      }
    }
    expect(paldeaTrainerForStarter(paldeaLeagueTrainers[4], 'meowscarada')).toBe(paldeaLeagueTrainers[4])
  })
})
