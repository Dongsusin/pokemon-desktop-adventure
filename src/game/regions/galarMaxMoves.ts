import type { Move } from '../engine'

const maxMoves: Readonly<Record<string, string>> = {
  normal: '다이어택', grass: '다이그래스', fire: '다이번', water: '다이스트림',
  electric: '다이썬더', ice: '다이아이스', fighting: '다이너클', poison: '다이애시드',
  ground: '다이어스', flying: '다이제트', psychic: '다이사이코', bug: '다이웜',
  rock: '다이록', ghost: '다이할로우', dragon: '다이드라군', dark: '다이아크',
  steel: '다이스틸', fairy: '다이페어리',
}

export const gigantamaxMoves: Readonly<Record<string, { type: string; name: string } | undefined>> = {
  charizard: { type: 'fire', name: '거다이옥염' }, centiskorch: { type: 'fire', name: '거다이백화' },
  drednaw: { type: 'water', name: '거다이암진' }, machamp: { type: 'fighting', name: '거다이회심격' },
  alcremie: { type: 'fairy', name: '거다이단원' }, coalossal: { type: 'rock', name: '거다이분석' },
  grimmsnarl: { type: 'dark', name: '거다이수마' }, hatterene: { type: 'fairy', name: '거다이천벌' },
  duraludon: { type: 'dragon', name: '거다이감쇠' },
}

// The desktop battle system scales its own move powers for a three-round stadium battle.
export function stadiumMove(move: Move, gigantamaxSpecies?: string): Move {
  const signature = gigantamaxSpecies ? gigantamaxMoves[gigantamaxSpecies] : undefined
  const nameKo = signature && signature.type === move.type ? signature.name : maxMoves[move.type]
  return { ...move, nameKo, power: Math.round(move.power * 1.35) }
}
