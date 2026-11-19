import { tick, type Bounds, type GameSave } from '../src/game/engine'

// Scripted fixtures provide individual fighter actions while both sides use the normal arena physics.
export function advanceScripted(game: GameSave, elapsed: number, bounds: Bounds) {
  tick(game, elapsed, bounds, () => [])
}
