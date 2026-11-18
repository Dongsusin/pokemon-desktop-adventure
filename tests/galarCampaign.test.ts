import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { species, starterIds } from '../src/game/catalog'
import {
  galarGymTrainerByLocationId, galarGymTrainers, galarLeagueTrainers, galarTrainerById, galarTrainerForStarter,
} from '../src/game/regions/galarCampaign'
import type { KantoTrainer } from '../src/game/regions/kantoCampaign'

function roster(trainer: KantoTrainer) {
  return trainer.team.map(member => [species[member.speciesId].pokedexNumber, member.level])
}

describe('Pokémon Sword Gym Challenge and Champion Cup', () => {
  it('registers eight badges and seven Cup matches at their venues in first-play order', () => {
    expect(galarGymTrainers.map(t => t.badge)).toEqual([
      '풀배지', '물배지', '불꽃배지', '격투배지', '페어리배지', '바위배지', '악배지', '드래곤배지',
    ])
    expect(galarGymTrainers.map(t => t.locationId)).toEqual([
      'turffield', 'hulbury', 'motostoke', 'stow-on-side', 'ballonlea', 'circhester', 'spikemuth', 'hammerlocke',
    ])
    for (const gym of galarGymTrainers) expect(galarGymTrainerByLocationId[gym.locationId]).toBe(gym)
    expect(galarLeagueTrainers.map(t => t.name)).toEqual(['마리', '호브', '비트', '야청', '채두', '금랑', '단델'])
    expect(galarLeagueTrainers.every(t => t.cupRound && t.locationId === 'wyndon-stadium')).toBe(true)
    expect(galarLeagueTrainers.filter(t => t.role === 'champion')).toEqual([galarLeagueTrainers[6]])
    const all = [...galarGymTrainers, ...galarLeagueTrainers]
    expect(new Set(all.map(t => t.id)).size).toBe(all.length)
    for (const trainer of all) expect(galarTrainerById[trainer.id]).toBe(trainer)
    const sheet = readFileSync('assets/maps/galar/gym-badges.png')
    expect([sheet.readUInt32BE(16), sheet.readUInt32BE(20)]).toEqual([16, galarGymTrainers.length * 32])
  })

  it('uses the original party slots, levels and alternate forms of the first challenge', () => {
    expect(galarGymTrainers.map(roster)).toEqual([
      [[829, 19], [830, 20]],
      [[118, 22], [846, 23], [834, 24]],
      [[38, 25], [59, 25], [851, 27]],
      [[237, 34], [675, 34], [865, 35], [68, 36]],
      [[110, 36], [303, 36], [468, 37], [869, 38]],
      [[689, 40], [213, 40], [874, 41], [839, 42]],
      [[560, 44], [687, 45], [435, 45], [862, 46]],
      [[526, 46], [330, 47], [844, 46], [884, 48]],
    ])
    expect(galarLeagueTrainers.map(roster)).toEqual([
      [[510, 47], [454, 47], [560, 47], [877, 48], [861, 49]],
      [[832, 48], [823, 48], [871, 47], [143, 47], [818, 49]],
      [[303, 51], [282, 51], [78, 52], [858, 53]],
      [[768, 51], [279, 51], [847, 52], [119, 52], [834, 53]],
      [[701, 52], [853, 52], [865, 53], [870, 53], [68, 54]],
      [[324, 53], [706, 54], [776, 54], [330, 54], [884, 55]],
      [[681, 62], [887, 62], [612, 63], [537, 64], [815, 64], [6, 65]],
    ])
    expect(galarGymTrainers[4].team.map(m => m.formId)).toEqual(['weezing-galar', undefined, undefined, 'alcremie-ruby-cream'])
    expect(galarLeagueTrainers[2].team[2].formId).toBe('rapidash-galar')
  })

  it('activates only native Dynamax and Gigantamax aces and respects Spikemuth', () => {
    expect(galarGymTrainers.map(t => t.team.at(-1)?.dynamax)).toEqual([
      'dynamax', 'dynamax', 'gigantamax', 'gigantamax', 'gigantamax', 'gigantamax', undefined, 'gigantamax',
    ])
    expect(galarLeagueTrainers.map(t => t.team.at(-1)?.dynamax)).toEqual([
      'gigantamax', 'dynamax', 'gigantamax', 'gigantamax', 'gigantamax', 'gigantamax', 'gigantamax',
    ])
    for (const trainer of [...galarGymTrainers, ...galarLeagueTrainers]) {
      expect(trainer.team.slice(0, -1).every(member => !member.dynamax)).toBe(true)
    }
  })

  it('gives Hop and Leon their story teams for all starter lines and their evolutions', () => {
    const [hop, leon] = [galarLeagueTrainers[1], galarLeagueTrainers[6]]
    const variants: Record<string, string[]> = {
      grass: ['inteleon', 'seismitoad', 'cinderace'],
      fire: ['rillaboom', 'mr-rime', 'inteleon'],
      water: ['cinderace', 'rhyperior', 'rillaboom'],
    }
    for (const starter of starterIds) {
      const [hopAce, leonPartner, leonStarter] = variants[species[starter].types[0]]
      let partner: string | undefined = starter
      while (partner) {
        const hopTeam = galarTrainerForStarter(hop, partner).team
        expect(hopTeam.slice(0, 4)).toEqual(hop.team.slice(0, 4))
        expect(hopTeam[4]).toEqual({ speciesId: hopAce, level: 49, dynamax: 'dynamax' })
        const leonTeam = galarTrainerForStarter(leon, partner).team
        expect(leonTeam.slice(0, 3)).toEqual(leon.team.slice(0, 3))
        expect(leonTeam.slice(3)).toEqual([
          { speciesId: leonPartner, level: 64 }, { speciesId: leonStarter, level: 64 },
          { speciesId: 'charizard', level: 65, dynamax: 'gigantamax' },
        ])
        partner = species[partner].evolvesTo?.speciesId
      }
    }
    expect(galarTrainerForStarter(hop, 'unknown')).toBe(hop)
    expect(galarTrainerForStarter(galarLeagueTrainers[0], 'scorbunny')).toBe(galarLeagueTrainers[0])
  })
})
