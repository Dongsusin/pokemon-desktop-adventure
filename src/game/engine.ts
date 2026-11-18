import { species, starterIds, wildIds } from './catalog'
import { collectionItems, fieldItems, itemEvolution } from './collectionItems'
import { RESEARCH_VISIT_CHANCE } from './regions/collectionEncounters'
import { isSpeciesMotionSupported, isMoveMotionSupported } from './motionEligibility'
import { supportedEncounters, supportedWildForms } from './regions/motionEncounters'
import { arenaCastTouches, arenaDistance, arenaMoveProfile, beamRounds, castDuration, createArenaCast, fullBeamMultiplier, type ArenaCast, type ArenaSpriteRefs } from './arenaMoves'
import { arenaBodyPoint } from './arenaMuzzle'
import { beamClashPower, escapeBeamClash } from './arenaBeams'
import { arenaStepMs, beginArenaCast, clearArenaCasts, createArena, dodgeArena, moveArena, restoreArena, stepArena,
  type ArenaFeedback, type TrainerArena } from './trainerArena'
import { battleForm, formStats, locationForm, validForm, wildEncounterForm } from './forms'
import type { KantoEncounter, KantoLocation, LegendaryEncounter } from './regions/kanto'
import { singleTypeEffectiveness, teraAttackMultiplier } from './regions/paldeaTera'
import { paldeaWildForms } from './regions/paldea-encounters'
import { getGalarWeatherEncounters, isGalarWildEncounter } from './regions/galar-encounters'
import { captureRates } from './catchRates'
import type { KantoTrainer, KantoTrainerMember } from './regions/kantoCampaign'
import { isRegionId, regionOrder, worldRegions, type RegionId, type WorldRegion } from './regions/world'

export interface Stats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface Species {
  id: string
  pokedexNumber: number
  generation: number
  nameKo: string
  types: string[]
  baseStats: Stats
  evolvesTo?: { speciesId: string; minLevel: number }
}

export interface Position { x: number; y: number }
export interface Bounds { width: number; height: number }
export const DYNAMAX_PARTNER_SCALE = 1.4
export const DYNAMAX_OPPONENT_SCALE = 1.48
type Direction = -1 | 1

export const activityLabels = {
  IDLE: '대기',
  WANDER: '산책 중',
  SEARCH: '야생 포켓몬 발견',
  CHASE: '접근 중',
  BATTLE: '전투 중',
  LOOT: '전리품 수집',
  RECOVER: '휴식 중',
  FAINT: '쓰러짐',
  EVOLUTION: '진화 중',
  PAUSED: '일시 정지',
}
export type Activity = keyof typeof activityLabels

const ballMultipliers = { pokeball: 1, greatBall: 1.5, ultraBall: 2 }
export type CaptureBallId = keyof typeof ballMultipliers
export const captureBallIds = Object.keys(ballMultipliers) as CaptureBallId[]

export interface Settings {
  autoCaptureBall: CaptureBallId | null
  sound: boolean
  fps: 15 | 30
  overlayVisible: boolean
  alwaysOnTop: boolean
  autoHeal: boolean
  autoEvolve: boolean
  spriteScale: number
  spawnRate: number
  effects: boolean
  hud: boolean
  startOnLogin: boolean
  notifications: boolean
  exploration: 'cautious' | 'balanced' | 'bold'
}

export const defaultSettings: Settings = {
  autoCaptureBall: null,
  sound: false,
  fps: 30,
  overlayVisible: true,
  alwaysOnTop: true,
  autoHeal: true,
  autoEvolve: true,
  spriteScale: 1,
  spawnRate: 1,
  effects: true,
  hud: false,
  startOnLogin: false,
  notifications: false,
  exploration: 'balanced',
}

export interface Move {
  id: string
  nameKo: string
  type: string
  power: number
  category: 'physical' | 'special' | 'healing'
  unlockLevel: number
  cooldownMs: number
}

function move(id: string, nameKo: string, type: string, power: number, category: Move['category'], unlockLevel = 5, cooldownMs = 0): Move {
  return { id, nameKo, type, power, category, unlockLevel, cooldownMs }
}

export const moves: Record<string, Move> = {
  tackle: move('tackle', '몸통박치기', 'normal', 40, 'physical', 1),
  vineWhip: move('vineWhip', '덩굴채찍', 'grass', 55, 'physical'),
  ember: move('ember', '불꽃세례', 'fire', 55, 'special'),
  waterGun: move('waterGun', '물대포', 'water', 55, 'special'),
  razorLeaf: move('razorLeaf', '잎날가르기', 'grass', 78, 'physical', 13, 2700),
  flameCharge: move('flameCharge', '니트로차지', 'fire', 78, 'physical', 13, 2700),
  waterPulse: move('waterPulse', '물의파동', 'water', 78, 'special', 13, 2700),
  recover: move('recover', '기운 되찾기', 'normal', 35, 'healing', 25, 7100),
  scratch: move('scratch', '할퀴기', 'normal', 29, 'physical'),
  bugBite: move('bugBite', '벌레먹기', 'bug', 29, 'physical'),
  gust: move('gust', '바람일으키기', 'flying', 29, 'special'),
}
const moveSets: Record<string, string[]> = {
  grass: ['tackle', 'vineWhip', 'razorLeaf', 'recover'],
  fire: ['tackle', 'ember', 'flameCharge', 'recover'],
  water: ['tackle', 'waterGun', 'waterPulse', 'recover'],
}

export interface Item {
  id: string
  nameKo: string
  description: string
  kind: 'recovery' | 'capture' | 'equipment' | 'boost' | 'material' | 'evolution' | 'fossil'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  symbol: string
  heal?: number
  attack?: number
  defense?: number
  exp?: number
  recovery?: number
  drop?: number
  speed?: number
  boostMs?: number
}

function item(id: string, nameKo: string, description: string, kind: Item['kind'], rarity: Item['rarity'], symbol: string, bonuses: Partial<Item> = {}): Item {
  return { id, nameKo, description, kind, rarity, symbol, ...bonuses }
}

export const items: Record<string, Item> = {
  potion: item('potion', '상처약', '최대 HP의 35%를 회복해요.', 'recovery', 'common', '+', { heal: 0.35 }),
  superPotion: item('superPotion', '좋은상처약', '최대 HP의 70%를 회복해요.', 'recovery', 'uncommon', '+', { heal: 0.7 }),
  pokeball: item('pokeball', '몬스터볼', '전투 중 야생 포켓몬을 잡을 때 사용해요.', 'capture', 'common', '●'),
  greatBall: item('greatBall', '수퍼볼', '몬스터볼보다 포획 확률이 높아요.', 'capture', 'uncommon', '●'),
  ultraBall: item('ultraBall', '하이퍼볼', '수퍼볼보다 포획 확률이 높아요.', 'capture', 'rare', '●'),
  muscleBand: item('muscleBand', '힘의머리띠', '공격과 특수공격이 8% 증가해요.', 'equipment', 'uncommon', '▲', { attack: 0.08 }),
  guardCharm: item('guardCharm', '진화의휘석', '방어와 특수방어가 8% 증가해요.', 'equipment', 'uncommon', '◆', { defense: 0.08 }),
  luckyEgg: item('luckyEgg', '행복의알', '전투 경험치가 12% 증가해요.', 'equipment', 'rare', '○', { exp: 0.12 }),
  soothingBell: item('soothingBell', '평온의방울', '휴식 중 HP 회복량이 25% 증가해요.', 'equipment', 'rare', '◇', { recovery: 0.25 }),
  explorerBadge: item('explorerBadge', '부적금화', '전리품 확률이 15%p 증가해요.', 'equipment', 'epic', '★', { drop: 0.15 }),
  swiftBerry: item('swiftBerry', '캄라열매', '2분 동안 이동 속도가 30% 증가해요.', 'boost', 'common', '»', { speed: 0.3, boostMs: 120000 }),
  trailStone: item('trailStone', '딱딱한돌', '야생 포켓몬에게서 얻는 수집 재료예요.', 'material', 'common', '◇'),
}
const dropPools: Record<Item['rarity'], Item[]> = {
  common: Object.values(items).filter((entry) => entry.rarity === 'common'),
  uncommon: Object.values(items).filter((entry) => entry.rarity === 'uncommon'),
  rare: Object.values(items).filter((entry) => entry.rarity === 'rare'),
  epic: Object.values(items).filter((entry) => entry.rarity === 'epic'),
}

// Field supplies have named excavation sites and stay outside the ordinary drop pools.
for (const [id, data] of Object.entries(collectionItems)) {
  items[id] = item(id, data.name, data.fossil ? '지정 연구소에서 포켓몬으로 복원해요.' : '조건에 맞는 선두 포켓몬을 진화시켜요.',
    data.fossil ? 'fossil' : 'evolution', 'rare', '◇')
}

export interface Player {
  formId?: string
  /** Exact full-level HP on entering a regionally capped lead slot. */
  uncappedHP?: number
  roamSeed?: number
  instanceId: string
  speciesId: string
  level: number
  exp: number
  currentHP: number
  moveIds: string[]
  heldItemId: string | null
  state: Activity
  position: Position
  direction: Direction
}

export interface PartyPokemon {
  exp?: number
  moveIds?: string[]
  heldItemId?: string | null
  cooldowns?: Record<string, number>
  boostUntil?: number
  formId?: string
  instanceId: string
  speciesId: string
  level: number
  currentHP: number
  position: Position
  direction: Direction
  state: 'IDLE' | 'WANDER'
  active: boolean
  destination: Position | null
  restMs: number
  roamSeed: number
}

export type PokemonBox = (PartyPokemon | null)[]

export interface Wild {
  teraType?: string
  abilityId?: KantoTrainerMember['abilityId']
  dynamax?: 'dynamax' | 'gigantamax'
  maxActionsLeft?: number
  formId?: string
  id: number
  trainerId?: string
  expiresAt?: number
  speciesId: string
  level: number
  currentHP: number
  maxHP: number
  position: Position
  direction: Direction
}

export interface GameLog {
  id: number
  at: number
  kind: 'battle' | 'loot' | 'level' | 'evolution' | 'recovery' | 'offline' | 'capture' | 'travel'
  text: string
}

export interface Effect {
  moveId?: string
  formId?: string
  id: number
  kind: 'damage' | 'attack' | 'loot' | 'reward' | 'level' | 'evolution' | 'heal' | 'pickup' | 'defeat' | 'capture' | 'travel'
  position: Position
  target?: Position
  text?: string
  moveType?: string
  actor?: 'partner' | number
  targetActor?: 'partner' | number
  itemId?: string
  fromFormId?: string
  toFormId?: string
  fromSpeciesId?: string
  toSpeciesId?: string
  speciesId?: string
  captured?: boolean
  caughtInstanceId?: string
  remainingMs: number
  durationMs: number
}

interface Drop {
  itemId: string
  position: Position
}

interface Runtime {
  captureIn: number
  autoCaptureTargetId: number | null
  clock: number
  rngState: number
  encounterSeed: number
  nextId: number
  spawnIn: number
  stateIn: number
  targetId: number | null
  destination: Position | null
  turn: 'player' | 'wild'
  drop: Drop | null
  cooldowns: Record<string, number>
  pausedState: Activity
  boostUntil: number
  evolutionFromForm?: string
  evolutionFrom: string | null
}

interface TrainerBattle {
  arena: TrainerArena
  trainerId: string
  opponentIndex: number
}

export interface RegionProgress {
  finaleWon?: true
  badges: string[]
  champion: boolean
}

export interface Campaign extends RegionProgress {
  leagueIndex: number | null
  eliteWins?: string[]
  battle: TrainerBattle | null
}

const SAVE_SCHEMA_VERSION = 16
const LEGACY_LOCATION_ID = 'route-1'
export const KANTO_LEGENDARY_ENCOUNTER_CHANCE = 0.0065

export interface GameSave {
  schemaVersion: typeof SAVE_SCHEMA_VERSION
  selectedSlot: number
  regionId: RegionId
  locationId: string
  campaign: Campaign
  regionProgress: Partial<Record<RegionId, RegionProgress>>
  starterSpeciesId: string
  player: Player
  followers: PartyPokemon[]
  boxes: PokemonBox[]
  inventory: Record<string, number>
  pokedexSeen: string[]
  pokedexCaught: string[]
  coins: number
  autoBattle: boolean
  settings: Settings
  lastSavedAt: string
  wild: Wild[]
  history: GameLog[]
  effects: Effect[]
  wins: number
  losses: number
  runtime: Runtime
}

export type ArenaAction =
  | { type: 'arena-move'; x: number; y: number }
  | { type: 'arena-skill'; slot: number }
  | { type: 'arena-switch'; instanceId: string }
  | { type: 'arena-pause'; paused: boolean }
  | { type: 'arena-dodge' }
  | { type: 'arena-surrender' }

export type ShopPurchase = {
  type: 'buyItem'
  itemId: string
  quantity: number
  expectedOwned: number
}

export type GameAction =
  | ShopPurchase
  | ArenaAction
  | { type: 'travel'; locationId: string }
  | { type: 'transfer-region'; regionId: RegionId }
  | { type: 'challenge-gym' }
  | { type: 'challenge-finale' }
  | { type: 'challenge-league'; trainerId?: string }
  | { type: 'set-auto-battle'; value: boolean }
  | { type: 'update-settings'; settings: Partial<Settings> }
  | { type: 'use-item'; itemId: string }
  | { type: 'equip-item'; itemId: string | null }
  | { type: 'take-box-item'; instanceId: string }
  | { type: 'set-moves'; moveIds: string[] }
  | { type: 'throw-ball'; itemId: string }
  | { type: 'set-follower-active'; instanceId: string; active: boolean; boxIndex?: number }
  | { type: 'move-party-member'; instanceId: string; toIndex: number }
  | { type: 'swap-box-pokemon'; partyInstanceId: string; boxInstanceId: string }
  | { type: 'evolve' }

export interface OfflineReward { minutes: number; exp: number; coins: number }

export const MAX_PARTY_SIZE = 6
export const BOX_SIZE = 30
const STARTER_BALLS = 8
const CAPTURE_MS = 2200
const AUTO_CAPTURE_HP = 0.35
const MAX_LEVEL = 100
const MAX_INVENTORY_SLOTS = 100
const MAX_HISTORY = 100
const MAX_WILD = 2
const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000
const INITIAL_SPAWN_MS = 5000
const TURN_MS = 730
const TRAINER_HEALTH_MULTIPLIER = 0.82
const RECOVERY_MS = 680
const EVOLUTION_MS = 3200
const BATTLE_RANGE = 75
export const LOOT_RANGE = 21
const SEARCH_RANGE = 460

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function advanceSeed(seed: number): number {
  return (Math.imul(1664525, seed) + 1013904223) >>> 0
}

function random(game: GameSave): number {
  game.runtime.rngState = advanceSeed(game.runtime.rngState)
  return game.runtime.rngState / 4294967296
}

function randomBetween(game: GameSave, min: number, max: number): number {
  return min + (max - min) * random(game)
}

export function requiredExp(level: number): number {
  return level >= MAX_LEVEL ? 0 : Math.round(20 + Math.pow(Math.max(1, level), 1.7) * 4)
}

export function statsFor(speciesId: string, level: number, heldItemId?: string | null, formId?: string): Stats {
  return scaleStats(formStats(speciesId, formId).baseStats, level, heldItemId)
}

function scaleStats(base: Stats, level: number, heldItemId?: string | null): Stats {
  const gear = heldItemId ? items[heldItemId] : undefined
  const attack = 1 + (gear?.attack ?? 0)
  const defense = 1 + (gear?.defense ?? 0)
  const scale = (value: number, multiplier = 1) => Math.round((8 + value * (0.28 + level * 0.022)) * multiplier)
  return {
    hp: Math.round(17 + level * 1.65 + base.hp * (0.22 + level * 0.026)),
    attack: scale(base.attack, attack),
    defense: scale(base.defense, defense),
    spAttack: scale(base.spAttack, attack),
    spDefense: scale(base.spDefense, defense),
    speed: scale(base.speed),
  }
}

function encounterStats(speciesId: string, level: number, formId?: string): Stats {
  // At low levels, encounters with fully evolved and legendary Pokémon stay winnable.
  const cap = 62 + Math.floor(level * 0.68)
  const { hp, attack, defense, spAttack, spDefense, speed } = formStats(speciesId, formId).baseStats
  return scaleStats({
    hp: Math.min(hp, cap), attack: Math.min(attack, cap), defense: Math.min(defense, cap),
    spAttack: Math.min(spAttack, cap), spDefense: Math.min(spDefense, cap), speed: Math.min(speed, cap)
  }, level)
}

