import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import type { RegionId } from './world'

export type FieldVenue = 'route' | 'forest' | 'coast' | 'city' | 'hideout' | 'cave' | 'ruins' | 'school' | 'arena' | 'desert' | 'volcano' | 'aether-lab' | 'ship'

export interface FieldTrainer extends KantoTrainer {
  readonly role: 'field'
  readonly kind: 'rival' | 'ally' | 'villain' | 'trainer'
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
    ['hiker', '등산가', 'rock-tunnel', 'cave', 2, 'trainer', 'game',
      [['geodude', 21], ['machop', 21], ['onix', 22]]],
    ['fisherman', '낚시꾼', 'route-12', 'coast', 4, 'trainer', 'game',
      [['goldeen', 24], ['poliwag', 24], ['shellder', 26]]],
  ]),
  johto: encounters('johto', [
    ['silver', '실버', 'cherrygrove-city', 'city', 0, 'rival', 'game', [['totodile', 5]]],
    ['eusine', '수호', 'cianwood-city', 'coast', 4, 'ally', 'game',
      [['drowzee', 23], ['haunter', 23], ['electrode', 27]]],
    ['ariana', '아테나', 'mahogany-town', 'hideout', 6, 'villain', 'game',
      [['arbok', 25], ['gloom', 25], ['murkrow', 27]]],
    ['archer', '아폴로', 'goldenrod-radio-tower', 'hideout', 7, 'villain', 'game',
      [['houndour', 35], ['koffing', 35], ['houndoom', 38]]],
    ['proton', '랜스', 'slowpoke-well', 'cave', 1, 'villain', 'game',
      [['zubat', 8], ['koffing', 12]]],
    ['kimono-girl', '전통무용수', 'ecruteak-city', 'arena', 3, 'trainer', 'game', [['espeon', 17]]],
  ]),
  hoenn: encounters('hoenn', [
    ['may', '봄이', 'route-103', 'route', 0, 'rival', 'game', [['torchic', 5]]],
    ['wally', '민진', 'mauville-city', 'city', 2, 'rival', 'game', [['ralts', 16]]],
    ['maxie', '마적', 'mt-chimney', 'volcano', 3, 'villain', 'game',
      [['mightyena', 24], ['zubat', 24], ['camerupt', 25]]],
    ['archie', '아강', 'seafloor-cavern', 'cave', 7, 'villain', 'game',
      [['mightyena', 41], ['crobat', 41], ['sharpedo', 43]]],
    ['tabitha', '호걸', 'meteor-falls', 'cave', 3, 'villain', 'game',
      [['poochyena', 19], ['numel', 21]]],
    ['shelly', '이연', 'route-119', 'route', 5, 'villain', 'game',
      [['carvanha', 28], ['mightyena', 30]]],
  ]),
  sinnoh: encounters('sinnoh', [
    ['barry', '용식', 'route-203', 'route', 0, 'rival', 'game', [['starly', 7], ['piplup', 9]]],
    ['cheryl', '모미', 'eterna-forest', 'forest', 1, 'ally', 'game', [['chansey', 15]]],
    ['riley', '현이', 'iron-island', 'cave', 5, 'ally', 'game', [['lucario', 34]]],
    ['cyrus', '태홍', 'spear-pillar', 'ruins', 7, 'villain', 'game',
      [['houndoom', 45], ['honchkrow', 46], ['crobat', 46], ['weavile', 48]]],
    ['mars', '마스', 'valley-windworks', 'hideout', 1, 'villain', 'game',
      [['zubat', 14], ['purugly', 16]]],
    ['dawn', '빛나', 'hearthome-city', 'arena', 2, 'ally', 'both',
      [['buneary', 22], ['pachirisu', 22], ['piplup', 24]]],
  ]),
  unova: encounters('unova', [
    ['hugh', '휴이', 'floccesy-ranch', 'route', 0, 'rival', 'game', [['tepig', 8]]],
    ['bianca', '벨', 'unova-route-4', 'desert', 3, 'rival', 'game',
      [['herdier', 18], ['munna', 18], ['dewott', 20]]],
    ['n', 'N', 'chargestone-cave', 'cave', 5, 'rival', 'game',
      [['boldore', 28], ['joltik', 28], ['ferroseed', 28], ['klink', 29]]],
    ['colress', '아크로마', 'plasma-frigate', 'hideout', 7, 'villain', 'game',
      [['magneton', 48], ['metang', 48], ['beheeyem', 48], ['klinklang', 50]]],
    ['cheren', '체렌', 'unova-route-5', 'route', 4, 'rival', 'game',
      [['liepard', 24], ['pansage', 24], ['pignite', 26]]],
    ['ghetsis', '게치스', 'giant-chasm', 'cave', 8, 'villain', 'game',
      [['cofagrigus', 50], ['drapion', 50], ['eelektross', 50], ['hydreigon', 52]]],
  ]),
  kalos: encounters('kalos', [
    ['shauna', '사나', 'aquacorde-town', 'city', 0, 'rival', 'game', [['chespin', 5]]],
    ['tierno', '티에르노', 'kalos-route-5', 'route', 1, 'ally', 'game', [['corphish', 12]]],
    ['serena', '세레나', 'anistar-city', 'city', 6, 'rival', 'game',
      [['meowstic', 41], ['absol', 42], ['greninja', 44]]],
    ['lysandre', '플라드리', 'team-flare-secret-hq', 'hideout', 7, 'villain', 'game',
      [['mienshao', 47], ['honchkrow', 47], ['gyarados', 50]]],
    ['trevor', '트로바', 'kalos-route-7', 'route', 1, 'ally', 'game',
      [['pikachu', 14], ['flabebe', 14]]],
    ['alain', '알랭', 'lumiose-city', 'arena', 7, 'rival', 'anime',
      [['tyranitar', 54], ['metagross', 55], ['bisharp', 55], ['charizard', 57]]],
  ]),
  alola: encounters('alola', [
    ['hau', '하우', 'iki-town', 'arena', 0, 'rival', 'game', [['pichu', 6], ['popplio', 7]]],
    ['gladion', '글라디오', 'alola-route-5', 'route', 2, 'rival', 'game',
      [['zubat', 17], ['type-null', 18]]],
    ['guzma', '구즈마', 'shady-house', 'hideout', 7, 'villain', 'game',
      [['ariados', 36], ['golisopod', 38]]],
    ['lusamine', '루자미네', 'aether-paradise', 'aether-lab', 8, 'villain', 'game',
      [['clefable', 41], ['lilligant', 41], ['bewear', 41], ['milotic', 42]]],
    ['ilima', '일리마', 'hauoli-city', 'city', 0, 'ally', 'game',
      [['yungoos', 9], ['smeargle', 10]]],
    ['plumeria', '플루메리', 'aether-house', 'hideout', 7, 'villain', 'game',
      [['golbat', 34], ['salazzle', 35]]],
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
    ['yell-grunt', '옐단 조무래기', 'galar-route-5', 'route', 1, 'villain', 'game',
      [['zigzagoon', 17], ['thievul', 18]]],
    ['oleana', '올리브', 'galar-rose-tower', 'hideout', 8, 'villain', 'game',
      [['froslass', 50], ['tsareena', 50], ['salazzle', 50], ['milotic', 50], ['garbodor', 52, { dynamax: 'gigantamax' }]]],
  ]),
  paldea: encounters('paldea', [
    ['nemona', '네모', 'cabo-poco', 'coast', 0, 'rival', 'game', [['quaxly', 5]]],
    ['giacomo', '피나', 'segin-squad', 'hideout', 2, 'villain', 'game', [['pawniard', 21]]],
    ['arven', '페퍼', 'asado-desert', 'desert', 4, 'ally', 'game', [['scovillain', 34]]],
    ['penny', '모란', 'naranja-academy', 'school', 7, 'ally', 'game',
      [['umbreon', 58], ['vaporeon', 58], ['jolteon', 58], ['sylveon', 60, { teraType: 'fairy' }]]],
    ['mela', '멜로코', 'schedar-squad', 'hideout', 2, 'villain', 'game', [['torkoal', 27]]],
    ['atticus', '추명', 'navi-squad', 'hideout', 4, 'villain', 'game',
      [['skuntank', 32], ['muk', 32], ['revavroom', 33]]],
  ]),
}

export const fieldTrainerById: Readonly<Record<string, FieldTrainer | undefined>> =
  Object.setPrototypeOf(Object.fromEntries(Object.values(fieldTrainersByRegion).flat().map(trainer => [trainer.id, trainer])), null)
