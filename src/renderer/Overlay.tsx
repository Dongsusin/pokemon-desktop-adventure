import { useEffect, useRef, useState } from 'react'
import { Application, Container, Graphics, ImageSource, Rectangle, Sprite, Texture } from 'pixi.js'
import 'pixi.js/unsafe-eval'
import { battleForm, formStats } from '../game/forms'
import { species } from '../game/catalog'
import { worldLocationById, worldRegions } from '../game/regions/world'
import { DYNAMAX_OPPONENT_SCALE, DYNAMAX_PARTNER_SCALE, activityLabels, effectiveLevel, items, levelCap, playerStats, requiredExp } from '../game/engine'
import type { Effect, GameSave, Position } from '../game/engine'
import { ItemSprite, Pokemon, TeraIcon, spriteUrl, useAdventure } from './shared'

const PARTNER = 'partner'
const MAX_TEXTURES = 24
const SPRITE_HEIGHT = 61
const BALL_LAND = 0.33
const BALL_REVEAL = 0.78
const effectColors: Record<string, string> = {
  normal: '#ffe7aa', fire: '#ff9a50', water: '#67dbff', grass: '#b9f773', bug: '#d0e880',
  flying: '#ccedff', poison: '#f4adff', ground: '#f6c37a', rock: '#e7ca9a', ice: '#a0f2ff',
  electric: '#ffe453', psychic: '#ffa4ec', ghost: '#d3a7ff', fighting: '#ffa584', steel: '#d7e4e9',
  fairy: '#ffd0eb', dark: '#c0a7e3', dragon: '#9eaaff'
}
const itemColors = { common: '#feedad', uncommon: '#b9f773', rare: '#9ddfff', epic: '#ebbbff' }
type Figure = {
  formId?: string
  totem?: boolean
  dynamax?: boolean
  teraType?: string
  id: string
  speciesId: string
  at: Position
  direction: -1 | 1
  moving: boolean
  scale: number
  defeat?: Effect
}
type Display = {
  root: Container
  shape: Graphics
  sprite: Sprite
  requestedId: string
  displayedId: string
}

const phase = (effect: Effect, ahead = 0) =>
  Math.min(1, Math.max(0, (effect.durationMs - effect.remainingMs + ahead) / Math.max(1, effect.durationMs)))
function latestEffect(effects: Effect[], matches: (effect: Effect) => boolean) {
  for (let i = effects.length - 1; i >= 0; i--) {
    if (matches(effects[i])) return effects[i]
  }
}
const anchor = (value: number, margin: number) => 'clamp(' + margin + 'px, ' + value + 'px, calc(100% - ' + margin + 'px))'
const approach = (from: Position, to: Position, t: number) =>
  ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })
const followerId = (instanceId: string) => 'follower:' + instanceId

function ballPosition(effect: Effect, t: number, height: number) {
  const target = effect.target ?? effect.position
  const start = { x: effect.position.x, y: effect.position.y - height * 0.62 }
  const end = { x: target.x, y: target.y - 13 }
  const travel = Math.min(1, t / BALL_LAND)
  const point = approach(start, end, travel)
  const arc = Math.max(0, Math.min(82, Math.min(start.y, end.y) - 15,
    30 + Math.hypot(start.x - end.x, start.y - end.y) * 0.28))
  return { x: point.x, y: point.y - Math.sin(travel * Math.PI) * arc }
}

function ballWobble(t: number) {
  if (t < BALL_LAND || t >= BALL_REVEAL) return 0
  const cycle = (t - BALL_LAND) / (BALL_REVEAL - BALL_LAND) * 3
  return Math.sin(cycle * Math.PI * 2) * Math.pow(Math.sin((cycle % 1) * Math.PI), 0.8)
}

