import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import type { RegionId } from './world'

export type FieldVenue = 'route' | 'forest' | 'coast' | 'city' | 'hideout' | 'cave' | 'ruins' | 'school' | 'arena' | 'desert' | 'volcano' | 'aether-lab' | 'ship'

export interface FieldTrainer extends KantoTrainer {
  readonly role: 'field'
  readonly kind: 'rival' | 'ally' | 'villain'
  readonly series: 'game' | 'anime' | 'both'
  readonly sprite: string
  readonly venue: FieldVenue
  readonly requiredBadges: number
}

type TeamSlot = readonly [speciesId: string, level: number, power?: Pick<KantoTrainerMember, 'teraType' | 'dynamax'>]
type Encounter = readonly [
  sprite: string, name: string, location: string, venue: FieldVenue, requiredBadges: number,
  kind: FieldTrainer['kind'], series: FieldTrainer['series'], roster: readonly TeamSlot[],
]

function encounters(region: RegionId, entries: readonly Encounter[]): readonly FieldTrainer[] {
  return entries.map(([sprite, name, locationId, venue, requiredBadges, kind, series, roster]) => ({
    id: 'field-' + region + '-' + sprite, role: 'field', sprite, name, locationId, venue, requiredBadges, kind, series,
    team: roster.map(([speciesId, level, power]) => ({ speciesId, level, ...power })),
  }))
}

