import { species } from './catalog'
import { pokemonForms } from './forms'
import { isSpeciesMotionSupported } from './motionEligibility'

interface CollectionItem {
  name: string
  site: string
  evolutions?: Readonly<Record<string, string>>
  fossil?: { speciesId: string; lab: string }
}

// Field sites and lab locations are desktop-game rules. Recipes use the saved form identity.
export const collectionItems: Readonly<Record<string, CollectionItem>> = {
  linkingCord: { name: '연결의끈', site: 'power-plant', evolutions: {
    kadabra: 'alakazam', machoke: 'machamp', graveler: 'golem', 'graveler-alola': 'golem-alola', haunter: 'gengar'
  } },
  fireStone: { name: '불꽃의돌', site: 'pokemon-mansion', evolutions: {
    growlithe: 'arcanine', vulpix: 'ninetales', eevee: 'flareon', pansear: 'simisear', capsakid: 'scovillain'
  } },
  waterStone: { name: '물의돌', site: 'seafoam-islands', evolutions: {
    poliwhirl: 'poliwrath', shellder: 'cloyster', staryu: 'starmie', eevee: 'vaporeon', lombre: 'ludicolo', panpour: 'simipour'
  } },
  thunderStone: { name: '천둥의돌', site: 'power-plant', evolutions: {
    pikachu: 'raichu', eevee: 'jolteon', eelektrik: 'eelektross', magneton: 'magnezone', nosepass: 'probopass', charjabug: 'vikavolt', tadbulb: 'bellibolt'
  } },
  leafStone: { name: '리프의돌', site: 'viridian-forest', evolutions: {
    gloom: 'vileplume', weepinbell: 'victreebel', exeggcute: 'exeggutor', nuzleaf: 'shiftry', pansage: 'simisage', eevee: 'leafeon'
  } },
  moonStone: { name: '달의돌', site: 'mt-moon', evolutions: {
    nidorina: 'nidoqueen', nidorino: 'nidoking', clefairy: 'clefable', jigglypuff: 'wigglytuff', skitty: 'delcatty', munna: 'musharna'
  } },
  sunStone: { name: '태양의돌', site: 'national-park', evolutions: {
    gloom: 'bellossom', sunkern: 'sunflora', cottonee: 'whimsicott', petilil: 'lilligant', helioptile: 'heliolisk'
  } },
  shinyStone: { name: '빛의돌', site: 'iron-island', evolutions: {
    togetic: 'togekiss', roselia: 'roserade', minccino: 'cinccino', floette: 'florges'
  } },
  duskStone: { name: '어둠의돌', site: 'lost-tower', evolutions: {
    murkrow: 'honchkrow', misdreavus: 'mismagius', lampent: 'chandelure', doublade: 'aegislash'
  } },
  iceStone: { name: '얼음의돌', site: 'frost-cavern', evolutions: {
    'sandshrew-alola': 'sandslash-alola', 'vulpix-alola': 'ninetales-alola', 'darumaka-galar': 'darmanitan-galar', eevee: 'glaceon', cetoddle: 'cetitan', crabrawler: 'crabominable'
  } },
  oldAmber: { name: '비밀의호박', site: 'mt-moon', fossil: { speciesId: 'aerodactyl', lab: 'cinnabar-island' } },
  helixFossil: { name: '조개화석', site: 'mt-moon', fossil: { speciesId: 'omanyte', lab: 'cinnabar-island' } },
  domeFossil: { name: '껍질화석', site: 'mt-moon', fossil: { speciesId: 'kabuto', lab: 'cinnabar-island' } },
  clawFossil: { name: '발톱화석', site: 'mirage-tower', fossil: { speciesId: 'anorith', lab: 'rustboro-city' } },
  skullFossil: { name: '두개의화석', site: 'oreburgh-mine', fossil: { speciesId: 'cranidos', lab: 'oreburgh-city' } },
  armorFossil: { name: '방패의화석', site: 'oreburgh-mine', fossil: { speciesId: 'shieldon', lab: 'oreburgh-city' } },
  plumeFossil: { name: '날개화석', site: 'desert-resort', fossil: { speciesId: 'archen', lab: 'nacrene-city' } },
  jawFossil: { name: '턱화석', site: 'glittering-cave', fossil: { speciesId: 'tyrunt', lab: 'ambrette-town' } },
  sailFossil: { name: '지느러미화석', site: 'glittering-cave', fossil: { speciesId: 'amaura', lab: 'ambrette-town' } },
}

export function itemEvolution(itemId: string, speciesId: string, formId?: string) {
  if (!Object.hasOwn(collectionItems, itemId) || !isSpeciesMotionSupported(speciesId, formId)) return
  const target = collectionItems[itemId].evolutions?.[formId ?? speciesId]
  if (!target) return
  const form = pokemonForms[target]
  const next = form ? { speciesId: form.base, formId: target } : { speciesId: target }
  return species[next.speciesId] && isSpeciesMotionSupported(next.speciesId, next.formId) ? next : undefined
}

export const fieldItems: Record<string, string[]> = {}
for (const [id, item] of Object.entries(collectionItems)) {
  (fieldItems[item.site] ??= []).push(id)
}
