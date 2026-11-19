import { catalogItems, type CatalogItem } from './shopCatalog'
import { megaForms, type BattleGimmick } from './battleGimmicks'
import itemTraits from './shop-item-traits.json'

export type ShopEffectKind = 'heal' | 'revive' | 'attack' | 'defense' | 'speed' | 'focus' | 'type' | 'guardType' | 'experience' | 'capture'
export interface ShopItemEffect {
  kind: ShopEffectKind
  magnitude: number
  type?: string
  durationMs?: number
  description: string
  arenaDescription?: string
  gimmick?: BattleGimmick
  megaForm?: string
  megaForms?: readonly string[]
  users?: readonly string[]
}
type Rule = Omit<ShopItemEffect, 'description' | 'arenaDescription'>
const typeNames: Record<string, string> = {
  normal: '노말', fighting: '격투', flying: '비행', poison: '독', ground: '땅', rock: '바위', bug: '벌레',
  ghost: '고스트', steel: '강철', fire: '불꽃', water: '물', grass: '풀', electric: '전기', psychic: '에스퍼',
  ice: '얼음', dragon: '드래곤', dark: '악', fairy: '페어리',
}
const byId = new Map(catalogItems.map(item => [item.id, item]))
const rules = new Map<string, Rule>()
function rule(kind: ShopEffectKind, magnitude: number, seconds = 60, type?: string): Rule {
  const timed = kind !== 'heal' && kind !== 'revive' && kind !== 'capture'
  return { kind, magnitude, ...(timed && { durationMs: seconds * 1000 }), ...(type && { type }) }
}
function register(names: string, effect: Rule) {
  for (const name of names.split(' ')) rules.set(name, effect)
}

register('potion', rule('heal', .35))
register('super-potion', rule('heal', .7))
register('hyper-potion energy-root', rule('heal', .85))
register('max-potion full-restore', rule('heal', 1))
register('fresh-water berry-juice sweet-heart', rule('heal', .24))
register('soda-pop energy-powder', rule('heal', .36))
register('lemonade moomoo-milk', rule('heal', .5))
register('oran-berry', rule('heal', .18))
register('sitrus-berry enigma-berry', rule('heal', .25))
register('max-revive revival-herb sacred-ash max-honey', rule('revive', 1))
register('revive', rule('revive', .5))
register('leppa-berry ether hopo-berry', rule('focus', .22, 45))
register('max-ether elixir', rule('focus', .28, 60))
register('max-elixir', rule('focus', .35, 75))
register('liechi-berry petaya-berry jaboca-berry rowap-berry', rule('attack', .25, 45))
register('ganlon-berry apicot-berry kee-berry maranga-berry', rule('defense', .25, 45))
register('salac-berry', rule('speed', .30, 120))
register('micle-berry custap-berry lansat-berry starf-berry', rule('focus', .24, 45))
register('muscle-band wise-glasses', rule('attack', .15, 90))
register('choice-band choice-specs life-orb expert-belt weakness-policy booster-energy', rule('attack', .3, 75))
register('choice-scarf quick-claw float-stone air-balloon eject-button eject-pack heavy-duty-boots', rule('speed', .25, 75))
register('scope-lens zoom-lens wide-lens metronome loaded-dice razor-claw', rule('focus', .22, 75))
register('eviolite assault-vest rocky-helmet focus-sash focus-band protective-pads safety-goggles covert-cloak', rule('defense', .25, 75))
register('leftovers shell-bell black-sludge big-root', rule('heal', .20))

register('remedy rage-candy-bar', rule('heal', .35))
register('fine-remedy', rule('heal', .7))
register('superb-remedy', rule('heal', .85))
register('roto-hp-restore', rule('heal', 1))
register('mystery-berry roto-pp-restore', rule('focus', .30, 60))
register('berry', rule('heal', .18))
register('gold-berry', rule('heal', .25))
register('blue-flute red-flute yellow-flute poke-flute jubilife-muffin psncureberry przcureberry burnt-berry ice-berry bitter-berry mint-berry miracle-berry e-reader-pumkin-berry e-reader-drash-berry e-reader-eggant-berry', rule('defense', .20, 45))

