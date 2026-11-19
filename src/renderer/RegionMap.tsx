import { useMemo, useState } from 'react'
import { worldRegions, type RegionId } from '../game/regions/world'
import { RESEARCH_VISIT_CHANCE } from '../game/regions/collectionEncounters'
import { PALDEA_MAP_WIDTH, PALDEA_MAP_HEIGHT, paldeaAreaByLocationId } from '../game/regions/paldea'
import { GALAR_MAP_WIDTH, GALAR_MAP_HEIGHT, galarAreaByLocationId } from '../game/regions/galar'
import { ALOLA_MAP_WIDTH, ALOLA_MAP_HEIGHT, alolaIslandByLocationId } from '../game/regions/alola'
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
import { nextGymTrainer, KANTO_LEGENDARY_ENCOUNTER_CHANCE, type GameSave } from '../game/engine'
import { locationAccess } from '../game/locationAccess'
import { fieldTrainersByRegion } from '../game/regions/fieldTrainers'
import { MapLocationTooltip, useMapPreview } from './MapLocationTooltip'
import { describePlace, levelLabel, locationKinds, placeKind, rareCondition, usePlaceEncounters } from './mapLocationGuide'
import { FieldTrainerCard } from './FieldTrainerCard'
import { FieldTrainerDirectory } from './FieldTrainerDirectory'
import { ChallengeActions, challengeName, type ChallengeKind } from './Campaign'
import { MapEncounterName, Pokemon } from './shared'
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

function RangeList({ location, game }: { location: KantoLocation; game: GameSave }) {
  const { entries, weather, rareEntries, available, caught, catchSummary } = usePlaceEncounters(game, location)
  const rareWeight = available.reduce((total, entry) => total + entry.weight, 0)
  const rarePercent = KANTO_LEGENDARY_ENCOUNTER_CHANCE * 100
  return <section className="kanto-encounters">
    {catchSummary && <p className="map-catch-total">{catchSummary}</p>}
    <h3>일반 야생 포켓몬</h3>
    {weather && <p className="subtext">오늘의 날씨 · {weather}</p>}
    {entries.length > 0 ? <ul className="kanto-encounter-list">
      {entries.map(entry => <li key={entry.id}>
        <Pokemon id={entry.id} formId={entry.formId} />
        <div><MapEncounterName id={entry.id} caught={caught.has(entry.id)} /><small>{[entry.description, levelLabel(entry.levels)].filter(Boolean).join(' · ')}</small></div>
        <span>{entry.percent === 0 ? '0.1% 미만' : entry.percent.toLocaleString('ko-KR') + '%'}</span>
      </li>)}
    </ul> : <p className="empty">이 장소에서는 일반 야생 포켓몬이 출현하지 않습니다.</p>}
    {Boolean(location.visitors?.length) && <div className="kanto-legendary">
      <h3>리그 우승 후 조사 출현</h3>
      <p className="subtext">{game.campaign.champion ? '조사 가능' : '이 지방 우승 후 해금'} · 희귀 조우 판정 후 {RESEARCH_VISIT_CHANCE * 100}%</p>
      <ul className="kanto-encounter-list">{location.visitors!.map(mon => <li key={mon.speciesId}>
        <Pokemon id={mon.speciesId}/><div><MapEncounterName id={mon.speciesId} caught={caught.has(mon.speciesId)} /><small>Lv. {mon.level}</small></div>
      </li>)}</ul>
    </div>}
    {rareEntries.length > 0 && <div className="kanto-legendary">
      <h3>희귀 포켓몬</h3>
      {available.length > 0 && <p className="subtext">출현 판정당 총 {rarePercent.toLocaleString('ko-KR')}%</p>}
      <ul className="kanto-encounter-list">
        {rareEntries.map(entry => <li key={entry.speciesId}>
          <Pokemon id={entry.speciesId} />
          <div><MapEncounterName id={entry.speciesId} caught={caught.has(entry.speciesId)} /><small>Lv. {entry.level}</small></div>
          <span>{available.some(choice => choice.speciesId === entry.speciesId) ? (rarePercent * entry.weight / rareWeight).toLocaleString('ko-KR') + '%' : rareCondition(game, location, entry)}</span>
        </li>)}
      </ul>
    </div>}
  </section>
}

