// Pokémon Red map and wild-encounter data, transcribed from pret/pokered.
// Pinned source: https://github.com/pret/pokered/tree/ba9c0568f64ae602fadda577a08c66639f93082a
// Coordinates: data/maps/town_map_entries.asm and engine/items/town_map.asm.
// Ordinary encounters: data/wild/maps and data/wild/probabilities.asm. Version-specific slots use Red.
// The four legendary levels and locations come from data/maps/objects.

export const KANTO_MAP_WIDTH = 160
export const KANTO_MAP_HEIGHT = 144
export const KANTO_START_LOCATION_ID = 'pallet-town'

export interface KantoEncounter {
  speciesId: string
  level: number
  weight: number
}

export interface LegendaryEncounter extends KantoEncounter {
  starterType?: 'grass' | 'fire' | 'water'
  championOnly?: boolean
  minBadges?: number
}

export interface KantoGym {
  type: string
  leader: string
  badge: string
}

export interface KantoLocation {
  id: string
  name: string
  nameEn: string
  kind: 'town' | 'city' | 'route' | 'dungeon' | 'league'
  x: number
  y: number
  encounters: readonly KantoEncounter[]
  visitors?: readonly KantoEncounter[]
  legends?: readonly LegendaryEncounter[]
  afterFinale?: boolean
  gym?: KantoGym
  links: readonly string[]
}

type Slot = readonly [level: number, speciesId: string]
type WildTable = readonly [terrain: 'grass' | 'water', encounterRate: number, slots: readonly Slot[]]

const slotWeights = [51,51,39,25,25,25,13,13,11,3] as const