function opponentStats(game: GameSave, wild: Wild): Stats {
  const stats = encounterStats(wild.speciesId, wild.level, battleForm(wild))
  const aura = wild.trainerId && worldRegions[game.regionId].trainerById[wild.trainerId]?.totemAura
  if (aura) {
    for (const stat of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const) {
      if (aura.stat === 'all' || aura.stat === stat) stats[stat] = Math.floor(stats[stat] * (2 + aura.stages) / 2)
    }
  }
  return stats
}

function encounterMaxHP(speciesId: string, level: number, formId?: string): number {
  return Math.max(8, Math.round(encounterStats(speciesId, level, formId).hp * 0.48))
}

export function movesFor(speciesId: string, level: number, formId?: string): Move[] {
  const types = formStats(speciesId, formId).types
  const technique = types.map(type => wildTechniques[type]).find(Boolean)
  const ids = moveSets[types[0]] ?? (technique ? ['tackle', technique.id, 'recover'] : ['tackle', 'recover'])
  return ids.map((id) => moves[id]).filter((entry) => level >= entry.unlockLevel && isMoveMotionSupported(speciesId, formId, entry.id))
}

export function typeMultiplier(moveType: string, defenderTypes: readonly string[]): number {
  return defenderTypes.reduce((factor, type) => factor * singleTypeEffectiveness(moveType, type), 1)
}

export function calculateDamage(attackMove: Move, attacker: Stats, defender: Stats, level: number, defenderTypes: string[], variance = 1): number {
  return damageWithMultiplier(attackMove, attacker, defender, level, typeMultiplier(attackMove.type, defenderTypes), variance)
}

function damageWithMultiplier(attackMove: Move, attacker: Stats, defender: Stats, level: number, multiplier: number, variance = 1): number {
  const special = attackMove.category === 'special'
  const offense = special ? attacker.spAttack : attacker.attack
  const defense = special ? defender.spDefense : defender.defense
  const base = Math.max(1, Math.floor((attackMove.power * offense / Math.max(1, defense)) * (1 + level / 50) / 10))
  return multiplier === 0 ? 0 : Math.max(1, Math.floor(base * multiplier * variance))
}

function bounded(position: Position, bounds: Bounds, scale: number): Position {
  const width = Math.max(0, bounds.width)
  const height = Math.max(0, bounds.height)
  // Sprites use their feet as the origin and need space above their position.
  const sideMargin = Math.min(24 + Math.ceil(57 * scale), width / 2)
  const topMargin = Math.min(24 + Math.ceil(70 * scale), height / 2)
  const bottomMargin = Math.min(24 + Math.ceil(12 * scale), height / 2)
  return { x: clamp(position.x, sideMargin, width - sideMargin), y: clamp(position.y, topMargin, height - bottomMargin) }
}

function home(bounds: Bounds, scale: number): Position {
  return bounded({ x: bounds.width * 0.56, y: bounds.height * 0.75 }, bounds, scale)
}

function newRuntime(now: number, seed: number): Runtime {
  return {
    captureIn: 0,
    autoCaptureTargetId: null,
    clock: now,
    rngState: seed >>> 0,
    encounterSeed: seed >>> 0,
    nextId: 1,
    spawnIn: INITIAL_SPAWN_MS,
    stateIn: 700,
    targetId: null,
    destination: null,
    turn: 'player',
    drop: null,
    cooldowns: {},
    pausedState: 'IDLE',
    boostUntil: 0,
    evolutionFrom: null,
  }
}

export function createGame(speciesId: string, slot: number, bounds: Bounds, now = Date.now(), seed = Math.floor(Math.random() * 4294967296)): GameSave {
  if (!starterIds.includes(speciesId) || !isSpeciesMotionSupported(speciesId)) throw new RangeError('선택할 수 없는 스타팅 포켓몬입니다.')
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new RangeError('저장 슬롯은 1~3 사이여야 합니다.')
  const speciesIdPart = species[speciesId].pokedexNumber.toString(16)
  const instanceId = [now.toString(36), seed.toString(36), speciesIdPart, slot].join('-')
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    selectedSlot: slot,
    regionId: 'kanto',
    locationId: worldRegions.kanto.startLocationId,
    campaign: newCampaign(),
    regionProgress: {},
    starterSpeciesId: speciesId,
    player: {
      instanceId,
      speciesId,
      level: 5,
      exp: 0,
      currentHP: statsFor(speciesId, 5).hp,
      moveIds: movesFor(speciesId, 5).map((entry) => entry.id),
      heldItemId: null,
      state: 'IDLE',
      position: home(bounds, defaultSettings.spriteScale),
      direction: 1,
    },
    followers: [],
    boxes: [emptyBox()],
    inventory: { potion: 5, pokeball: STARTER_BALLS },
    pokedexSeen: [speciesId],
    pokedexCaught: [speciesId],
    coins: 0,
    autoBattle: true,
    settings: { ...defaultSettings },
    lastSavedAt: new Date(now).toISOString(),
    wild: [],
    history: [],
    effects: [],
    wins: 0,
    losses: 0,
    runtime: newRuntime(now, seed),
  }
}

function transition(game: GameSave, state: Activity, stateIn = 0): void {
  game.player.state = state
  game.runtime.stateIn = stateIn
}

function addLog(game: GameSave, kind: GameLog['kind'], text: string): void {
  game.history.unshift({ id: game.runtime.nextId++, at: game.runtime.clock, kind, text })
  if (game.history.length > MAX_HISTORY) game.history.length = MAX_HISTORY
}

type EffectDetail = Omit<Effect, 'id' | 'kind' | 'position' | 'durationMs' | 'remainingMs'>

function addEffect(game: GameSave, kind: Effect['kind'], position: Position, durationMs: number, detail: EffectDetail = {}): void {
  if (!game.settings.effects) return
  game.effects.push({
    id: game.runtime.nextId++,
    kind,
    position: { ...position },
    durationMs,
    remainingMs: durationMs,
    ...detail,
  })
}

function addUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value)
}

export function levelCap(game: GameSave): number {
  return worldRegions[game.regionId].levelCaps[game.campaign.badges.length]
}

export function effectiveLevel(game: GameSave, level = game.player.level): number {
  return Math.min(level, levelCap(game))
}

export function playerStats(game: GameSave): Stats {
  const stats = statsFor(game.player.speciesId, effectiveLevel(game), game.player.heldItemId, game.player.formId)
  if (game.wild[0]?.maxActionsLeft) stats.hp = dynamaxHP(stats.hp)
  return stats
}

export const shopStock = [
  { itemId: 'pokeball', price: 20, badges: 0 },
  { itemId: 'greatBall', price: 50, badges: 2 },
  { itemId: 'ultraBall', price: 100, badges: 4 },
  { itemId: 'potion', price: 30, badges: 0 },
  { itemId: 'superPotion', price: 75, badges: 2 },
] as const

export function hasShop(game: GameSave): boolean {
  const place = worldRegions[game.regionId].locationById[game.locationId]
  return place?.kind === 'town' || place?.kind === 'city'
}

export function shopPurchaseLimit(game: GameSave, offer: typeof shopStock[number]): number {
  if (!hasShop(game) || game.campaign.battle || game.campaign.badges.length < offer.badges) return 0
  const owned = game.inventory[offer.itemId] ?? 0
  if (!owned && Object.keys(game.inventory).length >= MAX_INVENTORY_SLOTS) return 0
  return Math.min(Math.floor(game.coins / offer.price), Number.MAX_SAFE_INTEGER - owned)
}

function buyItem(game: GameSave, order: ShopPurchase): boolean {
  const offer = shopStock.find(entry => entry.itemId === order.itemId)
  if (!offer || !Number.isSafeInteger(order.quantity) || order.quantity < 1 ||
      order.quantity > shopPurchaseLimit(game, offer)) return false
  const owned = game.inventory[offer.itemId] ?? 0
  // Two clicks on the same displayed stock count must only charge once.
  if (owned !== order.expectedOwned) return false
  const cost = order.quantity * offer.price
  game.coins -= cost
  game.inventory[offer.itemId] = owned + order.quantity
  addLog(game, 'loot', items[offer.itemId].nameKo + ' ' + order.quantity + '개 구매 · −' + cost + ' 코인')
  return true
}

/** Owned copies available to the lead, including its currently equipped copy. */
export function availableEquipment(game: GameSave, itemId: string): number {
  let available = game.inventory[itemId] ?? 0
  for (const group of [game.followers, ...game.boxes]) {
    for (const pokemon of group) if (pokemon?.heldItemId === itemId) available--
  }
  return Math.max(0, available)
}

function equipped(game: GameSave): Item | undefined {
  const id = game.player.heldItemId
  return id ? items[id] : undefined
}

function heal(game: GameSave, amount: number): number {
  const before = game.player.currentHP
  game.player.currentHP = Math.min(playerStats(game).hp, before + amount)
  return game.player.currentHP - before
}

export function canUseCollectionItem(game: GameSave, itemId: string) {
  if (game.campaign.battle || game.player.currentHP <= 0 || !game.inventory[itemId] ||
      !Object.hasOwn(collectionItems, itemId)) return false
  if (!['IDLE', 'WANDER', 'RECOVER'].includes(activeState(game))) return false
  const fossil = collectionItems[itemId].fossil
  return fossil ? game.locationId === fossil.lab && isSpeciesMotionSupported(fossil.speciesId)
    : Boolean(itemEvolution(itemId, game.player.speciesId, game.player.formId))
}

function consume(game: GameSave, itemId: string): boolean {
  const count = game.inventory[itemId] ?? 0
  const entry = items[itemId]
  if (count <= 0 || !entry || game.player.currentHP <= 0) return false

  if (entry.kind === 'evolution' || entry.kind === 'fossil') {
    if (!canUseCollectionItem(game, itemId)) return false
    const fossil = collectionItems[itemId].fossil
    if (fossil) {
      const result = receivePokemon(game, fossil.speciesId, undefined, 20, game.player.position, game.player.direction)
      const message = entry.nameKo + ' 복원 · ' + species[fossil.speciesId].nameKo + ' Lv.20 · ' + result.destination
      addLog(game, 'capture', message)
      addEffect(game, 'reward', game.player.position, 1800, { text: message, actor: 'partner' })
    } else {
      performEvolution(game, itemEvolution(itemId, game.player.speciesId, game.player.formId)!)
      game.runtime.pausedState = 'IDLE'
    }
  } else if (entry.heal) {
    const amount = heal(game, Math.ceil(playerStats(game).hp * entry.heal))
    if (amount <= 0) return false
    addEffect(game, 'heal', game.player.position, 900, { text: '+' + amount + ' HP' })
    addLog(game, 'recovery', entry.nameKo + '으로 HP ' + amount + ' 회복')
  } else if (entry.boostMs) {
    game.runtime.boostUntil = game.runtime.clock + entry.boostMs
    addEffect(game, 'reward', game.player.position, 1100, { text: '이동 속도 증가' })
  } else {
    return false
  }

  spendItem(game, itemId)
  return true
}

function spendItem(game: GameSave, itemId: string): void {
  const count = game.inventory[itemId]
  if (count === 1) delete game.inventory[itemId]
  else game.inventory[itemId] = count - 1
}

function addExperience(game: GameSave, amount: number): number {
  const player = game.player
  const cap = levelCap(game)
  if (amount <= 0 || player.level >= cap) return 0

  const initialLevel = player.level
  const previousHP = playerStats(game).hp
  let remaining = amount
  while (remaining > 0 && player.level < cap) {
    const threshold = requiredExp(player.level)
    const gained = Math.min(remaining, threshold - player.exp)
    player.exp += gained
    remaining -= gained
    if (player.exp === threshold) {
      player.exp = 0
      player.level++
    }
  }

  if (player.level > initialLevel) {
    const learnedBefore = new Set(movesFor(player.speciesId, initialLevel, player.formId).map((entry) => entry.id))
    const learned = movesFor(player.speciesId, player.level, player.formId).filter((entry) => !learnedBefore.has(entry.id))
    player.moveIds = [...player.moveIds, ...learned.map((entry) => entry.id)].slice(0, 4)
    if (player.currentHP > 0) heal(game, playerStats(game).hp - previousHP)
    addEffect(game, 'level', player.position, 1700, { text: 'Lv.' + player.level })
    addLog(game, 'level', species[player.speciesId].nameKo + ' Lv.' + initialLevel + ' → Lv.' + player.level)
  }
  return amount - remaining
}

type Evolution = { speciesId: string; minLevel: number; formId?: string }

// These regional lines have different level evolutions from their standard species.
const regionalLevelEvolutions: Record<string, Evolution | null> = {
  'wooper-paldea': { speciesId: 'clodsire', minLevel: 20 },
  'meowth-galar': { speciesId: 'perrserker', minLevel: 28 },
  'corsola-galar': { speciesId: 'cursola', minLevel: 38 },
  'mr-mime-galar': { speciesId: 'mr-rime', minLevel: 42 },
  'meowth-alola': null, 'sandshrew-alola': null, 'darumaka-galar': null, 'yamask-galar': null,
}

function levelEvolution(speciesId: string, formId?: string): Evolution | undefined {
  if (formId && Object.hasOwn(regionalLevelEvolutions, formId)) return regionalLevelEvolutions[formId] ?? undefined
  const rule = species[speciesId].evolvesTo
  if (!rule || !formId) return rule
  const nextForm = validForm(rule.speciesId, rule.speciesId + formId.slice(speciesId.length))
  return nextForm ? { ...rule, formId: nextForm } : rule
}

export function evolutionFor(speciesId: string, formId?: string): Evolution | undefined {
  const rule = levelEvolution(speciesId, formId)
  return rule && isSpeciesMotionSupported(speciesId, formId) && isSpeciesMotionSupported(rule.speciesId, rule.formId) ? rule : undefined
}

export function canEvolve(game: GameSave): boolean {
  const player = game.player
  const rule = evolutionFor(player.speciesId, player.formId)
  return Boolean(rule && effectiveLevel(game) >= rule.minLevel && player.currentHP > 0)
}

function evolve(game: GameSave): boolean {
  if (!canEvolve(game)) return false
  return performEvolution(game, evolutionFor(game.player.speciesId, game.player.formId)!)
}

function performEvolution(game: GameSave, next: { speciesId: string; formId?: string }): boolean {
  const player = game.player
  const previous = species[player.speciesId]
  const previousHP = playerStats(game).hp
  game.runtime.evolutionFromForm = player.formId
  player.speciesId = next.speciesId
  player.formId = next.formId
  delete player.uncappedHP
  const availableMoves = movesFor(player.speciesId, player.level, player.formId).map((entry) => entry.id)
  player.moveIds = player.moveIds.filter((id) => availableMoves.includes(id))
  if (!player.moveIds.length) player.moveIds = availableMoves
  player.currentHP = clamp(player.currentHP + playerStats(game).hp - previousHP, 1, playerStats(game).hp)
  addUnique(game.pokedexSeen, player.speciesId)
  addUnique(game.pokedexCaught, player.speciesId)
  game.runtime.evolutionFrom = previous.id
  evolutionEffect(game, previous.id)
  addLog(game, 'evolution', previous.nameKo + ' → ' + species[player.speciesId].nameKo + ' 진화')
  transition(game, 'EVOLUTION', EVOLUTION_MS)
  return true
}

function evolutionEffect(game: GameSave, fromSpeciesId: string, remainingMs = EVOLUTION_MS): void {
  if (!game.settings.effects || remainingMs <= 0) return
  const toSpeciesId = game.player.speciesId
  addEffect(game, 'evolution', game.player.position, EVOLUTION_MS, {
    actor: 'partner', fromSpeciesId, toSpeciesId, fromFormId: game.runtime.evolutionFromForm, toFormId: game.player.formId, text: species[toSpeciesId].nameKo + '!'
  })
  game.effects[game.effects.length - 1].remainingMs = remainingMs
}

function moveToward(game: GameSave, to: Position, speed: number, elapsed: number, radius: number): boolean {
  const boost = game.runtime.boostUntil > game.runtime.clock ? (items.swiftBerry.speed ?? 0) : 0
  return moveActorToward(game.player, to, speed * (1 + boost), elapsed, radius)
}

function moveActorToward(actor: Pick<Player, 'position' | 'direction'>, to: Position, speed: number, elapsed: number, radius: number): boolean {
  const current = actor.position
  const dx = to.x - current.x
  const dy = to.y - current.y
  const distance = Math.hypot(dx, dy)
  if (distance <= radius) return true
  const step = Math.min(distance - radius, speed * elapsed / 1000)
  actor.position = { x: current.x + dx / distance * step, y: current.y + dy / distance * step }
  if (Math.abs(dx) > 1) actor.direction = dx < 0 ? -1 : 1
  return distance - step <= radius
}

function findTarget(game: GameSave): Wild | undefined {
  return game.wild.find((wild) => wild.id === game.runtime.targetId)
}

function isCaptureBallId(id: unknown): id is CaptureBallId {
  return typeof id === 'string' && hasKey(ballMultipliers, id)
}

