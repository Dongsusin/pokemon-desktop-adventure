import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { species } from '../game/catalog'
import type { GameSave } from '../game/engine'
import { locationAccess } from '../game/locationAccess'
import type { KantoLocation } from '../game/regions/kanto'
import { worldRegions } from '../game/regions/world'
import { describePlace, levelLabel, placeKind, placeTrainers, rareCondition, usePlaceEncounters } from './mapLocationGuide'
import { Pokemon } from './shared'

interface Preview {
  place: KantoLocation
  anchor: HTMLButtonElement
  trigger: string
  neighbors: readonly KantoLocation[]
}

export function useMapPreview() {
  const id = useId()
  const [preview, setPreview] = useState<Preview | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const activeAnchor = useRef<HTMLButtonElement | null>(null)
  const approach = useRef<number | null>(null)
  const keep = useCallback(() => {
    clearTimeout(timer.current)
    approach.current = null
  }, [])
  const dismiss = useCallback(() => { keep(); activeAnchor.current = null; setPreview(null) }, [keep])
  const delayClose = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (!activeAnchor.current?.matches(':hover') && !document.getElementById(id)?.matches(':hover')) dismiss()
    }, 180)
  }, [dismiss, id])
  function distanceToCard(x: number, y: number) {
    const box = document.getElementById(id)?.getBoundingClientRect()
    return box ? Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom)) : 0
  }
  function leave(event: ReactPointerEvent) {
    approach.current = distanceToCard(event.clientX, event.clientY)
    delayClose()
  }
  useEffect(() => {
    if (!preview) return
    // Keep the guide reachable across the gap without covering intervening map pins.
    function moving(event: PointerEvent) {
      if (approach.current === null) return
      const distance = distanceToCard(event.clientX, event.clientY)
      if (distance < approach.current) {
        approach.current = distance
        delayClose()
      }
    }
    document.addEventListener('pointermove', moving, { passive: true })
    return () => document.removeEventListener('pointermove', moving)
  }, [preview, id, delayClose])
  useEffect(() => keep, [keep])
  function trigger(place: KantoLocation, key: string, neighbors: readonly KantoLocation[] = []): HTMLAttributes<HTMLButtonElement> {
    function show(anchor: HTMLButtonElement) {
      keep()
      activeAnchor.current = anchor
      setPreview({ place, anchor, trigger: key, neighbors })
    }
    return {
      'aria-describedby': preview?.trigger === key ? id : undefined,
      onPointerEnter: event => { if (event.pointerType !== 'touch') show(event.currentTarget) },
      onPointerLeave: event => { if (activeAnchor.current === event.currentTarget) leave(event) },
      onFocus: event => show(event.currentTarget),
      onBlur: event => { if (activeAnchor.current === event.currentTarget) delayClose() },
      onKeyDown: event => {
        if (preview?.trigger !== key || !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return
        const body = document.getElementById(id)?.querySelector('.map-guide-scroll')
        if (!body || body.scrollHeight <= body.clientHeight) return
        const step = event.key.startsWith('Page') ? body.clientHeight : 42
        body.scrollBy(0, event.key.endsWith('Down') ? step : -step)
        event.preventDefault()
      },
    }
  }
  return { id, preview, trigger, dismiss, keep, leave }
}

