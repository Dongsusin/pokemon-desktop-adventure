import { captureBallIds, items, MAX_PARTY_SIZE, shopStock, type Settings } from '../game/engine'
import { isSlot, type AdventureCommand, type ArenaInput } from '../preload/contracts'
import { isRegionId, worldLocationById } from '../game/regions/world'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const booleanSettings = [
  'sound', 'overlayVisible', 'alwaysOnTop', 'autoHeal', 'autoEvolve', 'effects', 'hud', 'notifications'
] as const

function parseSettings(value: unknown): Partial<Settings> | null {
  if (!record(value)) return null
  const settings: Partial<Settings> = {}
  for (const key of booleanSettings) {
    if (typeof value[key] === 'boolean') settings[key] = value[key]
  }
  if (value.fps === 15 || value.fps === 30) settings.fps = value.fps
  const autoBall = captureBallIds.find(id => id === value.autoCaptureBall)
  if (value.autoCaptureBall === null || autoBall) settings.autoCaptureBall = autoBall ?? null
  if (typeof value.spriteScale === 'number' && Number.isFinite(value.spriteScale) && value.spriteScale >= 0.75 && value.spriteScale <= 2) {
    settings.spriteScale = value.spriteScale
  }
  if (typeof value.spawnRate === 'number' && Number.isFinite(value.spawnRate) && value.spawnRate >= 0.5 && value.spawnRate <= 2) {
    settings.spawnRate = value.spawnRate
  }
  if (value.exploration === 'cautious' || value.exploration === 'balanced' || value.exploration === 'bold') {
    settings.exploration = value.exploration
  }
  return settings
}

function knownId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{1,48}$/.test(value)
}

function memberId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[\\/]/.test(value)
}

function knownItem(value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(items, value)
}

function arenaAxis(value: unknown): value is -1 | 0 | 1 {
  return value === -1 || value === 0 || value === 1
}

function parseArenaInput(value: unknown): ArenaInput | null {
  if (!record(value)) return null
  switch (value.type) {
    case 'arena-move':
      return arenaAxis(value.x) && arenaAxis(value.y) ? { type: value.type, x: value.x, y: value.y } : null
    case 'arena-skill':
      return typeof value.slot === 'number' && Number.isInteger(value.slot) && value.slot >= 0 && value.slot < 4
        ? { type: value.type, slot: value.slot } : null
    case 'arena-switch':
      return memberId(value.instanceId) ? { type: value.type, instanceId: value.instanceId } : null
    case 'arena-pause':
      return typeof value.paused === 'boolean' ? { type: value.type, paused: value.paused } : null
    case 'arena-gimmick':
      if (value.formId === undefined) return { type: value.type }
      return knownId(value.formId) ? { type: value.type, formId: value.formId } : null
    case 'arena-dodge':
    case 'arena-surrender':
      return { type: value.type }
    default:
      return null
  }
}

export function parseCommand(value: unknown): AdventureCommand | null {
  if (!record(value)) return null
  switch (value.type) {
    case 'arenaInput': {
      const action = parseArenaInput(value.action)
      return action ? { type: 'arenaInput', action } : null
    }
    case 'selectSlot':
      return isSlot(value.slot) ? { type: value.type, slot: value.slot } : null
    case 'start': {
      if (!knownId(value.speciesId)) return null
      const settings = value.settings === undefined ? undefined : parseSettings(value.settings)
      if (settings === null || (value.autoBattle !== undefined && typeof value.autoBattle !== 'boolean')) return null
      return { type: value.type, speciesId: value.speciesId, settings, autoBattle: value.autoBattle }
    }
    case 'settings': {
      const settings = parseSettings(value.settings)
      return settings ? { type: value.type, settings } : null
    }
    case 'autoBattle':
    case 'setLaunchAtLogin':
      return typeof value.enabled === 'boolean' ? { type: value.type, enabled: value.enabled } : null
    case 'takeBoxItem':
      return memberId(value.instanceId) ? { type: 'takeBoxItem', instanceId: value.instanceId } : null
    case 'equip':
      return value.itemId === null || knownItem(value.itemId) ? { type: value.type, itemId: value.itemId } : null
    case 'buyItem': {
      const offer = shopStock.find(entry => entry.itemId === value.itemId)
      const { quantity, expectedOwned } = value
      return offer && typeof quantity === 'number' && Number.isSafeInteger(quantity) && quantity > 0 &&
        typeof expectedOwned === 'number' && Number.isSafeInteger(expectedOwned) && expectedOwned >= 0
        ? { type: 'buyItem', itemId: offer.itemId, quantity, expectedOwned } : null
    }
    case 'useItem':
      return knownItem(value.itemId) ? { type: value.type, itemId: value.itemId } : null
    case 'travel':
      return knownId(value.locationId) && Object.hasOwn(worldLocationById, value.locationId)
        ? { type: value.type, locationId: value.locationId } : null
    case 'transferRegion':
      return isRegionId(value.regionId) ? { type: value.type, regionId: value.regionId } : null
    case 'throwBall': {
      const itemId = captureBallIds.find(id => id === value.itemId)
      return itemId ? { type: value.type, itemId } : null
    }
    case 'setFollowerActive': {
      if (!memberId(value.instanceId) || typeof value.active !== 'boolean') return null
      const { boxIndex } = value
      if (boxIndex === undefined) return { type: value.type, instanceId: value.instanceId, active: value.active }
      if (value.active || typeof boxIndex !== 'number' || !Number.isSafeInteger(boxIndex) || boxIndex < 0) return null
      return { type: value.type, instanceId: value.instanceId, active: false, boxIndex }
    }
    case 'movePartyMember':
      return memberId(value.instanceId) && typeof value.toIndex === 'number' && Number.isInteger(value.toIndex) &&
        value.toIndex >= 0 && value.toIndex < MAX_PARTY_SIZE
        ? { type: value.type, instanceId: value.instanceId, toIndex: value.toIndex } : null
    case 'swapBoxPokemon':
      return memberId(value.partyInstanceId) && memberId(value.boxInstanceId) && value.partyInstanceId !== value.boxInstanceId
        ? { type: value.type, partyInstanceId: value.partyInstanceId, boxInstanceId: value.boxInstanceId } : null
    case 'setMoves':
      return Array.isArray(value.moveIds) && value.moveIds.length <= 4 && value.moveIds.every(knownId)
        ? { type: value.type, moveIds: value.moveIds } : null
    case 'challengeLeague':
      if (value.trainerId === undefined) return { type: value.type }
      return knownId(value.trainerId) ? { type: value.type, trainerId: value.trainerId } : null
    case 'challengeFinale':
    case 'challengeGym':
    case 'practiceGym':
    case 'evolve':
    case 'save':
    case 'showControl':
    case 'observe':
    case 'quit':
      return { type: value.type }
    default:
      return null
  }
}