const wildTables = {
  Route1: [
    ["grass", 25, [[3,"pidgey"],[3,"rattata"],[3,"rattata"],[2,"rattata"],[2,"pidgey"],[3,"pidgey"],[3,"pidgey"],[4,"rattata"],[4,"pidgey"],[5,"pidgey"]]],
  ],
  Route2: [
    ["grass", 25, [[3,"rattata"],[3,"pidgey"],[4,"pidgey"],[4,"rattata"],[5,"pidgey"],[3,"weedle"],[2,"rattata"],[5,"rattata"],[4,"weedle"],[5,"weedle"]]],
  ],
  Route22: [
    ["grass", 25, [[3,"rattata"],[3,"nidoran-m"],[4,"rattata"],[4,"nidoran-m"],[2,"rattata"],[2,"nidoran-m"],[3,"spearow"],[5,"spearow"],[3,"nidoran-f"],[4,"nidoran-f"]]],
  ],
  ViridianForest: [
    ["grass", 8, [[4,"weedle"],[5,"kakuna"],[3,"weedle"],[5,"weedle"],[4,"kakuna"],[6,"kakuna"],[4,"metapod"],[3,"caterpie"],[3,"pikachu"],[5,"pikachu"]]],
  ],
  Route3: [
    ["grass", 20, [[6,"pidgey"],[5,"spearow"],[7,"pidgey"],[6,"spearow"],[7,"spearow"],[8,"pidgey"],[8,"spearow"],[3,"jigglypuff"],[5,"jigglypuff"],[7,"jigglypuff"]]],
  ],
  MtMoon1F: [
    ["grass", 10, [[8,"zubat"],[7,"zubat"],[9,"zubat"],[8,"geodude"],[6,"zubat"],[10,"zubat"],[10,"geodude"],[8,"paras"],[11,"zubat"],[8,"clefairy"]]],
  ],
  MtMoonB1F: [
    ["grass", 10, [[8,"zubat"],[7,"zubat"],[7,"geodude"],[8,"geodude"],[9,"zubat"],[10,"paras"],[10,"zubat"],[11,"zubat"],[9,"clefairy"],[9,"geodude"]]],
  ],
  MtMoonB2F: [
    ["grass", 10, [[9,"zubat"],[9,"geodude"],[10,"zubat"],[10,"geodude"],[11,"zubat"],[10,"paras"],[12,"paras"],[10,"clefairy"],[12,"zubat"],[12,"clefairy"]]],
  ],
  Route4: [
    ["grass", 20, [[10,"rattata"],[10,"spearow"],[8,"rattata"],[6,"ekans"],[8,"spearow"],[10,"ekans"],[12,"rattata"],[12,"spearow"],[8,"ekans"],[12,"ekans"]]],
  ],
  Route24: [
    ["grass", 25, [[7,"weedle"],[8,"kakuna"],[12,"pidgey"],[12,"oddish"],[13,"oddish"],[10,"abra"],[14,"oddish"],[13,"pidgey"],[8,"abra"],[12,"abra"]]],
  ],
  Route25: [
    ["grass", 15, [[8,"weedle"],[9,"kakuna"],[13,"pidgey"],[12,"oddish"],[13,"oddish"],[12,"abra"],[14,"oddish"],[10,"abra"],[7,"metapod"],[8,"caterpie"]]],
  ],
  Route9: [
    ["grass", 15, [[16,"rattata"],[16,"spearow"],[14,"rattata"],[11,"ekans"],[13,"spearow"],[15,"ekans"],[17,"rattata"],[17,"spearow"],[13,"ekans"],[17,"ekans"]]],
  ],
  Route5: [
    ["grass", 15, [[13,"oddish"],[13,"pidgey"],[15,"pidgey"],[10,"mankey"],[12,"mankey"],[15,"oddish"],[16,"oddish"],[16,"pidgey"],[14,"mankey"],[16,"mankey"]]],
  ],
  Route6: [
    ["grass", 15, [[13,"oddish"],[13,"pidgey"],[15,"pidgey"],[10,"mankey"],[12,"mankey"],[15,"oddish"],[16,"oddish"],[16,"pidgey"],[14,"mankey"],[16,"mankey"]]],
  ],
  Route11: [
    ["grass", 15, [[14,"ekans"],[15,"spearow"],[12,"ekans"],[9,"drowzee"],[13,"spearow"],[13,"drowzee"],[15,"ekans"],[17,"spearow"],[11,"drowzee"],[15,"drowzee"]]],
  ],
  RockTunnel1F: [
    ["grass", 15, [[16,"zubat"],[17,"zubat"],[17,"geodude"],[15,"machop"],[16,"geodude"],[18,"zubat"],[15,"zubat"],[17,"machop"],[13,"onix"],[15,"onix"]]],
  ],
  RockTunnelB1F: [
    ["grass", 15, [[16,"zubat"],[17,"zubat"],[17,"geodude"],[15,"machop"],[16,"geodude"],[18,"zubat"],[17,"machop"],[17,"onix"],[13,"onix"],[18,"geodude"]]],
  ],
  Route10: [
    ["grass", 15, [[16,"voltorb"],[16,"spearow"],[14,"voltorb"],[11,"ekans"],[13,"spearow"],[15,"ekans"],[17,"voltorb"],[17,"spearow"],[13,"ekans"],[17,"ekans"]]],
  ],
  Route12: [
    ["grass", 15, [[24,"oddish"],[25,"pidgey"],[23,"pidgey"],[24,"venonat"],[22,"oddish"],[26,"venonat"],[26,"oddish"],[27,"pidgey"],[28,"gloom"],[30,"gloom"]]],
  ],
  Route8: [
    ["grass", 15, [[18,"pidgey"],[18,"mankey"],[17,"ekans"],[16,"growlithe"],[20,"pidgey"],[20,"mankey"],[19,"ekans"],[17,"growlithe"],[15,"growlithe"],[18,"growlithe"]]],
  ],
  Route7: [
    ["grass", 15, [[19,"pidgey"],[19,"oddish"],[17,"mankey"],[22,"oddish"],[22,"pidgey"],[18,"mankey"],[18,"growlithe"],[20,"growlithe"],[19,"mankey"],[20,"mankey"]]],
  ],
  PokemonTower3F: [
    ["grass", 10, [[20,"gastly"],[21,"gastly"],[22,"gastly"],[23,"gastly"],[19,"gastly"],[18,"gastly"],[24,"gastly"],[20,"cubone"],[22,"cubone"],[25,"haunter"]]],
  ],
  PokemonTower4F: [
    ["grass", 10, [[20,"gastly"],[21,"gastly"],[22,"gastly"],[23,"gastly"],[19,"gastly"],[18,"gastly"],[25,"haunter"],[20,"cubone"],[22,"cubone"],[24,"gastly"]]],
  ],
  PokemonTower5F: [
    ["grass", 10, [[20,"gastly"],[21,"gastly"],[22,"gastly"],[23,"gastly"],[19,"gastly"],[18,"gastly"],[25,"haunter"],[20,"cubone"],[22,"cubone"],[24,"gastly"]]],
  ],
  PokemonTower6F: [
    ["grass", 15, [[21,"gastly"],[22,"gastly"],[23,"gastly"],[24,"gastly"],[20,"gastly"],[19,"gastly"],[26,"haunter"],[22,"cubone"],[24,"cubone"],[28,"haunter"]]],
  ],
  PokemonTower7F: [
    ["grass", 15, [[21,"gastly"],[22,"gastly"],[23,"gastly"],[24,"gastly"],[20,"gastly"],[28,"haunter"],[22,"cubone"],[24,"cubone"],[28,"haunter"],[30,"haunter"]]],
  ],
  Route13: [
    ["grass", 20, [[24,"oddish"],[25,"pidgey"],[27,"pidgey"],[24,"venonat"],[22,"oddish"],[26,"venonat"],[26,"oddish"],[25,"ditto"],[28,"gloom"],[30,"gloom"]]],
  ],
  Route14: [
    ["grass", 15, [[24,"oddish"],[26,"pidgey"],[23,"ditto"],[24,"venonat"],[22,"oddish"],[26,"venonat"],[26,"oddish"],[30,"gloom"],[28,"pidgeotto"],[30,"pidgeotto"]]],
  ],
  Route15: [
    ["grass", 15, [[24,"oddish"],[26,"ditto"],[23,"pidgey"],[26,"venonat"],[22,"oddish"],[28,"venonat"],[26,"oddish"],[30,"gloom"],[28,"pidgeotto"],[30,"pidgeotto"]]],
  ],
  Route16: [
    ["grass", 25, [[20,"spearow"],[22,"spearow"],[18,"rattata"],[20,"doduo"],[20,"rattata"],[18,"doduo"],[22,"doduo"],[22,"rattata"],[23,"raticate"],[25,"raticate"]]],
  ],
  Route17: [
    ["grass", 25, [[20,"spearow"],[22,"spearow"],[25,"raticate"],[24,"doduo"],[27,"raticate"],[26,"doduo"],[28,"doduo"],[29,"raticate"],[25,"fearow"],[27,"fearow"]]],
  ],
  Route18: [
    ["grass", 25, [[20,"spearow"],[22,"spearow"],[25,"raticate"],[24,"doduo"],[25,"fearow"],[26,"doduo"],[28,"doduo"],[29,"raticate"],[27,"fearow"],[29,"fearow"]]],
  ],
  SafariZoneCenter: [
    ["grass", 30, [[22,"nidoran-m"],[25,"rhyhorn"],[22,"venonat"],[24,"exeggcute"],[31,"nidorino"],[25,"exeggcute"],[31,"nidorina"],[30,"parasect"],[23,"scyther"],[23,"chansey"]]],
  ],
  SafariZoneEast: [
    ["grass", 30, [[24,"nidoran-m"],[26,"doduo"],[22,"paras"],[25,"exeggcute"],[33,"nidorino"],[23,"exeggcute"],[24,"nidoran-f"],[25,"parasect"],[25,"kangaskhan"],[28,"scyther"]]],
  ],
  SafariZoneNorth: [
    ["grass", 30, [[22,"nidoran-m"],[26,"rhyhorn"],[23,"paras"],[25,"exeggcute"],[30,"nidorino"],[27,"exeggcute"],[30,"nidorina"],[32,"venomoth"],[26,"chansey"],[28,"tauros"]]],
  ],
  SafariZoneWest: [
    ["grass", 30, [[25,"nidoran-m"],[26,"doduo"],[23,"venonat"],[24,"exeggcute"],[33,"nidorino"],[26,"exeggcute"],[25,"nidoran-f"],[31,"venomoth"],[26,"tauros"],[28,"kangaskhan"]]],
  ],
  SeaRoutes: [
    ["water", 5, [[5,"tentacool"],[10,"tentacool"],[15,"tentacool"],[5,"tentacool"],[10,"tentacool"],[15,"tentacool"],[20,"tentacool"],[30,"tentacool"],[35,"tentacool"],[40,"tentacool"]]],
  ],
  SeafoamIslands1F: [
    ["grass", 15, [[30,"seel"],[30,"slowpoke"],[30,"shellder"],[30,"horsea"],[28,"horsea"],[21,"zubat"],[29,"golbat"],[28,"psyduck"],[28,"shellder"],[38,"golduck"]]],
  ],
  SeafoamIslandsB1F: [
    ["grass", 10, [[30,"staryu"],[30,"horsea"],[32,"shellder"],[32,"horsea"],[28,"slowpoke"],[30,"seel"],[30,"slowpoke"],[28,"seel"],[38,"dewgong"],[37,"seadra"]]],
  ],
  SeafoamIslandsB2F: [
    ["grass", 10, [[30,"seel"],[30,"slowpoke"],[32,"seel"],[32,"slowpoke"],[28,"horsea"],[30,"staryu"],[30,"horsea"],[28,"shellder"],[30,"golbat"],[37,"slowbro"]]],
  ],
  SeafoamIslandsB3F: [
    ["grass", 10, [[31,"slowpoke"],[31,"seel"],[33,"slowpoke"],[33,"seel"],[29,"horsea"],[31,"shellder"],[31,"horsea"],[29,"shellder"],[39,"seadra"],[37,"dewgong"]]],
  ],
  SeafoamIslandsB4F: [
    ["grass", 10, [[31,"horsea"],[31,"shellder"],[33,"horsea"],[33,"shellder"],[29,"slowpoke"],[31,"seel"],[31,"slowpoke"],[29,"seel"],[39,"slowbro"],[32,"golbat"]]],
  ],
  PokemonMansion1F: [
    ["grass", 10, [[32,"koffing"],[30,"koffing"],[34,"ponyta"],[30,"ponyta"],[34,"growlithe"],[32,"ponyta"],[30,"grimer"],[28,"ponyta"],[37,"weezing"],[39,"muk"]]],
  ],
  PokemonMansion2F: [
    ["grass", 10, [[32,"growlithe"],[34,"koffing"],[34,"koffing"],[30,"ponyta"],[30,"koffing"],[32,"ponyta"],[30,"grimer"],[28,"ponyta"],[39,"weezing"],[37,"muk"]]],
  ],
  PokemonMansion3F: [
    ["grass", 10, [[31,"koffing"],[33,"growlithe"],[35,"koffing"],[32,"ponyta"],[34,"ponyta"],[40,"weezing"],[34,"grimer"],[38,"weezing"],[36,"ponyta"],[42,"muk"]]],
  ],
  PokemonMansionB1F: [
    ["grass", 10, [[33,"koffing"],[31,"koffing"],[35,"growlithe"],[32,"ponyta"],[31,"koffing"],[40,"weezing"],[34,"ponyta"],[35,"grimer"],[42,"weezing"],[42,"muk"]]],
  ],
  Route21: [
    ["grass", 25, [[21,"rattata"],[23,"pidgey"],[30,"raticate"],[23,"rattata"],[21,"pidgey"],[30,"pidgeotto"],[32,"pidgeotto"],[28,"tangela"],[30,"tangela"],[32,"tangela"]]],
    ["water", 5, [[5,"tentacool"],[10,"tentacool"],[15,"tentacool"],[5,"tentacool"],[10,"tentacool"],[15,"tentacool"],[20,"tentacool"],[30,"tentacool"],[35,"tentacool"],[40,"tentacool"]]],
  ],
  CeruleanCave1F: [
    ["grass", 10, [[46,"golbat"],[46,"hypno"],[46,"magneton"],[49,"dodrio"],[49,"venomoth"],[52,"arbok"],[49,"kadabra"],[52,"parasect"],[53,"raichu"],[53,"ditto"]]],
  ],
  CeruleanCave2F: [
    ["grass", 15, [[51,"dodrio"],[51,"venomoth"],[51,"kadabra"],[52,"rhydon"],[52,"marowak"],[52,"electrode"],[56,"chansey"],[54,"wigglytuff"],[55,"ditto"],[60,"ditto"]]],
  ],
  CeruleanCaveB1F: [
    ["grass", 25, [[55,"rhydon"],[55,"marowak"],[55,"electrode"],[64,"chansey"],[64,"parasect"],[64,"raichu"],[57,"arbok"],[65,"ditto"],[63,"ditto"],[67,"ditto"]]],
  ],
  PowerPlant: [
    ["grass", 10, [[21,"voltorb"],[21,"magnemite"],[20,"pikachu"],[24,"pikachu"],[23,"magnemite"],[23,"voltorb"],[32,"magneton"],[35,"magneton"],[33,"electabuzz"],[36,"electabuzz"]]],
  ],
  Route23: [
    ["grass", 10, [[26,"ekans"],[33,"ditto"],[26,"spearow"],[38,"fearow"],[38,"ditto"],[38,"fearow"],[41,"arbok"],[43,"ditto"],[41,"fearow"],[43,"fearow"]]],
  ],
  VictoryRoad2F: [
    ["grass", 10, [[22,"machop"],[24,"geodude"],[26,"zubat"],[36,"onix"],[39,"onix"],[42,"onix"],[41,"machoke"],[40,"golbat"],[40,"marowak"],[43,"graveler"]]],
  ],
  VictoryRoad3F: [
    ["grass", 15, [[24,"machop"],[26,"geodude"],[22,"zubat"],[42,"onix"],[40,"venomoth"],[45,"onix"],[43,"graveler"],[41,"golbat"],[42,"machoke"],[45,"machoke"]]],
  ],
  VictoryRoad1F: [
    ["grass", 15, [[24,"machop"],[26,"geodude"],[22,"zubat"],[36,"onix"],[39,"onix"],[42,"onix"],[41,"graveler"],[41,"golbat"],[42,"machoke"],[43,"marowak"]]],
  ],
  DiglettsCave: [
    ["grass", 20, [[18,"diglett"],[19,"diglett"],[17,"diglett"],[20,"diglett"],[16,"diglett"],[15,"diglett"],[21,"diglett"],[22,"diglett"],[29,"dugtrio"],[31,"dugtrio"]]],
  ],
} as const satisfies Record<string, readonly WildTable[]>

