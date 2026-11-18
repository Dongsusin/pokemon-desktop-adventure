import { supportedEncounters } from './motionEncounters'
import { kantoLocations, kantoLocationById, kantoRegion, type KantoLocation } from './kanto'
import {
  kantoGymTrainerByLocationId, kantoGymTrainers, kantoLeagueChampionForStarter, kantoLeagueTrainers,
  kantoTrainerById, type KantoTrainer
} from './kantoCampaign'
import { johtoLocations, johtoLocationById, johtoRegion } from './johto'
import {
  johtoGymTrainerByLocationId, johtoGymTrainers, johtoLeagueTrainers, johtoTrainerById
} from './johtoCampaign'

import { hoennLocations, hoennLocationById, hoennRegion } from './hoenn'
import {
  hoennGymTrainerByLocationId, hoennGymTrainers, hoennLeagueTrainers, hoennTrainerById
} from './hoennCampaign'

import { sinnohLocations, sinnohLocationById, sinnohRegion } from './sinnoh'
import {
  sinnohGymTrainerByLocationId, sinnohGymTrainers, sinnohLeagueTrainers, sinnohTrainerById
} from './sinnohCampaign'

import { unovaLocations, unovaLocationById, unovaRegion } from './unova'
import {
  unovaGymTrainerByLocationId, unovaGymTrainers, unovaLeagueTrainers, unovaTrainerById
} from './unovaCampaign'

import { kalosLocations, kalosLocationById, kalosRegion } from './kalos'
import {
  kalosGymTrainerByLocationId, kalosGymTrainers, kalosLeagueTrainers, kalosTrainerById
} from './kalosCampaign'

import { alolaLocations, alolaLocationById, alolaRegion } from './alola'
import {
  alolaGymTrainerByLocationId, alolaGymTrainers, alolaLeagueTrainers, alolaTrainerById, alolaChampionForStarter
} from './alolaCampaign'

import { galarLocations, galarLocationById, galarRegion } from './galar'
import {
  galarGymTrainerByLocationId, galarGymTrainers, galarLeagueTrainers, galarTrainerById, galarTrainerForStarter
} from './galarCampaign'

import { paldeaLocations, paldeaLocationById, paldeaRegion } from './paldea'
import {
  paldeaGymTrainerByLocationId, paldeaGymTrainers, paldeaLeagueTrainers, paldeaTrainerById,
  paldeaNemona, paldeaTrainerForStarter
} from './paldeaCampaign'

export const regionOrder = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'] as const
export type RegionId = typeof regionOrder[number]

export interface WorldRegion {
  id: RegionId
  name: string
  generation: number
  firstSaveVersion: number
  freeEliteOrder?: boolean
  startLocationId: string
  leagueLocationId: string
  locations: readonly KantoLocation[]
  locationById: Readonly<Record<string, KantoLocation>>
  gymTrainers: readonly KantoTrainer[]
  gymTrainerByLocationId: Readonly<Record<string, KantoTrainer | undefined>>
  leagueTrainers: readonly KantoTrainer[]
  trainerById: Readonly<Record<string, KantoTrainer | undefined>>
  levelCaps: readonly number[]
  finaleTrainer?: KantoTrainer
  trainerForStarter?: (trainer: KantoTrainer, speciesId: string) => KantoTrainer
  championForStarter?: (speciesId: string) => KantoTrainer
}

// Regional campaigns open at 25, then gain a cap per local badge.
// League qualification unlocks 100, as specified for this game.
const badgeLevelCaps = [25, 30, 35, 40, 45, 50, 55, 60, 100] as const

