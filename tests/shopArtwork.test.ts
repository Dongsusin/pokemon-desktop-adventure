import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { catalogItems } from '../src/game/shopCatalog'
import manifest from '../src/renderer/shop-item-icons.json'

it('ships a local PNG for every shop and bag entry, including Z-A DLC', () => {
  const files: Record<string, string> = manifest.icons
  expect(Object.keys(files).sort()).toEqual(catalogItems.map(item => item.id).sort())
  for (const file of new Set(Object.values(files))) {
    expect(file).toMatch(/^(catalog\/)?[a-zA-Z0-9_-]+$/)
    const png = readFileSync(resolve('assets', 'items', file + '.png'))
    expect(png.subarray(0, 8).toString('hex'), file).toBe('89504e470d0a1a0a')
    expect(png.readUInt32BE(16), file).toBeGreaterThan(0)
    expect(png.readUInt32BE(20), file).toBeGreaterThan(0)
  }
  for (const id of ['pokeball', 'master-ball', 'hyper-oran-berry', 'charizardite-x', 'glimmoranite']) {
    expect(files[id]).toBeTruthy()
    expect(manifest.shared).not.toContain(id)
  }
})