function figures(game: GameSave, evolution?: Effect, capture?: Effect, ahead = 0): Figure[] {
  const player = game.player
  const nearby: Figure[] = game.wild.map(mon => {
    const totem = Boolean(mon.trainerId && worldRegions[game.regionId].trainerById[mon.trainerId]?.totemAura)
    return {
      id: String(mon.id), speciesId: mon.speciesId, formId: battleForm(mon), at: mon.position, direction: mon.direction,
      moving: false, totem, teraType: mon.teraType, dynamax: Boolean(mon.maxActionsLeft), scale: game.settings.spriteScale * (mon.maxActionsLeft ? DYNAMAX_OPPONENT_SCALE : totem ? 1.18 : 0.84)
    }
  })
  if (capture?.captured && capture.speciesId && capture.target && typeof capture.targetActor === 'number'
      && phase(capture, ahead) < BALL_LAND + 0.1 && !nearby.some(mon => mon.id === String(capture.targetActor))) {
    nearby.push({
      id: String(capture.targetActor), speciesId: capture.speciesId, formId: capture.formId, at: capture.target,
      direction: player.position.x >= capture.target.x ? 1 : -1,
      moving: false, scale: game.settings.spriteScale * 0.84
    })
  }
  const followers = game.followers.map(mon => ({
    id: followerId(mon.instanceId), speciesId: mon.speciesId, formId: mon.formId, at: mon.position, direction: mon.direction,
    moving: mon.state === 'WANDER', scale: game.settings.spriteScale
  }))
  const partnerId = evolution && phase(evolution, ahead) < 0.54 && evolution.fromSpeciesId
    ? evolution.fromSpeciesId : player.speciesId
  const defeated: Figure[] = []
  for (const effect of game.effects) {
    if (!game.settings.effects || effect.kind !== 'defeat' || typeof effect.actor !== 'number' || !effect.speciesId) continue
    if (nearby.some(mon => mon.id === String(effect.actor))) continue
    defeated.push({
      id: String(effect.actor), speciesId: effect.speciesId, formId: effect.formId, at: effect.position,
      direction: player.position.x >= effect.position.x ? 1 : -1,
      moving: false, scale: game.settings.spriteScale * 0.84, defeat: effect
    })
  }
  return [{
    id: PARTNER, speciesId: partnerId, formId: partnerId === player.speciesId ? player.formId : evolution?.fromFormId, at: player.position, direction: player.direction,
    moving: ['WANDER', 'SEARCH', 'CHASE', 'LOOT'].includes(player.state),
    teraType: game.wild[0]?.teraType ? formStats(player.speciesId, player.formId).types[0] : undefined,
    dynamax: Boolean(game.wild[0]?.maxActionsLeft), scale: game.settings.spriteScale * (game.wild[0]?.maxActionsLeft ? DYNAMAX_PARTNER_SCALE : 1)
  }, ...followers, ...nearby, ...defeated]
}

function characterTexture(id: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img
      const source = new ImageSource({ resource: img, scaleMode: 'nearest' })
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      let frame: Rectangle | undefined
      try {
        if (context) {
          context.drawImage(img, 0, 0)
          const { data } = context.getImageData(0, 0, width, height)
          let left = width, right = -1, top = height, bottom = -1
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (!data[(y * width + x) * 4 + 3]) continue
              left = Math.min(left, x)
              right = Math.max(right, x)
              top = Math.min(top, y)
              bottom = Math.max(bottom, y)
            }
          }
          if (right >= 0) frame = new Rectangle(left, top, right - left + 1, bottom - top + 1)
        }
      } catch {
        // Some WebGL environments restrict reading image pixels. Use the original frame.
      }
      resolve(new Texture({ source, frame }))
    }
    img.onerror = reject
    img.src = spriteUrl(id)
  })
}

function colorFor(effect: Effect) {
  return effectColors[effect.moveType || 'normal'] ?? effectColors.normal
}

function diamond(draw: Graphics, x: number, y: number, radius: number, color: string, alpha: number) {
  draw.poly([x, y - radius, x + radius, y, x, y + radius, x - radius, y]).fill({ color, alpha })
}