export function captureChance(wild: Wild, itemId: CaptureBallId): number {
  const baseRate = captureRates[species[wild.speciesId].pokedexNumber - 1]
  const speciesChance = 0.1 + 0.75 * Math.sqrt(baseRate / 255)
  const hpRatio = clamp(wild.currentHP / wild.maxHP, 0, 1)
  return clamp(speciesChance * (1 - 0.65 * hpRatio) * ballMultipliers[itemId], 0.04, 0.98)
}

function captureTarget(game: GameSave): Wild | undefined {
  if (!game.autoBattle || game.player.state !== 'BATTLE' || game.runtime.captureIn > 0) return
  const target = findTarget(game)
  return target && !target.trainerId && target.currentHP > 0 && isSpeciesMotionSupported(target.speciesId, target.formId) &&
    isSpeciesMotionSupported(target.speciesId, target.formId === 'wishiwashi-school' ? undefined : target.formId) ? target : undefined
}

export function canThrowBall(game: GameSave, itemId: string): boolean {
  return isCaptureBallId(itemId) && (game.inventory[itemId] ?? 0) > 0 && Boolean(captureTarget(game))
}

function emptyBox(): PokemonBox {
  return Array<PartyPokemon | null>(BOX_SIZE).fill(null)
}

// Occupied slots stay in place when a different Pokémon leaves the box.
function storeInBox(boxes: PokemonBox[], pokemon: PartyPokemon, preferred?: number): number | undefined {
  const firstFree = preferred === undefined ? boxes.findIndex(box => box.includes(null)) : preferred
  const index = preferred === undefined && firstFree < 0 ? boxes.length : firstFree
  if (!Number.isInteger(index) || index < 0 || index > boxes.length) return
  const box = boxes[index] ?? emptyBox()
  const slot = box.indexOf(null)
  if (slot < 0) return
  box[slot] = pokemon
  boxes[index] = box
  return index
}

function findBoxSlot(boxes: PokemonBox[], id: string) {
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index]
    const slot = box.findIndex(pokemon => pokemon?.instanceId === id)
    if (slot >= 0) return { index, box, slot, pokemon: box[slot]! }
  }
}

function setRoaming(pokemon: PartyPokemon, active: boolean) {
  pokemon.active = active
  pokemon.state = 'IDLE'
  pokemon.destination = null
  pokemon.restMs = active ? 350 : 0
}

export function canChangeLead(game: GameSave): boolean {
  const state = activeState(game)
  return !game.campaign.battle && game.runtime.captureIn <= 0 &&
    (state === 'IDLE' || state === 'WANDER' || state === 'RECOVER')
}

function leadAsMember(game: GameSave, active: boolean): PartyPokemon {
  const { instanceId, speciesId, formId, level, exp, moveIds, heldItemId, currentHP, position, direction, uncappedHP } = game.player
  const fullHP = statsFor(speciesId, level, heldItemId, formId).hp
  const maxHP = playerStats(game).hp
  // Keep the precise stored HP if a temporarily capped lead has not taken damage.
  const storedHP = uncappedHP !== undefined && resizeHP(uncappedHP, fullHP, maxHP) === currentHP
    ? uncappedHP : Math.floor(currentHP * fullHP / maxHP)
  const cooldowns = Object.fromEntries(Object.entries(game.runtime.cooldowns).filter(([, until]) => until > game.runtime.clock))
  return {
    instanceId, speciesId, ...(formId && { formId }), level, exp, moveIds, heldItemId, currentHP: storedHP,
    position, direction, active, state: 'IDLE', destination: null, restMs: active ? 350 : 0,
    roamSeed: game.player.roamSeed ?? (game.runtime.encounterSeed ^ species[speciesId].pokedexNumber) >>> 0,
    ...(Object.keys(cooldowns).length && { cooldowns }),
    ...(game.runtime.boostUntil > game.runtime.clock && { boostUntil: game.runtime.boostUntil }),
  }
}

function installLead(game: GameSave, member: PartyPokemon): void {
  const { instanceId, speciesId, formId, level, exp, moveIds, heldItemId, position, direction } = member
  const fullHP = statsFor(speciesId, level, heldItemId, formId).hp
  const cappedHP = statsFor(speciesId, effectiveLevel(game, level), heldItemId, formId).hp
  const maxHP = game.wild[0]?.maxActionsLeft ? dynamaxHP(cappedHP) : cappedHP
  const currentHP = resizeHP(member.currentHP, fullHP, maxHP)
  const state = currentHP > 0 ? 'IDLE' : 'RECOVER'
  game.player = {
    instanceId, speciesId, ...(formId && { formId }), level, exp: exp ?? 0,
    moveIds: equippedMoves(moveIds, speciesId, level, formId), heldItemId: heldItemId ?? null,
    currentHP, ...(fullHP !== maxHP && { uncappedHP: member.currentHP }), position, direction, roamSeed: member.roamSeed,
    state: state === 'RECOVER' && !game.autoBattle ? 'PAUSED' : state,
  }
  const runtime = game.runtime
  runtime.pausedState = state
  runtime.targetId = null
  runtime.destination = null
  runtime.stateIn = 350
  runtime.turn = 'player'
  runtime.cooldowns = member.cooldowns ?? {}
  runtime.boostUntil = member.boostUntil ?? 0
  runtime.evolutionFrom = null
  delete runtime.evolutionFromForm
  game.effects = game.effects.filter(effect => effect.actor !== 'partner' && effect.targetActor !== 'partner')
}

function movePartyMember(game: GameSave, instanceId: string, toIndex: number): boolean {
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex > game.followers.length) return false
  const fromIndex = [game.player, ...game.followers].findIndex(member => member.instanceId === instanceId)
  if (fromIndex < 0) return false
  const selected = fromIndex ? game.followers[fromIndex - 1] : game.player
  if (!isSpeciesMotionSupported(selected.speciesId, selected.formId)) return false
  if (fromIndex === 0 && toIndex > 0 && !isSpeciesMotionSupported(game.followers[0].speciesId, game.followers[0].formId)) return false
  if (fromIndex === toIndex) return true
  if (fromIndex > 0 && toIndex > 0) {
    const [member] = game.followers.splice(fromIndex - 1, 1)
    game.followers.splice(toIndex - 1, 0, member)
    return true
  }
  if (!canChangeLead(game)) return false
  const oldLead = leadAsMember(game, true)
  const [nextLead] = game.followers.splice(Math.max(0, fromIndex - 1), 1)
  game.followers.splice(Math.max(0, toIndex - 1), 0, oldLead)
  installLead(game, nextLead)
  return true
}

function setFollowerActive(game: GameSave, instanceId: string, active: boolean, boxIndex?: number): boolean {
  if (game.player.instanceId === instanceId) {
    if (active) return true
    if (!game.followers.length || !canChangeLead(game) || !isSpeciesMotionSupported(game.followers[0].speciesId, game.followers[0].formId)) return false
    if (storeInBox(game.boxes, leadAsMember(game, false), boxIndex) === undefined) return false
    installLead(game, game.followers.shift()!)
    return true
  }
  const partyIndex = game.followers.findIndex(pokemon => pokemon.instanceId === instanceId)
  if (partyIndex < 0) {
    const stored = findBoxSlot(game.boxes, instanceId)
    if (!stored) return false
    if (!active) return boxIndex === undefined || boxIndex === stored.index
    if (game.followers.length >= MAX_PARTY_SIZE - 1 || !isSpeciesMotionSupported(stored.pokemon.speciesId, stored.pokemon.formId)) return false
    stored.box[stored.slot] = null
    setRoaming(stored.pokemon, true)
    game.followers.push(stored.pokemon)
    return true
  }
  if (active) return true
  const pokemon = game.followers[partyIndex]
  if (storeInBox(game.boxes, pokemon, boxIndex) === undefined) return false
  setRoaming(pokemon, false)
  game.followers.splice(partyIndex, 1)
  return true
}

function swapBoxPokemon(game: GameSave, partyId: string, boxId: string): boolean {
  const partyIndex = game.followers.findIndex(pokemon => pokemon.instanceId === partyId)
  const isLead = partyId === game.player.instanceId
  if (isLead ? !canChangeLead(game) : partyIndex < 0) return false
  const stored = findBoxSlot(game.boxes, boxId)
  if (!stored || !isSpeciesMotionSupported(stored.pokemon.speciesId, stored.pokemon.formId)) return false
  if (isLead) {
    stored.box[stored.slot] = leadAsMember(game, false)
    installLead(game, stored.pokemon)
    return true
  }
  const outgoing = game.followers[partyIndex]
  setRoaming(outgoing, false)
  setRoaming(stored.pokemon, true)
  stored.box[stored.slot] = outgoing
  game.followers[partyIndex] = stored.pokemon
  return true
}

function arenaNotice(game: GameSave, arena: TrainerArena, notice: Omit<ArenaFeedback, 'id'>): void {
  arena.feedback = { ...notice, id: game.runtime.nextId++ }
}

function spriteRefs(id: string, formId: string | undefined, foe: Wild): ArenaSpriteRefs {
  return {
    player: { dex: species[id].pokedexNumber, formId, dynamax: Boolean(foe.maxActionsLeft) },
    enemy: { dex: species[foe.speciesId].pokedexNumber, formId: battleForm(foe), dynamax: Boolean(foe.maxActionsLeft) },
  }
}

export function arenaSpriteRefs(game: GameSave, foe = findTarget(game)): ArenaSpriteRefs {
  return foe ? spriteRefs(game.player.speciesId, game.player.formId, foe) : {}
}

export function arenaSkills(game: GameSave) {
  const arena = game.campaign.battle?.arena
  const target = game.wild.find(enemy => enemy.id === game.runtime.targetId)
  if (!arena || !target) return []
  const casting = arena.casts.find(cast => cast.side === 'player')
  const refs = arenaSpriteRefs(game, target)
  return game.player.moveIds.filter(id => isMoveMotionSupported(game.player.speciesId, game.player.formId, id)).map(id => {
    const move = moves[id]
    const profile = arenaMoveProfile(move)
    const range = profile.range
    const preview = createArenaCast(0, 'player', move, arena.player, arena.enemy, refs)
    return {
      move, range, profile, preview,
      cooldownMs: Math.max(arena.skillLockMs, casting ? castDuration(casting) - casting.elapsedMs : 0, (game.runtime.cooldowns[id] ?? 0) - game.runtime.clock, 0),
      unlocked: move.unlockLevel <= effectiveLevel(game),
      inRange: arenaCastTouches(preview, 0, castDuration(preview), arena.enemy, arena.enemy),
    }
  })
}

function arenaSwitch(game: GameSave, arena: TrainerArena, target: Wild, id: string): boolean {
  if ((arena.paused && !arena.needsSwitch) || arena.switchCooldownMs > 0) return false
  const index = game.followers.findIndex(member => member.instanceId === id && member.currentHP > 0)
  if (index < 0) return false
  const incoming = game.followers[index]
  if (!isSpeciesMotionSupported(incoming.speciesId, incoming.formId)) return false
  const position = { ...game.player.position }
  game.followers[index] = leadAsMember(game, true)
  installLead(game, incoming)
  game.player.position = position
  game.runtime.targetId = target.id
  game.runtime.pausedState = 'BATTLE'
  transition(game, 'BATTLE')
  escapeBeamClash(arena)
  arena.casts = arena.casts.filter(cast => cast.side === 'enemy')
  // The incoming Pokémon can have a different silhouette and body height.
  const incomingBody = arenaSpriteRefs(game, target).player!
  for (const incomingCast of arena.casts) {
    if (incomingCast.victimOffset) {
      const body = arenaBodyPoint(arena.player, incomingBody)
      incomingCast.victimOffset = { x: body.x - arena.player.x, y: body.y - arena.player.y }
    }
  }
  arena.dodgeMs = arena.invulnerableMs = 0
  addUnique(arena.participants, id)
  arena.direction = { x: 0, y: 0 }
  arena.switchCooldownMs = 1450
  arena.skillLockMs = 350
  if (arena.needsSwitch) arena.enemyInMs = 850
  arena.needsSwitch = false
  arenaNotice(game, arena, { actor: 'player', kind: 'switch', text: species[incoming.speciesId].nameKo + ' 출전!' })
  return true
}

function restoreTrainerParty(game: GameSave, arena: TrainerArena, healParticipants: boolean): void {
  if (healParticipants) {
    heal(game, playerStats(game).hp)
    for (const member of game.followers) {
      if (arena.participants.includes(member.instanceId)) {
        member.currentHP = statsFor(member.speciesId, member.level, member.heldItemId, member.formId).hp
      }
    }
  }
  const first = arena.partyOrder[0]
  if (first !== game.player.instanceId) {
    const index = game.followers.findIndex(member => member.instanceId === first)
    if (index >= 0) {
      const openingLead = game.followers[index]
      game.followers[index] = leadAsMember(game, true)
      installLead(game, openingLead)
    }
  }
  game.followers.sort((a, b) => arena.partyOrder.indexOf(a.instanceId) - arena.partyOrder.indexOf(b.instanceId))
}

function handleArenaAction(game: GameSave, action: ArenaAction): boolean {
  const arena = game.campaign.battle?.arena
  const target = findTarget(game)
  if (!arena || !target?.trainerId) return false
  switch (action.type) {
    case 'arena-pause':
      if (typeof action.paused !== 'boolean') return false
      arena.paused = action.paused
      arena.direction = { x: 0, y: 0 }
      return true
    case 'arena-surrender': {
      const trainer = currentTrainer(game)
      if (!trainer) return false
      trainerDefeat(game, trainer, true)
      return true
    }
    case 'arena-move':
      return moveArena(arena, action.x, action.y)
    case 'arena-switch':
      return arenaSwitch(game, arena, target, action.instanceId)
    case 'arena-dodge':
      if (!dodgeArena(arena)) return false
      arenaNotice(game, arena, { actor: 'player', kind: 'dodge', text: '회피' })
      return true
    case 'arena-skill': {
      if (arena.paused || arena.needsSwitch || arena.dodgeMs > 0 || !Number.isInteger(action.slot)) return false
      const skill = arenaSkills(game)[action.slot]
      if (!skill?.unlocked || skill.cooldownMs > 0) return false
      if (skill.move.category === 'healing' && game.player.currentHP >= playerStats(game).hp) return false
      const cast = beginArenaCast(arena, 'player', skill.move, arenaSpriteRefs(game, target))
      arena.skillLockMs = castDuration(cast)
      game.runtime.cooldowns[skill.move.id] = game.runtime.clock + Math.max(620, skill.move.cooldownMs)
      return true
    }
  }
}

function updateTrainerArena(game: GameSave, elapsed: number): void {
  const arena = game.campaign.battle!.arena
  const opponent = findTarget(game)
  if (!opponent || arena.paused || arena.needsSwitch) return
  game.runtime.clock += elapsed
  const skills = trainerTechniques(opponent)
  // A committed cast keeps its own technique through movement, switches and beam clashes.
  const castMove = (cast: ArenaCast) => cast.side === 'enemy'
    ? skills.find(move => move.id === cast.moveId) ?? moves[cast.moveId] : moves[cast.moveId]
  const committed = arena.casts.find(cast => cast.side === 'enemy')
  const selected = committed ? castMove(committed) : chooseTrainerMove(game, opponent, arena, skills)
  const boost = game.runtime.boostUntil > game.runtime.clock ? 1.3 : 1
  const playerSpeed = Math.min(0.33, 0.23 + playerStats(game).speed / 1200) * boost
  const enemySpeed = Math.min(0.28, 0.17 + opponentStats(game, opponent).speed / 1100)
  const refs = arenaSpriteRefs(game, opponent)
  const outcome = arena.lastClash
  const wasDynamaxed = Boolean(opponent.maxActionsLeft)
  const impacts = stepArena(arena, elapsed, playerSpeed, enemySpeed, selected, refs, (a, b) => {
    const strength = (cast: ArenaCast, other: ArenaCast) => {
      const player = cast.side === 'player'
      const move = castMove(cast)
      const stats = player ? playerStats(game) : opponentStats(game, opponent)
      const level = player ? effectiveLevel(game) : opponent.level
      const types = player ? formStats(game.player.speciesId, game.player.formId).types : formStats(opponent.speciesId, battleForm(opponent)).types
      const offense = move.category === 'physical' ? stats.attack : stats.spAttack
      return beamClashPower(level, offense, move.power, types.includes(move.type), move.type, other.moveType)
    }
    return strength(a, b) / strength(b, a)
  })
  if (arena.lastClash && arena.lastClash !== outcome) {
    const end = arena.lastClash
    arenaNotice(game, arena, { actor: end.winner ?? 'system',
      kind: end.outcome === 'draw' ? 'clash-draw' : end.outcome === 'escape' ? 'clash-break' : 'clash-win',
      text: end.outcome === 'draw' ? '두 빔이 상쇄됐다!' : end.outcome === 'escape' ? '힘겨루기가 풀렸다!' : end.winner === 'player' ? '밀어냈다!' : '밀렸다!',
      position: end.point })
  }
  for (const { cast, hit, position, beamShare, silent } of impacts) {
    if (game.campaign.battle?.arena !== arena || arena.needsSwitch || findTarget(game) !== opponent) break
    if (wasDynamaxed && !opponent.maxActionsLeft) break
    const playerTurn = cast.side === 'player'
    if (hit) attack(game, opponent, { playerTurn, move: castMove(cast), cast, position, beamShare })
    else {
      if (!cast.beam?.spent) spendMaxAction(game, opponent)
      if (cast.beam) cast.beam.spent = true
      if (silent) continue
      arenaNotice(game, arena, { actor: cast.side, kind: 'miss', text: cast.moveName + ' · 빗나감',
        moveType: cast.moveType, castId: cast.id, moveId: cast.moveId, position })
    }
  }
}

