// node tools/import-champions-moves.mjs <Champions Arena checkout> <Resonance v3.0.0 app.asar> [--check]
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, basename, normalize } from 'node:path'
import { extractFile, listPackage } from '@electron/asar'

const [source, archive, check] = process.argv.slice(2)
assert(source && archive && (!check || check === '--check'))
const root = new URL('../', import.meta.url)
const json = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'))
const roster = await json('src/game/regions/champions-arena-roster.json')
const existing = (await json('src/game/resonance-motions.json')).moves
const requested = new Set(roster.trainers.flatMap(t => t.teams.flat().flatMap(m => m.plan.moves)))
const original = JSON.parse(await readFile(resolve(source, 'src/data/generatedBattleMoves.json'), 'utf8')).moves
const byId = new Map(original.map(move => [move.id, move]))
const originalFile = path => extractFile(archive, normalize(path))
const kinds = JSON.parse(originalFile('dist/data/move-kinds.json')).moves
const files = new Set(listPackage(archive).map(path => path.replaceAll('\\','/').replace(/^\//,'')))
const moves = {}, clips = {}, sounds = {}, images = new Set(), audio = new Set()
const stages = { atk:'attack', def:'defense', spa:'spAttack', spd:'spDefense', spe:'speed' }
const shapes = { dash:'dash', leap:'dash', vanish:'dash', skyStrike:'dash', strike:'strike', cone:'cone',
  shot:'projectile', volley:'volley', beam:'beam', burst:'pulse', groundArea:'area', lob:'lob', vortex:'area' }

for (const id of [...requested].sort()) {
  const move = byId.get(id.toLowerCase()), key = id.toUpperCase()
  const sourceMove = kinds[key], file = 'dist/data/anims/moves/' + key + '.json'
  if (!move || sourceMove?.from !== 'map' || !files.has(file)) continue
  const effects = sourceMove.effects ?? []
  let shape = shapes[sourceMove.kind], category = move.categoryId, power = move.power
  const extra = {}
  if (category === 'status') {
    shape = 'self'
    const heal = effects.find(e => e.op === 'heal' && ['user','userAndAllies'].includes(e.who) && e.frac > 0 && !e.over)
    if (sourceMove.kind === 'heal' && heal) {
      category = 'healing'
      power = Math.round(100 * heal.frac)
    } else if (sourceMove.kind === 'selfBuff') {
      const boosts = {}
      for (const effect of effects.filter(e => e.op === 'stat' && e.who === 'user')) {
        for (const [stat, change] of Object.entries(effect.stages)) if (stages[stat]) boosts[stages[stat]] = change
      }
      if (!Object.values(boosts).some(amount => amount > 0)) continue
      extra.stages = boosts
    } else if (['protect','detect'].includes(move.id)) extra.guard = true
    else continue
  } else if (!shape || !(power > 0)) continue
  for (const e of effects) {
    if (e.op === 'switch' && e.who === 'user' && e.free) extra.pivot = true
    if (e.op === 'drain' && e.frac > 0) extra.drain = e.frac
    if (e.op === 'recoil' && e.of === 'dealt' && e.frac > 0) extra.recoil = e.frac
  }
  const clip = JSON.parse(originalFile(file))
  if (clip.id !== key || clip.src !== 'Move:' + key || clip.n < 2 || clip.n !== clip.f.length ||
      !(clip.f.some(frame => frame.length) || clip.spr?.length || clip.ov?.length)) continue
  moves[id] = { nameKo:move.name, type:move.typeId, power:power ?? 0, category, shape, priority:move.priority ?? 0,
    pose:existing[id] ?? (['strike','dash'].includes(sourceMove.kind) ? 'attack' : 'shoot'), ...extra }
  if (Object.hasOwn(existing,id)) continue
  clips[id] = Object.fromEntries(['id','src','sheet','hue','n','imp','lau','f','spr','ov','img','fx']
    .filter(k => k in clip).map(k => [k,clip[k]]))
  for (const name of [clip.sheet, ...(clip.img ?? [])].filter(Boolean)) images.add(name)
  const cues = (clip.cue ?? []).map(([frame,index]) => ({frame,file:clip.snd?.[index]}))
    .filter(cue => cue.file && files.has('assets/Audio/SE/Anim/' + cue.file))
  if (cues.length) {
    const split = Math.max(0,clip.lau,clip.imp)
    const windup = cues.find(c => c.frame < split), release = cues.find(c => c.frame >= split)
    sounds[id] = { ...(windup && {windup:windup.file}), ...(release && {release:release.file}) }
    for (const file of Object.values(sounds[id])) audio.add(file)
  }
}
const output = async (file, bytes) => {
  const path = new URL(file,root)
  if (check) {
    const saved = await readFile(path)
    if (typeof bytes === 'string') assert.equal(saved.toString().replaceAll('\r\n','\n'), bytes, file)
    else assert(saved.equals(bytes), file)
  } else await writeFile(path,bytes)
}
const records = entries => '{\n' + Object.entries(entries).map(([id,value]) =>
  JSON.stringify(id) + ':' + JSON.stringify(value)).join(',\n') + '\n}\n'
await output('src/game/champions-moves.json', records(moves))
await output('src/renderer/champions-move-clips.json', records(clips))
await output('src/renderer/champions-move-sounds.json', records(sounds))
for (const name of audio) {
  assert.equal(basename(name),name)
  await output('assets/battle/audio/' + encodeURIComponent(name), originalFile('assets/Audio/SE/Anim/' + name))
}
for (const name of images) {
  assert.equal(basename(name),name)
  await output('assets/battle/moves/' + encodeURIComponent(name), originalFile('assets/Graphics/Animations/' + name))
}
console.log(JSON.stringify({requested:requested.size, supported:Object.keys(moves).length, additionalClips:Object.keys(clips).length, sheets:images.size, audio:audio.size}))