const byType: Record<string, string> = {
  normal: 'silk-scarf chilan-berry',
  fire: 'charcoal flame-plate heat-rock flame-orb hearthflame-mask occa-berry',
  water: 'mystic-water splash-plate sea-incense wave-incense damp-rock wellspring-mask passho-berry',
  grass: 'miracle-seed meadow-plate rose-incense grassy-seed rindo-berry',
  electric: 'magnet zap-plate cell-battery electric-seed light-ball wacan-berry',
  ice: 'never-melt-ice icicle-plate icy-rock snowball yache-berry',
  fighting: 'black-belt fist-plate punching-glove chople-berry',
  poison: 'poison-barb toxic-plate toxic-orb kebia-berry',
  ground: 'soft-sand earth-plate smooth-rock shuca-berry',
  flying: 'sharp-beak sky-plate coba-berry',
  psychic: 'twisted-spoon mind-plate odd-incense psychic-seed soul-dew payapa-berry',
  bug: 'silver-powder insect-plate tanga-berry',
  rock: 'hard-stone stone-plate rock-incense cornerstone-mask charti-berry',
  ghost: 'spell-tag spooky-plate kasib-berry',
  dragon: 'dragon-fang draco-plate adamant-orb lustrous-orb haban-berry',
  dark: 'black-glasses dread-plate colbur-berry',
  steel: 'metal-coat iron-plate babiri-berry',
  fairy: 'fairy-feather pixie-plate misty-seed roseli-berry',
}
for (const [type, names] of Object.entries(byType)) {
  for (const slug of names.split(' ')) {
    const resist = slug.endsWith('-berry')
    rules.set(slug, rule(resist ? 'guardType' : 'type', resist ? .5 : .25, 60, type))
  }
}

const zTypes: Record<string, string> = {
  normalium: 'normal', firium: 'fire', waterium: 'water', electrium: 'electric', grassium: 'grass', icium: 'ice',
  fightinium: 'fighting', poisonium: 'poison', groundium: 'ground', flyinium: 'flying', psychium: 'psychic',
  buginium: 'bug', rockium: 'rock', ghostium: 'ghost', dragonium: 'dragon', darkinium: 'dark', steelium: 'steel', fairium: 'fairy',
  pikanium: 'electric', pikashunium: 'electric', aloraichium: 'electric', decidium: 'ghost', incinium: 'dark',
  primarium: 'water', tapunium: 'fairy', marshadium: 'ghost', snorlium: 'normal', eevium: 'normal', mewnium: 'psychic',
  kommonium: 'dragon', lunalium: 'ghost', solganium: 'steel', ultranecrozium: 'psychic', mimikium: 'fairy', lycanium: 'rock',
}
const stones: Record<string, string[]> = itemTraits.stones
const zUsers: Record<string, string[]> = itemTraits.zUsers
const categories: Record<CatalogItem['category'], Rule> = {
  balls: rule('capture', 1), medicine: rule('heal', .30), berries: rule('heal', .20),
  held: rule('defense', .16, 70), key: rule('focus', .14, 75), gimmicks: rule('attack', .22, 75),
}
function selectRule(item: CatalogItem): Rule {
  const { sourceCategory: group, category } = item
  const slug = item.slug.toLowerCase().replace(/--(held|bag)$/, '')
  const exact = rules.get(slug)
  if (exact) return exact
  const key = slug.replace(/[^a-z0-9]/g, '')
  const forms = stones[key]
  if (forms) {
    const available = forms.filter(id => Object.hasOwn(megaForms, id))
    const type = megaForms[available[0]]?.types[0]
    return { ...(type ? rule('type', .30, 90, type) : rule('attack', .22, 90)),
      ...(available.length > 0 && { gimmick: 'mega' as const, megaForm: available[0], megaForms: available }) }
  }
  const zType = zTypes[slug.split('-z')[0]]
  if (zType) return { ...rule('type', .32, 75, zType), gimmick: 'z', users: zUsers[key] }
  if (category === 'balls') {
    const ball = slug.replace(/^la(?=(poke|great|ultra|heavy|leaden|gigaton|feather|wing|jet|origin|strange)-ball)/, '')
    const boost: Record<string, number> = { 'master-ball': 255, 'origin-ball': 2.5, 'ultra-ball': 2, 'great-ball': 1.5, 'gigaton-ball': 2, 'jet-ball': 2, 'wing-ball': 1.5, 'leaden-ball': 1.5 }
    return rule('capture', boost[ball] ?? 1)
  }
  const typed = slug.split('-')[0]
  if (Object.hasOwn(typeNames, typed) && /-(gem|memory|tera-shard|feather|drive)$/.test(slug)) return rule('type', .26, 70, typed)
  if (/scope|lens/.test(slug)) return rule('focus', .20, 75)
  if (/armor|shield|helmet|shell/.test(slug)) return rule('defense', .22, 70)
  if (/fang|claw|blade/.test(slug)) return rule('attack', .20, 60)
  if (group === 'status-cures' || group === 'flutes') return rule('defense', .20, 45)
  if (group === 'pp-recovery') return rule('focus', .22, 60)
  if (group === 'revival') return rule('revive', .5)
  if (group === 'in-a-pinch') return rule('focus', .20, 40)
  if (group === 'picky-healing') return rule('heal', .33)
  return categories[category]
}