function drawAttack(draw: Graphics, effect: Effect, t: number, offset: number) {
  if (!effect.target) return
  const from = { x: effect.position.x, y: effect.position.y - offset }
  const to = { x: effect.target.x, y: effect.target.y - offset * 0.9 }
  const color = colorFor(effect)
  const alpha = Math.min(1, (1 - t) * 3.5)
  const travel = Math.min(1, t / 0.62)
  const { x, y } = approach(from, to, travel)
  const isCharge = ['normal', 'fighting', 'flying', 'bug'].includes(effect.moveType || 'normal')
  const isLeaf = effect.moveType === 'grass'
  const isWater = effect.moveType === 'water' || effect.moveType === 'ice'
  if (isCharge) {
    const normal = { x: from.y - to.y, y: to.x - from.x }
    const divisor = Math.max(1, Math.hypot(normal.x, normal.y))
    const nx = normal.x / divisor
    const ny = normal.y / divisor
    for (let i = -1; i <= 1; i++) {
      const streak = approach(from, to, Math.max(0, travel - 0.34))
      draw.moveTo(streak.x + nx * i * 6, streak.y + ny * i * 6)
        .lineTo(x + nx * i * 6, y + ny * i * 6).stroke({ color, width: i ? 2 : 4, alpha: alpha * (i ? 0.6 : 1) })
    }
  } else if (isLeaf) {
    for (let i = 0; i < 5; i++) {
      const dot = approach(from, to, Math.max(0, travel - i * 0.08))
      const drift = Math.sin((t - i / 10) * Math.PI * 2) * i * 2.1
      diamond(draw, dot.x, dot.y + drift, 6 - i * 0.65, i % 2 ? '#e5ffc3' : color, alpha)
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const dot = approach(from, to, Math.max(0, travel - i * 0.1))
      const drift = i * Math.sin(t * 8 + i) * 2
      if (isWater) draw.circle(dot.x, dot.y + drift, 6 - i).fill({ color, alpha: alpha * (1 - i * 0.13) })
      else diamond(draw, dot.x, dot.y + drift, 8 - i, i < 2 ? color : effectColors.normal, alpha)
    }
    draw.circle(x - 1, y - 2, 2.5).fill({ color: '#fffdf0', alpha })
  }
}

function drawBurst(draw: Graphics, effect: Effect, t: number, offset: number) {
  const { x, y } = effect.position
  const alpha = (1 - t) * 0.9
  const color = effect.kind === 'heal' ? '#9af5a2' : effect.kind === 'damage' ? '#ffb093' : '#f5da85'
  const spread = 7 + t * 25
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3
    diamond(draw, x + Math.cos(angle) * spread, y - offset + Math.sin(angle) * spread, 3.6 - t * 2, color, alpha)
  }
}

function drawEvolution(draw: Graphics, effect: Effect, t: number, height: number) {
  const { x, y } = effect.position
  const cy = y - height * 0.53
  const flash = Math.max(0, 1 - Math.abs(t - 0.52) * 8)
  const alpha = Math.min(1, t * 8, (1 - t) * 8)
  const glow = height * (0.43 + flash * 0.16)
  draw.circle(x, cy, glow * 1.22).fill({ color: '#ffca67', alpha: alpha * 0.12 })
  draw.circle(x, cy, glow).fill({ color: '#fff1b5', alpha: 0.14 * alpha + flash * 0.58 })
  draw.ellipse(x, y, height * (0.56 + t * 0.27), height * 0.17)
    .stroke({ color: '#ffdf95', alpha: 0.9 * alpha, width: 2 })
  draw.ellipse(x, y, height * (0.43 + t * 0.17), height * 0.12)
    .stroke({ color: '#fff8cf', alpha: 0.5 * alpha, width: 1.3 })
  for (let i = 0; i < 13; i++) {
    const angle = i * (Math.PI * 2 / 13) + t * 6
    const radius = height * (0.35 + (i % 3) * 0.14 + t * 0.22)
    const radiusY = cy - t * 13 + Math.sin(angle) * radius
    diamond(draw, x + Math.cos(angle) * radius, radiusY, 2 + (i % 3) * 1.1, i % 2 ? '#ffdf95' : '#fff8cf', alpha)
  }
}

function drawCapture(draw: Graphics, effect: Effect, t: number, height: number) {
  if (!effect.target) return
  const { x, y } = ballPosition(effect, t, height)
  if (t < BALL_LAND) {
    for (let i = 1; i <= 3; i++) {
      const trail = ballPosition(effect, Math.max(0, t - i * 0.035), height)
      diamond(draw, trail.x, trail.y, 5 - i, '#fff2bf', 0.74 - i * 0.17)
    }
    return
  }
  const impact = Math.max(0, 1 - (t - BALL_LAND) * 13)
  const reveal = Math.max(0, 1 - Math.abs(t - BALL_REVEAL) * 12)
  if (impact || reveal) {
    const wave = reveal || impact
    const color = !impact && effect.captured ? '#e5f88c' : '#ffd390'
    draw.circle(x, y, 16 + (1 - wave) * 21).stroke({ color, width: 2, alpha: wave * 0.8 })
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3
      const distance = 13 + (1 - wave) * 18
      diamond(draw, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 2.6, color, wave)
    }
  }
}

