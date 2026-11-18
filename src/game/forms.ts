import { species } from './catalog'
import type { Stats, Wild } from './engine'

interface Form {
  base: string
  types: string[]
  baseStats: Stats
}

type FormRow = [id: string, base: string, types: string[], stats: [number, number, number, number, number, number]]
// PokéAPI species forms and sprites are credited in assets/sprites/SOURCES.md.
const rows: FormRow[] = [
  ["shellos-east","shellos",["water"],[76,48,48,57,62,34]],
  ["gastrodon-east","gastrodon",["water","ground"],[111,83,68,92,82,39]],
  ["rattata-alola","rattata",["dark","normal"],[30,56,35,25,35,72]],
  ["raticate-alola","raticate",["dark","normal"],[75,71,70,40,80,77]],
  ["raichu-alola","raichu",["electric","psychic"],[60,85,50,95,85,110]],
  ["sandshrew-alola","sandshrew",["ice","steel"],[50,75,90,10,35,40]],
  ["sandslash-alola","sandslash",["ice","steel"],[75,100,120,25,65,65]],
  ["vulpix-alola","vulpix",["ice"],[38,41,40,50,65,65]],
  ["ninetales-alola","ninetales",["ice","fairy"],[73,67,75,81,100,109]],
  ["diglett-alola","diglett",["ground","steel"],[10,55,30,35,45,90]],
  ["dugtrio-alola","dugtrio",["ground","steel"],[35,100,60,50,70,110]],
  ["meowth-alola","meowth",["dark"],[40,35,35,50,40,90]],
  ["persian-alola","persian",["dark"],[65,60,60,75,65,115]],
  ["geodude-alola","geodude",["rock","electric"],[40,80,100,30,30,20]],
  ["graveler-alola","graveler",["rock","electric"],[55,95,115,45,45,35]],
  ["golem-alola","golem",["rock","electric"],[80,120,130,55,65,45]],
  ["grimer-alola","grimer",["poison","dark"],[80,80,50,40,50,25]],
  ["muk-alola","muk",["poison","dark"],[105,105,75,65,100,50]],
  ["exeggutor-alola","exeggutor",["grass","dragon"],[95,105,85,125,75,45]],
  ["marowak-alola","marowak",["fire","ghost"],[60,80,110,50,80,45]],
  ["oricorio-pom-pom","oricorio",["electric","flying"],[75,70,70,98,70,93]],
  ["oricorio-pau","oricorio",["psychic","flying"],[75,70,70,98,70,93]],
  ["oricorio-sensu","oricorio",["ghost","flying"],[75,70,70,98,70,93]],
  ["lycanroc-midnight","lycanroc",["rock"],[85,115,75,55,75,82]],
  ["wishiwashi-school","wishiwashi",["water"],[45,140,130,140,135,30]],
  ["meowth-galar","meowth",["steel"],[50,65,55,40,40,40]],
  ["ponyta-galar","ponyta",["psychic"],[50,85,55,65,65,90]],
  ["rapidash-galar","rapidash",["psychic","fairy"],[65,100,70,80,80,105]],
  ["farfetchd-galar","farfetchd",["fighting"],[52,95,55,58,62,55]],
  ["weezing-galar","weezing",["poison","fairy"],[65,90,120,85,70,60]],
  ["mr-mime-galar","mr-mime",["ice","psychic"],[50,65,65,90,90,100]],
  ["corsola-galar","corsola",["ghost"],[60,55,100,65,100,30]],
  ["zigzagoon-galar","zigzagoon",["dark","normal"],[38,30,41,30,41,60]],
  ["linoone-galar","linoone",["dark","normal"],[78,70,61,50,61,100]],
  ["darumaka-galar","darumaka",["ice"],[70,90,45,15,45,50]],
  ["yamask-galar","yamask",["ground","ghost"],[38,55,85,30,65,30]],
  ["stunfisk-galar","stunfisk",["ground","steel"],[109,81,99,66,84,32]],
  ["charizard-gmax","charizard",["fire","flying"],[78,84,78,109,85,100]],
  ["machamp-gmax","machamp",["fighting"],[90,130,80,65,85,55]],
  ["drednaw-gmax","drednaw",["water","rock"],[90,115,90,48,68,74]],
  ["coalossal-gmax","coalossal",["rock","fire"],[110,80,120,80,90,30]],
  ["centiskorch-gmax","centiskorch",["fire","bug"],[100,115,65,90,90,65]],
  ["hatterene-gmax","hatterene",["psychic","fairy"],[57,90,95,136,103,29]],
  ["grimmsnarl-gmax","grimmsnarl",["dark","fairy"],[95,120,65,95,75,60]],
  ["alcremie-gmax","alcremie",["fairy"],[65,60,75,110,121,64]],
  ["duraludon-gmax","duraludon",["steel","dragon"],[70,95,115,120,50,85]],
  ["alcremie-ruby-cream","alcremie",["fairy"],[65,60,75,110,121,64]],
  ["toxtricity-low-key","toxtricity",["electric","poison"],[75,98,70,114,70,75]],
  ["tauros-paldea-combat-breed","tauros",["fighting"],[75,110,105,30,70,100]],
  ["tauros-paldea-blaze-breed","tauros",["fighting","fire"],[75,110,105,30,70,100]],
  ["wooper-paldea","wooper",["poison","ground"],[55,45,45,25,25,15]],
  ["dudunsparce-three-segment","dudunsparce",["normal"],[125,100,80,85,75,55]],
  ["tatsugiri-droopy","tatsugiri",["dragon","water"],[68,50,60,120,95,82]],
  ["tatsugiri-stretchy","tatsugiri",["dragon","water"],[68,50,60,120,95,82]],
  ["squawkabilly-blue-plumage","squawkabilly",["normal","flying"],[82,96,51,45,51,92]],
  ["squawkabilly-yellow-plumage","squawkabilly",["normal","flying"],[82,96,51,45,51,92]],
  ["squawkabilly-white-plumage","squawkabilly",["normal","flying"],[82,96,51,45,51,92]],
  ["lycanroc-dusk","lycanroc",["rock"],[75,117,65,55,65,110]]
]

