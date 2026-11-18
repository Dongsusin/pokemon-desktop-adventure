import { randomUUID } from 'node:crypto'
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { hydrateSave, type GameSave } from '../game/engine'
import { isSlot, type SlotNumber } from '../preload/contracts'

export type SaveRead = {
  game: GameSave | null
  status: 'clean' | 'empty' | 'recovered' | 'damaged'
}

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

function parseJson(text: string | null): unknown {
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function writeAtomic(path: string, contents: string): void {
  const temporary = path + '.' + randomUUID() + '.tmp'
  try {
    const descriptor = openSync(temporary, 'wx', 0o600)
    try {
      writeFileSync(descriptor, contents, 'utf8')
      fsyncSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
    renameSync(temporary, path)
  } finally {
    if (existsSync(temporary)) rmSync(temporary, { force: true })
  }
}

export class SaveRepository {
  constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true })
  }

  private slotPath(slot: SlotNumber): string {
    return join(this.directory, 'slot' + slot + '.json')
  }

  read(slot: SlotNumber): SaveRead {
    const path = this.slotPath(slot)
    const primary = readText(path)
    const game = hydrateSave(parseJson(primary), slot)
    if (game) return { game, status: 'clean' }

    const backup = readText(path + '.bak')
    const recovered = hydrateSave(parseJson(backup), slot)
    if (recovered) return { game: recovered, status: 'recovered' }
    return { game: null, status: primary === null && backup === null ? 'empty' : 'damaged' }
  }

  write(game: GameSave, at = Date.now()): void {
    const slot = game.selectedSlot
    if (!isSlot(slot)) throw new Error('Invalid save slot')
    const path = this.slotPath(slot)
    const lastSavedAt = new Date(at).toISOString()
    const next = JSON.stringify({ ...game, lastSavedAt })
    const current = readText(path)
    if (current !== null && hydrateSave(parseJson(current), slot)) {
      writeAtomic(path + '.bak', current)
    } else {
      if (current !== null) writeAtomic(path + '.corrupt-' + randomUUID(), current)
      const backup = readText(path + '.bak')
      if (!hydrateSave(parseJson(backup), slot)) {
        if (backup !== null) writeAtomic(path + '.bak.corrupt-' + randomUUID(), backup)
        writeAtomic(path + '.bak', next)
      }
    }
    writeAtomic(path, next)
    game.lastSavedAt = lastSavedAt
  }

  readSelectedSlot(): SlotNumber {
    const value = parseJson(readText(join(this.directory, 'selected-slot.json')))
    return isSlot(value) ? value : 1
  }

  writeSelectedSlot(slot: SlotNumber): void {
    writeAtomic(join(this.directory, 'selected-slot.json'), JSON.stringify(slot))
  }
}