const regionalData: Readonly<Record<RegionId, WorldRegion>> = {
  kanto: {
    ...kantoRegion,
    firstSaveVersion: 1,
    locations: kantoLocations,
    locationById: kantoLocationById,
    gymTrainers: kantoGymTrainers,
    gymTrainerByLocationId: kantoGymTrainerByLocationId,
    leagueTrainers: kantoLeagueTrainers,
    trainerById: kantoTrainerById,
    levelCaps: badgeLevelCaps,
    championForStarter: kantoLeagueChampionForStarter,
  },
  johto: {
    ...johtoRegion,
    firstSaveVersion: 6,
    locations: johtoLocations,
    locationById: johtoLocationById,
    gymTrainers: johtoGymTrainers,
    gymTrainerByLocationId: johtoGymTrainerByLocationId,
    leagueTrainers: johtoLeagueTrainers,
    trainerById: johtoTrainerById,
    levelCaps: badgeLevelCaps,
  },
  hoenn: {
    ...hoennRegion,
    firstSaveVersion: 7,
    locations: hoennLocations,
    locationById: hoennLocationById,
    gymTrainers: hoennGymTrainers,
    gymTrainerByLocationId: hoennGymTrainerByLocationId,
    leagueTrainers: hoennLeagueTrainers,
    trainerById: hoennTrainerById,
    levelCaps: badgeLevelCaps,
  },
  sinnoh: {
    ...sinnohRegion,
    firstSaveVersion: 8,
    locations: sinnohLocations,
    locationById: sinnohLocationById,
    gymTrainers: sinnohGymTrainers,
    gymTrainerByLocationId: sinnohGymTrainerByLocationId,
    leagueTrainers: sinnohLeagueTrainers,
    trainerById: sinnohTrainerById,
    levelCaps: badgeLevelCaps,
  },
  unova: {
    ...unovaRegion,
    firstSaveVersion: 9,
    freeEliteOrder: true,
    locations: unovaLocations,
    locationById: unovaLocationById,
    gymTrainers: unovaGymTrainers,
    gymTrainerByLocationId: unovaGymTrainerByLocationId,
    leagueTrainers: unovaLeagueTrainers,
    trainerById: unovaTrainerById,
    levelCaps: badgeLevelCaps,
  },
  kalos: {
    ...kalosRegion,
    firstSaveVersion: 10,
    freeEliteOrder: true,
    locations: kalosLocations,
    locationById: kalosLocationById,
    gymTrainers: kalosGymTrainers,
    gymTrainerByLocationId: kalosGymTrainerByLocationId,
    leagueTrainers: kalosLeagueTrainers,
    trainerById: kalosTrainerById,
    levelCaps: badgeLevelCaps,
  },
  alola: {
    ...alolaRegion,
    firstSaveVersion: 11,
    freeEliteOrder: true,
    locations: alolaLocations,
    locationById: alolaLocationById,
    gymTrainers: alolaGymTrainers,
    gymTrainerByLocationId: alolaGymTrainerByLocationId,
    leagueTrainers: alolaLeagueTrainers,
    trainerById: alolaTrainerById,
    championForStarter: alolaChampionForStarter,
    levelCaps: [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 100],
  },
  galar: {
    ...galarRegion,
    firstSaveVersion: 12,
    locations: galarLocations,
    locationById: galarLocationById,
    gymTrainers: galarGymTrainers,
    gymTrainerByLocationId: galarGymTrainerByLocationId,
    leagueTrainers: galarLeagueTrainers,
    trainerById: galarTrainerById,
    trainerForStarter: galarTrainerForStarter,
    levelCaps: badgeLevelCaps,
  },
  paldea: {
    ...paldeaRegion,
    firstSaveVersion: 13,
    locations: paldeaLocations,
    locationById: paldeaLocationById,
    gymTrainers: paldeaGymTrainers,
    gymTrainerByLocationId: paldeaGymTrainerByLocationId,
    leagueTrainers: paldeaLeagueTrainers,
    trainerById: paldeaTrainerById,
    trainerForStarter: paldeaTrainerForStarter,
    finaleTrainer: paldeaNemona,
    levelCaps: badgeLevelCaps,
  },
}

// Every map lookup shares the same playable encounter tables, including offline exploration.
export const worldRegions = Object.fromEntries<WorldRegion>(regionOrder.map(id => {
  const region = regionalData[id]
  const locations = region.locations.map(location => ({
    ...location,
    encounters: supportedEncounters(id, location.id, location.encounters),
    legends: location.legends && supportedEncounters(id, location.id, location.legends),
  }))
  return [id, { ...region, locations, locationById: Object.fromEntries(locations.map(location => [location.id, location])) }]
})) as Readonly<Record<RegionId, WorldRegion>>

export const worldLocationById: Readonly<Record<string, KantoLocation>> =
  Object.assign(Object.create(null), ...regionOrder.map(id => worldRegions[id].locationById))

export function isRegionId(value: unknown): value is RegionId {
  return regionOrder.some(id => id === value)
}