function receivePokemon(game: GameSave, speciesId: string, formId: string | undefined, level: number, position: Position, direction: Direction) {
  const sequence = game.runtime.nextId++
  const active = game.followers.length < MAX_PARTY_SIZE - 1
  const pokemon: PartyPokemon = {
    instanceId: 'caught-' + sequence, speciesId, ...(formId && { formId }), level,
    currentHP: scaleStats(formStats(speciesId, formId).baseStats, level).hp,
    position: { ...position }, direction, state: 'IDLE', active, destination: null, restMs: CAPTURE_MS,
    roamSeed: (game.runtime.encounterSeed ^ Math.imul(sequence, 0x9e3779b9)) >>> 0,
  }
  let destination = '파티 합류'
  if (active) game.followers.push(pokemon)
  else destination = '박스 ' + (storeInBox(game.boxes, pokemon)! + 1) + '에 보관'
  addUnique(game.pokedexSeen, speciesId)
  addUnique(game.pokedexCaught, speciesId)
  return { instanceId: pokemon.instanceId, destination }
}

function throwBall(game: GameSave, itemId: CaptureBallId): boolean {
  const wild = captureTarget(game)
  if (!wild || (game.inventory[itemId] ?? 0) <= 0) return false

  spendItem(game, itemId)
  const captured = random(game) < captureChance(wild, itemId)
  const speciesName = species[wild.speciesId].nameKo
  game.runtime.captureIn = CAPTURE_MS
  faceTarget(game, wild)

  let caughtInstanceId: string | undefined
  let text = speciesName + ' 포획 실패'
  if (captured) {
    const formId = wild.formId === 'wishiwashi-school' ? undefined : wild.formId
    const received = receivePokemon(game, wild.speciesId, formId, wild.level, wild.position, wild.direction)
    caughtInstanceId = received.instanceId
    text = speciesName + ' 포획 성공 · ' + received.destination
    game.wild = game.wild.filter((entry) => entry.id !== wild.id)
    game.runtime.targetId = null
    game.runtime.destination = null
    transition(game, 'RECOVER', CAPTURE_MS)
  } else {
    game.runtime.turn = 'wild'
    game.runtime.stateIn = CAPTURE_MS
  }

  addLog(game, 'capture', items[itemId].nameKo + ' · ' + text)
  addEffect(game, 'capture', game.player.position, CAPTURE_MS, {
    actor: 'partner', targetActor: wild.id, target: { ...wild.position }, itemId,
    speciesId: wild.speciesId, formId: battleForm(wild), captured, caughtInstanceId, text,
  })
  return true
}

const wildSpecies = new Set(wildIds)

function readLocation(region: WorldRegion, id: unknown): KantoLocation | undefined {
  return typeof id === 'string' && hasKey(region.locationById, id) ? region.locationById[id] : undefined
}

export function eligibleLegends(location: KantoLocation, partnerId: string, champion: boolean, badgeCount = 0): readonly LegendaryEncounter[] {
  const starterType = species[partnerId].types[0]
  return location.legends?.filter(entry => (!entry.starterType || entry.starterType === starterType) &&
    (!entry.championOnly || champion) && (champion || badgeCount >= (entry.minBadges ?? 0))) ?? []
}

function encounterLevelLimit(game: GameSave): number {
  return effectiveLevel(game) + { cautious: -1, balanced: 1, bold: 3 }[game.settings.exploration]
}

function weightedEncounter<T extends { weight: number }>(game: GameSave, choices: readonly T[]): T | undefined {
  if (!choices.length) return
  const total = choices.reduce((sum, entry) => sum + entry.weight, 0)
  let draw = random(game) * total
  return choices.find((entry) => (draw -= entry.weight) < 0)
}

type WeatherPool = NonNullable<ReturnType<typeof getGalarWeatherEncounters>>
const playableWeather = new WeakMap<WeatherPool, WeatherPool>()

export function regionalWeather(game: GameSave, locationId: string, date = new Date()) {
  if (game.regionId !== 'galar') return
  const forecast = getGalarWeatherEncounters(locationId, date, game.campaign.badges.length, game.campaign.champion)
  if (!forecast) return
  const cached = playableWeather.get(forecast)
  if (cached) return cached
  const filtered = { ...forecast, encounters: supportedEncounters('galar', locationId, forecast.encounters) }
  playableWeather.set(forecast, filtered)
  return filtered
}

function nextEncounter(game: GameSave, location: KantoLocation): KantoEncounter | undefined {
  const legends = eligibleLegends(location, game.starterSpeciesId, game.campaign.champion, game.campaign.badges.length)
  if (legends.length && random(game) < KANTO_LEGENDARY_ENCOUNTER_CHANCE) {
    const rare = weightedEncounter(game, legends)
    if (rare && !game.wild.some((entry) => entry.speciesId === rare.speciesId)) return rare
  }
  if (game.campaign.champion && location.visitors?.length && random(game) < RESEARCH_VISIT_CHANCE) {
    return weightedEncounter(game, location.visitors)
  }
  return weightedEncounter(game, regionalWeather(game, location.id)?.encounters ?? location.encounters)
}

function spawn(game: GameSave, bounds: Bounds, location: KantoLocation): void {
  const encounter = nextEncounter(game, location)
  if (!encounter) return
  const { speciesId: wildId, level } = encounter
  const distance = randomBetween(game, 95, 220)
  const angle = randomBetween(game, 0, 2 * Math.PI)
  const { x, y } = game.player.position
  const position = bounded({ x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance }, bounds, game.settings.spriteScale)
  const forms = supportedWildForms(game.regionId, location.id, wildId, level)
  if (!forms.length) return
  const formId = forms.length === 1 ? forms[0].formId : weightedEncounter(game, forms)?.formId
  const maxHP = encounterMaxHP(wildId, level, formId)
  game.wild.push({
    id: game.runtime.nextId++,
    expiresAt: game.runtime.clock + 90000,
    ...(formId && { formId }),
    speciesId: wildId,
    level,
    currentHP: maxHP,
    maxHP,
    position,
    direction: position.x < x ? 1 : -1,
  })
  addUnique(game.pokedexSeen, wildId)
}

function canHunt(game: GameSave, speciesId: string, formId?: string): boolean {
  const defenderTypes = formStats(speciesId, formId).types
  const level = effectiveLevel(game)
  // A temporarily cooling-down attack can still finish the encounter.
  return game.player.moveIds.some(id => {
    const move = moves[id]
    return move && move.category !== 'healing' && move.unlockLevel <= level &&
      isMoveMotionSupported(game.player.speciesId, game.player.formId, id) && typeMultiplier(move.type, defenderTypes) > 0
  })
}

function chooseTarget(game: GameSave): Wild | undefined {
  const position = game.player.position
  const levelLimit = encounterLevelLimit(game)
  const legends = worldRegions[game.regionId].locationById[game.locationId].legends
  let target: Wild | undefined
  let closest = SEARCH_RANGE
  for (const wild of game.wild) {
    if (wild.level > levelLimit || !isSpeciesMotionSupported(wild.speciesId, wild.formId) || !canHunt(game, wild.speciesId, battleForm(wild))) continue
    const distance = Math.hypot(wild.position.x - position.x, wild.position.y - position.y)
    if (distance < SEARCH_RANGE && legends?.some((slot) => slot.speciesId === wild.speciesId)) return wild
    if (distance < closest) {
      closest = distance
      target = wild
    }
  }
  return target
}

function matchup(game: GameSave, wild: Wild, move: Move, playerTurn: boolean) {
  const playerTypes = formStats(game.player.speciesId, game.player.formId).types
  const enemyTypes = formStats(wild.speciesId, battleForm(wild)).types
  if (!wild.teraType) return typeMultiplier(move.type, playerTurn ? enemyTypes : playerTypes)
  const partnerTera = playerTypes[0]
  return playerTurn ? teraAttackMultiplier(move.type, playerTypes, partnerTera, wild.teraType, wild.abilityId)
    : teraAttackMultiplier(move.type, enemyTypes, wild.teraType, partnerTera)
}

