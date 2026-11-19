// node tools/import-campaign-sets.mjs <Champions Arena checkout> [--check]
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const [source, check] = process.argv.slice(2)
assert(source && (!check || check === '--check'))
const root = fileURLToPath(new URL('../', import.meta.url))
const json = async path => JSON.parse(await readFile(path, 'utf8'))
const profiles = await json(resolve(source, 'src/data/generatedPokemonData.json'))
const originalMoves = (await json(resolve(source, 'src/data/generatedBattleMoves.json'))).moves
const bySlug = new Map([...profiles.species, ...profiles.forms].map(profile => [profile.slug, profile]))
const originalById = new Map(originalMoves.map(move => [move.id, move]))
const roster = (await json(resolve(root, 'src/game/regions/champions-arena-roster.json'))).trainers
const techniques = await json(resolve(root, 'src/game/champions-moves.json'))
const server = await createServer({ root, configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null } })
try {
  const { worldRegions } = await server.ssrLoadModule('/src/game/regions/world.ts')
  const { locationForm, formStats } = await server.ssrLoadModule('/src/game/forms.ts')
  const { megaFormsFor } = await server.ssrLoadModule('/src/game/battleGimmicks.ts')
  const { isSpeciesMotionSupported, isMoveMotionSupported } = await server.ssrLoadModule('/src/game/motionEligibility.ts')
  const { typeMultiplier } = await server.ssrLoadModule('/src/game/regions/paldeaTera.ts')
  const names = { 'johto-morty': '유진', 'kalos-olympia': '코지카', 'alola-kukui': '쿠쿠이박사' }
  // Misty's opening Staryu uses its native Water Gun beam in this campaign.
  const storyMoves = { misty: { staryu: 'waterGun' } }
  const allTypes = [...new Set(Object.values(techniques).map(move => move.type))]
  const attacking = move => move.category === 'physical' || move.category === 'special'
  const sets = {}
  let exact = 0, learned = 0

  function buildSet(trainer, member, reference, specialty) {
    const { speciesId, formId, level } = member
    const profile = bySlug.get(formId ?? speciesId) ?? bySlug.get(speciesId)
    const legal = new Set(profile.learnsetMoveIds)
    const { types, baseStats } = formStats(speciesId, formId)
    const limit = level < 20 ? 65 : level < 30 ? 90 : level < 40 ? 105 : 150
    const usable = Object.entries(techniques).filter(([id]) => legal.has(originalById.get(id.toLowerCase())?.number) &&
      isMoveMotionSupported(speciesId, formId, id))
    const lowest = Math.min(...usable.filter(([, m]) => attacking(m)).map(([, m]) => m.power))
    const pool = usable.filter(([, m]) => !attacking(m) || m.power <= Math.max(limit, lowest))
    assert(pool.some(([, m]) => attacking(m)), 'No learned attack: ' + trainer.id + '/' + (formId ?? speciesId))
    const ids = new Set(pool.map(([id]) => id))
    const copies = reference.teams.flat().filter(m => m.speciesId === speciesId && m.formId === formId)
    const fit = plan => plan.moves.filter(id => ids.has(id)).length
    const signature = copies.map(m => m.plan).sort((a, b) => fit(b) - fit(a))[0]
    const role = signature?.role ?? (baseStats.attack > baseStats.spAttack * 1.15 ? 'physical' :
      baseStats.spAttack > baseStats.attack * 1.15 ? 'special' : 'balanced')
    const signatureMove = storyMoves[trainer.id]?.[speciesId]
    const chosen = ids.has(signatureMove) ? [signatureMove] : []
    const weakness = allTypes.filter(type => typeMultiplier(type, types) > 1 || (trainer.type && typeMultiplier(type, [trainer.type]) > 1))
    function pick(candidates) {
      const score = ([id, move]) => {
        const attack = attacking(move)
        const referenceIndex = signature?.moves.indexOf(id) ?? -1
        const signatureBonus = referenceIndex < 0 ? 0 : 58 - referenceIndex
        if (!attack) return signatureBonus + (role === 'support' ? 24 : 7) + (move.category === 'healing' ? 12 : 0)
        const coverage = weakness.filter(type => typeMultiplier(move.type, [type]) > 1 &&
          !chosen.some(other => attacking(techniques[other]) && typeMultiplier(techniques[other].type, [type]) > 1)).length
        const duplicateType = chosen.some(other => attacking(techniques[other]) && techniques[other].type === move.type)
        const offense = move.category === 'physical' ? baseStats.attack : baseStats.spAttack
        const efficiency = offense / Math.max(baseStats.attack, baseStats.spAttack)
        const flags = originalById.get(id.toLowerCase()).flags
        const twoTurns = flags.some(flag => ['charge', 'recharge', 'futuremove'].includes(flag))
        const conditional = ['upperhand', 'focuspunch', 'dreameater', 'steelroller', 'lastresort'].includes(id)
        return signatureBonus + move.power * .24 * efficiency + 28 * efficiency - (twoTurns || conditional ? 45 : 0) +
          (role === move.category ? 10 : 0) +
          (types.includes(move.type) ? 8 : 0) + (duplicateType ? -36 : 8) + 5 * coverage
      }
      const best = candidates.filter(([id]) => !chosen.includes(id)).sort((a, b) => score(b) - score(a))[0]
      if (best) chosen.push(best[0])
    }
    const attacks = pool.filter(([, m]) => attacking(m))
    const thematic = attacks.filter(([, m]) => m.type === specialty)
    const native = attacks.filter(([, m]) => types.includes(m.type))
    if (!chosen.length) pick(thematic.length ? thematic : native.length ? native : attacks)
    const count = level < 16 ? 2 : level < 30 ? 3 : 4
    const utility = pool.filter(([id, move]) => {
      if (attacking(move) || (!signature?.moves.includes(id) && role !== 'support')) return false
      return !move.stages || Object.entries(move.stages).some(([stat, amount]) => amount > 0 &&
        (stat !== 'attack' && stat !== 'spAttack' || chosen.some(attack =>
          techniques[attack].category === (stat === 'attack' ? 'physical' : 'special'))))
    })
    if (count >= 3 && utility.length) pick(utility)
    for (let i = chosen.length; i < count; i++) pick(attacks)
    if (chosen.some(id => signature?.moves.includes(id))) exact++
    else learned++
    return { moves: chosen, role }
  }

  for (const region of Object.values(worldRegions)) {
    const trainers = [...region.gymTrainers, ...region.leagueTrainers, ...(region.finaleTrainer ? [region.finaleTrainer] : [])]
    for (const trainer of trainers.filter(t => t.trialKind !== 'totem')) {
      const reference = roster.find(t => t.name === (names[trainer.id] ?? trainer.name))
      assert(reference, 'Missing Champions Arena trainer: ' + trainer.id)
      const plans = sets[trainer.id] = {}
      for (const starter of ['bulbasaur', 'charmander', 'squirtle']) {
        const variant = region.trainerForStarter?.(trainer, starter) ??
          (trainer.role === 'champion' ? region.championForStarter?.(starter) : undefined) ?? trainer
        const team = variant.team.map(member => ({ ...member,
          formId: member.formId ?? locationForm(region.id, trainer.locationId, member.speciesId),
        })).filter(m => isSpeciesMotionSupported(m.speciesId, m.formId))
        const key = m => (m.formId ?? m.speciesId) + ':' + m.level
        const originalAce = variant.team.at(-1)
        for (const member of team) {
          const ace = member === team.at(-1)
          const specialty = member.teraType ?? (ace ? originalAce.teraType : undefined) ?? trainer.type
          if (!plans[key(member)]) plans[key(member)] = buildSet(trainer, member, reference, specialty)
        }
        const ace = team.at(-1)
        let owner = ace, power
        if (region.id === 'kalos') {
          const options = team.map(m => megaFormsFor(m.speciesId, m.formId).filter(form =>
            plans[key(m)].moves.some(id => attacking(techniques[id]) && isMoveMotionSupported(m.speciesId, form, id))))
          const index = options.findLastIndex(forms => forms.length)
          if (index >= 0) {
            owner = team[index]
            const sourceForms = reference.teams.flat().filter(m => m.speciesId === owner.speciesId && m.formId === owner.formId)
              .flatMap(m => m.plan.powers ?? []).filter(p => p.kind === 'mega').map(p => p.formId)
            power = { kind: 'mega', formId: sourceForms.find(form => options[index].includes(form)) ?? options[index][0] }
          }
        } else if (region.id === 'alola') {
          const attacks = plans[key(ace)].moves.map(id => techniques[id]).filter(attacking)
          const type = [trainer.type, ...formStats(ace.speciesId, ace.formId).types].find(type => attacks.some(m => m.type === type))
          power = { kind: 'z', type: type ?? attacks[0].type }
        } else if (region.id === 'galar' && originalAce.dynamax) {
          power = { kind: 'dynamax', ...(ace.dynamax === 'gigantamax' && !ace.formId &&
            isSpeciesMotionSupported(ace.speciesId, ace.speciesId + '-gmax') && { giant: true }) }
        } else if (region.id === 'paldea' && originalAce.teraType) power = { kind: 'tera', type: originalAce.teraType }
        if (power) plans[key(owner)].powers = [power]
      }
    }
  }
  const path = resolve(root, 'src/game/regions/campaign-sets.json')
  const output = '{\n' + Object.entries(sets).map(([id, plans]) => JSON.stringify(id) + ':' + JSON.stringify(plans)).join(',\n') + '\n}\n'
  if (check) assert.equal((await readFile(path, 'utf8')).replaceAll('\r\n', '\n'), output)
  else await writeFile(path, output)
  console.log(JSON.stringify({ battles: Object.keys(sets).length, trainerSets: exact, speciesSets: learned }))
} finally {
  await server.close()
}