function poseFor(figure: Figure, effects: Effect[], ahead: number, time: number, evolution?: Effect, capture?: Effect) {
  let x = 0
  const step = time / 105 + (figure.at.x + figure.at.y) / 110
  let y = figure.moving ? -Math.round(Math.abs(Math.sin(step)) * 3) : 0
  let alpha = 1
  let tint = 0xffffff
  let stretch = 1
  const activeAttack = latestEffect(effects, effect => effect.kind === 'attack' && String(effect.actor) === figure.id)
  const damage = latestEffect(effects, effect => effect.kind === 'damage' && String(effect.actor ?? effect.targetActor) === figure.id)
  if (activeAttack?.target) {
    const power = Math.sin(phase(activeAttack, ahead) * Math.PI)
    x += Math.sign(activeAttack.target.x - activeAttack.position.x) * power * 18 * figure.scale
    y += Math.sign(activeAttack.target.y - activeAttack.position.y) * power * 7 - power * 8
  }
  if (damage) {
    const t = phase(damage, ahead)
    if (t < 0.43) {
      x += Math.sin(t * 50) * (1 - t) * 8 * figure.scale
      tint = 0xffb38f
    }
  }
  if (figure.defeat) {
    const t = phase(figure.defeat, ahead)
    y += t * 12
    stretch = 1 - t * 0.21
    alpha = 1 - t
  }
  if (evolution && figure.id === PARTNER) {
    const t = phase(evolution, ahead)
    const flash = Math.max(0, 1 - Math.abs(t - 0.52) * 11)
    y -= Math.sin(t * Math.PI) * 9 * figure.scale
    stretch = 1 + Math.sin(t * Math.PI) * 0.15
    alpha = 1 - flash * 0.90
    tint = t < 0.54 ? 0xffdf9c : 0xffffff
  }
  if (capture) {
    const t = phase(capture, ahead)
    if (typeof capture.targetActor === 'number' && String(capture.targetActor) === figure.id) {
      const entering = Math.max(0, Math.min(1, (t - BALL_LAND + 0.02) / 0.1))
      const leaving = capture.captured ? 0 : Math.max(0, Math.min(1, (t - BALL_REVEAL) / 0.12))
      const visible = Math.max(1 - entering, leaving)
      alpha *= visible
      stretch *= 0.2 + visible * 0.8
      if (visible < 0.96) tint = 0xffc798
    } else if (capture.caughtInstanceId && figure.id === followerId(capture.caughtInstanceId)) {
      const joining = Math.max(0, Math.min(1, (t - BALL_REVEAL) / 0.14))
      alpha *= joining
      stretch *= 0.35 + joining * 0.65
    }
  }
  return { x, y, alpha, tint, stretch }
}

