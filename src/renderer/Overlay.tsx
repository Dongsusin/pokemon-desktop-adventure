import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Application, Container, Graphics, ImageSource, Rectangle, Sprite, Texture } from 'pixi.js'
import 'pixi.js/unsafe-eval'
import { WildTrainer } from './PlayerTrainer'
import { GimmickFlare } from './GimmickControl'
import { species } from '../game/catalog'
import { worldLocationById, worldRegions } from '../game/regions/world'
import { battleGimmickStatus, DYNAMAX_OPPONENT_SCALE, DYNAMAX_PARTNER_SCALE, activityLabels, effectiveLevel, items, levelCap, playerStats, requiredExp } from '../game/engine'
import type { Effect, GameSave, Position } from '../game/engine'
import { ItemSprite, TeraIcon, useAdventure } from './shared'
import { BALL_LAND, BALL_REVEAL, fieldFrame, figures, latestEffect, phase, poseFor, type Figure } from './desktopSprites'
import { spriteAtlasKey, spriteSheetUrl } from './spriteAtlas'

const SPRITE_HEIGHT = 61
const effectColors: Record<string, string> = {
  normal: '#ffe7aa', fire: '#ff9a50', water: '#67dbff', grass: '#b9f773', bug: '#d0e880',
  flying: '#ccedff', poison: '#f4adff', ground: '#f6c37a', rock: '#e7ca9a', ice: '#a0f2ff',
  electric: '#ffe453', psychic: '#ffa4ec', ghost: '#d3a7ff', fighting: '#ffa584', steel: '#d7e4e9',
  fairy: '#ffd0eb', dark: '#c0a7e3', dragon: '#9eaaff'
}
const itemColors = { common: '#feedad', uncommon: '#b9f773', rare: '#9ddfff', epic: '#ebbbff' }
type Display = {
  root: Container
  shape: Graphics
  sprite: Sprite
  key: string
  row?: number
}

const anchor = (value: number, margin: number) => 'clamp(' + margin + 'px, ' + value + 'px, calc(100% - ' + margin + 'px))'
const approach = (from: Position, to: Position, t: number) =>
  ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t })

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

function loadSheet(key: string): Promise<ImageSource> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(new ImageSource({ resource: image, scaleMode: 'nearest' }))
    image.onerror = reject
    image.src = spriteSheetUrl(key)
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

function FallbackFigure({ figure, effects, showEffects, evolution, capture }: { figure: Figure; effects: Effect[]; showEffects: boolean; evolution?: Effect; capture?: Effect }) {
  const row = useRef<number | undefined>(undefined)
  const pose = poseFor(figure, effects, 0, evolution, capture)
  const frame = fieldFrame(figure, pose, row.current, performance.now())
  useLayoutEffect(() => { row.current = frame?.row }, [frame?.row])
  if (!frame) return null
  const size = SPRITE_HEIGHT * figure.scale * pose.stretch / frame.extent
  const aura = !showEffects ? '' : figure.gimmick ? ' ' + figure.gimmick + '-glow' : figure.totem ? ' totem-glow' : ''
  return <div className={'fallback-figure' + aura} style={{ left: figure.at.x + pose.x, top: figure.at.y + pose.y - 4,
    opacity: pose.alpha, zIndex: Math.round(figure.at.y), width: frame.width, height: frame.height,
    transform: 'scale(' + size + ') translate(' + -frame.anchorX + 'px,' + -frame.anchorY + 'px)',
    backgroundImage: 'url("' + spriteSheetUrl(frame.key) + '")', backgroundPosition: -frame.x + 'px ' + -frame.y + 'px'
  }}/>
}