// Parties are curated for the mapped place and point in this game's badge progression.
// See docs/field-trainers.md for the character and story references.
export const fieldTrainersByRegion: Readonly<Record<RegionId, readonly FieldTrainer[]>> = {
  kanto: encounters('kanto', [
    ['ash', '지우', 'viridian-forest', 'forest', 0, 'ally', 'anime',
      [['caterpie', 4], ['pikachu', 6]]],
    ['rocket-duo', '로사·로이', 'mt-moon', 'cave', 1, 'villain', 'both',
      [['ekans', 12], ['meowth', 12], ['koffing', 14]]],
    ['blue', '그린', 'ss-anne', 'ship', 2, 'rival', 'game',
      [['pidgeotto', 19], ['kadabra', 18], ['wartortle', 20]]],
    ['giovanni', '비주기', 'silph-co', 'hideout', 4, 'villain', 'both',
      [['nidorino', 37], ['kangaskhan', 35], ['rhyhorn', 37], ['nidoqueen', 41]]],
  ]),
  johto: encounters('johto', [
    ['silver', '실버', 'cherrygrove-city', 'city', 0, 'rival', 'game', [['totodile', 5]]],
    ['eusine', '수호', 'cianwood-city', 'coast', 4, 'ally', 'game',
      [['drowzee', 23], ['haunter', 23], ['electrode', 27]]],
    ['ariana', '아테나', 'mahogany-town', 'hideout', 6, 'villain', 'game',
      [['arbok', 25], ['gloom', 25], ['murkrow', 27]]],
    ['archer', '아폴로', 'goldenrod-radio-tower', 'hideout', 7, 'villain', 'game',
      [['houndour', 35], ['koffing', 35], ['houndoom', 38]]],
  ]),
  hoenn: encounters('hoenn', [
    ['may', '봄이', 'route-103', 'route', 0, 'rival', 'game', [['torchic', 5]]],
    ['wally', '민진', 'mauville-city', 'city', 2, 'rival', 'game', [['ralts', 16]]],
    ['maxie', '마적', 'mt-chimney', 'volcano', 3, 'villain', 'game',
      [['mightyena', 24], ['zubat', 24], ['camerupt', 25]]],
    ['archie', '아강', 'seafloor-cavern', 'cave', 7, 'villain', 'game',
      [['mightyena', 41], ['crobat', 41], ['sharpedo', 43]]],
  ]),
  sinnoh: encounters('sinnoh', [
    ['barry', '용식', 'route-203', 'route', 0, 'rival', 'game', [['starly', 7], ['piplup', 9]]],
    ['cheryl', '모미', 'eterna-forest', 'forest', 1, 'ally', 'game', [['chansey', 15]]],
    ['riley', '현이', 'iron-island', 'cave', 5, 'ally', 'game', [['lucario', 34]]],
    ['cyrus', '태홍', 'spear-pillar', 'ruins', 7, 'villain', 'game',
      [['houndoom', 45], ['honchkrow', 46], ['crobat', 46], ['weavile', 48]]],
  ]),
  unova: encounters('unova', [
    ['hugh', '휴이', 'floccesy-ranch', 'route', 0, 'rival', 'game', [['tepig', 8]]],
    ['bianca', '벨', 'unova-route-4', 'desert', 3, 'rival', 'game',
      [['herdier', 18], ['munna', 18], ['dewott', 20]]],
    ['n', 'N', 'chargestone-cave', 'cave', 5, 'rival', 'game',
      [['boldore', 28], ['joltik', 28], ['ferroseed', 28], ['klink', 29]]],
    ['colress', '아크로마', 'plasma-frigate', 'hideout', 7, 'villain', 'game',
      [['magneton', 48], ['metang', 48], ['beheeyem', 48], ['klinklang', 50]]],
  ]),
  kalos: encounters('kalos', [
    ['shauna', '사나', 'aquacorde-town', 'city', 0, 'rival', 'game', [['chespin', 5]]],
    ['tierno', '티에르노', 'kalos-route-5', 'route', 1, 'ally', 'game', [['corphish', 12]]],
    ['serena', '세레나', 'anistar-city', 'city', 6, 'rival', 'game',
      [['meowstic', 41], ['absol', 42], ['greninja', 44]]],
    ['lysandre', '플라드리', 'team-flare-secret-hq', 'hideout', 7, 'villain', 'game',
      [['mienshao', 47], ['honchkrow', 47], ['gyarados', 50]]],
  ]),
  alola: encounters('alola', [
    ['hau', '하우', 'iki-town', 'arena', 0, 'rival', 'game', [['pichu', 6], ['popplio', 7]]],
    ['gladion', '글라디오', 'alola-route-5', 'route', 2, 'rival', 'game',
      [['zubat', 17], ['type-null', 18]]],
    ['guzma', '구즈마', 'shady-house', 'hideout', 7, 'villain', 'game',
      [['ariados', 36], ['golisopod', 38]]],
    ['lusamine', '루자미네', 'aether-paradise', 'aether-lab', 8, 'villain', 'game',
      [['clefable', 41], ['lilligant', 41], ['bewear', 41], ['milotic', 42]]],
  ]),
  galar: encounters('galar', [
    ['hop', '호브', 'galar-route-2', 'route', 0, 'rival', 'game',
      [['wooloo', 6], ['rookidee', 5], ['sobble', 8]]],
    ['bede', '비트', 'galar-mine', 'cave', 0, 'rival', 'game',
      [['solosis', 13], ['gothita', 15], ['hatenna', 16]]],
    ['marnie', '마리', 'outer-spikemuth', 'city', 6, 'rival', 'game',
      [['liepard', 40], ['toxicroak', 40], ['scrafty', 40], ['morpeko', 44]]],
    ['rose', '로즈', 'energy-plant', 'hideout', 8, 'villain', 'game',
      [['escavalier', 55], ['ferrothorn', 55], ['perrserker', 55], ['klinklang', 57]]],
  ]),
  paldea: encounters('paldea', [
    ['nemona', '네모', 'cabo-poco', 'coast', 0, 'rival', 'game', [['quaxly', 5]]],
    ['giacomo', '피나', 'segin-squad', 'hideout', 2, 'villain', 'game', [['pawniard', 21]]],
    ['arven', '페퍼', 'asado-desert', 'desert', 4, 'ally', 'game', [['scovillain', 34]]],
    ['penny', '모란', 'naranja-academy', 'school', 7, 'ally', 'game',
      [['umbreon', 58], ['vaporeon', 58], ['jolteon', 58], ['sylveon', 60, { teraType: 'fairy' }]]],
  ]),
}

export const fieldTrainerById: Readonly<Record<string, FieldTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(Object.values(fieldTrainersByRegion).flat().map(trainer => [trainer.id, trainer])), null)