function chooseMove(game: GameSave, wild: Wild): Move {
  const level = effectiveLevel(game)
  const attacker = playerStats(game)
  const defender = opponentStats(game, wild)
  let best = moves.tackle
  let bestScore = -1
  for (const id of game.player.moveIds) {
    if (!isMoveMotionSupported(game.player.speciesId, game.player.formId, id) || (game.runtime.cooldowns[id] ?? 0) > game.runtime.clock) continue
    const candidate = moves[id]
    if (candidate.unlockLevel > level) continue
    if (candidate.category === 'healing') {
      if (!wild.maxActionsLeft && game.player.currentHP < attacker.hp * 0.4) return candidate
      continue
    }
    const score = damageWithMultiplier(candidate, attacker, defender, level, matchup(game, wild, candidate, true))
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

function faceTarget(game: GameSave, wild: Wild): void {
  game.player.direction = game.player.position.x <= wild.position.x ? 1 : -1
  wild.direction = game.player.direction === 1 ? -1 : 1
}

const wildTechniques: Record<string, Move> = {
  bug: moves.bugBite,
  flying: moves.gust,
  grass: { ...moves.vineWhip, power: 29 },
  fire: { ...moves.ember, power: 29 },
  water: { ...moves.waterGun, power: 29 },
  fighting: move('lowKick', '안다리걸기', 'fighting', 29, 'physical'),
  poison: move('poisonSting', '독침', 'poison', 29, 'physical'),
  ground: move('mudShot', '머드숏', 'ground', 29, 'special'),
  rock: move('rockThrow', '돌떨구기', 'rock', 29, 'physical'),
  ghost: move('shadowSneak', '야습', 'ghost', 29, 'physical'),
  steel: move('metalClaw', '메탈클로', 'steel', 29, 'physical'),
  electric: move('thunderShock', '전기쇼크', 'electric', 29, 'special'),
  psychic: move('confusion', '염동력', 'psychic', 29, 'special'),
  ice: move('iceShard', '얼음뭉치', 'ice', 29, 'physical'),
  dragon: move('dragonBreath', '용의숨결', 'dragon', 29, 'special'),
  dark: move('bite', '물기', 'dark', 29, 'physical'),
  fairy: move('fairyWind', '요정의바람', 'fairy', 29, 'special'),
}

for (const technique of Object.values(wildTechniques)) {
  moves[technique.id] ??= technique
}

function wildMove(wild: Wild): Move {
  const formId = battleForm(wild)
  const types = formStats(wild.speciesId, formId).types
  const candidates = [...(wild.teraType ? [wild.teraType] : []), ...types].map(type => wildTechniques[type])
  candidates.push(moves.scratch, moves.tackle)
  // Every playable form has a body-attack clip for Tackle.
  return candidates.find(candidate => candidate && isMoveMotionSupported(wild.speciesId, formId, candidate.id)) ?? moves.tackle
}

const trainerSkills = new WeakMap<Wild, { formId?: string; moves: Move[] }>()

function trainerTechniques(foe: Wild): Move[] {
  const formId = battleForm(foe)
  const cached = trainerSkills.get(foe)
  if (cached && cached.formId === formId) return cached.moves
  const { types } = formStats(foe.speciesId, formId)
  // Keep the old signature first so saves with legacy warnings can resume it.
  const candidates = [wildMove(foe), ...types.map(type => wildTechniques[type]), ...movesFor(foe.speciesId, foe.level, formId)]
  const skills: Move[] = []
  for (const move of candidates) {
    if (move && move.id !== 'tackle' && move.category !== 'healing' && !skills.some(entry => entry.id === move.id) &&
        isMoveMotionSupported(foe.speciesId, formId, move.id)) skills.push(move)
    if (skills.length === 2) break
  }
  skills.push(moves.tackle)
  trainerSkills.set(foe, { formId, moves: skills })
  return skills
}

function chooseTrainerMove(game: GameSave, foe: Wild, arena: TrainerArena, skills: Move[]): Move {
  const distance = arenaDistance(arena.enemy, arena.player)
  let best = skills[0], bestScore = -1
  for (const move of skills) {
    const p = arenaMoveProfile(move)
    const melee = p.kind === 'dash' || p.kind === 'cone'
    // Keep distance with ranged moves and favor faster body attacks up close.
    const distanceFit = melee === (distance <= .12) ? 1.8 : 1
    const reach = distance <= p.range + p.radius ? 1 : .15
    const variety = move.id === arena.lastEnemyMoveId ? .55 : 1
    const signature = move === skills[0] ? 1.15 : 1
    const score = matchup(game, foe, move, false) * reach * distanceFit * variety * signature
    if (score > bestScore) {
      best = move
      bestScore = score
    }
  }
  return best
}

function newCampaign(progress: RegionProgress = { badges: [], champion: false }): Campaign {
  return { ...progress, leagueIndex: null, battle: null }
}

function remainingGym(region: WorldRegion, badges: string[]): KantoTrainer | undefined {
  return region.gymTrainers.find((trainer) => !badges.includes(trainer.id))
}

export function nextGymTrainer(game: GameSave): KantoTrainer | undefined {
  const region = worldRegions[game.regionId]
  const trainer = remainingGym(region, game.campaign.badges)
  return trainer && resolveTrainer(region, trainer, game.starterSpeciesId)
}

function originalTrainer(region: WorldRegion, trainer: KantoTrainer, speciesId: string): KantoTrainer {
  if (region.trainerForStarter) return region.trainerForStarter(trainer, speciesId)
  return trainer.role === 'champion' ? region.championForStarter?.(speciesId) ?? trainer : trainer
}

function supportedTrainerMember(region: WorldRegion, trainer: KantoTrainer, member: KantoTrainerMember): KantoTrainerMember[] {
  const formId = member.formId ?? locationForm(region.id, trainer.locationId, member.speciesId)
  if (!isSpeciesMotionSupported(member.speciesId, formId)) return []
  if (formId === 'wishiwashi-school' && !isSpeciesMotionSupported(member.speciesId)) return []
  if (member.dynamax === 'gigantamax' && !isSpeciesMotionSupported(member.speciesId, member.speciesId + '-gmax')) {
    return [{ ...member, dynamax: 'dynamax' }]
  }
  return [member]
}

const resolvedTrainers = new WeakMap<KantoTrainer, Map<string, KantoTrainer>>()
export function resolveTrainer(region: WorldRegion, trainer: KantoTrainer, starterSpeciesId: string): KantoTrainer {
  const key = region.id + ':' + (species[starterSpeciesId]?.types[0] ?? '')
  const cache = resolvedTrainers.get(trainer) ?? new Map<string, KantoTrainer>()
  const previous = cache.get(key)
  if (previous) return previous
  const original = originalTrainer(region, trainer, starterSpeciesId)
  const team = original.team.flatMap(member => supportedTrainerMember(region, original, member))
  // Use the Alolan Raticate totem at Verdant Cavern when Gumshoos lacks a clip.
  if (!team.length && original.id === 'alola-gumshoos') {
    team.push(...supportedTrainerMember(region, original, { speciesId: 'raticate', level: original.team[0].level }))
  }
  if (!team.length) throw new Error('출전 가능한 포켓몬이 없는 트레이너: ' + original.id)
  const name = original.trialKind === 'totem' ? '주인 ' + species[team[0].speciesId].nameKo : original.name
  const result = { ...original, name, team }
  cache.set(key, result)
  resolvedTrainers.set(trainer, cache)
  return result
}

function eligibleLeagueOpponents(region: WorldRegion, campaign: Campaign, speciesId: string): KantoTrainer[] {
  if (region.freeEliteOrder) {
    const remaining = region.leagueTrainers.filter(trainer => trainer.role === 'elite' && !campaign.eliteWins?.includes(trainer.id))
    if (remaining.length) return remaining.map(trainer => resolveTrainer(region, trainer, speciesId))
  }
  const next = region.leagueTrainers[campaign.leagueIndex ?? 0]
  return next ? [resolveTrainer(region, next, speciesId)] : []
}

export function leagueOpponents(game: GameSave): KantoTrainer[] {
  if (game.campaign.champion || nextGymTrainer(game)) return []
  return eligibleLeagueOpponents(worldRegions[game.regionId], game.campaign, game.starterSpeciesId)
}

export function nextLeagueTrainer(game: GameSave): KantoTrainer | undefined {
  return leagueOpponents(game)[0]
}

function resetLeagueRun(campaign: Campaign): void {
  campaign.leagueIndex = null
  delete campaign.eliteWins
}

export function currentTrainer(game: GameSave): KantoTrainer | undefined {
  const id = game.campaign.battle?.trainerId
  if (!id) return
  const region = worldRegions[game.regionId]
  const trainer = region.trainerById[id]
  return trainer && resolveTrainer(region, trainer, game.starterSpeciesId)
}

function canChallenge(game: GameSave): boolean {
  return !game.campaign.battle && game.player.currentHP > 0 && isSpeciesMotionSupported(game.player.speciesId, game.player.formId) &&
    (['IDLE', 'WANDER', 'RECOVER'] as Activity[]).includes(activeState(game))
}

export function canChallengeGym(game: GameSave): boolean {
  return nextGymTrainer(game)?.locationId === game.locationId && canChallenge(game)
}

export function canChallengeFinale(game: GameSave): boolean {
  const finale = worldRegions[game.regionId].finaleTrainer
  return finale?.locationId === game.locationId && game.campaign.champion && !game.campaign.finaleWon && canChallenge(game)
}

export function canChallengeLeague(game: GameSave): boolean {
  return game.locationId === worldRegions[game.regionId].leagueLocationId &&
    Boolean(nextLeagueTrainer(game) && canChallenge(game))
}

const dynamaxHP = (hp: number) => Math.floor(hp * 1.5)

function resizeHP(current: number, previousMax: number, newMax: number) {
  return Math.min(newMax, Math.ceil(current * newMax / previousMax))
}

function trainerOpponent(regionId: RegionId, trainer: KantoTrainer, opponentIndex: number, id: number, position: Position, direction: Direction, remainingActions = 6): Wild {
  const member = trainer.team[opponentIndex]
  const { speciesId, level } = member
  const formId = member.formId ?? locationForm(regionId, trainer.locationId, speciesId)
  // Trainer teams use their campaign HP scaling independently of wild encounters.
  const baseHP = Math.max(8, Math.round(encounterMaxHP(speciesId, level, formId) * TRAINER_HEALTH_MULTIPLIER))
  const maxHP = member.dynamax && remainingActions > 0 ? dynamaxHP(baseHP) : baseHP
  return { id, trainerId: trainer.id, ...(member.teraType && { teraType: member.teraType }), ...(member.abilityId && { abilityId: member.abilityId }), ...(member.dynamax && { dynamax: member.dynamax, maxActionsLeft: remainingActions }), ...(formId && { formId }), speciesId, level, currentHP: maxHP, maxHP, position, direction }
}

function sendTrainerOpponent(game: GameSave, trainer: KantoTrainer, position: Position, wait: number): void {
  const battle = game.campaign.battle!
  delete battle.arena.lastEnemyMoveId
  const target = trainerOpponent(game.regionId, trainer, battle.opponentIndex, game.runtime.nextId++, position, -1)
  const previousHP = playerStats(game).hp
  game.wild = [target]
  if (target.maxActionsLeft) {
    game.player.currentHP = resizeHP(game.player.currentHP, previousHP, playerStats(game).hp)
    const label = target.dynamax === 'gigantamax' ? '거다이맥스' : '다이맥스'
    addEffect(game, 'travel', position, 1600, { text: species[target.speciesId].nameKo + ' ' + label + '!' })
    addLog(game, 'battle', species[target.speciesId].nameKo + ' ' + label + ' · 파트너 다이맥스')
  }
  if (target.teraType) {
    addEffect(game, 'travel', position, 1800, { text: species[target.speciesId].nameKo + ' 테라스탈!' })
    addLog(game, 'battle', species[target.speciesId].nameKo + ' · 파트너와 함께 테라스탈')
  }
  game.runtime.targetId = target.id
  faceTarget(game, target)
  game.runtime.turn = playerStats(game).speed >= opponentStats(game, target).speed ? 'player' : 'wild'
  addUnique(game.pokedexSeen, target.speciesId)
  transition(game, 'BATTLE', wait)
}

function startChallenge(game: GameSave, trainer: KantoTrainer): boolean {
  if (game.runtime.drop) collect(game, game.runtime.drop)
  game.effects = []
  game.runtime.destination = null
  game.runtime.captureIn = 0
  game.runtime.autoCaptureTargetId = null
  game.runtime.cooldowns = {}
  if (trainer.role !== 'gym' && trainer.id !== worldRegions[game.regionId].finaleTrainer?.id) game.campaign.leagueIndex ??= 0
  game.campaign.battle = { trainerId: trainer.id, opponentIndex: 0, arena: createArena([game.player.instanceId, ...game.followers.map(member => member.instanceId)]) }
  const { x, y } = game.player.position
  const inward = x > 145 * game.settings.spriteScale ? -1 : 1
  sendTrainerOpponent(game, trainer, { x: x + inward * 92, y }, 1050)
  addLog(game, 'battle', trainer.name + ' 도전 시작')
  addEffect(game, 'travel', game.player.position, 1100, { text: trainer.name + ' 도전!' })
  return true
}

function endDynamax(game: GameSave, target: Wild) {
  const playerMax = playerStats(game).hp
  target.maxActionsLeft = 0
  const baseHP = Math.max(8, Math.round(encounterMaxHP(target.speciesId, target.level, target.formId) * TRAINER_HEALTH_MULTIPLIER))
  target.currentHP = resizeHP(target.currentHP, target.maxHP, baseHP)
  target.maxHP = baseHP
  game.player.currentHP = resizeHP(game.player.currentHP, playerMax, playerStats(game).hp)
  const arena = game.campaign.battle?.arena
  if (arena) {
    // Both sides return to their standard moves at the transformation boundary.
    clearArenaCasts(arena)
    arena.enemyInMs = 650
  }
}

function spendMaxAction(game: GameSave, target: Wild) {
  if (target.maxActionsLeft === 1) endDynamax(game, target)
  else if (target.maxActionsLeft) target.maxActionsLeft--
}

function clearChallenge(game: GameSave): void {
  if (game.wild[0]?.maxActionsLeft) endDynamax(game, game.wild[0])
  game.campaign.battle = null
  game.wild = []
  game.runtime.targetId = null
  game.runtime.pausedState = 'IDLE'
  game.runtime.cooldowns = {}
  game.runtime.spawnIn = INITIAL_SPAWN_MS / game.settings.spawnRate
}

function restAfterChallenge(game: GameSave): void {
  heal(game, playerStats(game).hp)
  transition(game, 'IDLE', 900)
}

function trainerVictory(game: GameSave, trainer: KantoTrainer, opponent: Wild): void {
  const battle = game.campaign.battle!
  if (battle.opponentIndex + 1 < trainer.team.length) {
    if (opponent.maxActionsLeft) endDynamax(game, opponent)
    battle.opponentIndex++
    clearArenaCasts(battle.arena)
    battle.arena.enemyInMs = 950
    battle.arena.enemy = { x: battle.arena.player.x > 0.55 ? 0.26 : 0.74, y: 0.50 }
    sendTrainerOpponent(game, trainer, opponent.position, 900)
    return
  }

  game.wins++
  clearChallenge(game)
  let result = trainer.name + ' 격파'
  let experience = 0
  let coins = 0
  if (trainer.role === 'gym') {
    addUnique(game.campaign.badges, trainer.id)
    result += ' · ' + trainer.badge + ' 획득'
    const combinedLevels = trainer.team.reduce((sum, entry) => sum + entry.level, 0)
    experience = 120 + combinedLevels * 8
    coins = 40 + combinedLevels
  } else if (trainer.id === worldRegions[game.regionId].finaleTrainer?.id) {
    game.campaign.finaleWon = true
    result = trainer.name + '에게 승리 · 챔피언 로드 완료!'
    experience = 2500
    coins = 1000
  } else if (trainer.role === 'champion') {
    resetLeagueRun(game.campaign)
    game.campaign.champion = true
    result = game.regionId === 'galar' ? '가라르 챔피언컵 우승!' : worldRegions[game.regionId].name.replace(/지방$/, '') + ' 포켓몬 리그 우승!'
    if (game.regionId === 'paldea') result = '팔데아 챔피언 테스트 합격!'
    experience = 2500
    coins = 1000
  } else {
    if (worldRegions[game.regionId].freeEliteOrder) {
      game.campaign.eliteWins = [...(game.campaign.eliteWins ?? []), trainer.id]
    }
    game.campaign.leagueIndex = (game.campaign.leagueIndex ?? 0) + 1
  }

  const earned = addExperience(game, experience)
  game.coins += coins
  restoreTrainerParty(game, battle.arena, true)
  restAfterChallenge(game)
  const rewards = formatRewards(earned, coins)
  addLog(game, 'battle', rewards ? result + ' · ' + rewards : result)
  addEffect(game, 'reward', game.player.position, 2400, { text: result, actor: 'partner' })
}

function trainerDefeat(game: GameSave, trainer: KantoTrainer, surrendered = false): void {
  const arena = game.campaign.battle!.arena
  game.losses++
  clearChallenge(game)
  resetLeagueRun(game.campaign)
  restoreTrainerParty(game, arena, true)
  restAfterChallenge(game)
  const result = trainer.name + (surrendered ? ' 도전 포기' : '에게 패배')
  addLog(game, 'battle', result)
  addEffect(game, 'travel', game.player.position, 1900, { text: result })
}

function rollDrop(game: GameSave): string | undefined {
  if (random(game) >= 0.74 + (equipped(game)?.drop ?? 0)) return undefined
  const roll = random(game)
  const rarity = roll < 0.7 ? 'common' : roll < 0.93 ? 'uncommon' : roll < 0.99 ? 'rare' : 'epic'
  const pool = dropPools[rarity]
  const result = pool[Math.floor(random(game) * pool.length)].id
  const supplies = fieldItems[game.locationId]
  if (result === 'trailStone' && supplies?.length && random(game) < 0.5) {
    return supplies[Math.floor(random(game) * supplies.length)]
  }
  return result
}

function defeat(game: GameSave, wild: Wild): void {
  game.losses++
  game.wild = game.wild.filter((entry) => entry.id !== wild.id)
  game.runtime.targetId = null
  addLog(game, 'battle', species[wild.speciesId].nameKo + '와 전투에서 쓰러졌어요.')
  transition(game, 'FAINT', 1400)
}

function formatRewards(experience: number, coins: number): string {
  const captions = []
  if (experience > 0) captions.push('+' + experience + ' EXP')
  if (coins > 0) captions.push('+' + coins + ' 코인')
  return captions.join(' · ')
}

function victory(game: GameSave, wild: Wild): void {
  game.wins++
  game.wild = game.wild.filter((entry) => entry.id !== wild.id)
  game.runtime.targetId = null
  const amount = Math.round((13 + wild.level * 3) * (1 + (equipped(game)?.exp ?? 0)))
  const coins = Math.max(1, Math.round(2 + wild.level / 2))
  const earned = addExperience(game, amount)
  const rewards = formatRewards(earned, coins)
  game.coins += coins
  addLog(game, 'battle', species[wild.speciesId].nameKo + ' Lv.' + wild.level + ' 격파 · ' + rewards)
  addEffect(game, 'defeat', wild.position, 900, { actor: wild.id, speciesId: wild.speciesId, formId: battleForm(wild) })
  addEffect(game, 'reward', game.player.position, 1450, { text: rewards, actor: 'partner' })
  const itemId = rollDrop(game)
  if (itemId) {
    game.runtime.drop = { itemId, position: { ...wild.position } }
    addEffect(game, 'loot', wild.position, 2400, { itemId, text: items[itemId].nameKo })
    transition(game, 'LOOT', 2000)
  } else {
    transition(game, 'RECOVER', RECOVERY_MS)
  }
}

function attack(game: GameSave, target: Wild, manual?: { move: Move; playerTurn: boolean; cast: ArenaCast; position: Position; beamShare?: number }): void {
  const player = game.player
  const playerTurn = manual?.playerTurn ?? (game.runtime.turn === 'player')
  const selected = manual?.move ?? (playerTurn ? chooseMove(game, target) : wildMove(target))
  const arena = game.campaign.battle?.arena
  const stats = playerStats(game)
  const enemyStats = opponentStats(game, target)
  const source = playerTurn ? player : target
  const recipient = playerTurn ? target : player
  const actor = playerTurn ? 'partner' : target.id
  const targetActor = playerTurn ? target.id : 'partner'
  faceTarget(game, target)
  const feedback = manual ? { castId: manual.cast.id, moveId: selected.id, position: manual.position } : {}
  if (playerTurn && !manual && selected.cooldownMs) {
    game.runtime.cooldowns[selected.id] = game.runtime.clock + selected.cooldownMs
  }

  const beam = manual?.cast.beam
  const firstBeamContact = !beam?.spent
  if (beam) beam.spent = true
  if (selected.category === 'healing') {
    const amount = heal(game, Math.ceil(stats.hp * selected.power / 100))
    addEffect(game, 'heal', player.position, 900, { text: '+' + amount + ' HP' })
    if (arena) arenaNotice(game, arena, { actor: 'player', kind: 'heal', ...feedback, amount, text: selected.nameKo + ' · +' + amount + ' HP', moveType: selected.type })
  } else {
    const rollDamage = () => damageWithMultiplier(
      selected,
      playerTurn ? stats : enemyStats,
      playerTurn ? enemyStats : stats,
      playerTurn ? effectiveLevel(game) : target.level,
      matchup(game, target, selected, playerTurn), randomBetween(game, 0.90, 1.10),
    )
    let damage: number
    if (beam && manual?.beamShare !== undefined) {
      if (beam.budget === undefined) {
        const base = rollDamage()
        // Integer HP requires at least one point per damaging pulse. One
        // sampled budget per cast keeps the full hold and save/reload stable.
        beam.budget = base ? Math.max(beamRounds(manual.cast), Math.round(base * fullBeamMultiplier)) : 0
      }
      const amount = manual.cast.clashBreakthrough
        ? Math.round(beam.budget * manual.beamShare)
        : Math.round(beam.hits * beam.budget / beamRounds(manual.cast)) - beam.applied
      damage = Math.max(0, Math.min(beam.budget - beam.applied, amount))
      beam.applied += damage
    } else damage = rollDamage()
    recipient.currentHP = Math.max(0, recipient.currentHP - damage)
    addEffect(game, 'attack', source.position, 560, {
      target: { ...recipient.position }, moveId: selected.id, moveType: selected.type, text: selected.nameKo, actor, targetActor
    })
    if (firstBeamContact && playerTurn && target.abilityId === 'water-absorb' && selected.type === 'water') {
      const recovered = Math.min(target.maxHP - target.currentHP, Math.max(1, Math.floor(target.maxHP / 4)))
      target.currentHP += recovered
      addEffect(game, 'heal', target.position, 900, { text: '저수 · +' + recovered + ' HP', actor: target.id })
      if (arena) arenaNotice(game, arena, { actor: 'enemy', kind: 'heal', ...feedback, amount: recovered, text: '저수 · +' + recovered + ' HP', moveType: selected.type })
    } else {
      addEffect(game, 'damage', recipient.position, 820, { text: damage ? '−' + damage : '효과 없음', actor: targetActor, moveType: selected.type })
      if (arena) arenaNotice(game, arena, { actor: playerTurn ? 'player' : 'enemy', kind: 'hit', ...feedback, amount: damage,
        text: selected.nameKo + (damage ? ' · −' + damage + ' HP' : ' · 효과 없음'), moveType: selected.type })
    }
  }

  const trainer = target.trainerId ? currentTrainer(game) : undefined
  if (target.currentHP === 0) {
    if (trainer) trainerVictory(game, trainer, target)
    else victory(game, target)
  } else if (player.currentHP === 0) {
    if (trainer && arena && game.followers.some(member => member.currentHP > 0 && isSpeciesMotionSupported(member.speciesId, member.formId))) {
      if (firstBeamContact) spendMaxAction(game, target)
      arena.needsSwitch = true
      clearArenaCasts(arena)
      arena.direction = { x: 0, y: 0 }
      arena.switchCooldownMs = 0
      arenaNotice(game, arena, { actor: 'system', kind: 'switch', text: species[player.speciesId].nameKo + ' 기절 · 다음 포켓몬을 선택하세요.' })
    } else if (trainer) trainerDefeat(game, trainer)
    else defeat(game, target)
  } else {
    if (firstBeamContact) spendMaxAction(game, target)
    game.runtime.turn = playerTurn ? 'wild' : 'player'
    game.runtime.stateIn = TURN_MS
  }
}

function collect(game: GameSave, drop: Drop): void {
  const count = game.inventory[drop.itemId] ?? 0
  if (count || Object.keys(game.inventory).length < MAX_INVENTORY_SLOTS) {
    game.inventory[drop.itemId] = count + 1
    addLog(game, 'loot', items[drop.itemId].nameKo + ' ×1 획득')
    addEffect(game, 'pickup', drop.position, 1750, {
      actor: 'partner', itemId: drop.itemId, target: { ...game.player.position },
      text: items[drop.itemId].nameKo + ' ×1 획득'
    })
  } else {
    addLog(game, 'loot', '가방이 가득 차 전리품을 가져올 수 없어요.')
  }
  game.runtime.drop = null
}

function travel(game: GameSave, locationId: unknown): boolean {
  const location = readLocation(worldRegions[game.regionId], locationId)
  if (!location || (location.afterFinale && !game.campaign.finaleWon)) return false
  if (game.locationId !== location.id) travelTo(game, location)
  return true
}

function travelTo(game: GameSave, location: KantoLocation): void {
  const trainer = currentTrainer(game)
  if (trainer) {
    const arena = game.campaign.battle!.arena
    game.losses++
    addLog(game, 'battle', trainer.name + ' 도전 중단')
    clearChallenge(game)
    restoreTrainerParty(game, arena, false)
  }
  resetLeagueRun(game.campaign)

  const runtime = game.runtime
  if (runtime.drop) collect(game, runtime.drop)
  game.wild = []
  game.effects = []
  game.locationId = location.id
  runtime.targetId = null
  runtime.autoCaptureTargetId = null
  runtime.captureIn = 0
  runtime.destination = null
  runtime.turn = 'player'
  runtime.evolutionFrom = null
  runtime.spawnIn = INITIAL_SPAWN_MS / game.settings.spawnRate

  if (game.player.currentHP === 0) {
    runtime.pausedState = 'RECOVER'
    transition(game, game.autoBattle ? 'RECOVER' : 'PAUSED', RECOVERY_MS)
  } else {
    runtime.pausedState = 'IDLE'
    transition(game, 'IDLE', 700)
  }

  addLog(game, 'travel', location.name + ' 도착')
  addEffect(game, 'travel', game.player.position, 1500, { text: location.name })
}

export function canTransferRegion(game: GameSave, regionId: RegionId): boolean {
  const target = regionOrder.indexOf(regionId)
  if (target < 0 || regionId === game.regionId) return false
  return regionOrder.slice(0, target).every(id =>
    id === game.regionId ? game.campaign.champion : game.regionProgress[id]?.champion
  )
}

function transferRegion(game: GameSave, regionId: RegionId): boolean {
  if (!canTransferRegion(game, regionId)) return false
  const prior = game.regionId
  const { badges, champion } = game.campaign
  const destination = worldRegions[regionId]
  travelTo(game, destination.locationById[destination.startLocationId])
  game.regionProgress[prior] = { badges: [...badges], champion, ...(game.campaign.finaleWon && { finaleWon: true }) }
  game.regionId = regionId
  game.campaign = newCampaign(game.regionProgress[regionId])
  delete game.regionProgress[regionId]
  game.runtime.cooldowns = {}
  game.player.currentHP = playerStats(game).hp
  delete game.player.uncappedHP
  game.runtime.pausedState = 'IDLE'
  transition(game, 'IDLE', 700)
  addLog(game, 'travel', destination.name + ' · 레벨 상한 Lv.' + levelCap(game))
  return true
}

function isRoaming(state: Activity): boolean {
  return state === 'IDLE' || state === 'WANDER'
}

function nextRoamDestination({ x, y }: Position, bounds: Bounds, scale: number, sample: () => number): Position {
  const column = clamp(Math.floor(x * 3 / Math.max(1, bounds.width)), 0, 2)
  const row = clamp(Math.floor(y * 3 / Math.max(1, bounds.height)), 0, 2)
  const currentRegion = row * 3 + column
  const choice = Math.floor(sample() * 8)
  const region = choice < currentRegion ? choice : choice + 1
  return bounded({
    x: (region % 3 + 0.2 + 0.6 * sample()) * bounds.width / 3,
    y: (Math.floor(region / 3) + 0.2 + 0.6 * sample()) * bounds.height / 3,
  }, bounds, scale)
}

function walkFollower(follower: PartyPokemon, elapsed: number, bounds: Bounds, scale: number): void {
  if (follower.restMs > 0) {
    follower.restMs = Math.max(0, follower.restMs - elapsed)
    return
  }
  const sample = () => {
    follower.roamSeed = advanceSeed(follower.roamSeed)
    return follower.roamSeed / 4294967296
  }
  if (!follower.destination) {
    follower.destination = nextRoamDestination(follower.position, bounds, scale, sample)
    follower.state = 'WANDER'
  }
  const baseSpeed = formStats(follower.speciesId, follower.formId).baseStats.speed
  const speed = clamp(Math.hypot(bounds.width, bounds.height) * 0.052, 55, 158) * (0.85 + 0.3 * baseSpeed / (baseSpeed + 100))
  if (moveActorToward(follower, follower.destination, speed, elapsed, 3)) {
    follower.destination = null
    follower.state = 'IDLE'
    follower.restMs = 700 + 1400 * sample()
  }
}

function walk(game: GameSave, elapsed: number, bounds: Bounds): void {
  const player = game.player
  const runtime = game.runtime
  const target = game.autoBattle ? chooseTarget(game) : undefined
  if (target) {
    runtime.targetId = target.id
    transition(game, 'SEARCH', 280)
    return
  }
  if (player.state === 'IDLE' && runtime.stateIn > 0) return

  if (!runtime.destination) {
    runtime.destination = nextRoamDestination(player.position, bounds, game.settings.spriteScale, () => random(game))
    transition(game, 'WANDER')
  }
  const speed = clamp(Math.hypot(bounds.width, bounds.height) * 0.06, 64, 180)
  if (moveToward(game, runtime.destination, speed, elapsed, 3)) {
    runtime.destination = null
    transition(game, 'IDLE', randomBetween(game, 650, 1800))
  }
}

function update(game: GameSave, elapsed: number, bounds: Bounds): void {
  const player = game.player
  const runtime = game.runtime
  if (game.campaign.battle?.arena.paused || game.campaign.battle?.arena.needsSwitch) return
  if (game.effects.length) {
    for (const effect of game.effects) effect.remainingMs -= elapsed
    game.effects = game.effects.filter((effect) => effect.remainingMs > 0)
  }

  if (game.campaign.battle) {
    updateTrainerArena(game, elapsed)
    return
  }
  for (const follower of game.followers) {
    if (follower.active) walkFollower(follower, elapsed, bounds, game.settings.spriteScale)
  }
  runtime.captureIn = Math.max(0, runtime.captureIn - elapsed)
  if (!game.autoBattle && player.state !== 'EVOLUTION' && !isRoaming(player.state)) return
  runtime.clock += elapsed
  runtime.stateIn -= elapsed
  for (let index = game.wild.length - 1; index >= 0; index--) {
    const wild = game.wild[index]
    if (wild.id !== runtime.targetId && wild.expiresAt !== undefined && wild.expiresAt <= runtime.clock) game.wild.splice(index, 1)
  }
  const location = worldRegions[game.regionId].locationById[game.locationId]
  if (game.autoBattle && (location.encounters.length || location.legends?.length || (game.campaign.champion && location.visitors?.length)) &&
      player.state !== 'FAINT' && player.state !== 'EVOLUTION' && game.wild.length < MAX_WILD) {
    runtime.spawnIn -= elapsed
    if (runtime.spawnIn <= 0) {
      spawn(game, bounds, location)
      runtime.spawnIn = randomBetween(game, 30000, 60000) / game.settings.spawnRate
    }
  }

  switch (player.state) {
    case 'EVOLUTION':
      if (runtime.stateIn <= 0) {
        runtime.evolutionFrom = null
        delete runtime.evolutionFromForm
        transition(game, 'IDLE', 550)
      }
      break
    case 'FAINT':
      if (runtime.stateIn <= 0) {
        player.position = home(bounds, game.settings.spriteScale)
        runtime.destination = null
        transition(game, 'RECOVER', RECOVERY_MS)
      }
      break
    case 'RECOVER':
      if (runtime.stateIn > 0) break
      if (player.currentHP >= playerStats(game).hp) transition(game, 'IDLE', 650)
      else {
        if (game.settings.autoHeal && player.currentHP > 0 && player.currentHP < playerStats(game).hp * 0.36) {
          if (!consume(game, 'potion')) consume(game, 'superPotion')
        }
        heal(game, Math.ceil(playerStats(game).hp * 0.19 * (1 + (equipped(game)?.recovery ?? 0))))
        runtime.stateIn = RECOVERY_MS
      }
      if (game.settings.autoEvolve && canEvolve(game)) evolve(game)
      break
    case 'LOOT':
      if (runtime.drop) {
        const arrived = moveToward(game, runtime.drop.position, 55, elapsed, LOOT_RANGE)
        if (runtime.stateIn > 0 || !arrived) break
        collect(game, runtime.drop)
      }
      transition(game, 'RECOVER', RECOVERY_MS)
      break
    case 'SEARCH':
      if (runtime.stateIn <= 0) transition(game, 'CHASE')
      break
    case 'CHASE': {
      const target = findTarget(game)
      if (!target) {
        runtime.targetId = null
        transition(game, 'IDLE')
        break
      }
      if (moveToward(game, target.position, 53, elapsed, BATTLE_RANGE)) {
        faceTarget(game, target)
        runtime.turn = playerStats(game).speed >= opponentStats(game, target).speed ? 'player' : 'wild'
        transition(game, 'BATTLE', 430)
      }
      break
    }
    case 'BATTLE': {
      const target = findTarget(game)
      if (!target || !canHunt(game, target.speciesId, battleForm(target))) {
        runtime.targetId = null
        transition(game, 'IDLE')
      } else if (runtime.stateIn <= 0) {
        const ball = game.settings.autoCaptureBall
        if (!target.trainerId && ball && runtime.turn === 'player' && runtime.autoCaptureTargetId !== target.id &&
            target.currentHP <= target.maxHP * AUTO_CAPTURE_HP && throwBall(game, ball)) {
          runtime.autoCaptureTargetId = target.id
        } else {
          attack(game, target)
        }
      }
      break
    }
    case 'IDLE':
    case 'WANDER':
      if (game.autoBattle && player.currentHP < playerStats(game).hp * 0.45) {
        transition(game, 'RECOVER', RECOVERY_MS)
      } else if (!(game.autoBattle && game.settings.autoEvolve && evolve(game))) {
        walk(game, elapsed, bounds)
      }
      break
    case 'PAUSED':
      transition(game, 'IDLE')
      break
  }
}

export function tick(game: GameSave, elapsedMs: number, bounds: Bounds): void {
  const scale = game.settings.spriteScale
  game.player.position = bounded(game.player.position, bounds, scale)
  for (const wild of game.wild) wild.position = bounded(wild.position, bounds, scale)
  for (const follower of game.followers) {
    if (!follower.active) continue
    follower.position = bounded(follower.position, bounds, scale)
    if (follower.destination) follower.destination = bounded(follower.destination, bounds, scale)
  }
  const maxOpponent = game.wild[0]
  if (maxOpponent?.maxActionsLeft) {
    const partner = game.player.position
    const enemy = maxOpponent.position
    const side = enemy.x >= partner.x ? 1 : -1
    const margin = Math.min(24 + 57 * DYNAMAX_OPPONENT_SCALE * scale, bounds.width / 2)
    const distance = Math.min(118 * scale, Math.max(0, bounds.width - 2 * margin))
    const center = clamp((partner.x + enemy.x) / 2, margin + distance / 2, bounds.width - margin - distance / 2)
    partner.x = center - side * distance / 2
    enemy.x = center + side * distance / 2
    const headroom = Math.min(bounds.height / 2, 46 + 70 * DYNAMAX_OPPONENT_SCALE * scale)
    partner.y = Math.max(partner.y, headroom)
    enemy.y = Math.max(enemy.y, headroom)
  }
  if (game.runtime.destination) game.runtime.destination = bounded(game.runtime.destination, bounds, scale)
  if (game.runtime.drop) game.runtime.drop.position = bounded(game.runtime.drop.position, bounds, scale)
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return

  // Limit catch-up after a suspended process and keep the AI step bounded.
  let remaining = Math.min(1000, elapsedMs)
  while (remaining > 0) {
    const arena = game.campaign.battle?.arena
    const step = arena && !arena.paused && !arena.needsSwitch ? arenaStepMs(arena, remaining) : Math.min(200, remaining)
    update(game, step, bounds)
    // Present the trainer result before starting the next overworld update.
    if (arena && !game.campaign.battle) break
    remaining -= step
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasKey(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

const booleanSettings = [
  'sound', 'overlayVisible', 'alwaysOnTop', 'autoHeal', 'autoEvolve',
  'effects', 'hud', 'startOnLogin', 'notifications',
] as const

function validatedSettings(value: Record<string, unknown>): Partial<Settings> {
  const next: Partial<Settings> = {}
  for (const key of booleanSettings) {
    const flag = value[key]
    if (typeof flag === 'boolean') next[key] = flag
  }
  if (value.autoCaptureBall === null || isCaptureBallId(value.autoCaptureBall)) next.autoCaptureBall = value.autoCaptureBall
  if (value.fps === 15 || value.fps === 30) next.fps = value.fps
  if (typeof value.spriteScale === 'number' && Number.isFinite(value.spriteScale)) next.spriteScale = clamp(value.spriteScale, 0.75, 2)
  if (typeof value.spawnRate === 'number' && Number.isFinite(value.spawnRate)) next.spawnRate = clamp(value.spawnRate, 0.5, 2)
  if (value.exploration === 'cautious' || value.exploration === 'balanced' || value.exploration === 'bold') next.exploration = value.exploration
  return next
}

function validMoveIds(values: unknown, speciesId: string, level: number, formId?: string): string[] {
  if (!Array.isArray(values)) return []
  const available = movesFor(speciesId, level, formId).map((entry) => entry.id)
  return [...new Set(values.filter((id): id is string => typeof id === 'string' && available.includes(id)))].slice(0, 4)
}

function activeState(game: GameSave): Activity {
  return game.player.state === 'PAUSED' ? game.runtime.pausedState : game.player.state
}

export function dispatch(game: GameSave, action: GameAction): boolean {
  if (!isRecord(action)) return false
  const player = game.player
  switch (action.type) {
    case 'arena-move':
    case 'arena-dodge':
    case 'arena-skill':
    case 'arena-switch':
    case 'arena-pause':
    case 'arena-surrender':
      return handleArenaAction(game, action)
    case 'travel':
      return travel(game, action.locationId)
    case 'transfer-region':
      return transferRegion(game, action.regionId)
    case 'challenge-gym': {
      const trainer = nextGymTrainer(game)
      return Boolean(trainer && canChallengeGym(game) && startChallenge(game, trainer))
    }
    case 'challenge-finale': {
      const region = worldRegions[game.regionId]
      const trainer = region.finaleTrainer
      return Boolean(trainer && canChallengeFinale(game) && startChallenge(game, resolveTrainer(region, trainer, game.starterSpeciesId)))
    }
    case 'challenge-league': {
      if (game.locationId !== worldRegions[game.regionId].leagueLocationId || !canChallenge(game)) return false
      const opponents = leagueOpponents(game)
      const trainer = action.trainerId === undefined ? opponents[0] : opponents.find(entry => entry.id === action.trainerId)
      return Boolean(trainer && startChallenge(game, trainer))
    }
    case 'set-auto-battle': {
      if (typeof action.value !== 'boolean') return false
      if (action.value === game.autoBattle) return true
      game.autoBattle = action.value
      if (game.campaign.battle) return true
      if (game.autoBattle && player.state === 'PAUSED') {
        player.state = game.runtime.pausedState
      } else if (!game.autoBattle && player.state !== 'EVOLUTION' && !isRoaming(player.state)) {
        game.runtime.pausedState = player.state
        player.state = 'PAUSED'
      }
      return true
    }
    case 'update-settings': {
      if (!isRecord(action.settings)) return false
      const validated = validatedSettings(action.settings)
      if (!Object.keys(validated).length) return false
      // Apply spawn-rate changes to the currently scheduled encounter.
      if (validated.spawnRate !== undefined) game.runtime.spawnIn *= game.settings.spawnRate / validated.spawnRate
      Object.assign(game.settings, validated)
      if (!game.settings.effects) game.effects = []
      else if (validated.effects && game.player.state === 'EVOLUTION' && game.runtime.evolutionFrom &&
          !game.effects.some((effect) => effect.kind === 'evolution')) {
        evolutionEffect(game, game.runtime.evolutionFrom, game.runtime.stateIn)
      }
      return true
    }
    case 'buyItem':
      return buyItem(game, action)
    case 'use-item':
      return !game.campaign.battle && typeof action.itemId === 'string' && hasKey(items, action.itemId) && consume(game, action.itemId)
    case 'take-box-item': {
      if (game.campaign.battle || typeof action.instanceId !== 'string') return false
      const boxed = findBoxSlot(game.boxes, action.instanceId)?.pokemon
      if (!boxed?.heldItemId) return false
      // Inventory already counts equipped copies. Releasing ownership makes this copy available.
      const itemId = boxed.heldItemId
      boxed.heldItemId = null
      addLog(game, 'loot', `${species[boxed.speciesId].nameKo}의 ${items[itemId].nameKo} 회수`)
      return true
    }
    case 'equip-item':
      if (game.campaign.battle) return false
      if (action.itemId !== null && (typeof action.itemId !== 'string' || !hasKey(items, action.itemId) ||
          items[action.itemId].kind !== 'equipment' || availableEquipment(game, action.itemId) < 1)) return false
      player.heldItemId = action.itemId
      return true
    case 'set-moves': {
      if (game.campaign.battle) return false
      const validIds = validMoveIds(action.moveIds, player.speciesId, player.level, player.formId)
      if (!Array.isArray(action.moveIds) || validIds.length !== action.moveIds.length || !validIds.includes('tackle')) return false
      player.moveIds = validIds
      return true
    }
    case 'throw-ball':
      return isCaptureBallId(action.itemId) && throwBall(game, action.itemId)
    case 'set-follower-active':
      return !game.campaign.battle && typeof action.instanceId === 'string' && typeof action.active === 'boolean' &&
        (action.boxIndex === undefined || (!action.active && Number.isInteger(action.boxIndex))) &&
        setFollowerActive(game, action.instanceId, action.active, action.boxIndex)
    case 'move-party-member':
      return !game.campaign.battle && typeof action.instanceId === 'string' && movePartyMember(game, action.instanceId, action.toIndex)
    case 'swap-box-pokemon':
      return !game.campaign.battle && typeof action.partyInstanceId === 'string' && typeof action.boxInstanceId === 'string' &&
        swapBoxPokemon(game, action.partyInstanceId, action.boxInstanceId)
    case 'evolve':
      if (!['IDLE', 'WANDER', 'RECOVER'].includes(activeState(game))) return false
      if (!evolve(game)) return false
      game.runtime.pausedState = 'IDLE'
      return true
    default:
      return false
  }
}

export function applyOffline(game: GameSave, now = Date.now(), since = Date.parse(game.lastSavedAt)): OfflineReward {
  const reward: OfflineReward = { minutes: 0, exp: 0, coins: 0 }
  if (!Number.isFinite(since) || !Number.isFinite(now) || now <= since || now > 8640000000000000) return reward
  game.lastSavedAt = new Date(now).toISOString()
  // A saved arena resumes on its own clock, including remaining technique cooldowns.
  if (game.campaign.battle) return reward
  game.runtime.clock = Math.max(game.runtime.clock, now)
  if (!game.autoBattle) return reward
  const location = worldRegions[game.regionId].locationById[game.locationId]
  const slots = regionalWeather(game, location.id, new Date(now))?.encounters ?? location.encounters
  const limit = encounterLevelLimit(game)
  const possible = slots.flatMap(slot => {
    if (slot.level > limit) return []
    const forms = supportedWildForms(game.regionId, location.id, slot.speciesId, slot.level)
    const weight = forms.reduce((sum, form) => sum + form.weight, 0)
    const huntable = forms.reduce((sum, form) => sum + (canHunt(game, slot.speciesId, form.formId) ? form.weight : 0), 0)
    return huntable ? [{ ...slot, weight: slot.weight * huntable / weight }] : []
  })
  const totalWeight = possible.reduce((total, slot) => total + slot.weight, 0)
  if (totalWeight <= 0) return reward
  reward.minutes = Math.floor(Math.min(now - since, MAX_OFFLINE_MS) / 60000)
  if (reward.minutes === 0) return reward

  // Half of one typical encounter per minute, without simulating historical fights or drops.
  const enemyLevel = possible.reduce((total, slot) => total + slot.level * slot.weight, 0) / totalWeight
  reward.exp = addExperience(game, Math.floor(reward.minutes * (13 + enemyLevel * 3) / 2))
  reward.coins = Math.floor(reward.minutes * Math.round(2 + enemyLevel / 2) / 2)
  game.coins += reward.coins
  addLog(game, 'offline', '자리 비움 ' + reward.minutes + '분 · ' + formatRewards(reward.exp, reward.coins))
  return reward
}

const logKinds = ['battle', 'loot', 'level', 'evolution', 'recovery', 'offline', 'capture', 'travel'] as const
const maxStoredNumber = Number.MAX_SAFE_INTEGER

function finite(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback
}

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return Math.floor(finite(value, fallback, min, max))
}

function readPosition(value: unknown): Position | null {
  if (!isRecord(value) || typeof value.x !== 'number' || typeof value.y !== 'number') return null
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) return null
  return { x: value.x, y: value.y }
}

function readActivity(value: unknown, fallback: Activity): Activity {
  return typeof value === 'string' && hasKey(activityLabels, value) ? value as Activity : fallback
}

function readInventory(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}
  const inventory: Record<string, number> = {}
  for (const id of Object.keys(items)) {
    const count = integer(value[id], 0, 0, maxStoredNumber)
    if (count) inventory[id] = count
  }
  return inventory
}

function readPokedex(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && hasKey(species, id)))]
}