function Stage({ game }: { game: GameSave | null }) {
  const host = useRef<HTMLDivElement>(null)
  const current = useRef({ game, at: performance.now() })
  const [fallback, setFallback] = useState(false)
  if (current.current.game !== game) current.current = { game, at: performance.now() }
  useEffect(() => {
    const mount = host.current!
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
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
    const sheets = new Map<string, Promise<ImageSource>>()
    const world = new Container({ sortableChildren: true, eventMode: 'none' })
    const glows = new Graphics({ eventMode: 'none' })
    const particles = new Graphics({ eventMode: 'none' })

    function sheetFor(key: string) {
      const cached = sheets.get(key)
      if (cached) return cached
      const pending = loadSheet(key)
      sheets.set(key, pending)
      return pending
    }

    function releaseSheet(pending: Promise<ImageSource>) {
      void pending.then(source => source.destroy(), () => undefined)
    }

    function clearSprite(view: Display) {
      const texture = view.sprite.texture
      view.sprite.texture = Texture.EMPTY
      if (texture !== Texture.EMPTY) texture.destroy()
    }

    function showFrame(view: Display, region: NonNullable<ReturnType<typeof fieldFrame>>) {
      const { key, x, y, width, height, anchorX, anchorY } = region
      if (view.key !== key) {
        clearSprite(view)
        view.key = key
        // Each actor owns its own mutable frame. Duplicate party members share only the pixels.
        void sheetFor(key).then(source => {
          if (!live || view.root.destroyed || view.key !== key) return
          view.sprite.texture = new Texture({ source, dynamic: true, frame: new Rectangle(x, y, width, height) })
        }).catch(() => {})
      }
      const texture = view.sprite.texture
      if (texture !== Texture.EMPTY && (texture.frame.x !== x || texture.frame.y !== y ||
          texture.frame.width !== width || texture.frame.height !== height)) {
        texture.frame.set(x, y, width, height)
        texture.update()
      }
      view.sprite.anchor.set(anchorX / width, anchorY / height)
    }

    function makeDisplay(figure: Figure) {
      const root = new Container({ eventMode: 'none' })
      const shape = new Graphics()
      const sprite = new Sprite(Texture.EMPTY)
      sprite.anchor.set(0.5, 1)
      root.addChild(shape, sprite)
      root.position.set(figure.at.x, figure.at.y)
      const view: Display = { root, shape, sprite, key: '' }
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
      for (const view of displays.values()) clearSprite(view)
      displays.clear()
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
        const visibleSheets = new Set<string>()
        if (evolutionId) {
          const key = spriteAtlasKey(species[evolutionId].pokedexNumber, evolution?.toFormId)
          visibleSheets.add(key)
          void sheetFor(key).catch(() => {})
        }
        const roster = figures(state, evolution, capture, ahead)
        const visible = new Set(roster.map(figure => figure.id))
        for (const [key, view] of displays) {
          if (!visible.has(key)) {
            clearSprite(view)
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
          const pose = poseFor(figure, effects, ahead, evolution, capture)
          const region = fieldFrame(figure, pose, view.row, ticker.lastTime)
          if (!region) { root.visible = false; continue }
          visibleSheets.add(region.key)
          view.row = region.row
          showFrame(view, region)
          const size = SPRITE_HEIGHT / region.extent * figure.scale * pose.stretch
          sprite.scale.set(size)
          sprite.position.set(pose.x, -4 + pose.y)
          sprite.tint = pose.tint
          sprite.alpha = pose.alpha
          shape.clear().ellipse(pose.x * 0.6, -1, 20 * figure.scale, 4 * figure.scale)
            .fill({ color: '#112b21', alpha: 0.3 * pose.alpha })
          const auraTime = reduceMotion.matches ? 360 : ticker.lastTime
          if (figure.teraType && state.settings.effects) {
            const color = effectColors[figure.teraType] ?? '#b2f6ff'
            const top = pose.y - Math.abs(sprite.height) - 4
            const radius = 5 * figure.scale
            diamond(shape, pose.x, top - radius, radius, color, 0.95)
            for (let i = 0; i < 4; i++) {
              const shimmer = (auraTime / 1100 + i / 4) % 1
              diamond(shape, pose.x + Math.cos(i * 2.4) * 19 * figure.scale,
                pose.y - (9 + 43 * shimmer) * figure.scale, radius * (1 - shimmer), color, 1 - shimmer)
            }
          }
          if (state.settings.effects && (figure.gimmick === 'mega' || figure.gimmick === 'z')) {
            const radius = figure.scale * 20
            const orbit = auraTime / 560
            if (figure.gimmick === 'mega') {
              for (let i = 0; i < 6; i++) {
                const angle = orbit + i * Math.PI / 3
                diamond(shape, Math.cos(angle) * radius, -(9 + i * 6) * figure.scale,
                  2.8 * figure.scale, i % 2 ? '#80efd3' : '#cb9dff', .86)
              }
            } else {
              shape.poly([0,-13,7,-21,3,-21,9,-32,-3,-19,1,-19].map(v => v * figure.scale))
                .fill({ color:'#ffe671', alpha:.95 })
            }
          }
          if ((figure.totem || figure.gimmick === 'dynamax') && state.settings.effects) {
            const pulse = (1 + Math.sin(auraTime / 240)) / 2
            const radius = (22 + 4 * pulse) * figure.scale
            shape.ellipse(0, -3, radius, radius * 0.28).stroke({ color: figure.gimmick === 'dynamax' ? '#fd4c92' : '#ffc64c', width: 2, alpha: 0.65 + 0.3 * pulse })
            for (let i = 0; i < 6; i++) {
              const rise = (auraTime / 900 + i / 6) % 1
              diamond(shape, Math.cos(i * 2.4) * radius, -(6 + rise * 48) * figure.scale, (3 - rise) * figure.scale, figure.gimmick === 'dynamax' ? '#ff94cd' : '#ffe282', 1 - rise)
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
        for (const [key, pending] of sheets) {
          if (visibleSheets.has(key)) continue
          sheets.delete(key)
          releaseSheet(pending)
        }
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
      for (const pending of sheets.values()) releaseSheet(pending)
      sheets.clear()
      if (sound) void sound.close()
    }
  }, [])

  const effects = game?.settings.effects ? game.effects : []
  const evolution = latestEffect(effects, effect => effect.kind === 'evolution')
  const capture = latestEffect(effects, effect => effect.kind === 'capture')
  return <div className="overlay-stage" ref={host} aria-hidden="true">
    {fallback && game?.settings.overlayVisible && figures(game, evolution, capture).map(figure =>
      <FallbackFigure key={figure.id} figure={figure} effects={effects} showEffects={game.settings.effects} evolution={evolution} capture={capture}/>)}
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
  const actors = [battleGimmickStatus(game), battleGimmickStatus(game, 'enemy')]
  return <div data-cue="battle" className="battle-meters">
    {[{ ...player, level: effectiveLevel(game), maxHP: max }, enemy].map((mon, index) => {
      const status = actors[index]
      const active = status?.phase === 'active' ? status : null
      const scale = active?.kind === 'dynamax' ? (index ? DYNAMAX_OPPONENT_SCALE : DYNAMAX_PARTNER_SCALE) : index && totem ? 1.18 : 1
      const relative = index === 0 ? player.position.x - enemy.position.x : enemy.position.x - player.position.x
      const side = (relative || (index ? 1 : -1)) >= 0 ? 1 : -1
      return <div key={index} className={'battle-meter ' + (index ? 'enemy-meter' : 'partner-meter')}
        style={{ left: anchor(mon.position.x + side * Math.max(22, (118 - Math.abs(relative)) / 2), 58),
          top: Math.max(34, mon.position.y - SPRITE_HEIGHT * game.settings.spriteScale * scale - 10) }}>
        <span>{active?.kind === 'tera' && active.teraType && <TeraIcon type={active.teraType}/>}<strong>{index === 1 && totem ? '주인 ' : ''}{species[mon.speciesId].nameKo}</strong><small>Lv.{mon.level}</small></span>
        {active && <small className="meter-gimmick" data-gimmick={active.kind}>{active.label}{active.kind === 'dynamax' && active.remaining !== undefined && ' · 잔여 ' + active.remaining + '회'}</small>}
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
  if (effect.kind === 'travel' && effect.gimmick) return <div data-cue="gimmick" className="field-gimmick-cue" data-gimmick={effect.gimmick}
    style={{ left: anchor(effect.position.x, 46), top: Math.max(height, effect.position.y), width: height, height }}>
    <GimmickFlare kind={effect.gimmick}/><strong>{effect.text}</strong></div>
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
    {game && <WildTrainer game={game} viewportWidth={window.innerWidth} />}
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