export const pokemonForms: Record<string, Form> = Object.fromEntries(rows.map(([id, base, types, stats]) => {
  const [hp, attack, defense, spAttack, spDefense, speed] = stats
  return [id, { base, types, baseStats: { hp, attack, defense, spAttack, spDefense, speed } }]
}))

export function validForm(speciesId: string, formId: unknown): string | undefined {
  return typeof formId === 'string' && Object.hasOwn(pokemonForms, formId) && pokemonForms[formId].base === speciesId ? formId : undefined
}

export function locationForm(regionId: string, locationId: string, speciesId: string): string | undefined {
  if (regionId === 'paldea') {
    if (speciesId === 'wooper') return 'wooper-paldea'
    if (speciesId === 'tauros') return 'tauros-paldea-combat-breed'
  }
  if (regionId === 'galar') {
    if (speciesId === 'gastrodon' || speciesId === 'shellos') return speciesId + '-east'
    return validForm(speciesId, speciesId + '-galar')
  }
  if (regionId !== 'alola') return
  if (speciesId === 'shellos' || speciesId === 'gastrodon') return speciesId + '-east'
  if (speciesId === 'oricorio') {
    if (locationId === 'melemele-meadow') return 'oricorio-pom-pom'
    if (locationId === 'alola-route-6') return 'oricorio-pau'
    if (locationId === 'poni-meadow') return 'oricorio-sensu'
  }
  return validForm(speciesId, speciesId + '-alola')
}

export function hasWildMidnightForm(regionId: string, locationId: string, speciesId: string) {
  return regionId === 'alola' && locationId === 'vast-poni-canyon' && speciesId === 'lycanroc'
}

export function wildEncounterForm(regionId: string, locationId: string, speciesId: string, level: number, midnight: boolean) {
  if ((regionId === 'alola' || regionId === 'galar') && speciesId === 'wishiwashi' && level >= 20) return 'wishiwashi-school'
  if (midnight && hasWildMidnightForm(regionId, locationId, speciesId)) return 'lycanroc-midnight'
  return locationForm(regionId, locationId, speciesId)
}

export function battleForm(mon: Pick<Wild, 'speciesId' | 'formId' | 'currentHP' | 'maxHP' | 'maxActionsLeft' | 'dynamax'>) {
  if (mon.maxActionsLeft && mon.dynamax === 'gigantamax') return validForm(mon.speciesId, mon.speciesId + '-gmax') ?? mon.formId
  if (mon.formId === 'wishiwashi-school' && mon.currentHP * 4 <= mon.maxHP) return undefined
  return mon.formId
}

export function formStats(speciesId: string, formId?: string) {
  return formId ? pokemonForms[formId] ?? species[speciesId] : species[speciesId]
}

export function formLabel(formId: string | undefined) {
  if (formId?.endsWith('-galar')) return '가라르의 모습'
  if (formId?.endsWith('-gmax')) return '거다이맥스'
  if (formId === 'alcremie-ruby-cream') return '루비크림'
  if (formId?.endsWith('-alola')) return '알로라의 모습'
  switch (formId) {
    case 'wooper-paldea': return '팔데아의 모습'
    case 'tauros-paldea-combat-breed': return '컴뱃종'
    case 'tauros-paldea-blaze-breed': return '블레이즈종'
    case 'dudunsparce-three-segment': return '세 마디 폼'
    case 'toxtricity-low-key': return '로우한 모습'
    case 'lycanroc-dusk': return '황혼의 모습'
    case 'tatsugiri-droopy': return '늘어진 모습'
    case 'tatsugiri-stretchy': return '뻗은 모습'
    case 'squawkabilly-blue-plumage': return '블루 페더'
    case 'squawkabilly-yellow-plumage': return '옐로 페더'
    case 'squawkabilly-white-plumage': return '화이트 페더'
    case 'gastrodon-east':
    case 'shellos-east': return '동쪽바다'
    case 'oricorio-pom-pom': return '파칙파칙스타일'
    case 'oricorio-pau': return '훌라훌라스타일'
    case 'oricorio-sensu': return '하늘하늘스타일'
    case 'lycanroc-midnight': return '한밤중의 모습'
    case 'wishiwashi-school': return '군집의 모습'
  }
}
