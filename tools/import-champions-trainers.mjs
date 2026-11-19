// Run with Node 22.12+ against a trusted checkout of the original Champions Arena game.
// node tools/import-champions-trainers.mjs <path-to-pokemon-champions-ai-web> [--check]
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [source, check] = process.argv.slice(2)
assert(source, 'Pass the original Champions Arena checkout directory.')
assert(check === undefined || check === '--check', 'Expected --check or no second argument.')
const loadSource = file => import(pathToFileURL(resolve(source, 'src/data', file)).href)
const { trainers } = JSON.parse(await readFile(resolve(source, 'src/data/generatedTrainerTeams.json'), 'utf8'))
const { BOSS_CHALLENGES } = await loadSource('bossChallenge.js')
const { createFactoryRun, selectFactoryRentals, FACTORY_TRAINER } = await loadSource('battleFactory.js')
const { getSpeciesProfile } = await loadSource('trainingData.js')
const { actors } = JSON.parse(await readFile(new URL('../src/game/resonance-motions.json', import.meta.url), 'utf8'))
const target = new URL('../src/game/regions/champions-arena-roster.json', import.meta.url)
const poseBySlug = new Map(Object.keys(actors).map(actor => [actor.split('/').at(-1), actor]))
const types = Object.fromEntries(Object.entries({normal:'노말', fire:'불꽃', water:'물', electric:'전기', grass:'풀',
  ice:'얼음', fighting:'격투', poison:'독', ground:'땅', flying:'비행', psychic:'에스퍼', bug:'벌레', rock:'바위',
  ghost:'고스트', dragon:'드래곤', dark:'악', steel:'강철', fairy:'페어리', stellar:'스텔라'}).map(([id, ko]) => [ko, id]))
const skipped = new Map()
function projectTeam(team) {
  const members = []
  for (const pokemon of team.pokemon) {
    const slug = pokemon.slug ?? getSpeciesProfile(pokemon.speciesId).slug
    const actor = poseBySlug.get(slug)
    if (!actor) {
      skipped.set(slug, (skipped.get(slug) ?? 0) + 1)
      continue
    }
    const powers = team.battleGimmicks.filter(power => power.pokemonSlug === slug ||
      power.pokemonName === (pokemon.name ?? getSpeciesProfile(pokemon.speciesId).name))
    const tera = powers.find(power => power.type === 'terastallization')
    const max = powers.find(power => power.type === 'gigantamax' || power.type === 'dynamax')
    const ability = {levitate:'levitate', waterabsorb:'water-absorb'}[pokemon.abilityId]
    const [speciesId, formId] = actor.split('/')
    members.push({speciesId, ...(formId && {formId}), ...(tera && types[tera.teraType] && {teraType:types[tera.teraType]}),
      ...(max && {dynamax:max.type}), ...(ability && {abilityId:ability})})
  }
  assert(members.length, 'A source team has no supported members.')
  return members
}
const roster = trainers.map(t => ({id:t.id, name:t.name, tier:t.tier, origin:t.region, teams:t.teams.map(projectTeam)}))
const raids = [
  ['mewtwo', 0, 'd-193'], ['mewtwo', 1, 'b-045'],
  ['hooh', 0, 'boss-proton-petrel'], ['lugia', 0, 'boss-ariana-archer'],
]
for (const [bossId, round, id] of raids) {
  const match = BOSS_CHALLENGES.find(boss => boss.id === bossId).rounds[round]
  const team = projectTeam(match)
  const trainer = roster.find(t => t.id === id)
  if (trainer) trainer.teams.push(team)
  else roster.push({id, name:match.name, origin:'johto', teams:[team]})
}
// The Factory Clown draws rentals instead of having fixed parties. Reproduce three draws
// from the original generator and retain all three slots of each rental team.
const rentals = []
for (let seed = 1; rentals.length < 3; seed++) {
  const run = createFactoryRun({seed, id:'desktop-factory-' + seed, mode:'classic'})
  const withRentals = selectFactoryRentals(run, run.offers.slice(0, 3).map(pokemon => pokemon.captureId))
  if (withRentals.opponentTeam.pokemon.every(pokemon => poseBySlug.has(pokemon.slug))) {
    rentals.push(projectTeam(withRentals.opponentTeam))
  }
}
roster.push({id:FACTORY_TRAINER.id, name:FACTORY_TRAINER.name, tier:FACTORY_TRAINER.tier, origin:FACTORY_TRAINER.region, teams:rentals})
const hash = createHash('sha256').update(JSON.stringify(trainers)).digest('hex')
const output = '{\n  "regularRosterSha256": "' + hash + '",\n  "trainers": [\n' +
  roster.map(t => '    ' + JSON.stringify(t)).join(',\n') + '\n  ]\n}\n'
if (check === '--check') assert.equal((await readFile(target, 'utf8')).replaceAll('\r\n', '\n'), output)
else await writeFile(target, output)
console.log(JSON.stringify({ trainers:roster.length, teams:roster.reduce((n,t)=>n+t.teams.length,0),
  sourceRegularSlots:trainers.flatMap(t=>t.teams).flatMap(t=>t.pokemon).length,
  playableSlots:roster.flatMap(t=>t.teams).flat().length, omitted:Object.fromEntries(skipped) }))