function TravelRequirements({ game, access, here, choose }: {
  game: GameSave; access: ReturnType<typeof locationAccess>; here: boolean; choose: (id: string) => void
}) {
  const region = worldRegions[game.regionId]
  const next = access.missingBadges > 0 ? nextGymTrainer(game) : undefined
  function locate(id: string) {
    const name = region.locationById[id].name
    return <button type="button" className="gate-destination" aria-label={name + ' 지도에서 보기'}
      onClick={() => choose(id)}>{name} <span aria-hidden="true">›</span></button>
  }
  return <section className="travel-requirements" id="map-travel-requirements" aria-label="이동 조건">
    <h3><i className="map-lock-icon" aria-hidden="true" />{here ? '다시 방문하려면' : '이동 조건'}</h3>
    <ul>
      {access.missingBadges > 0 && <li><span>{region.id === 'alola' ? '시련·큰 시련' : '배지'} {access.requiredBadges}개
        <small>{game.campaign.badges.length}/{access.requiredBadges} 완료{next && ' · 다음 ' + challengeName(next) + ' ' + next.name}</small></span>
        {next && locate(next.locationId)}</li>}
    </ul>
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
  const guide = useMapPreview()
  const selected = region.locationById[selectedId] ?? current
  const localTrainer = region.gymTrainerByLocationId[selected.id]
  const regionalTrainers = useMemo(() => [...fieldTrainersByRegion[region.id]].sort((first, second) =>
    first.name.localeCompare(second.name, 'ko')
  ), [region.id])
  const encounters = regionalTrainers.filter(trainer => trainer.locationId === selected.id)
  const fieldWins = game.campaign.fieldWins ?? []
  const isHere = selected.id === current.id
  const accessByPlace = Object.fromEntries(region.locations.map(place => [place.id, locationAccess(game, place.id)]))
  const access = accessByPlace[selected.id]
  const locked = !access.unlocked
  const placeLabel = (place: KantoLocation) => place.name + (accessByPlace[place.id].unlocked ? '' : ' · 이동 잠김')
  const areaPlaces = zoomArea && areas ? region.locations.filter(place => areas[place.id] === zoomArea) : []
  const zoomed = areaPlaces.length > 0
  const groups = zoomed ? markerGroups[region.id].map(group => group.filter(place => areaPlaces.includes(place))).filter(group => group.length > 0)
    : markerGroups[region.id]
  const viewport = zoomed ? areaViewport(areaPlaces, map.width, map.height) : { x: 0, y: 0, width: map.width, height: map.height }
  function choose(id: string) {
    guide.dismiss()
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

  return <div className="kanto-layout">
    <section className="card kanto-map-card" aria-label={region.name + ' 지도'}>
      <div className="kanto-map-heading">
        <div><h2>{region.name}</h2><small>{region.generation}세대</small></div>
        <span className="kanto-current">현재 위치 · {current.name}</span>
      </div>
      {areas && <div className="filter-row island-zoom" role="group" aria-label={region.id === 'alola' ? '섬 확대' : '지역 확대'}>
        <button aria-pressed={!zoomed} onClick={() => { guide.dismiss(); zoom('') }}>전체 지도</button>
        {placeGroups.filter(group => group.places.length > 1).map(({ label, places }) => <button key={label}
          aria-pressed={label === zoomArea} onClick={() => {
            if (areas[selected.id] !== label) choose(places.find(place => place.id === current.id)?.id ?? places[0].id)
            guide.dismiss()
            zoom(label)
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
          const firstOpen = group.find(option => accessByPlace[option.id].unlocked)
          const destination = picked ? selected : atCurrent ? current : firstOpen ?? place
          const lockedDestination = !accessByPlace[destination.id].unlocked
          const names = group.map(placeLabel).join(' · ')
          return <button key={place.id}
            className={'kanto-pin kanto-pin-' + destination.kind + (atCurrent ? ' is-current' : '') + (earned ? ' is-earned' : '') +
              (lockedDestination ? ' is-locked' : '')}
            aria-label={names} aria-pressed={picked} data-place={destination.id}
            {...guide.trigger(destination, place.id, group)}
            aria-description={group.length > 1 ? destination.name + ' 선택' : undefined}
            style={{ left: (x - viewport.x) / viewport.width * 100 + '%', top: (y - viewport.y) / viewport.height * 100 + '%' }}
            onClick={() => choose(destination.id)}>
            {lockedDestination ? <i className="map-lock-icon" aria-hidden="true" /> : group.length > 1 ? group.length : <span aria-hidden="true" />}
          </button>
        })}
      </div>
      <div className="kanto-map-key" aria-label="지도 범례">
        {Object.entries(locationKinds).map(([kind, name]) =>
          <span key={kind}><i className={'kanto-pin-' + kind} aria-hidden="true" />{kind === 'route' && game.regionId === 'paldea' ? '야생 구역' : kind === 'route' && game.regionId === 'galar' ? '도로·야생 구역' : name}</span>)}
        <span><i className="map-lock-icon" aria-hidden="true" />이동 잠김</span>
      </div>
      <p className="kanto-map-hint">표식에 마우스를 올려 장소를 살펴보고, 클릭해 이동할 곳을 고르세요.</p>
      <label className="select-field kanto-picker"><strong>장소 목록</strong>
        <select aria-label={region.name.replace(/지방$/, '') + ' 장소'} value={selected.id} onChange={e => choose(e.target.value)}>
          {placeGroups.map(({ label, places }) => <optgroup key={label} label={label}>
            {places.map(place =>
              <option key={place.id} value={place.id}>{placeLabel(place)}</option>)}
          </optgroup>)}
        </select>
      </label>
      <FieldTrainerDirectory regionId={region.id} trainers={regionalTrainers} wins={fieldWins} selectedId={selected.id}
        placeLabel={id => placeLabel(region.locationById[id])} select={trainer => choose(trainer.locationId)} />
    </section>
    <section className="card kanto-place" aria-label="선택한 장소 정보">
      <div className="kanto-place-top">
        <div><small>{[area, placeKind(region.id, selected)].filter(Boolean).join(' · ')}</small><h2>{selected.name}</h2></div>
        {isHere && <span className="kanto-current">현재 위치</span>}
      </div>
      <p className="kanto-place-description">{describePlace(game, selected)}</p>
      {overlap.length > 1 && <div className="filter-row kanto-links" aria-label="가까운 지도 지점의 장소">
        <strong>같은 지점</strong>
        {overlap.map(place => <button key={place.id} aria-pressed={place.id === selected.id}
          {...guide.trigger(place, 'nearby-' + place.id, overlap)}
          onClick={() => choose(place.id)}>{placeLabel(place)}</button>)}
      </div>}
      {locked && <TravelRequirements game={game} access={access} here={isHere} choose={choose} />}
      <button className="primary kanto-travel" disabled={isHere || busy || locked}
        aria-describedby={locked ? 'map-travel-requirements' : undefined} onClick={() => travel(selected.id)}>
        {isHere ? '이곳에 도착했습니다' : locked ? '이동 잠김' : '이곳으로 이동'}
      </button>
      {!isHere && !locked && (game.campaign.battle || game.campaign.leagueIndex !== null) &&
        <p className="kanto-travel-detail">이동하면 진행 중인 도전이 종료됩니다.</p>}

      {localTrainer && <div className="kanto-landmark">
        <strong>{challengeName(localTrainer)}</strong>
        <span>{localTrainer.trialKind ? '' : '관장 '}{localTrainer.name} · {localTrainer.badge}</span>
      </div>}
      {selected.kind === 'league' && <div className="kanto-landmark"><strong>{region.id === 'galar' ? '가라르 챔피언컵' : region.id === 'paldea' ? '팔데아 챔피언 테스트' : region.name.replace(/지방$/, '') + ' 포켓몬 리그'}</strong></div>}
      {isHere && region.finaleTrainer?.locationId === selected.id && <ChallengeActions game={game} kind="finale" busy={busy} begin={begin} />}
      {isHere && localTrainer && <ChallengeActions game={game} kind="gym" busy={busy} begin={begin} />}
      {isHere && selected.kind === 'league' && <ChallengeActions game={game} kind="league" busy={busy} begin={begin} />}
      {encounters.map(trainer => <FieldTrainerCard key={trainer.id} game={game} trainer={trainer}
        busy={busy} challenge={id => begin('field', id)} />)}
      {adjacent.length > 0 && <div className="filter-row kanto-links" aria-label="이어지는 장소">
        {adjacent.map(id => {
          const place = region.locationById[id]
          return place ? <button key={id} {...guide.trigger(place, 'link-' + id)} onClick={() => choose(id)}>{placeLabel(place)}</button> : null
        })}
      </div>}
      <RangeList location={selected} game={game} />
    </section>
    <MapLocationTooltip game={game} guide={guide} />
  </div>
}