type LocationRow = readonly [
  id: string,
  name: string,
  nameEn: string,
  kind: KantoLocation['kind'],
  tileX: number,
  tileY: number,
  encounterTables: readonly (keyof typeof wildTables)[],
  links: readonly string[],
]

const locationRows: readonly LocationRow[] = [
  ["pallet-town","태초마을","Pallet Town","town",2,11,[],["route-1","route-21"]],
  ["viridian-city","상록시티","Viridian City","city",2,8,[],["route-2","route-1","route-22"]],
  ["pewter-city","회색시티","Pewter City","city",2,3,[],["route-2","route-3"]],
  ["cerulean-city","블루시티","Cerulean City","city",10,2,[],["route-24","route-5","route-4","route-9","cerulean-cave"]],
  ["lavender-town","보라타운","Lavender Town","town",14,5,[],["route-10","route-12","route-8","pokemon-tower"]],
  ["vermilion-city","갈색시티","Vermilion City","city",10,9,[],["route-6","route-11","ss-anne"]],
  ["celadon-city","무지개시티","Celadon City","city",7,5,[],["route-16","route-7","rocket-hideout"]],
  ["fuchsia-city","연분홍시티","Fuchsia City","city",8,13,[],["route-19","route-18","route-15","safari-zone"]],
  ["cinnabar-island","홍련섬","Cinnabar Island","city",2,15,[],["route-21","route-20","pokemon-mansion"]],
  ["indigo-plateau","석영고원","Indigo Plateau","league",0,2,[],["route-23"]],
  ["saffron-city","노랑시티","Saffron City","city",10,5,[],["route-5","route-6","route-7","route-8","silph-co"]],
  ["route-1","1번도로","Route 1","route",2,10,["Route1"],["viridian-city","pallet-town"]],
  ["route-2","2번도로","Route 2","route",2,6,["Route2"],["pewter-city","viridian-city","viridian-forest","digletts-cave"]],
  ["route-3","3번도로","Route 3","route",4,3,["Route3"],["route-4","pewter-city","mt-moon"]],
  ["route-4","4번도로","Route 4","route",8,2,["Route4"],["route-3","cerulean-city","mt-moon"]],
  ["route-5","5번도로","Route 5","route",10,3,["Route5"],["cerulean-city","saffron-city"]],
  ["route-6","6번도로","Route 6","route",10,8,["Route6"],["saffron-city","vermilion-city"]],
  ["route-7","7번도로","Route 7","route",8,5,["Route7"],["celadon-city","saffron-city"]],
  ["route-8","8번도로","Route 8","route",13,5,["Route8"],["saffron-city","lavender-town"]],
  ["route-9","9번도로","Route 9","route",13,2,["Route9"],["cerulean-city","route-10"]],
  ["route-10","10번도로","Route 10","route",14,4,["Route10"],["lavender-town","route-9","rock-tunnel","power-plant"]],
  ["route-11","11번도로","Route 11","route",12,9,["Route11"],["vermilion-city","route-12","digletts-cave"]],
  ["route-12","12번도로","Route 12","route",14,9,["Route12"],["lavender-town","route-13","route-11"]],
  ["route-13","13번도로","Route 13","route",13,11,["Route13"],["route-12","route-14"]],
  ["route-14","14번도로","Route 14","route",11,12,["Route14"],["route-15","route-13"]],
  ["route-15","15번도로","Route 15","route",10,13,["Route15"],["fuchsia-city","route-14"]],
  ["route-16","16번도로","Route 16","route",5,5,["Route16"],["route-17","celadon-city"]],
  ["route-17","17번도로","Route 17","route",4,8,["Route17"],["route-16","route-18"]],
  ["route-18","18번도로","Route 18","route",6,13,["Route18"],["route-17","fuchsia-city"]],
  ["route-19","19번도로","Route 19","route",6,15,["SeaRoutes"],["fuchsia-city","route-20"]],
  ["route-20","20번도로","Route 20","route",4,15,["SeaRoutes"],["cinnabar-island","route-19","seafoam-islands"]],
  ["route-21","21번도로","Route 21","route",2,13,["Route21"],["pallet-town","cinnabar-island"]],
  ["route-22","22번도로","Route 22","route",0,8,["Route22"],["route-23","viridian-city"]],
  ["route-23","23번도로","Route 23","route",0,6,["Route23"],["indigo-plateau","route-22","victory-road"]],
  ["route-24","24번도로","Route 24","route",10,1,["Route24"],["cerulean-city","route-25","cerulean-cave"]],
  ["route-25","25번도로","Route 25","route",11,0,["Route25"],["route-24","sea-cottage"]],
  ["viridian-forest","상록숲","Viridian Forest","dungeon",2,4,["ViridianForest"],["route-2"]],
  ["mt-moon","달맞이산","Mt. Moon","dungeon",6,2,["MtMoon1F","MtMoonB1F","MtMoonB2F"],["route-3","route-4"]],
  ["rock-tunnel","돌산터널","Rock Tunnel","dungeon",14,3,["RockTunnel1F","RockTunnelB1F"],["route-10"]],
  ["power-plant","무인발전소","Power Plant","dungeon",15,4,["PowerPlant"],["route-10"]],
  ["sea-cottage","바닷가 오두막","Sea Cottage","dungeon",12,0,[],["route-25"]],
  ["ss-anne","상트앙느호","S.S. Anne","dungeon",9,10,[],["vermilion-city"]],
  ["victory-road","챔피언로드","Victory Road","dungeon",0,4,["VictoryRoad1F","VictoryRoad2F","VictoryRoad3F"],["route-23"]],
  ["pokemon-tower","포켓몬타워","Pokémon Tower","dungeon",15,5,["PokemonTower3F","PokemonTower4F","PokemonTower5F","PokemonTower6F","PokemonTower7F"],["lavender-town"]],
  ["safari-zone","사파리존","Safari Zone","dungeon",8,12,["SafariZoneCenter","SafariZoneEast","SafariZoneNorth","SafariZoneWest"],["fuchsia-city"]],
  ["seafoam-islands","쌍둥이섬","Seafoam Islands","dungeon",5,15,["SeafoamIslands1F","SeafoamIslandsB1F","SeafoamIslandsB2F","SeafoamIslandsB3F","SeafoamIslandsB4F"],["route-20"]],
  ["pokemon-mansion","포켓몬저택","Pokémon Mansion","dungeon",2,15,["PokemonMansion1F","PokemonMansion2F","PokemonMansion3F","PokemonMansionB1F"],["cinnabar-island"]],
  ["digletts-cave","디그다의굴","Diglett's Cave","dungeon",3,4,["DiglettsCave"],["route-2","route-11"]],
  ["rocket-hideout","로켓단아지트","Rocket Hideout","dungeon",7,5,[],["celadon-city"]],
  ["silph-co","실프주식회사","Silph Co.","dungeon",10,5,[],["saffron-city"]],
  ["cerulean-cave","블루동굴","Cerulean Cave","dungeon",9,1,["CeruleanCave1F","CeruleanCave2F","CeruleanCaveB1F"],["cerulean-city","route-24"]],
]