function readWild(value: unknown, clock: number, regionId: RegionId, location: KantoLocation, partnerId: string, campaign: Campaign): Wild[] {
  if (!Array.isArray(value)) return []
  const legends = eligibleLegends(location, partnerId, campaign.champion, campaign.badges.length)
  const results: Wild[] = []
  for (const entry of value.slice(0, MAX_WILD)) {
    if (!isRecord(entry) || entry.trainerId !== undefined || typeof entry.speciesId !== 'string' ||
        !wildSpecies.has(entry.speciesId)) continue
    const position = readPosition(entry.position)
    const id = integer(entry.id, 0, 0, maxStoredNumber - 1000)
    if (!position || id <= 0 || results.some((wild) => wild.id === id)) continue
    const level = integer(entry.level, 1, 1, MAX_LEVEL)
    const matches = (slot: KantoEncounter) => slot.speciesId === entry.speciesId && slot.level === level
    const ordinary = regionId === 'galar'
      ? isGalarWildEncounter(location.id, entry.speciesId, level, campaign.champion, campaign.badges.length)
      : location.encounters.some(matches)
    if (!ordinary && !legends.some(matches) && !(campaign.champion && location.visitors?.some(matches))) continue
    const savedForm = validForm(entry.speciesId, entry.formId)
    if (savedForm && !isSpeciesMotionSupported(entry.speciesId, savedForm)) continue
    const forms = regionId === 'paldea' ? paldeaWildForms(location.id, entry.speciesId, level) : undefined
    const formId = forms?.length ? (forms.find(row => row.formId === entry.formId) ?? forms[0]).formId
      : wildEncounterForm(regionId, location.id, entry.speciesId, level, entry.formId === 'lycanroc-midnight')
    if (!isSpeciesMotionSupported(entry.speciesId, formId)) continue
    const maxHP = encounterMaxHP(entry.speciesId, level, formId)
    const currentHP = integer(entry.currentHP, maxHP, 1, maxHP)
    const expiresAt = finite(entry.expiresAt, clock + 90000, 0, clock + 90000)
    results.push({ id, expiresAt, ...(formId && { formId }), speciesId: entry.speciesId, level, currentHP, maxHP, position, direction: entry.direction === -1 ? -1 : 1 })
  }
  return results
}

