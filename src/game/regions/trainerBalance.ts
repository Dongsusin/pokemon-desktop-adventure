import { fieldTrainerById, fieldReservePlan } from './fieldTrainers'
import type { KantoTrainer, KantoTrainerMember } from './kantoCampaign'
import { locationGateRules } from './locationGates'
import type { WorldRegion } from './world'

// Specialists whose source party is small or loses members to the motion filter.
const regionalReserves: Readonly<Record<string, readonly string[] | undefined>> = {
  'lance': ['charizard', 'kingdra'],
  'johto-whitney': ['wigglytuff'],
  'johto-chuck': ['hitmontop', 'machamp'],
  'johto-jasmine': ['skarmory'],
  'johto-pryce': ['cloyster', 'lapras'],
  'johto-clair': ['gyarados', 'aerodactyl', 'altaria', 'dragonite'],
  'blaine': ['magmar'],
  'hoenn-tate-liza': ['gardevoir'],
  'sinnoh-wake': ['pelipper'],
  'sinnoh-byron': ['bronzong'],
  'sinnoh-candice': ['glaceon'],
  'sinnoh-volkner': ['electrode'],
  'unova-elesa': ['galvantula'],
  'unova-clay': ['golurk'],
  'unova-skyla': ['unfezant'],
  'unova-drayden': ['salamence', 'altaria'],
  'unova-marlon': ['mantine', 'starmie', 'lapras', 'seismitoad'],
  'unova-shauntal': ['froslass'],
  'unova-grimsley': ['sharpedo'],
  'unova-caitlin': ['metagross'],
  'unova-marshal': ['lucario', 'machamp'],
  'kalos-clemont': ['luxray'],
  'kalos-valerie': ['azumarill'],
  'kalos-olympia': ['espeon', 'gardevoir'],
  'kalos-wulfric': ['mamoswine', 'glalie'],
  'kalos-malva': ['houndoom', 'arcanine'],
  'kalos-siebold': ['milotic'],
  'kalos-drasna': ['dragonite'],
  'kalos-wikstrom': ['bronzong'],
  'alola-olivia': ['gigalith'],
  'alola-nanu': ['absol', 'krookodile'],
  'alola-hapu': ['krookodile'],
  'alola-kahili': ['braviary'],
  'galar-gordie': ['tyranitar'],
  'galar-piers': ['toxtricity'],
  'galar-raihan': ['goodra'],
  'galar-bede': ['sylveon'],
  'galar-bea-cup': ['hitmontop', 'pangoro'],
  'paldea-larry': ['braviary'],
  'paldea-tulip': ['gallade', 'espeon'],
  'paldea-grusha': ['weavile'],
  'paldea-poppy': ['steelix'],
  'paldea-larry-elite': ['braviary'],
  'paldea-geeta': ['dragapult'],
  'paldea-nemona': ['kommo-o']
}

function addReserves(trainer: KantoTrainer, team: readonly KantoTrainerMember[], size: number) {
  const needed = size - team.length
  if (needed <= 0) return team
  const picks = (regionalReserves[trainer.id] ?? []).filter(id => !team.some(m => m.speciesId === id)).slice(0, needed)
  const reserves = picks.map(speciesId => ({ speciesId, level: 1, plan: fieldReservePlan(speciesId) }))
  return [...team.slice(0, -1), ...reserves, team[team.length - 1]]
}

export function balanceTrainerTeam(region: WorldRegion, trainer: KantoTrainer, members: readonly KantoTrainerMember[], leagueWins: number) {
  let team = members
  let ace: number
  if (trainer.role === 'field') {
    const gate = locationGateRules[region.id][trainer.locationId]
    const stage = Math.floor(8 * gate / region.gymTrainers.length)
    const field = fieldTrainerById[trainer.id]!
    const tierBonus = field.tier ? { D: 0, C: 2, B: 4, A: 6, S: 8 }[field.tier] : 8
    const cap = region.levelCaps[gate]
    ace = (stage === 8 ? 78 : cap - 11) + tierBonus + (region.locationById[trainer.locationId].kind === 'dungeon' ? 1 : 0)
    const size = [2, 3, 3, 4, 4, 5, 5, 5, 6][stage]
    if (team.length > size) {
      // Hop brings his route companions here and keeps his legendary for later battles.
      const routePartner = trainer.id === 'field-galar-hop' ? team.slice(1).find(m => m.speciesId === 'corviknight') : undefined
      const aceMember = routePartner ?? team[team.length - 1]
      const middle = team.slice(1).filter(m => m !== aceMember)
      const selected = [...middle].sort((a, b) => Number(Boolean(b.plan?.powers?.length)) - Number(Boolean(a.plan?.powers?.length))).slice(0, size - 2)
      team = [team[0], ...middle.filter(m => selected.includes(m)), aceMember]
    }
  } else if (trainer.role === 'gym') {
    const index = region.gymTrainers.findIndex(t => t.id === trainer.id)
    ace = region.levelCaps[index] - Math.max(0, 6 - index)
    if (trainer.trialKind !== 'totem') team = addReserves(trainer, team, index < 2 ? 2 : index < 4 ? 3 : index < 6 ? 4 : 5)
  } else {
    const rounds = region.leagueTrainers.length - 1
    const first = region.levelCaps[region.gymTrainers.length - 1] + 8
    const round = region.freeEliteOrder ? leagueWins : region.leagueTrainers.findIndex(t => t.id === trainer.id)
    ace = trainer.id === region.finaleTrainer?.id ? 100 : trainer.role === 'champion' ? 96
      : first + Math.round((89 - first) * round / Math.max(1, rounds - 1))
    team = addReserves(trainer, team, trainer.role === 'champion' ? 6 : 5)
  }
  return team.map((member, index) => ({ ...member, level: ace - (team.length - 1 - index) }))
}