function Stage({ game }: { game: GameSave | null }) {
  const host = useRef<HTMLDivElement>(null)
  const current = useRef({ game, at: performance.now() })
  const [fallback, setFallback] = useState(false)
  if (current.current.game !== game) current.current = { game, at: performance.now() }
  useEffect(() => {
    const mount = host.current!
    const canvas = document.createElement('canvas')
    // Keep the transparent desktop surface in a software-backed 2D canvas.
    if (!canvas.getContext('2d', { alpha: true, willReadFrequently: true })) {
      setFallback(true)
      return
    }
    const app = new Application()
    let live = true
    let sound: AudioContext | null = null
    let lastSoundEffect = -1
    const displays = new Map<string, Display>()
    const textures = new Map<string, Promise<Texture>>()
    const world = new Container({ sortableChildren: true, eventMode: 'none' })
    const glows = new Graphics({ eventMode: 'none' })
    const particles = new Graphics({ eventMode: 'none' })

    function texture(id: string) {
      let pending = textures.get(id)
      if (!pending) pending = characterTexture(id)
      else textures.delete(id)
      textures.set(id, pending)
      return pending
    }

    function discardTexture(pending: Promise<Texture>) {
      void pending.then(tex => tex.destroy(true), () => undefined)
    }

    function pruneTextures(evolution?: Effect) {
      if (textures.size <= MAX_TEXTURES) return
      const used = new Set([evolution?.fromFormId ?? evolution?.fromSpeciesId, evolution?.toFormId ?? evolution?.toSpeciesId])
      for (const { requestedId, displayedId } of displays.values()) {
        used.add(requestedId)
        used.add(displayedId)
      }
      for (const [id, pending] of textures) {
        if (textures.size <= MAX_TEXTURES) break
        if (used.has(id)) continue
        textures.delete(id)
        discardTexture(pending)
      }
    }

    function spriteFor(view: Display, requestedId: string) {
      if (view.requestedId === requestedId) return
      view.requestedId = requestedId
      void texture(requestedId).then(tex => {
        if (!live || view.root.destroyed || view.requestedId !== requestedId) return
        view.sprite.texture = tex
        view.displayedId = requestedId
      }).catch(() => {
        if (!live || view.root.destroyed || view.requestedId !== requestedId) return
        view.sprite.texture = Texture.EMPTY
        view.displayedId = ''
      })
    }

    function makeDisplay(figure: Figure) {
      const root = new Container({ eventMode: 'none' })
      const shape = new Graphics()
      const sprite = new Sprite(Texture.EMPTY)
      sprite.anchor.set(0.5, 1)
      root.addChild(shape, sprite)
      root.position.set(figure.at.x, figure.at.y)
      const view: Display = { root, shape, sprite, requestedId: '', displayedId: '' }
      displays.set(figure.id, view)
      world.addChild(root)
      return view
    }

    function playSound(effect: Effect) {
      try {
        sound ??= new AudioContext()
        const pitch = effect.kind === 'evolution' ? 659.25 : effect.kind === 'level' ? 523.25 : 329.63
        if (sound.state === 'suspended') void sound.resume().catch(() => {})
        const now = sound.currentTime
        const signal = sound.createOscillator()
        const volume = sound.createGain()
        signal.type = 'triangle'
        signal.frequency.setValueAtTime(pitch, now)
        signal.frequency.setValueAtTime(pitch * 1.33, now + 0.08)
        volume.gain.setValueAtTime(0.035, now)
        volume.gain.exponentialRampToValueAtTime(0.001, now + 0.21)
        signal.connect(volume)
        volume.connect(sound.destination)
        signal.start(now)
        signal.stop(now + 0.22)
      } catch {
        // Sound is optional on systems without an audio output.
      }
    }

    function destroy() {
      if (app.renderer) app.destroy({ removeView: true }, { children: true })
    }

    void app.init({
      canvas, preference: ['canvas'], backgroundAlpha: 0, clearBeforeRender: true,
      antialias: false, resizeTo: window, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2),
      eventFeatures: { move: false, globalMove: false, click: false, wheel: false }
    }).then(() => {
      if (!live) return destroy()
      mount.appendChild(app.canvas)
      app.stage.addChild(glows, world, particles)
      app.ticker.maxFPS = 30
      app.ticker.add(ticker => {
        const { game: state, at } = current.current
        glows.clear()
        particles.clear()
        if (!state || !state.settings.overlayVisible) {
          for (const view of displays.values()) view.root.visible = false
          return
        }
        app.ticker.maxFPS = state.settings.fps
        const ahead = Math.min(105, performance.now() - at)
        const effects = state.settings.effects ? state.effects : []
        const evolution = latestEffect(effects, effect => effect.kind === 'evolution')
        const capture = latestEffect(effects, effect => effect.kind === 'capture')
        const evolutionId = evolution?.toSpeciesId
        if (evolutionId && !textures.has(evolutionId)) void texture(evolutionId).catch(() => {})
        const roster = figures(state, evolution, capture, ahead)
        const visible = new Set(roster.map(figure => figure.id))
        for (const [key, view] of displays) {
          if (!visible.has(key)) {
            view.root.destroy({ children: true })
            displays.delete(key)
          }
        }
        for (const figure of roster) {
          const view = displays.get(figure.id) ?? makeDisplay(figure)
          const { root, shape, sprite } = view
          root.visible = true
          root.zIndex = figure.at.y
          const blend = 1 - Math.exp(-ticker.deltaMS / 75)
          const snap = Math.hypot(root.x - figure.at.x, root.y - figure.at.y) > 140
          root.x += (figure.at.x - root.x) * (snap ? 1 : blend)
          root.y += (figure.at.y - root.y) * (snap ? 1 : blend)
          spriteFor(view, figure.formId ?? figure.speciesId)
          const pose = poseFor(figure, effects, ahead, ticker.lastTime, evolution, capture)
          const size = SPRITE_HEIGHT / Math.max(sprite.texture.width, sprite.texture.height, 1) * figure.scale * pose.stretch
          sprite.scale.set(size * -figure.direction, size)
          sprite.position.set(pose.x, -4 + pose.y)
          sprite.tint = pose.tint
          sprite.alpha = pose.alpha
          shape.clear().ellipse(pose.x * 0.6, -1, 20 * figure.scale, 4 * figure.scale)
            .fill({ color: '#112b21', alpha: 0.3 * pose.alpha })
          if (figure.teraType && state.settings.effects) {
            const color = effectColors[figure.teraType] ?? '#b2f6ff'
            const top = pose.y - Math.abs(sprite.height) - 4
            const radius = 5 * figure.scale
            diamond(shape, pose.x, top - radius, radius, color, 0.95)
            for (let i = 0; i < 4; i++) {
              const shimmer = (ticker.lastTime / 1100 + i / 4) % 1
              diamond(shape, pose.x + Math.cos(i * 2.4) * 19 * figure.scale,
                pose.y - (9 + 43 * shimmer) * figure.scale, radius * (1 - shimmer), color, 1 - shimmer)
            }
          }
          if ((figure.totem || figure.dynamax) && state.settings.effects) {
            const pulse = (1 + Math.sin(ticker.lastTime / 240)) / 2
            const radius = (22 + 4 * pulse) * figure.scale
            shape.ellipse(0, -3, radius, radius * 0.28).stroke({ color: figure.dynamax ? '#fd4c92' : '#ffc64c', width: 2, alpha: 0.65 + 0.3 * pulse })
            for (let i = 0; i < 6; i++) {
              const rise = (ticker.lastTime / 900 + i / 6) % 1
              diamond(shape, Math.cos(i * 2.4) * radius, -(6 + rise * 48) * figure.scale, (3 - rise) * figure.scale, figure.dynamax ? '#ff94cd' : '#ffe282', 1 - rise)
            }
          }
          if (sprite.texture === Texture.EMPTY) {
            shape.rect(pose.x - 13, -33 + pose.y, 26, 26).fill({ color: '#ffdb80', alpha: pose.alpha })
          }
        }
        const offset = 34 * state.settings.spriteScale
        for (const effect of effects) {
          const t = phase(effect, ahead)
          if (effect.kind === 'attack') drawAttack(particles, effect, t, offset)
          else if (effect.kind === 'evolution') drawEvolution(glows, effect, t, SPRITE_HEIGHT * state.settings.spriteScale)
          else if (effect.kind === 'capture') drawCapture(particles, effect, t, SPRITE_HEIGHT * state.settings.spriteScale)
          else if (['damage', 'heal', 'level'].includes(effect.kind)) drawBurst(particles, effect, t, offset)
        }
        pruneTextures(evolution)
        if (state.settings.sound) {
          const audible = latestEffect(state.effects, effect => ['level', 'evolution', 'reward', 'pickup'].includes(effect.kind) && effect.id > lastSoundEffect)
          if (audible) {
            lastSoundEffect = audible.id
            playSound(audible)
          }
        }
      })
    }).catch(() => { if (live) setFallback(true) })

    return () => {
      live = false
      if (app.renderer) destroy()
      for (const pending of textures.values()) discardTexture(pending)
      textures.clear()
      if (sound) void sound.close()
    }
  }, [])

  const effects = game?.settings.effects ? game.effects : []
  const evolution = latestEffect(effects, effect => effect.kind === 'evolution')
  const capture = latestEffect(effects, effect => effect.kind === 'capture')
  return <div className="overlay-stage" ref={host} aria-hidden="true">
    {fallback && game?.settings.overlayVisible && figures(game, evolution, capture).map(figure => {
      const pose = poseFor(figure, effects, 0, 0, evolution, capture)
      const size = (figure.formId?.endsWith('-gmax') ? 70 : 116) * figure.scale * pose.stretch
      return <div key={figure.id} className={'fallback-figure' + (game.settings.effects && figure.teraType ? ' tera-glow' : game.settings.effects && figure.dynamax ? ' dynamax-glow' : figure.totem && game.settings.effects ? ' totem-glow' : '')} style={{
        left: figure.at.x + pose.x, top: figure.at.y + pose.y, width: size, height: size,
        opacity: pose.alpha, scale: (-figure.direction) + ' 1'
      }}>
        <Pokemon id={figure.speciesId} formId={figure.formId} className={figure.moving ? 'fallback-walk' : ''} />
      </div>
    })}
  </div>
}