function describe(effect: Rule, slug: string): ShopItemEffect {
  const { kind, type } = effect
  const pct = Math.round(effect.magnitude * 100) + '%'
  const span = (effect.durationMs ?? 0) / 1000 + '초 동안 '
  const t = typeNames[type ?? '']
  const suffix = effect.gimmick ? ' 해당 지방에서 발동 조건을 충족하면 배틀 기믹도 발동합니다.' : ''
  let text: string
  let arena: string | undefined
  switch (kind) {
    case 'heal': text = '출전 포켓몬의 최대 HP의 ' + pct + '를 회복합니다.'; break
    case 'revive': text = '기절한 출전 포켓몬을 최대 HP의 ' + pct + '로 되살립니다.'; break
    case 'attack': text = span + '공격·특수공격이 ' + pct + ' 증가합니다.'; break
    case 'defense': text = span + '방어·특수방어가 ' + pct + ' 증가합니다.'; break
    case 'speed': text = span + '스피드와 이동 속도가 ' + pct + ' 증가합니다.'; break
    case 'focus':
      text = span + '기술 대기 시간과 자동 공격 간격이 ' + pct + ' 줄어듭니다.'
      arena = span + '기술 재사용 대기 시간이 ' + pct + ' 줄어듭니다.'
      break
    case 'type': text = span + t + ' 기술의 피해가 ' + pct + ', 다른 타입 기술의 피해가 5% 증가합니다.'; break
    case 'guardType': text = span + t + ' 기술로 받는 피해가 ' + pct + ', 다른 타입 피해가 5% 감소합니다.'; break
    case 'experience':
      text = span + '승리 경험치가 ' + pct + ' 증가하고 기술 대기 시간이 5% 줄어듭니다.'
      break
    case 'capture':
      text = ballDescriptions[slug] ?? '야생 상대에게 던집니다. 기본 포획 보정 ×' + effect.magnitude + '.'
      arena = '30초 동안 기술 재사용 대기 시간이 15% 줄어듭니다.'
      break
  }
  return { ...effect, description: text + suffix, ...((arena || effect.gimmick) && { arenaDescription: (arena ?? text) + (effect.gimmick ? ' 지방 기믹은 트레이너의 신호로 발동합니다.' : '') }) }
}
const ballDescriptions: Record<string, string> = {
  'master-ball': '잡을 수 있는 야생 포켓몬을 반드시 포획합니다.',
  'net-ball': '물·벌레 타입 야생 포켓몬의 포획 보정이 3.5배입니다.',
  'repeat-ball': '이미 잡은 종이면 포획 보정이 3.5배입니다.',
  'quick-ball': '야생전이 시작된 직후 던지면 포획 보정이 5배입니다.',
  'timer-ball': '야생전이 길어질수록 포획 보정이 최대 4배까지 증가합니다.',
  'nest-ball': '야생 포켓몬의 레벨이 낮을수록 잡기 쉽습니다.',
  'fast-ball': '스피드 종족값이 100 이상인 상대의 포획 보정이 4배입니다.',
  'moon-ball': '달의돌로 진화하는 상대의 포획 보정이 4배입니다.',
  'dusk-ball': '밤이나 던전의 야생 상대에게 포획 보정 3배를 받습니다.',
  'level-ball': '선두가 상대보다 높은 레벨이면 포획 보정이 최대 8배입니다.',
  'beast-ball': '울트라비스트에게 포획 보정 5배, 그 밖의 상대에게 0.1배를 받습니다.',
}
const cached = new Map<string, ShopItemEffect>()
export function shopItemEffect(itemId: string): ShopItemEffect {
  const known = cached.get(itemId)
  if (known) return known
  const item = byId.get(itemId)
  if (!item) throw Error('Unknown shop item: ' + itemId)
  const selected = selectRule(item)
  const effect = describe(selected, item.slug)
  cached.set(itemId, effect)
  return effect
}