function heldEquipment(rawId: unknown, inventory: Record<string, number>): string | null {
  return typeof rawId === 'string' && hasKey(items, rawId) && items[rawId].kind === 'equipment' && inventory[rawId] > 0 ? rawId : null
}

function storedForm(speciesId: string, raw: unknown) {
  const saved = validForm(speciesId, raw)
  return saved === 'wishiwashi-school' || saved?.endsWith('-gmax') ? undefined : saved
}

function equippedMoves(raw: unknown, speciesId: string, level: number, formId?: string): string[] {
  if (!isSpeciesMotionSupported(speciesId, formId)) {
    return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && hasKey(moves, id)))].slice(0, 4) : []
  }
  const chosen = validMoveIds(raw, speciesId, level, formId)
  return chosen.includes('tackle') ? chosen : movesFor(speciesId, level, formId).map(move => move.id)
}

function readCooldowns(value: unknown, clock: number) {
  const cooldowns: Record<string, number> = {}
  if (isRecord(value)) {
    for (const id of Object.keys(moves)) {
      const until = finite(value[id], 0, 0, clock + 10000)
      if (until > clock) cooldowns[id] = until
    }
  }
  return cooldowns
}

function readOwnedPokemon(value: Record<string, unknown>, leaderId: string, leaderPosition: Position, runtime: Runtime,
  inventory: Record<string, number>, leaderItem: string | null) {
  const unequipped = { ...inventory }
  if (leaderItem) unequipped[leaderItem]--
  const knownIds = new Set([leaderId])
  function reserveCaptureId(instanceId: string) {
    const sequence = /^caught-(\d+)$/.exec(instanceId)
    if (!sequence) return
    const id = Number(sequence[1])
    if (Number.isSafeInteger(id) && id < maxStoredNumber - 1000) runtime.nextId = Math.max(runtime.nextId, id + 1)
  }
  reserveCaptureId(leaderId)
  function readMember(entry: unknown, active: boolean): PartyPokemon | null {
    if (!isRecord(entry) || typeof entry.speciesId !== 'string' || !wildSpecies.has(entry.speciesId) ||
        typeof entry.instanceId !== 'string' || entry.instanceId.length < 1 || entry.instanceId.length > 128 ||
        knownIds.has(entry.instanceId)) return null

    const { instanceId, speciesId } = entry
    const level = integer(entry.level, 1, 1, MAX_LEVEL)
    const formId = storedForm(speciesId, entry.formId)
    const heldItemId = heldEquipment(entry.heldItemId, unequipped)
    if (heldItemId) unequipped[heldItemId]--
    const cooldowns = readCooldowns(entry.cooldowns, runtime.clock)
    const boostUntil = finite(entry.boostUntil, 0, 0, runtime.clock + 120000)
    const maxHP = scaleStats(formStats(speciesId, formId).baseStats, level).hp
    const position = readPosition(entry.position) ?? { ...leaderPosition }
    const destination = active ? readPosition(entry.destination) : null
    reserveCaptureId(instanceId)
    knownIds.add(instanceId)
    return {
      instanceId, speciesId, level, ...(formId && { formId }),
      currentHP: integer(entry.currentHP, maxHP, typeof value.schemaVersion === 'number' && value.schemaVersion >= 15 ? 0 : 1, maxHP),
      ...(entry.exp !== undefined && { exp: integer(entry.exp, 0, 0, Math.max(0, requiredExp(level) - 1)) }),
      ...(entry.moveIds !== undefined && { moveIds: equippedMoves(entry.moveIds, speciesId, level, formId) }),
      ...(entry.heldItemId !== undefined && { heldItemId }),
      ...(Object.keys(cooldowns).length && { cooldowns }), ...(boostUntil > runtime.clock && { boostUntil }),
      position, destination,
      direction: entry.direction === -1 ? -1 : 1,
      state: destination ? 'WANDER' : 'IDLE',
      active,
      restMs: finite(entry.restMs, 0, 0, CAPTURE_MS),
      roamSeed: integer(entry.roamSeed, (runtime.encounterSeed ^ Math.imul(knownIds.size - 1, 0x9e3779b9)) >>> 0, 0, 4294967295),
    }
  }

  const followers: PartyPokemon[] = []
  const overflow: PartyPokemon[] = []
  const separateBoxes = typeof value.schemaVersion === 'number' && value.schemaVersion >= 14
  if (Array.isArray(value.followers)) {
    for (const entry of value.followers) {
      const active = followers.length < MAX_PARTY_SIZE - 1 && (separateBoxes || (isRecord(entry) && entry.active === true))
      const pokemon = readMember(entry, active)
      if (pokemon) (active ? followers : overflow).push(pokemon)
    }
  }
  const boxes: PokemonBox[] = []
  if (separateBoxes && Array.isArray(value.boxes)) {
    for (const entries of value.boxes) {
      const box = emptyBox()
      boxes.push(box)
      if (!Array.isArray(entries)) continue
      for (const [slot, entry] of entries.entries()) {
        const pokemon = readMember(entry, false)
        if (!pokemon) continue
        if (slot < BOX_SIZE) box[slot] = pokemon
        else overflow.push(pokemon)
      }
    }
  }
  if (!boxes.length) boxes.push(emptyBox())
  for (const pokemon of overflow) storeInBox(boxes, pokemon)
  return { followers, boxes }
}

function readHistory(value: unknown): GameLog[] {
  if (!Array.isArray(value)) return []
  const history: GameLog[] = []
  for (const entry of value.slice(0, MAX_HISTORY)) {
    if (!isRecord(entry) || typeof entry.text !== 'string') continue
    const kind = logKinds.find((known) => known === entry.kind)
    const id = integer(entry.id, 0, 0, maxStoredNumber - 1000)
    if (kind && id) history.push({ id, at: finite(entry.at, 0, 0, maxStoredNumber), kind, text: entry.text.slice(0, 240) })
  }
  return history
}

function readRuntime(value: unknown, now: number): Runtime {
  const runtime = newRuntime(now, Math.floor(now) >>> 0)
  if (!isRecord(value)) return runtime
  runtime.captureIn = finite(value.captureIn, 0, 0, CAPTURE_MS)
  runtime.autoCaptureTargetId = integer(value.autoCaptureTargetId, 0, 0, maxStoredNumber - 1000) || null
  runtime.clock = finite(value.clock, now, 0, now + 60000)
  runtime.rngState = integer(value.rngState, runtime.rngState, 0, 4294967295)
  runtime.encounterSeed = integer(value.encounterSeed, runtime.rngState, 0, 4294967295)
  runtime.nextId = integer(value.nextId, 1, 1, maxStoredNumber - 1000)
  runtime.spawnIn = finite(value.spawnIn, INITIAL_SPAWN_MS, 0, 120000)
  runtime.stateIn = finite(value.stateIn, 0, -1000, EVOLUTION_MS)
  runtime.targetId = integer(value.targetId, 0, 0, maxStoredNumber - 1000) || null
  runtime.destination = readPosition(value.destination)
  runtime.turn = value.turn === 'wild' ? 'wild' : 'player'
  runtime.pausedState = readActivity(value.pausedState, 'IDLE')
  if (runtime.pausedState === 'PAUSED' || runtime.pausedState === 'EVOLUTION') runtime.pausedState = 'IDLE'
  runtime.boostUntil = finite(value.boostUntil, 0, 0, runtime.clock + 120000)
  runtime.evolutionFrom = typeof value.evolutionFrom === 'string' && hasKey(species, value.evolutionFrom) ? value.evolutionFrom : null
  if (isRecord(value.drop) && typeof value.drop.itemId === 'string' && hasKey(items, value.drop.itemId)) {
    const position = readPosition(value.drop.position)
    if (position) runtime.drop = { itemId: value.drop.itemId, position }
  }
  runtime.cooldowns = readCooldowns(value.cooldowns, runtime.clock)
  if (runtime.evolutionFrom) runtime.evolutionFromForm = storedForm(runtime.evolutionFrom, value.evolutionFromForm)
  return runtime
}

const starterForEvolution = new Map<string, string>()
for (const starterId of starterIds) {
  let id: string | undefined = starterId
  while (id && !starterForEvolution.has(id)) {
    starterForEvolution.set(id, starterId)
    id = species[id].evolvesTo?.speciesId
  }
}

function readRegionProgress(region: WorldRegion, value: unknown): RegionProgress {
  if (!isRecord(value)) return { badges: [], champion: false }
  const savedBadges = value.badges
  const badges = Array.isArray(savedBadges)
    ? region.gymTrainers.filter((trainer) => savedBadges.includes(trainer.id)).map((trainer) => trainer.id)
    : []
  const champion = badges.length === region.gymTrainers.length && value.champion === true
  return { badges, champion, ...(champion && region.finaleTrainer && value.finaleWon === true && { finaleWon: true }) }
}