function BattleMeters({ game }: { game: GameSave }) {
  if (game.player.state !== 'BATTLE') return null
  const enemy = game.wild.find(mon => mon.id === game.runtime.targetId)
  if (!enemy) return null
  const capture = latestEffect(game.effects, effect => effect.kind === 'capture' && effect.targetActor === enemy.id)
  if (capture && phase(capture) > BALL_LAND - 0.02 && phase(capture) < BALL_REVEAL + 0.07) return null
  const player = game.player
  const totem = Boolean(enemy.trainerId && worldRegions[game.regionId].trainerById[enemy.trainerId]?.totemAura)
  const max = playerStats(game).hp
  return <div data-cue="battle" className="battle-meters">
    {[{ ...player, level: effectiveLevel(game), maxHP: max }, enemy].map((mon, index) => {
      const relative = index === 0 ? player.position.x - enemy.position.x : enemy.position.x - player.position.x
      const side = (relative || (index ? 1 : -1)) >= 0 ? 1 : -1
      return <div key={index} className={'battle-meter ' + (index ? 'enemy-meter' : 'partner-meter')}
        style={{ left: anchor(mon.position.x + side * Math.max(22, (118 - Math.abs(relative)) / 2), 58),
          top: Math.max(34, mon.position.y - SPRITE_HEIGHT * game.settings.spriteScale * (enemy.maxActionsLeft ? (index ? DYNAMAX_OPPONENT_SCALE : DYNAMAX_PARTNER_SCALE) : index && totem ? 1.18 : 1) - 10) }}>
        <span>{enemy.teraType && <TeraIcon type={index ? enemy.teraType : formStats(player.speciesId, player.formId).types[0]} />}<strong>{enemy.maxActionsLeft ? index && enemy.dynamax === 'gigantamax' ? '거다이 ' : '다이 ' : index === 1 && totem ? '주인 ' : ''}{species[mon.speciesId].nameKo}</strong><small>Lv.{mon.level}</small></span>
        <progress aria-label="HP" value={mon.currentHP} max={mon.maxHP} />
      </div>
    })}
  </div>
}

