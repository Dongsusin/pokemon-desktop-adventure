import { useMemo, useState } from 'react'
import { worldRegions, type RegionId } from '../game/regions/world'
import { paldeaWildForms } from '../game/regions/paldea-encounters'
import { PALDEA_MAP_WIDTH, PALDEA_MAP_HEIGHT, paldeaAreaByLocationId } from '../game/regions/paldea'
import { GALAR_MAP_WIDTH, GALAR_MAP_HEIGHT, galarAreaByLocationId } from '../game/regions/galar'
import { ALOLA_MAP_WIDTH, ALOLA_MAP_HEIGHT, alolaIslandByLocationId } from '../game/regions/alola'
import { galarWildAreaIds } from '../game/regions/galar-encounters'
import { KALOS_MAP_WIDTH, KALOS_MAP_HEIGHT } from '../game/regions/kalos'
import { UNOVA_MAP_WIDTH, UNOVA_MAP_HEIGHT } from '../game/regions/unova'
import { SINNOH_MAP_WIDTH, SINNOH_MAP_HEIGHT } from '../game/regions/sinnoh'
import { HOENN_MAP_WIDTH, HOENN_MAP_HEIGHT } from '../game/regions/hoenn'
import { JOHTO_MAP_WIDTH, JOHTO_MAP_HEIGHT } from '../game/regions/johto'
import {
  KANTO_ILLUSTRATED_MAP_HEIGHT, KANTO_ILLUSTRATED_MAP_WIDTH,
  kantoIllustratedPins
} from '../game/regions/kantoIllustratedMap'
import type { KantoLocation } from '../game/regions/kanto'
import { species } from '../game/catalog'
import { regionalWeather, eligibleLegends, KANTO_LEGENDARY_ENCOUNTER_CHANCE, type GameSave } from '../game/engine'
import { formLabel, hasWildMidnightForm, locationForm } from '../game/forms'
import { ChallengeActions, challengeName, type ChallengeKind } from './Campaign'
import { Pokemon, types } from './shared'
import './region-map.css'

const maps = {
  kanto: {
    path: 'maps/kanto/illustrated-map.png', alt: '관동지방 일러스트 지도',
    width: KANTO_ILLUSTRATED_MAP_WIDTH, height: KANTO_ILLUSTRATED_MAP_HEIGHT, pixelArt: false
  },
  johto: {
    path: 'maps/johto/town-map.png', alt: '성도지방 포켓기어 지도',
    width: JOHTO_MAP_WIDTH, height: JOHTO_MAP_HEIGHT, pixelArt: true
  },
  hoenn: {
    path: 'maps/hoenn/town-map.png', alt: '호연지방 포켓나비 지도',
    width: HOENN_MAP_WIDTH, height: HOENN_MAP_HEIGHT, pixelArt: true
  },
  sinnoh: {
    path: 'maps/sinnoh/town-map.png', alt: '신오지방 타운맵',
    width: SINNOH_MAP_WIDTH, height: SINNOH_MAP_HEIGHT, pixelArt: true
  },
  unova: {
    path: 'maps/unova/town-map.png', alt: '하나지방 타운맵',
    width: UNOVA_MAP_WIDTH, height: UNOVA_MAP_HEIGHT, pixelArt: true
  },
  kalos: {
    path: 'maps/kalos/town-map.png', alt: '칼로스지방 지도',
    width: KALOS_MAP_WIDTH, height: KALOS_MAP_HEIGHT, pixelArt: true
  },
  paldea: {
    path: 'maps/paldea/town-map.png', alt: '팔데아지방 로토무 지도',
    width: PALDEA_MAP_WIDTH, height: PALDEA_MAP_HEIGHT, pixelArt: false
  },
  galar: {
    path: 'maps/galar/town-map.png', alt: '가라르지방 타운맵',
    width: GALAR_MAP_WIDTH, height: GALAR_MAP_HEIGHT, pixelArt: false
  },
  alola: {
    path: 'maps/alola/town-map.png', alt: '알로라지방 지도',
    width: ALOLA_MAP_WIDTH, height: ALOLA_MAP_HEIGHT, pixelArt: false
  }
}
const locationKinds = {
  town: '마을',
  city: '도시',
  route: '도로',
  dungeon: '동굴·시설',
  league: '리그'
}

function pinFor(regionId: RegionId, location: KantoLocation) {
  return regionId === 'kanto' ? kantoIllustratedPins[location.id] : location
}

function groupMarkers(regionId: RegionId) {
  const groups: KantoLocation[][] = []
  for (const location of worldRegions[regionId].locations) {
    const coordinates = pinFor(regionId, location)
    const group = groups.find(([anchor]) => {
      const pin = pinFor(regionId, anchor)
      const distance = Math.hypot(pin.x - coordinates.x, pin.y - coordinates.y)
      return maps[regionId].pixelArt ? distance < 6 : distance === 0
    })
    if (group) group.push(location)
    else groups.push([location])
  }
  return groups
}

