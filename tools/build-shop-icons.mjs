// Optional first argument: a local cache of the pinned Git blobs named <sha>.png.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const cache = process.argv[2]
const rev = 'c0542f7c51215d9672439012838c99f520596cbd'
const treeSHA = '90d1800bf2bd00713c1fe3936f786b40a9520123'
const json = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'))
async function get(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'pokemon-desktop-adventure-icons' }, signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw Error(url + ' HTTP ' + res.status)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(done => setTimeout(done, attempt * 500))
    }
  }
}
const entries = JSON.parse(await get('https://api.github.com/repos/PokeAPI/sprites/git/trees/' + treeSHA)).tree
const source = new Map(entries.filter(e => e.path.endsWith('.png')).map(e => [e.path.slice(0, -4), e]))
const catalog = await json('src/game/shop-catalog.json')
const supplement = await json('tools/data/shop-icon-supplement.json')
const destinations = new Map(), icons = {}, shared = []
const pending = new Map()
const out = path.join(root, 'assets/items/catalog')
await mkdir(out, { recursive: true })
const put = (id, url, name, blob, sha256) => {
  if (!destinations.has(id)) {
    destinations.set(id, 'catalog/' + name)
    pending.set(id, { url, name, blob, sha256 })
  }
  return destinations.get(id)
}
const categoryArt = {
  balls: 'poke-ball', medicine: 'potion', berries: 'oran-berry', held: 'leftovers', evolution: 'fire-stone',
  machines: 'tm-normal', battle: 'x-attack', materials: 'green-shard', treasures: 'nugget',
  key: 'town-map', gimmicks: 'key-stone', food: 'old-gateau', other: 'explorer-kit',
}
function commonIcon(row) {
  if (/recipe/.test(row.slug)) return 'rule-book'
  if (/mail/.test(row.slug)) return 'harbor-mail'
  if (/slate/.test(row.slug)) return 'stone-plate'
  if (/balm/.test(row.slug)) return 'sticky-barb'
  if (/charm/.test(row.slug)) return 'oval-charm'
  return categoryArt[row.category]
}
for (const row of catalog) {
  // The original 31 save-identity PNGs are shipped separately.
  if (await readFile(path.join(root, 'assets/items', row.id + '.png')).then(() => true, () => false)) {
    icons[row.id] = row.id
    continue
  }
  let slug = row.slug
  if (row.category === 'machines' && row.moveType && source.has('tm-' + row.moveType) && /^tm\d+$/.test(slug)) {
    slug = 'tm-' + row.moveType
  }
  if (!source.has(slug) && supplement[row.slug]) {
    const [url, sha256] = supplement[row.slug]
    icons[row.id] = put(sha256, url, 'extra-' + row.slug, undefined, sha256)
    continue
  }
  if (!source.has(slug)) {
    slug = commonIcon(row)
    if (!source.has(slug)) slug = categoryArt[row.category]
    shared.push(row.id)
  }
  const entry = source.get(slug)
  if (!entry) throw Error('Missing icon for ' + row.id)
  icons[row.id] = put(entry.sha, 'https://raw.githubusercontent.com/PokeAPI/sprites/' + rev + '/sprites/items/' + entry.path, slug, entry.sha)
}
const jobs = [...pending.values()]
let index = 0
await Promise.all(Array.from({ length: 10 }, async () => {
  while (index < jobs.length) {
    const { name, url, blob, sha256 } = jobs[index++]
    const key = blob ?? 'sha256-' + sha256
    const cached = cache && await readFile(path.join(cache, key + '.png')).catch(() => undefined)
    const image = cached || await get(url)
    if (!image.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw Error('Expected PNG: ' + url)
    if (blob && createHash('sha1').update('blob ' + image.length + '\0').update(image).digest('hex') !== blob) throw Error('Incorrect Git blob: ' + url)
    if (sha256 && createHash('sha256').update(image).digest('hex') !== sha256) throw Error('Incorrect supplemental icon: ' + url)
    await writeFile(path.join(out, name + '.png'), image)
  }
}))
await writeFile(path.join(root, 'src/renderer/shop-item-icons.json'), JSON.stringify({ icons, shared }, null, 2) + '\n')
console.log(catalog.length + ' items, ' + jobs.length + ' unique additional images, ' + shared.length + ' shared category icons')