function ItemIcon({ itemId }: { itemId: string }) {
  const item = items[itemId]
  if (!item) return null
  return <span className={'field-item-icon icon-' + item.kind} style={{ color: itemColors[item.rarity] }} aria-hidden="true">
    <ItemSprite id={itemId} className="field-item-sprite" />
  </span>
}

function FieldDrop({ drop }: { drop: NonNullable<GameSave['runtime']['drop']> }) {
  const item = items[drop.itemId]
  if (!item) return null
  return <div data-cue="drop" className="field-drop" style={{ left: anchor(drop.position.x, 42), top: drop.position.y - 6 }}>
    <ItemIcon itemId={item.id} />
    <span className="field-drop-name">{item.nameKo}</span>
  </div>
}

function Pickup({ effect, height }: { effect: Effect; height: number }) {
  if (!effect.target || !effect.itemId) return null
  const t = phase(effect)
  const fly = Math.min(1, t * 2.7)
  const end = { x: effect.target.x, y: effect.target.y - height * 0.55 }
  const point = approach(effect.position, end, fly)
  return <div data-cue="pickup" className="pickup-cue">
    {fly < 1 && <span className="pickup-moving" style={{ left: point.x, top: point.y - Math.sin(fly * Math.PI) * 33 }}>
      <ItemIcon itemId={effect.itemId} />
    </span>}
    <span className="effect-pill pickup-label" style={{
      left: anchor(effect.target.x, 78), top: Math.max(24, effect.target.y - height - 9 - t * 20), opacity: Math.min(1, t * 7, (1 - t) * 4)
    }}><ItemIcon itemId={effect.itemId} /> {effect.text}</span>
  </div>
}

function EvolutionCue({ effect, height }: { effect: Effect; height: number }) {
  const before = effect.fromSpeciesId && species[effect.fromSpeciesId]
  const after = effect.toSpeciesId && species[effect.toSpeciesId]
  const t = phase(effect)
  return <div data-cue="evolution" data-phase={t < 0.54 ? 'before' : 'after'}
    className="evolution-cue" style={{ left: anchor(effect.position.x, 105), top: Math.max(48, effect.position.y - height - 18) }}>
    <span>{t < 0.54 ? '진화 중' : '진화 완료'}</span>
    <strong>{before && after ? before.nameKo + ' → ' + after.nameKo : effect.text}</strong>
  </div>
}