function readCampaign(region: WorldRegion, value: unknown, locationId: string, speciesId: string, version: number): Campaign {
  const campaign = newCampaign(readRegionProgress(region, value))
  if (!isRecord(value)) return campaign
  const gym = remainingGym(region, campaign.badges)
  const atLeague = locationId === region.leagueLocationId
  if (!gym && atLeague && !campaign.champion && typeof value.leagueIndex === 'number' &&
      Number.isInteger(value.leagueIndex) && value.leagueIndex >= 0 && value.leagueIndex < region.leagueTrainers.length) {
    if (region.freeEliteOrder) {
      const savedWins: unknown[] = Array.isArray(value.eliteWins) ? value.eliteWins : []
      const wins = savedWins.filter((id, index): id is string =>
        typeof id === 'string' && savedWins.indexOf(id) === index && region.trainerById[id]?.role === 'elite'
      )
      if (wins.length !== value.leagueIndex) return campaign
      if (wins.length) campaign.eliteWins = wins
    }
    campaign.leagueIndex = value.leagueIndex
  }

  if (!isRecord(value.battle) || typeof value.battle.trainerId !== 'string') return campaign
  // Older saves can already be battling a later gym. Resume the exact opponent;
  // challenge dispatch still enforces the current badge order.
  const savedTrainerId = value.battle.trainerId
  const localGym = region.gymTrainerByLocationId[locationId]
  const finale = region.finaleTrainer
  const availableFinale = finale?.locationId === locationId && campaign.champion && !campaign.finaleWon ? finale : undefined
  const eligibleTrainer = localGym && !campaign.badges.includes(localGym.id) ? localGym
    : campaign.leagueIndex !== null ? eligibleLeagueOpponents(region, campaign, speciesId)
      .find(trainer => trainer.id === savedTrainerId) : availableFinale
  const index = value.battle.opponentIndex
  if (eligibleTrainer?.id !== savedTrainerId || typeof index !== 'number' || !Number.isInteger(index) || index < 0) return campaign
  const definition = region.trainerById[savedTrainerId]
  if (!definition) return campaign
  const team = resolveTrainer(region, definition, speciesId).team
  let opponentIndex = index
  if (version < 16) {
    const oldTeam = originalTrainer(region, definition, speciesId).team
    const member = oldTeam[index]
    if (!member || !isSpeciesMotionSupported(member.speciesId, member.formId ?? locationForm(region.id, definition.locationId, member.speciesId))) return campaign
    // The same species and level can occur more than once in an original team.
    const sameMember = (slot: KantoTrainerMember) => slot.speciesId === member.speciesId && slot.level === member.level && slot.formId === member.formId
    let occurrence = oldTeam.slice(0, index).filter(sameMember).length
    opponentIndex = team.findIndex(slot => sameMember(slot) && occurrence-- === 0)
  }
  if (opponentIndex >= 0 && opponentIndex < team.length) {
    campaign.battle = { trainerId: savedTrainerId, opponentIndex, arena: createArena([]) }
  }
  return campaign
}

function readTrainerOpponent(region: WorldRegion, value: unknown, campaign: Campaign, speciesId: string, targetId: number | null): Wild | undefined {
  const battle = campaign.battle
  if (!battle || !Array.isArray(value) || !targetId) return
  const definition = region.trainerById[battle.trainerId]
  if (!definition) return
  const trainer = resolveTrainer(region, definition, speciesId)
  const slot = trainer.team[battle.opponentIndex]
  if (!slot) return
  for (const entry of value.slice(0, MAX_WILD)) {
    if (!isRecord(entry) || entry.id !== targetId || entry.trainerId !== trainer.id || entry.speciesId !== slot.speciesId ||
        entry.level !== slot.level || typeof entry.currentHP !== 'number' || entry.currentHP <= 0 || !Number.isFinite(entry.currentHP)) continue
    const position = readPosition(entry.position)
    if (!position) continue
    const opponent = trainerOpponent(region.id, trainer, battle.opponentIndex, targetId, position, entry.direction === -1 ? -1 : 1, integer(entry.maxActionsLeft, 6, 0, 6))
    opponent.currentHP = integer(entry.currentHP, opponent.maxHP, 1, opponent.maxHP)
    return opponent
  }
}

/** Move retired species to stable PC slots once, including the original partner. */
function restorePlayableParty(game: GameSave): void {
  const playable = (member: { speciesId: string; formId?: string }) => isSpeciesMotionSupported(member.speciesId, member.formId)
  const archived = game.followers.filter(member => !playable(member))
  game.followers = game.followers.filter(playable)
  if (!playable(game.player)) {
    archived.unshift(leadAsMember(game, false))
    let next = game.followers.shift()
    if (!next) {
      for (const box of game.boxes) {
        const slot = box.findIndex(member => member !== null && playable(member))
        if (slot >= 0) {
          next = box[slot]!
          box[slot] = null
          break
        }
      }
    }
    if (!next) {
      const speciesId = isSpeciesMotionSupported(game.starterSpeciesId) ? game.starterSpeciesId : starterIds.find(id => isSpeciesMotionSupported(id))!
      next = {
        instanceId: 'caught-' + game.runtime.nextId++, speciesId, level: 5, currentHP: statsFor(speciesId, 5).hp,
        position: game.player.position, direction: game.player.direction, active: true, state: 'IDLE', destination: null,
        restMs: 0, roamSeed: game.runtime.encounterSeed,
      }
      addUnique(game.pokedexSeen, speciesId)
      addUnique(game.pokedexCaught, speciesId)
      addLog(game, 'recovery', `출전 가능한 보유 포켓몬이 없어 ${species[speciesId].nameKo}(Lv.5)이 파티에 합류했습니다.`)
    }
    game.campaign.battle = null
    game.wild = []
    game.runtime.captureIn = 0
    game.runtime.autoCaptureTargetId = null
    game.runtime.drop = null
    installLead(game, { ...next, position: game.player.position })
  }
  for (const member of archived) {
    setRoaming(member, false)
    storeInBox(game.boxes, member)
  }
  if (archived.length) addLog(game, 'recovery', `전용 모션이 없는 파티 포켓몬 ${archived.length}마리를 PC 박스에 보관했습니다.`)
}

/** Validate essential fields and rebuild the rest from known keys, allowing additive save changes. */
export function hydrateSave(value: unknown, expectedSlot: number): GameSave | null {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number' || !Number.isInteger(value.schemaVersion) ||
      value.schemaVersion < 1 || value.schemaVersion > SAVE_SCHEMA_VERSION ||
      value.selectedSlot !== expectedSlot ||
      !Number.isInteger(expectedSlot) || expectedSlot < 1 || expectedSlot > 3) return null
  if (!isRecord(value.player) || typeof value.lastSavedAt !== 'string') return null
  const lastSaved = Date.parse(value.lastSavedAt)
  const rawPlayer = value.player
  const speciesId = rawPlayer.speciesId
  const position = readPosition(rawPlayer.position)
  if (!Number.isFinite(lastSaved) || lastSaved < 0 || !position || typeof speciesId !== 'string' ||
      !(value.schemaVersion >= 15 ? wildSpecies.has(speciesId) : starterForEvolution.has(speciesId)) ||
      typeof rawPlayer.instanceId !== 'string' || rawPlayer.instanceId.length < 1 ||
      typeof rawPlayer.level !== 'number' || !Number.isInteger(rawPlayer.level) ||
      rawPlayer.level < (value.schemaVersion >= 15 ? 1 : 5) || rawPlayer.level > MAX_LEVEL ||
      typeof rawPlayer.exp !== 'number' || !Number.isFinite(rawPlayer.exp) || rawPlayer.exp < 0 ||
      typeof rawPlayer.currentHP !== 'number' || !Number.isFinite(rawPlayer.currentHP) || rawPlayer.currentHP < 0) return null

  const starterSpeciesId = value.schemaVersion >= 15 && typeof value.starterSpeciesId === 'string' && starterIds.includes(value.starterSpeciesId)
    ? value.starterSpeciesId : starterForEvolution.get(speciesId)
  if (!starterSpeciesId) return null
  const formId = storedForm(speciesId, rawPlayer.formId)
  const level = rawPlayer.level
  const inventory = readInventory(value.inventory)
  if (value.schemaVersion === 1 || value.schemaVersion === 2) inventory.pokeball = Math.max(inventory.pokeball ?? 0, STARTER_BALLS)
  const heldItemId = heldEquipment(rawPlayer.heldItemId, inventory)
  const moveIds = equippedMoves(rawPlayer.moveIds, speciesId, level, formId)
  const runtime = readRuntime(value.runtime, lastSaved)
  const supportsRegions = value.schemaVersion >= 6
  const savedRegion = supportsRegions && isRegionId(value.regionId) &&
    value.schemaVersion >= worldRegions[value.regionId].firstSaveVersion ? value.regionId : 'kanto'
  const savedProgress = supportsRegions && isRecord(value.regionProgress) ? value.regionProgress : {}
  const regionProgress: GameSave['regionProgress'] = {}
  let regionId: RegionId = 'kanto'
  for (const id of regionOrder) {
    if (value.schemaVersion < worldRegions[id].firstSaveVersion) break
    const active = id === savedRegion
    const record = active ? value.campaign : savedProgress[id]
    if (!active && !isRecord(record)) break
    const progress = readRegionProgress(worldRegions[id], record)
    if (active) regionId = id
    else regionProgress[id] = progress
    if (!progress.champion) break
  }
  const region = worldRegions[regionId]
  const proposedLocation = value.schemaVersion >= 4 && savedRegion === regionId
    ? readLocation(region, value.locationId) : undefined
  const savedCampaign = savedRegion === regionId ? value.campaign : regionProgress[regionId]
  const savedLocation = proposedLocation?.afterFinale && !readRegionProgress(region, savedCampaign).finaleWon ? undefined : proposedLocation
  const fallbackLocationId = regionId === 'kanto' ? LEGACY_LOCATION_ID : region.startLocationId
  const location = savedLocation ?? region.locationById[fallbackLocationId]
  delete regionProgress[regionId]
  const campaign = value.schemaVersion >= 5 ? readCampaign(region, savedCampaign, location.id, starterSpeciesId, value.schemaVersion) : newCampaign()
  const effective = Math.min(level, region.levelCaps[campaign.badges.length])
  const baseHP = statsFor(speciesId, effective, heldItemId, formId).hp
  let trainerEnemy = campaign.battle
    ? readTrainerOpponent(region, value.wild, campaign, starterSpeciesId, runtime.targetId) : undefined
  const maxHP = trainerEnemy?.maxActionsLeft ? dynamaxHP(baseHP) : baseHP
  const currentHP = clamp(Math.floor(rawPlayer.currentHP), 0, maxHP)
  if (campaign.battle && !trainerEnemy) {
    campaign.battle = null
    resetLeagueRun(campaign)
  }
  const wild = trainerEnemy ? [trainerEnemy] : savedLocation ? readWild(value.wild, runtime.clock, regionId, location, starterSpeciesId, campaign) : []
  if (!savedLocation) {
    runtime.captureIn = 0
    runtime.spawnIn = INITIAL_SPAWN_MS
  }
  const history = readHistory(value.history)
  runtime.nextId = Math.max(runtime.nextId, ...wild.map((entry) => entry.id + 1), ...history.map((entry) => entry.id + 1))
  if (!wild.some((entry) => entry.id === runtime.autoCaptureTargetId)) runtime.autoCaptureTargetId = null
  const leaderId = rawPlayer.instanceId.slice(0, 128)
  const { followers, boxes } = readOwnedPokemon(value, leaderId, position, runtime, inventory, heldItemId)
  if (campaign.battle && trainerEnemy) {
    const rawArena = isRecord(savedCampaign) && isRecord(savedCampaign.battle) ? savedCampaign.battle.arena : undefined
    const playableFollowers = followers.filter(member => isSpeciesMotionSupported(member.speciesId, member.formId))
    if (isSpeciesMotionSupported(speciesId, formId) && currentHP === 0 && !playableFollowers.some(member => member.currentHP > 0)) {
      campaign.battle = null
      trainerEnemy = undefined
      wild.length = 0
      if (!followers.some(member => member.currentHP > 0)) resetLeagueRun(campaign)
    } else {
      const foe = trainerEnemy
      const clearedMaxCasts = value.schemaVersion < 16 && foe.maxActionsLeft && isRecord(rawArena)
        ? { ...rawArena, casts: [], beamClash: undefined } : rawArena
      if (isSpeciesMotionSupported(speciesId, formId)) {
        campaign.battle.arena = restoreArena(clearedMaxCasts, [leaderId, ...playableFollowers.map(member => member.instanceId)],
          currentHP === 0, trainerTechniques(foe), id => moveIds.includes(id) ? moves[id] : undefined, spriteRefs(speciesId, formId, foe))
      }
    }
  }
  const autoBattle = value.autoBattle !== false
  let state = trainerEnemy ? 'BATTLE' as const : readActivity(rawPlayer.state, 'IDLE')
  if (state === 'PAUSED') state = runtime.pausedState
  if (!trainerEnemy && currentHP === 0 && state !== 'FAINT') state = 'RECOVER'
  if (currentHP > 0 && state === 'FAINT') state = 'RECOVER'
  if (['SEARCH', 'CHASE', 'BATTLE'].includes(state) && !wild.some((entry) => entry.id === runtime.targetId)) state = 'IDLE'
  if (!['SEARCH', 'CHASE', 'BATTLE'].includes(state)) runtime.targetId = null
  if (state === 'LOOT' && !runtime.drop) state = 'RECOVER'
  if (state !== 'LOOT') runtime.drop = null
  const from = runtime.evolutionFrom
  const matchesEvolution = (rule: { speciesId: string; formId?: string } | undefined) => rule?.speciesId === speciesId && rule.formId === formId
  if (state !== 'EVOLUTION' || !from || !(matchesEvolution(evolutionFor(from, runtime.evolutionFromForm)) ||
      Object.keys(collectionItems).some(id => matchesEvolution(itemEvolution(id, from, runtime.evolutionFromForm))))) {
    runtime.evolutionFrom = null
    delete runtime.evolutionFromForm
  }
  if (!autoBattle && !trainerEnemy && state !== 'EVOLUTION' && !isRoaming(state)) {
    runtime.pausedState = state
    state = 'PAUSED'
  }

  const pokedexSeen = readPokedex(value.pokedexSeen)
  const pokedexCaught = readPokedex(value.pokedexCaught)
  addUnique(pokedexSeen, speciesId)
  addUnique(pokedexCaught, speciesId)
  for (const group of [followers, ...boxes]) {
    for (const pokemon of group) {
      if (!pokemon) continue
      addUnique(pokedexSeen, pokemon.speciesId)
      addUnique(pokedexCaught, pokemon.speciesId)
    }
  }
  const settings = { ...defaultSettings, ...(isRecord(value.settings) ? validatedSettings(value.settings) : {}) }
  // Older saves used a different topmost default. Apply the desktop-companion
  // preference once, then retain the user's choice in the new schema.
  if (value.schemaVersion === 1) settings.alwaysOnTop = true
  const hydrated: GameSave = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    selectedSlot: expectedSlot,
    regionId,
    locationId: location.id,
    campaign,
    regionProgress,
    starterSpeciesId,
    player: {
      instanceId: leaderId,
      ...(formId && { formId }),
      ...(typeof rawPlayer.roamSeed === 'number' && { roamSeed: integer(rawPlayer.roamSeed, 0, 0, 4294967295) }),
      ...(effective < level && typeof rawPlayer.uncappedHP === 'number' && { uncappedHP: integer(rawPlayer.uncappedHP, 0, 0, statsFor(speciesId, level, heldItemId, formId).hp) }),
      speciesId,
      level,
      exp: level === MAX_LEVEL ? 0 : clamp(Math.floor(rawPlayer.exp), 0, requiredExp(level) - 1),
      currentHP,
      moveIds,
      heldItemId,
      state,
      position,
      direction: rawPlayer.direction === -1 ? -1 : 1,
    },
    followers,
    boxes,
    inventory,
    pokedexSeen,
    pokedexCaught,
    coins: integer(value.coins, 0, 0, maxStoredNumber),
    autoBattle,
    settings,
    lastSavedAt: new Date(lastSaved).toISOString(),
    wild,
    history,
    effects: [],
    wins: integer(value.wins, 0, 0, maxStoredNumber),
    losses: integer(value.losses, 0, 0, maxStoredNumber),
    runtime,
  }
  if (!savedLocation && runtime.drop) {
    collect(hydrated, runtime.drop)
    hydrated.effects = []
    if (currentHP > 0) {
      runtime.pausedState = 'IDLE'
      transition(hydrated, autoBattle ? 'RECOVER' : 'IDLE', autoBattle ? RECOVERY_MS : 700)
    }
  }
  restorePlayableParty(hydrated)
  if (runtime.evolutionFrom) evolutionEffect(hydrated, runtime.evolutionFrom, runtime.stateIn)
  return hydrated
}