const markerGroups = {
  kanto: groupMarkers('kanto'),
  johto: groupMarkers('johto'),
  hoenn: groupMarkers('hoenn'),
  sinnoh: groupMarkers('sinnoh'),
  unova: groupMarkers('unova'),
  kalos: groupMarkers('kalos'),
  alola: groupMarkers('alola'),
  galar: groupMarkers('galar'),
  paldea: groupMarkers('paldea'),
}

function areaViewport(places: readonly KantoLocation[], width: number, height: number) {
  const xs = places.map(place => place.x)
  const ys = places.map(place => place.y)
  const left = Math.min(...xs), right = Math.max(...xs)
  const top = Math.min(...ys), bottom = Math.max(...ys)
  if (height > width) {
    const w = Math.min(width, Math.max(width * 0.35, right - left + width * 0.14, (bottom - top) * 0.78))
    const h = Math.min(height, Math.max(w * 0.78, bottom - top + width * 0.15))
    return { x: Math.max(0, Math.min(width - w, (left + right - w) / 2)),
      y: Math.max(0, Math.min(height - h, (top + bottom - h) / 2)), width: w, height: h }
  }
  const scale = Math.min(1, Math.max(0.22, (right - left) / width + 0.08, (bottom - top) / height + 0.1))
  const w = width * scale, h = height * scale
  return {
    x: Math.max(0, Math.min(width - w, (left + right - w) / 2)),
    y: Math.max(0, Math.min(height - h, (top + bottom - h) / 2)), width: w, height: h,
  }
}

function levelLabel(values: ReadonlySet<number>) {
  const levels = [...values].sort((a, b) => a - b)
  if (levels.length === 1) return 'Lv. ' + levels[0]
  const first = levels[0]
  const last = levels[levels.length - 1]
  return 'Lv. ' + (last - first + 1 === levels.length ? first + '–' + last : levels.join(' · '))
}

function poolSummary(entries: KantoLocation['encounters']) {
  const grouped = new Map<string, { id: string; levels: Set<number>; weight: number }>()
  for (const entry of entries) {
    let current = grouped.get(entry.speciesId)
    if (!current) {
      current = { id: entry.speciesId, levels: new Set(), weight: 0 }
      grouped.set(entry.speciesId, current)
    }
    current.levels.add(entry.level)
    current.weight += entry.weight
  }
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  return [...grouped.values()].sort((a, b) => b.weight - a.weight)
    .map(entry => ({ ...entry, percent: Math.round(entry.weight * 1000 / total) / 10 }))
}

function RangeList({ location, game }: { location: KantoLocation; game: GameSave }) {
  const forecast = regionalWeather(game, location.id)
  const slots = forecast?.encounters ?? location.encounters
  const entries = useMemo(() => poolSummary(slots).map(entry => {
    const forms = game.regionId === 'paldea' ? paldeaWildForms(location.id, entry.id) : undefined
    const formId = forms?.length ? forms[0].formId : locationForm(game.regionId, location.id, entry.id)
    const description = forms?.map(row => formLabel(row.formId) ?? '기본 모습').join(' · ') ??
      (hasWildMidnightForm(game.regionId, location.id, entry.id) ? '한낮·한밤중의 모습' : formLabel(formId))
    return { ...entry, formId, description }
  }), [slots, game.regionId, location.id])
  const rareEntries = eligibleLegends(location, game.starterSpeciesId, true)
  const available = location.afterFinale && !game.campaign.finaleWon ? [] : eligibleLegends(location, game.starterSpeciesId, game.campaign.champion, game.campaign.badges.length)
  const rareWeight = available.reduce((total, entry) => total + entry.weight, 0)
  const rarePercent = KANTO_LEGENDARY_ENCOUNTER_CHANCE * 100
  return <section className="kanto-encounters">
    <h3>일반 야생 포켓몬</h3>
    {forecast && <p className="subtext">오늘의 날씨 · {forecast.weather}</p>}
    {entries.length > 0 ? <ul className="kanto-encounter-list">
      {entries.map(entry => <li key={entry.id}>
        <Pokemon id={entry.id} formId={entry.formId} />
        <div><strong>{species[entry.id].nameKo}</strong><small>{[entry.description, levelLabel(entry.levels)].filter(Boolean).join(' · ')}</small></div>
        <span>{entry.percent === 0 ? '0.1% 미만' : entry.percent.toLocaleString('ko-KR') + '%'}</span>
      </li>)}
    </ul> : <p className="empty">이 장소에서는 일반 야생 포켓몬이 출현하지 않습니다.</p>}
    {rareEntries.length > 0 && <div className="kanto-legendary">
      <h3>희귀 포켓몬</h3>
      {available.length > 0 && <p className="subtext">출현 판정당 총 {rarePercent.toLocaleString('ko-KR')}%</p>}
      <ul className="kanto-encounter-list">
        {rareEntries.map(entry => <li key={entry.speciesId}>
          <Pokemon id={entry.speciesId} />
          <div><strong>{species[entry.speciesId].nameKo}</strong><small>Lv. {entry.level}</small></div>
          <span>{available.includes(entry) ? (rarePercent * entry.weight / rareWeight).toLocaleString('ko-KR') + '%' : location.afterFinale ? '네모에게 승리 후 출현' : entry.championOnly ? '리그 우승 후 출현' : '배지 ' + entry.minBadges + '개 필요'}</span>
        </li>)}
      </ul>
    </div>}
  </section>
}

