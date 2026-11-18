import { useEffect, useState } from 'react'
import { pokemonForms, formLabel } from '../game/forms'
import { species } from '../game/catalog'
import { items } from '../game/engine'
import type { AdventureSnapshot } from '../preload/contracts'

export const types: Record<string, string> = {
  normal: '노말', fighting: '격투', flying: '비행', poison: '독', ground: '땅',
  rock: '바위', bug: '벌레', ghost: '고스트', steel: '강철', fire: '불꽃',
  water: '물', grass: '풀', electric: '전기', psychic: '에스퍼', ice: '얼음',
  dragon: '드래곤', dark: '악', fairy: '페어리'
}

export const statNames = {
  hp: '체력', attack: '공격', defense: '방어', spAttack: '특수공격', spDefense: '특수방어', speed: '스피드'
}

export function spriteUrl(id: string) {
  if (Object.hasOwn(pokemonForms, id)) return new URL('sprites/forms/' + id + '.png', document.baseURI).href
  return new URL('sprites/pokemon/' + species[id]?.pokedexNumber + '.png', document.baseURI).href
}

export function TeraIcon({ type }: { type: string }) {
  return <img className="tera-icon" src={new URL('maps/paldea/tera/' + type + '.png', document.baseURI).href}
    alt={types[type] + ' 테라스탈'} draggable={false} />
}

export function pokemonName(id: string, formId?: string) {
  return [species[id]?.nameKo ?? '포켓몬', formLabel(formId)].filter(Boolean).join(' · ')
}

export function Pokemon({ id, formId, className = '', label = false }: { id: string; formId?: string; className?: string; label?: boolean }) {
  const [failedId, setFailedId] = useState('')
  const spriteId = formId ?? id
  const name = pokemonName(id, formId)
  if (failedId === spriteId || !species[id]) {
    return <span className={'sprite-fallback ' + className} role={label ? 'img' : undefined} aria-label={label ? name : undefined} />
  }
  return <img className={'pokemon-sprite ' + className} src={spriteUrl(spriteId)} alt={label ? name : ''} draggable={false} onError={() => setFailedId(spriteId)} />
}

export function itemSpriteUrl(id: string) {
  return new URL('items/' + encodeURIComponent(id) + '.png', document.baseURI).href
}

export function ItemSprite({ id, className = '', label = false }: { id: string; className?: string; label?: boolean }) {
  const [failedId, setFailedId] = useState('')
  const item = Object.hasOwn(items, id) ? items[id] : undefined
  if (!item || failedId === id) {
    return <span className={'item-sprite item-placeholder ' + className}
      role={label ? 'img' : undefined} aria-label={label ? item?.nameKo : undefined}>{item?.symbol || '•'}</span>
  }
  return <img className={'item-sprite ' + className} src={itemSpriteUrl(id)}
    alt={label ? item.nameKo : ''} draggable={false} onError={() => setFailedId(id)} />
}

export function useAdventure() {
  const [snapshot, setSnapshot] = useState<AdventureSnapshot | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!window.adventure) {
      setError('Electron 앱에서 실행해 주세요.')
      return
    }
    let live = true
    let receivedUpdate = false
    const off = window.adventure.subscribe(next => {
      receivedUpdate = true
      setSnapshot(next)
    })
    void window.adventure.getSnapshot().then(next => {
      if (live && !receivedUpdate) setSnapshot(next)
    }).catch(() => {
      if (live) setError('게임 상태를 불러오지 못했습니다. 앱을 다시 실행해 주세요.')
    })
    return () => { live = false; off() }
  }, [])
  return { snapshot, error }
}