function CaptureCue({ effect, height }: { effect: Effect; height: number }) {
  const { target, itemId, captured } = effect
  if (!target || !itemId) return null
  const t = phase(effect)
  const point = ballPosition(effect, t, height)
  const state = t < BALL_LAND ? 'throw' : t < BALL_REVEAL ? 'shake' : captured ? 'caught' : 'escaped'
  const wobble = ballWobble(t)
  const rotation = state === 'throw' ? (t / BALL_LAND - 1) * 300 : wobble * 27
  const ballOpacity = state === 'escaped' ? Math.max(0, 1 - (t - BALL_REVEAL) * 12) : Math.min(1, (1 - t) * 8)
  const name = effect.speciesId ? species[effect.speciesId]?.nameKo : undefined
  const result = state === 'caught' ? (effect.text || (name ? name + ' 포획 성공!' : '포획 성공!'))
    : state === 'escaped' ? '볼에서 벗어났어요' : '포획 중'

  return <div className="capture-cue" data-cue="capture" data-phase={state}>
    <span className="capture-ball" style={{
      left: point.x + wobble * 3, top: point.y - Math.abs(wobble) * 3,
      transform: 'translate(-50%, -50%) rotate(' + rotation + 'deg)', opacity: ballOpacity
    }}><ItemSprite id={itemId} className="capture-ball-sprite" /></span>
    {state !== 'throw' && <span className="effect-pill capture-label" style={{
      left: anchor(target.x, 112), top: Math.max(28, target.y - height - 10),
      opacity: Math.min(1, (1 - t) * 10)
    }}>{result}</span>}
  </div>
}

function EventLabel({ effect, height, inBattle }: { effect: Effect; height: number; inBattle: boolean }) {
  const t = phase(effect)
  if (effect.kind === 'pickup') return <Pickup effect={effect} height={height} />
  if (effect.kind === 'evolution') return <EvolutionCue effect={effect} height={height} />
  if (effect.kind === 'capture') return <CaptureCue effect={effect} height={height} />
  if (!effect.text || effect.kind === 'loot' || effect.kind === 'defeat') return null

  if (effect.kind === 'attack' && effect.target) {
    const middle = approach(effect.position, effect.target, 0.5)
    return <span data-cue="attack" className="effect-pill move-label" style={{
      color: colorFor(effect), left: anchor(middle.x, 56), top: anchor(middle.y + 16, 24), opacity: Math.max(0.15, Math.min(1, (1 - t) * 3))
    }}>{effect.text}</span>
  }

  const cueOffset = inBattle && effect.kind === 'damage' ? height * 0.47 : height + 5
  return <span data-cue={effect.kind} className={'effect-label effect-' + effect.kind} style={{
    left: anchor(effect.position.x, 66), top: Math.max(18, effect.position.y - cueOffset - t * 19), opacity: Math.min(1, (1 - t) * 3)
  }}>{effect.text}</span>
}

export function Overlay() {
  const { snapshot } = useAdventure()
  const game = snapshot?.game ?? null
  const level = game ? effectiveLevel(game) : 0
  const xpToNext = game && level < levelCap(game) ? requiredExp(level) : 0
  return <>
    <Stage key={snapshot?.selectedSlot ?? 0} game={game} />
    {game?.settings.overlayVisible && <>
      {game.settings.effects && <div className="overlay-effects" aria-hidden="true">
        <BattleMeters game={game} />
        {game.runtime.drop && <FieldDrop drop={game.runtime.drop} />}
        {game.effects.map(effect => <EventLabel key={effect.id} effect={effect}
          height={SPRITE_HEIGHT * game.settings.spriteScale} inBattle={game.player.state === 'BATTLE'} />)}
      </div>}
      {game.settings.hud && <div className="overlay-hud">
        <strong>{species[game.player.speciesId].nameKo} · Lv. {level}</strong>
        <span>{worldLocationById[game.locationId]?.name} · {activityLabels[game.player.state]}</span>
        <progress aria-label="HP" value={game.player.currentHP} max={playerStats(game).hp} />
        <progress aria-label="EXP" value={xpToNext ? game.player.exp : 1} max={Math.max(1, xpToNext)} />
      </div>}
    </>}
  </>
}
