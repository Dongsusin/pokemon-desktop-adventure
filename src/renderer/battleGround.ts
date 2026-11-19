import type { KantoTrainer } from '../game/regions/kantoCampaign'
import type { RegionId } from '../game/regions/world'
import manifest from './battle-venues.json'
import { fieldTrainerById } from '../game/regions/fieldTrainers'
import { worldRegions } from '../game/regions/world'
import { fieldTrainerGround } from './fieldTrainerArt'

const venueNames: Partial<Record<RegionId, Readonly<Record<string, string>>>> = manifest

const gyms = new Set([
  'pewter', 'cerulean', 'vermilion', 'celadon', 'fuchsia', 'saffron', 'cinnabar', 'viridian',
  'violet', 'azalea', 'goldenrod', 'ecruteak', 'cianwood', 'olivine', 'mahogany', 'blackthorn',
  'oreburgh', 'eterna', 'hearthome', 'veilstone', 'pastoria', 'canalave', 'snowpoint', 'sunyshore'
])

const terrainByType: Record<string, string> = {
  rock: 'cave', ground: 'desert', water: 'sea', grass: 'grove', bug: 'grove', fairy: 'grove',
  ice: 'icecave', poison: 'sinnoh-marsh', electric: 'lab', steel: 'gym-canalave',
  ghost: 'gym-hearthome', dark: 'cave', psychic: 'gym-saffron', fighting: 'gym-cianwood',
  flying: 'mountain', dragon: 'gym-blackthorn', fire: 'gym-cinnabar', normal: 'indoor'
}

function fallbackGround(locationId: string, trainerType: string, league: boolean) {
  const town = locationId.replace(/-(city|town|island)$/, '')
  const ground = league ? 'league' : gyms.has(town) ? 'gym-' + town : terrainByType[trainerType] ?? 'indoor'
  return 'battle/grounds/' + ground + '.png'
}

export function battleVenue(region: RegionId, trainer: KantoTrainer) {
  const local = trainer.role === 'field' && fieldTrainerById[trainer.id]
  if (local) return { name: worldRegions[region].locationById[local.locationId]?.name ?? local.name, image: fieldTrainerGround(local) }
  const name = venueNames[region]?.[trainer.id]
  return {
    name,
    image: name ? 'battle/venues/' + region + '/' + trainer.id + '.png'
      : fallbackGround(trainer.locationId, trainer.type ?? 'normal', trainer.role !== 'gym'),
  }
}
