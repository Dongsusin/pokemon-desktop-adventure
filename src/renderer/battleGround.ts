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

export function battleGroundUrl(locationId: string, trainerType: string, league: boolean) {
  const town = locationId.replace(/-(city|town|island)$/, '')
  const ground = league ? 'league' : gyms.has(town) ? 'gym-' + town : terrainByType[trainerType] ?? 'indoor'
  return new URL('battle/grounds/' + ground + '.png', document.baseURI).href
}