export function RegionMap({ game, focus, travel, busy, begin }: {
  game: GameSave
  focus?: string
  travel: (id: string) => void
  busy: boolean
  begin: (kind: ChallengeKind, trainerId?: string) => void
}) {
  const region = worldRegions[game.regionId]
  const map = maps[game.regionId]
  const current = region.locationById[game.locationId] ?? region.locationById[region.startLocationId]
  const areas = region.id === 'alola' ? alolaIslandByLocationId : region.id === 'galar' ? galarAreaByLocationId : region.id === 'paldea' ? paldeaAreaByLocationId : undefined
  const [zoomArea, zoom] = useState(() => region.id === 'galar' ? areas?.[focus ?? current.id] ?? '' : '')
  const [selectedId, setSelected] = useState(() => focus && region.locationById[focus] ? focus : current.id)
  const selected = region.locationById[selectedId] ?? current
  const localTrainer = region.gymTrainerByLocationId[selected.id]
  const isHere = selected.id === current.id
  const locked = selected.afterFinale && !game.campaign.finaleWon
  const areaPlaces = zoomArea && areas ? region.locations.filter(place => areas[place.id] === zoomArea) : []
  const zoomed = areaPlaces.length > 0
  const groups = zoomed ? markerGroups[region.id].map(group => group.filter(place => areaPlaces.includes(place))).filter(group => group.length > 0)
    : markerGroups[region.id]
  const viewport = zoomed ? areaViewport(areaPlaces, map.width, map.height) : { x: 0, y: 0, width: map.width, height: map.height }
  function choose(id: string) {
    setSelected(id)
    if (zoomed && areas) zoom(areas[id])
  }
  const overlap = groups.find(group => group.includes(selected)) ?? []
  const adjacent = selected.links.filter(id => !overlap.some(place => place.id === id))
  const area = areas?.[selected.id]
  const placeGroups = areas
    ? [...new Set(Object.values(areas))]
      .map(label => ({ label, places: region.locations.filter(place => areas[place.id] === label) }))
    : Object.entries(locationKinds).map(([kind, label]) => ({ label, places: region.locations.filter(place => place.kind === kind) }))
  const areaImage = game.regionId === 'kanto'
    ? new URL('maps/kanto/areas/' + selected.id + '.png', document.baseURI).href : undefined

  return <div className="kanto-layout">
    <section className="card kanto-map-card" aria-label={region.name + ' 지도'}>
      <div className="kanto-map-heading">
        <div><h2>{region.name}</h2><small>{region.generation}세대</small></div>
        <span className="kanto-current">현재 위치 · {current.name}</span>
      </div>
      {areas && <div className="filter-row island-zoom" role="group" aria-label={region.id === 'alola' ? '섬 확대' : '지역 확대'}>
        <button aria-pressed={!zoomed} onClick={() => zoom('')}>전체 지도</button>
        {placeGroups.filter(group => group.places.length > 1).map(({ label, places }) => <button key={label}
          aria-pressed={label === zoomArea} onClick={() => {
            zoom(label)
            if (areas[selected.id] !== label) setSelected(places.find(place => place.id === current.id)?.id ?? places[0].id)
          }}>{label}</button>)}
      </div>}
      <div className={'kanto-map-image' + (map.pixelArt ? ' is-pixel-art' : '') + (region.id === 'galar' && !zoomed ? ' galar-overview' : '')}
        style={zoomed ? { aspectRatio: viewport.width + ' / ' + viewport.height } : undefined}>
        <img src={new URL(map.path, document.baseURI).href} width={map.width} height={map.height} alt={map.alt} draggable={false}
          style={zoomed ? { position: 'absolute', width: map.width / viewport.width * 100 + '%', maxWidth: 'none',
            left: -viewport.x / viewport.width * 100 + '%', top: -viewport.y / viewport.height * 100 + '%' } : undefined} />
        {groups.map(group => {
          const place = group[0]
          const { x, y } = pinFor(game.regionId, place)
          const earned = group.some(option => game.campaign.badges.includes(region.gymTrainerByLocationId[option.id]?.id ?? ''))
          const atCurrent = group.some(option => option.id === current.id)
          const picked = group.some(option => option.id === selected.id)
          const names = group.map(option => option.name).join(' · ')
          return <button key={place.id}
            className={'kanto-pin kanto-pin-' + place.kind + (atCurrent ? ' is-current' : '') + (earned ? ' is-earned' : '')}
            aria-label={names} aria-pressed={picked} title={names}
            style={{ left: (x - viewport.x) / viewport.width * 100 + '%', top: (y - viewport.y) / viewport.height * 100 + '%' }}
            onClick={() => { if (!picked) choose(place.id) }}>
            {group.length > 1 ? group.length : <span aria-hidden="true" />}
          </button>
        })}
      </div>
      <div className="kanto-map-key" aria-label="지도 범례">
        {Object.entries(locationKinds).map(([kind, name]) =>
          <span key={kind}><i className={'kanto-pin-' + kind} aria-hidden="true" />{kind === 'route' && game.regionId === 'paldea' ? '야생 구역' : kind === 'route' && game.regionId === 'galar' ? '도로·야생 구역' : name}</span>)}
      </div>
      <label className="select-field kanto-picker"><strong>장소 목록</strong>
        <select aria-label={region.name.replace(/지방$/, '') + ' 장소'} value={selected.id} onChange={e => choose(e.target.value)}>
          {placeGroups.map(({ label, places }) => <optgroup key={label} label={label}>
            {places.map(place =>
              <option key={place.id} value={place.id}>{place.name}</option>)}
          </optgroup>)}
        </select>
      </label>
    </section>
    <section className="card kanto-place" aria-label="선택한 장소 정보">
      <div className="kanto-place-top">
        <div><small>{[area, (game.regionId === 'paldea' && selected.kind === 'route') || (game.regionId === 'galar' && galarWildAreaIds.has(selected.id)) ? '야생 구역' : locationKinds[selected.kind]].filter(Boolean).join(' · ')}</small><h2>{selected.name}</h2></div>
        {isHere && <span className="kanto-current">현재 위치</span>}
      </div>
      {overlap.length > 1 && <div className="filter-row kanto-links" aria-label="가까운 지도 지점의 장소">
        {overlap.map(place => <button key={place.id} aria-pressed={place.id === selected.id}
          onClick={() => choose(place.id)}>{place.name}</button>)}
      </div>}
      {areaImage && <figure className="kanto-area-preview">
        <img src={areaImage} alt={selected.name + ' 원작 지형'} draggable={false} />
      </figure>}
      <button className="primary kanto-travel" disabled={isHere || busy || locked} onClick={() => travel(selected.id)}>
        {isHere ? '이곳에 도착했습니다' : locked ? '네모에게 승리하면 이동 가능' : '이곳으로 이동'}
      </button>
      {!isHere && (game.campaign.battle || game.campaign.leagueIndex !== null) &&
        <p className="kanto-travel-detail">이동하면 진행 중인 도전이 종료됩니다.</p>}
      {localTrainer && <div className="kanto-landmark">
        <strong>{localTrainer.type && (types[localTrainer.type] ?? localTrainer.type) + ' '}{challengeName(localTrainer)}</strong>
        <span>{localTrainer.trialKind ? '' : '관장 '}{localTrainer.name} · {localTrainer.badge}</span>
      </div>}
      {selected.kind === 'league' && <div className="kanto-landmark"><strong>{region.id === 'galar' ? '가라르 챔피언컵' : region.id === 'paldea' ? '팔데아 챔피언 테스트' : region.name.replace(/지방$/, '') + ' 포켓몬 리그'}</strong></div>}
      {isHere && region.finaleTrainer?.locationId === selected.id && <ChallengeActions game={game} kind="finale" busy={busy} begin={begin} />}
      {isHere && localTrainer && <ChallengeActions game={game} kind="gym" busy={busy} begin={begin} />}
      {isHere && selected.kind === 'league' && <ChallengeActions game={game} kind="league" busy={busy} begin={begin} />}
      {adjacent.length > 0 && <div className="filter-row kanto-links" aria-label="이어지는 장소">
        {adjacent.map(id => {
          const place = region.locationById[id]
          return place ? <button key={id} onClick={() => choose(id)}>{place.name}</button> : null
        })}
      </div>}
      <RangeList location={selected} game={game} />
    </section>
  </div>
}