const gyms: Readonly<Partial<Record<string, KantoGym>>> = {
  'pewter-city': { leader: '웅', type: 'rock', badge: '회색배지' },
  'cerulean-city': { leader: '이슬', type: 'water', badge: '블루배지' },
  'vermilion-city': { leader: '마티스', type: 'electric', badge: '오렌지배지' },
  'celadon-city': { leader: '민화', type: 'grass', badge: '레인보우배지' },
  'fuchsia-city': { leader: '독수', type: 'poison', badge: '핑크배지' },
  'saffron-city': { leader: '초련', type: 'psychic', badge: '골드배지' },
  'cinnabar-island': { leader: '강연', type: 'fire', badge: '크림슨배지' },
  'viridian-city': { leader: '비주기', type: 'ground', badge: '그린배지' },
}

const legends: Readonly<Partial<Record<string, readonly KantoEncounter[]>>> = {
  'seafoam-islands': [{ speciesId: 'articuno', level: 50, weight: 1 }],
  'power-plant': [{ speciesId: 'zapdos', level: 50, weight: 1 }],
  'victory-road': [{ speciesId: 'moltres', level: 50, weight: 1 }],
  'cerulean-cave': [{ speciesId: 'mewtwo', level: 70, weight: 1 }],
}

function mergeEncounters(tables: LocationRow[6]): KantoEncounter[] {
  const encounters = new Map<string, KantoEncounter>()
  for (const table of tables) {
    for (const [, rate, slots] of wildTables[table]) {
      // A desktop area covers the original floor group. Keep each table's slot ratios
      // and use their original encounter rates when pooling different floors or terrain.
      slots.forEach(([level, speciesId], index) => {
        const key = speciesId + ':' + level
        const weight = rate * slotWeights[index]
        const existing = encounters.get(key)
        if (existing) existing.weight += weight
        else encounters.set(key, { speciesId, level, weight })
      })
    }
  }
  return [...encounters.values()]
}

export const kantoLocations: readonly KantoLocation[] = locationRows.map(
  ([id, name, nameEn, kind, tileX, tileY, tables, links]) => ({
    id, name, nameEn, kind, links,
    x: tileX * 8 + 20,
    y: tileY * 8 + 12,
    encounters: mergeEncounters(tables),
    gym: gyms[id],
    legends: legends[id],
  }),
)

export const kantoLocationById: Readonly<Record<string, KantoLocation>> = Object.fromEntries(
  kantoLocations.map((location) => [location.id, location]),
)

export const kantoRegion = {
  id: 'kanto',
  name: '관동지방',
  generation: 1,
  startLocationId: KANTO_START_LOCATION_ID,
  leagueLocationId: 'indigo-plateau',
  gymLocationIds: Object.keys(gyms),
  locations: kantoLocations,
} as const