export function PlaceGuideContent({ game, place, neighbors = [] }: {
  game: GameSave; place: KantoLocation; neighbors?: readonly KantoLocation[]
}) {
  const region = worldRegions[game.regionId]
  const { entries, rareEntries, available, weather } = usePlaceEncounters(game, place)
  const trainers = placeTrainers(region, place)
  const here = place.id === game.locationId
  const locked = !locationAccess(game, place.id).unlocked
  const others = neighbors.filter(other => other.id !== place.id)
  return <>
    <header className="map-guide-heading">
      <div><small>{region.name} · {placeKind(region.id, place)}</small><h3>{place.name}</h3></div>
      <span className={'map-guide-status' + (locked && !here ? ' locked' : '')}>{here ? '현재 위치' : locked ? '이동 잠김' : '이동 가능'}</span>
    </header>
    <div className="map-guide-scroll" key={place.id}>
      <p className="map-guide-description">{describePlace(game, place)}</p>
      <section className="map-guide-trainers"><h4>트레이너</h4>
        <p>{trainers.length ? trainers.join(' · ') : '이곳에는 트레이너가 없습니다.'}</p>
      </section>
      <section><h4>야생 포켓몬 <span>{entries.length}종{weather && ' · ' + weather}</span></h4>
        {entries.length ? <ul className="map-guide-roster">{entries.map(entry => <li key={entry.id}>
          <Pokemon id={entry.id} formId={entry.formId} />
          <div><strong>{species[entry.id].nameKo}</strong><small>{[entry.description, levelLabel(entry.levels)].filter(Boolean).join(' · ')}</small></div>
        </li>)}</ul> : <p>일반 야생 포켓몬이 없습니다.</p>}
      </section>
      {rareEntries.length > 0 && <section><h4>희귀 출현</h4><ul className="map-guide-special">
        {rareEntries.map(entry => <li key={entry.speciesId}><strong>{species[entry.speciesId].nameKo}</strong>
          <small>Lv. {entry.level} · {available.some(choice => choice.speciesId === entry.speciesId) ? (locked && !here ? '도착 후 출현' : '출현 가능') : rareCondition(game, place, entry)}</small></li>)}
      </ul></section>}
      {Boolean(place.visitors?.length) && <section><h4>{game.campaign.champion ? '조사 출현' : '리그 우승 후 조사 출현'}</h4>
        <ul className="map-guide-special">{place.visitors!.map(entry => <li key={entry.speciesId}>
          <strong>{species[entry.speciesId].nameKo}</strong><small>Lv. {entry.level}</small>
        </li>)}</ul>
      </section>}
      {others.length > 0 && <p className="map-guide-neighbors">같은 지점 · {others.map(other => other.name).join(' · ')}</p>}
    </div>
  </>
}

export function MapLocationTooltip({ game, guide }: { game: GameSave; guide: ReturnType<typeof useMapPreview> }) {
  const { preview, id, keep, leave, dismiss } = guide
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const card = ref.current
    if (!preview || !card) return
    const { anchor } = preview
    const position = () => {
      const target = anchor.getBoundingClientRect()
      const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight
      if (!anchor.isConnected || target.bottom <= 0 || target.top >= height || target.right <= 0 || target.left >= width) {
        dismiss()
        return
      }
      const gap = 7, margin = 8
      const map = anchor.closest('.kanto-map-image')?.getBoundingClientRect()
      const pane = anchor.closest('.kanto-layout')?.querySelector('.kanto-place')?.getBoundingClientRect()
      const dock = map && pane && pane.left >= map.right && pane.width >= 240
      const cardWidth = dock ? pane.width : Math.min(292, width - 2 * margin)
      const roomRight = target.right + gap + cardWidth <= width - margin
      const roomLeft = target.left - gap - cardWidth >= margin
      const below = height - target.bottom >= target.top
      const vertical = !dock && !roomRight && !roomLeft
      const maxHeight = vertical ? (below ? height - target.bottom : target.top) - gap - margin : height - margin * 2
      card.style.width = cardWidth + 'px'
      card.style.maxHeight = Math.min(370, maxHeight) + 'px'
      card.toggleAttribute('data-docked', Boolean(dock))
      const box = card.getBoundingClientRect()
      const x = dock ? pane.left : roomRight ? target.right + gap : roomLeft ? target.left - gap - box.width : target.left + (target.width - box.width) / 2
      const y = dock ? pane.top : vertical ? (below ? target.bottom + gap : target.top - gap - box.height) : target.top + target.height / 2 - 36
      card.style.left = Math.max(margin, Math.min(x, width - box.width - margin)) + 'px'
      card.style.top = Math.max(margin, Math.min(y, height - box.height - margin)) + 'px'
    }
    const onScroll = (event: Event) => { if (!(event.target instanceof Node && card.contains(event.target))) position() }
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') dismiss() }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(card)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', position)
    window.addEventListener('blur', dismiss)
    return () => {
      observer.disconnect()
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', position)
      window.removeEventListener('blur', dismiss)
    }
  }, [preview, dismiss])
  if (!preview) return null
  return createPortal(<div className="map-location-guide" id={id} ref={ref} role="tooltip" onPointerEnter={keep} onPointerLeave={leave}>
    <PlaceGuideContent game={game} place={preview.place} neighbors={preview.neighbors} />
  </div>, document.body)
}
