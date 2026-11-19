import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { species } from '../src/game/catalog'
import { moves } from '../src/game/engine'
import { pokemonForms, formStats, validForm } from '../src/game/forms'
import { gimmickMoveName, megaFormFor, megaFormsFor, megaForms, regionGimmick } from '../src/game/battleGimmicks'
import { firingPose } from '../src/game/arenaMuzzle'
import { isMoveMotionAvailable, isMoveMotionSupported, isSpeciesMotionSupported } from '../src/game/motionEligibility'

type Strip = [number, number, number, number, number, number, number[], number?, number?]
type Atlas = { idle: Strip; walk: Strip; attack: Strip; charge?: Strip; shoot?: Strip; hurt?: Strip }
const metadata: Record<string, Atlas> = JSON.parse(readFileSync('src/renderer/battle-atlases.json', 'utf8'))
const spriteDir = 'assets/battle/sprites'

describe('offline Resonance artwork', () => {
  it('ships only actors with dedicated eight-direction walk and attack strips', () => {
    const bases = Object.values(species).filter(mon => isSpeciesMotionSupported(mon.id))
    const forms = Object.entries(pokemonForms).filter(([id, form]) => isSpeciesMotionSupported(form.base, id))
    expect([bases.length, forms.length]).toEqual([961, 44])
    const keys = [...bases.map(mon => String(mon.pokedexNumber)), ...forms.map(([key]) => key), ...Object.keys(megaForms)].sort()
    expect(Object.keys(metadata).sort()).toEqual(keys)
    expect(readdirSync(spriteDir).sort()).toEqual(keys.map(key => key + '.png').sort())
    for (const atlas of Object.values(metadata)) {
      for (const strip of [atlas.walk, atlas.attack]) {
        if (strip[5] !== 8 || strip[6].length < 2) throw Error('Missing directional motion')
      }
    }
  })

  it('matches battle-only transformations to a native actor, source stats, muzzle and portrait', () => {
    expect(Object.keys(megaForms)).toHaveLength(87)
    expect(new Set(Object.values(megaForms).map(form => form.from)).size).toBe(81)
    for (const [id, form] of Object.entries(megaForms)) {
      expect(megaFormsFor(form.base, form.from === form.base ? undefined : form.from)).toContain(id)
      expect(isSpeciesMotionSupported(form.base, id)).toBe(true)
      expect(validForm(form.base, id)).toBeUndefined()
      expect(firingPose({ dex: species[form.base].pokedexNumber, formId: id })?.mouth).toHaveLength(16)
      const portrait = readFileSync(join('assets/battle/gimmicks/portraits', id + '.png'))
      expect(portrait.readUInt32BE(16)).toBeGreaterThan(0)
      expect(Object.values(form.baseStats).every(n => Number.isInteger(n) && n > 0)).toBe(true)
    }
    expect(megaFormsFor('charizard')).toEqual(['charizard-mega-x', 'charizard-mega-y'])
    expect(megaFormsFor('lucario')).toEqual(['lucario-mega', 'lucario-mega-z'])
    expect(megaFormFor('charizard')).toBe('charizard-mega-x')
    expect(formStats('charizard', megaFormFor('charizard'))).toMatchObject({ types: ['fire', 'dragon'], baseStats: { attack: 130 } })
    expect(megaFormFor('raichu', 'raichu-alola')).toBeUndefined()
    expect(megaFormFor('squirtle', 'charizard')).toBeUndefined()
    expect(isMoveMotionSupported('blastoise', 'blastoise-mega', 'waterGun')).toBe(false)
    expect(isMoveMotionSupported('charizard', 'charizard-mega-x', 'ember')).toBe(true)
  })

  it('packages animated activation art and maps original Korean powered move names', () => {
    expect(['kanto', 'kalos', 'alola', 'galar', 'paldea'].map(regionGimmick)).toEqual([undefined, 'mega', 'z', 'dynamax', 'tera'])
    expect(gimmickMoveName('z', 'water')).toBe('슈퍼아쿠아토네이도')
    expect(gimmickMoveName('dynamax', 'fire')).toBe('다이번')
    for (const id of ['mega', 'z']) {
      const webp = readFileSync(join('assets/battle/gimmicks', id + '.webp'))
      expect(webp.toString('ascii', 0, 4)).toBe('RIFF')
      expect(webp.indexOf('ANIM')).toBeGreaterThan(0)
      expect(webp.indexOf('ANMF')).toBeGreaterThan(0)
    }
  })

  it('keeps every directional frame and impact marker inside its shipped sheet', () => {
    for (const [key, atlas] of Object.entries(metadata)) {
      const png = readFileSync(join(spriteDir, key + '.png'))
      const width = png.readUInt32BE(16), height = png.readUInt32BE(20)
      for (const [name, strip] of Object.entries(atlas)) {
        const [y, w, h, , , rows, durations, hit, back] = strip
        const total = durations.reduce((sum: number, t: number) => sum + t, 0)
        const inside = w > 0 && h > 0 && w * durations.length <= width && y >= 0 && y + h * rows <= height
        const markers = hit === undefined || (back !== undefined && hit >= 0 && back >= hit && back <= total)
        if (!inside || !markers || total < 1) throw Error('Invalid ' + key + '/' + name + ' sprite strip')
      }
    }
  })

  it('requires matching form identity and a real release for a ranged move', () => {
    expect(isSpeciesMotionSupported('rattata', 'rattata-alola')).toBe(true)
    for (const [speciesId, formId] of [['miraidon', undefined], ['beedrill', undefined],
      ['charizard', 'charizard-gmax'], ['pikachu', 'rattata-alola'], ['__proto__', undefined],
      ['rattata/rattata-alola', undefined], ['rattata', '']]) {
      expect(isSpeciesMotionSupported(speciesId!, formId)).toBe(false)
      expect(isMoveMotionSupported(speciesId!, formId, 'tackle')).toBe(false)
    }
    expect(isMoveMotionSupported('clefairy', undefined, 'tackle')).toBe(true)
    expect(isMoveMotionSupported('clefairy', undefined, 'waterGun')).toBe(false)
    expect(isMoveMotionSupported('arceus', undefined, 'waterGun')).toBe(false)
    expect(isMoveMotionSupported('squirtle', undefined, 'waterGun')).toBe(true)
    expect(isMoveMotionSupported('charmander', undefined, 'ember')).toBe(true)
    for (const id of ['maxFlare', 'gmaxWildfire', '__proto__', 'notAMove']) {
      expect(isMoveMotionAvailable(id)).toBe(false)
      expect(isMoveMotionSupported('charizard', undefined, id)).toBe(false)
    }
  })

  it('packages each original move timeline and every referenced effect image', () => {
    type Clip = { id: string; src: string; sheet: string | null; img?: string[]; n: number; f: number[][]; spr?: number[][] }
    const clips: Record<string, Clip> = JSON.parse(readFileSync('src/renderer/move-clips.json', 'utf8'))
    expect(Object.keys(clips).sort()).toEqual(Object.keys(moves).sort())
    expect(Object.keys(clips)).toHaveLength(23)
    const files = new Set(['CREDITS.txt'])
    for (const [id, clip] of Object.entries(clips)) {
      expect(isMoveMotionAvailable(id)).toBe(true)
      expect([clip.id, clip.src]).toEqual([id.toUpperCase(), 'Move:' + id.toUpperCase()])
      expect(clip.n).toBeGreaterThan(1)
      expect(clip.f).toHaveLength(clip.n)
      if (clip.sheet) {
        files.add(clip.sheet)
        const png = readFileSync(join('assets/battle/moves', clip.sheet))
        const cols = png.readUInt32BE(16) / 192, rows = png.readUInt32BE(20) / 192
        expect(cols).toBeLessThanOrEqual(5)
        for (const cels of clip.f) {
          expect(cels.length % 9).toBe(0)
          for (let i = 2; i < cels.length; i += 9) {
            expect(cels[i]).toBeGreaterThanOrEqual(0)
            expect(cels[i] % 5).toBeLessThan(cols)
            expect(Math.floor(cels[i] / 5)).toBeLessThan(rows)
          }
        }
      } else {
        expect(clip.spr?.length).toBeGreaterThan(1)
      }
      for (const image of clip.img ?? []) files.add(image)
    }
    expect(readdirSync('assets/battle/moves').sort()).toEqual([...files].sort())
  })
})
