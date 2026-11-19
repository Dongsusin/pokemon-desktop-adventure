// Run with Node 22+. Immutable upstream revisions keep clean catalog builds identical.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const api = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/e98f2ad82fc61c46036689ecb10c3aa89d562d6b/data/v2/csv/'
const pkhex = 'https://raw.githubusercontent.com/kwsch/PKHeX/6c9583883c7551ac74a4b74180cead249d4277b8/PKHeX.Core/'
const snapshot = JSON.parse(await readFile(new URL('data/shop-offers.json', import.meta.url), 'utf8'))

async function source(url) {
  const result = await fetch(url)
  if (!result.ok) throw new Error(url + ' HTTP ' + result.status)
  const bytes = new Uint8Array(await result.arrayBuffer())
  return new TextDecoder(bytes[0] === 255 && bytes[1] === 254 ? 'utf-16le' : 'utf-8').decode(bytes)
}
function csv(data) {
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
    if (char === '"') {
      if (quoted && data[i + 1] === '"') { cell += '"'; i++ }
      else quoted = !quoted
    } else if (!quoted && char === ',') {
      row.push(cell); cell = ''
    } else if (!quoted && char === '\n') {
      row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''
    } else cell += char
  }
  if (cell || row.length) rows.push([...row, cell])
  return rows.slice(1)
}
const csvFiles = ['items', 'item_names', 'item_game_indices', 'item_categories', 'item_prices',
  'version_groups', 'machines', 'moves', 'move_names', 'types']
const tables = Object.fromEntries(await Promise.all(csvFiles.map(async file => [file, csv(await source(api + file + '.csv'))])))
async function languages(stem) {
  return Promise.all(['en', 'ko'].map(async lang => (await source(pkhex + 'Resources/text/items/' + stem + '_' + lang + '.txt')).split(/\r?\n/)))
}
const [modern, g1, g2, g3, mail4, zaStorage, svStorage, laStorage, bdStorage, swshStorage] = await Promise.all([
  ...['text_Items', 'gen1/text_ItemsG1', 'gen2/text_ItemsG2', 'gen3/text_ItemsG3', 'gen4/text_Mail4'].map(languages),
  ...['9ZA', '9SV', '8LA', '8BDSP', '8SWSH'].map(v => source(pkhex + 'Items/ItemStorage' + v + '.cs')),
])
function pockets(code) {
  const types = new Map()
  for (const match of code.replace(/\/\/[^\n]*/g, '').matchAll(/public static ReadOnlySpan<ushort> (\w+) =>\s*\[([^\]]*)\]/g)) {
    if (match[1] === 'Unreleased') continue
    for (const id of match[2].match(/\b\d+\b/g) ?? []) types.set(Number(id), match[1])
  }
  return types
}
const zaPockets = pockets(zaStorage), svPockets = pockets(svStorage), laPockets = pockets(laStorage)
const bdPockets = pockets(bdStorage)
const crystalBound = constant => Number(swshStorage.match(new RegExp('const int DMAX_' + constant + ' = (\\d+)'))[1])
const lastReleasedCrystal = crystalBound('LEGAL_END'), lastCrystal = crystalBound('END')
// Unreleased numeric placeholders and quest-only transient records are not stock.
const ignoredIndex = i => (i > lastReleasedCrystal && i <= lastCrystal) || i === 1622 || i === 2612
const slugify = name => (name || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’'.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const norm = name => slugify(name).replaceAll('-', '')
function named(rows, language) { return new Map(rows.filter(r => r[1] === language).map(r => [r[0], r[2]])) }
const enNames = named(tables.item_names, '9'), koNames = named(tables.item_names, '3')
const localMoves = named(tables.move_names, '3')
const modernIndices = Map.groupBy(modern[0].map((name, index) => ({ name, index })), r => norm(r.name))
const historicalKo = new Map()
for (const [en, ko] of [g1, g2, g3, mail4]) en.forEach((name, id) => historicalKo.set(norm(name), ko[id]?.replace(/\*/g, '').trim()))
const groups = new Map(tables.version_groups.map(([id, slug, , order]) => [id, { slug, order: +order }]))
const indexes = Map.groupBy(tables.item_game_indices.filter(r => +r[1] >= 4), r => r[0])
const itemCategories = new Map(tables.item_categories.map(([id, pocket, slug]) => [id, { pocket, slug }]))
const offers = new Map()
for (const [item, version, currency, purchase] of tables.item_prices) {
  const group = groups.get(version)
  if (currency !== '1' || !(+purchase > 0) || (offers.get(item)?.order ?? 0) > group.order) continue
  offers.set(item, { price: +purchase, ...group })
}
const moveNames = new Map(tables.moves.map(row => [row[0], row]))
const typeNames = new Map(tables.types.map(row => [row[0], row[1]]))
const machines = new Map()
for (const [num, version, item, move] of tables.machines) {
  const order = groups.get(version).order
  if (order >= (machines.get(item)?.order ?? 0)) machines.set(item, { order, move, num, version })
}

const saveIds = {
  'poke-ball': 'pokeball', 'great-ball': 'greatBall', 'ultra-ball': 'ultraBall', 'super-potion': 'superPotion',
  'muscle-band': 'muscleBand', eviolite: 'guardCharm', 'lucky-egg': 'luckyEgg', 'soothe-bell': 'soothingBell',
  'amulet-coin': 'explorerBadge', 'salac-berry': 'swiftBerry', 'hard-stone': 'trailStone', 'linking-cord': 'linkingCord',
}
for (const slug of ['fire-stone', 'water-stone', 'thunder-stone', 'leaf-stone', 'moon-stone', 'sun-stone',
  'shiny-stone', 'dusk-stone', 'ice-stone', 'old-amber', 'helix-fossil', 'dome-fossil', 'claw-fossil',
  'skull-fossil', 'armor-fossil', 'plume-fossil', 'jaw-fossil', 'sail-fossil']) {
  saveIds[slug] = slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}
const pocketCategories = { Medicine: 'medicine', Balls: 'balls', Battle: 'battle', Berry: 'berries', MegaStones: 'gimmicks',
  Machine: 'machines', TM: 'machines', Treasure: 'treasures', Material: 'materials', Picnic: 'food', Event: 'key', Key: 'key', Recipe: 'key' }
function category(sourceCategory, index, slug) {
  if (laPockets.get(index) === 'Recipe') return 'key'
  if (index === 2618) return 'gimmicks'
  if (index === 2619 || (index >= 1808 && index <= 1809)) return 'materials'
  if (index === 1810 || (index >= 1811 && index <= 1822)) return 'key'
  if (index === 1621 || index === 2558 || /^(fine-|superb-)?remedy$|^grit-(dust|gravel|pebble|rock)$/.test(slug)) return 'medicine'
  if (index >= 2601 && index <= 2610) return 'food'
  if (index >= 1614 && index <= 1619 && index !== 1615 && index !== 1616 || index >= 1724 && index <= 1728) return 'food'
  if (index === 1615 || index === 1616 || (index >= 1756 && index <= 1758)) return 'battle'
  if (index === 1720) return 'treasures'
  if (/^(survival|warding|tempting)-charm[-]?[a-z]$/.test(slug)) return 'other'
  if (/^mega-(bracelet|charm|ring|tiara|glove|pendant|glasses|anchor|stickpin|anklet|cuff)$|^z-(power-)?ring$|^(tera-orb|dynamax-band|wishing-(star|piece))$/.test(slug)) return 'gimmicks'
  if (/z--(bag|held)$/.test(slug) || /^(mega-stones|z-crystals|tera-shard|dynamax-crystals)$/.test(sourceCategory)) return 'gimmicks'
  if (/fossil|old-amber|black-augurite|peat-block|metal-alloy/.test(slug) || sourceCategory === 'evolution') return 'evolution'
  if (/berry$/.test(slug) && !/juice|pouch|pots|blender/.test(slug)) return 'berries'
  if (/^((tm|hm|tr)\d+)$/.test(slug) || sourceCategory === 'all-machines') return 'machines'
  if (['standard-balls', 'special-balls', 'apricorn-balls'].includes(sourceCategory)) return 'balls'
  if (['stat-boosts', 'flutes', 'miracle-shooter'].includes(sourceCategory)) return 'battle'
  if (['vitamins', 'healing', 'pp-recovery', 'revival', 'status-cures', 'nature-mints', 'species-candies'].includes(sourceCategory)) return 'medicine'
  if (['sandwich-ingredients', 'curry-ingredients', 'picnic'].includes(sourceCategory)) return 'food'
  if (['tm-materials', 'mulch', 'collectibles'].includes(sourceCategory)) return 'materials'
  if (sourceCategory === 'loot') return 'treasures'
  if (['held-items','choice','effort-training','bad-held-items','training','plates','species-specific','type-enhancement','memories','jewels','scarves'].includes(sourceCategory)) return 'held'
  const pocket = zaPockets.get(index) ?? svPockets.get(index) ?? laPockets.get(index) ?? bdPockets.get(index)
  if (pocketCategories[pocket]) return pocketCategories[pocket]
  if (['event-items', 'gameplay', 'plot-advancement', 'apricorn-box', 'data-cards'].includes(sourceCategory)) return 'key'
  if (sourceCategory === 'unused' && /^(bike|dropped-item|ss-ticket|xtransceiver|holo-caster|dna-splicers|storage-key|basement-key|contest-costume|meteorite)--|-(pocket|badge|petal|album)$/.test(slug)) return 'key'
  if (sourceCategory === 'all-mail') return 'other'
  if (index >= 1900 && index <= 1946) return 'food'
  if (index >= 1608 && index < 1829 && pocket === 'General') return 'materials'
  return 'other'
}
const categoryPrice = { balls: 1500, medicine: 1500, berries: 200, held: 4000, evolution: 5000, machines: 3000,
  battle: 800, materials: 300, treasures: 5000, key: 10000, gimmicks: 10000, food: 300, other: 1000 }
function desktopPrice(slug, group, type) {
  if (slug === 'master-ball') return 100000
  if (type === 'mega-stones' || group === 'gimmicks' && /ite(-[xyz])?$/.test(slug)) return 50000
  if (type === 'tera-shard') return 500
  if (type === 'dynamax-crystals') return 5000
  if (slug.startsWith('hyper-') && group === 'berries') return 1500
  if (slug === 'mega-shard') return 500
  if (type === 'apricorn-balls' || slug === 'beast-ball' || slug === 'dream-ball') return 10000
  return categoryPrice[group]
}
const catalog = [], usedIndices = new Set(), usedSlugs = new Set()
const description = {
  balls: '야생 포켓몬을 담는 볼.', medicine: '포켓몬의 회복이나 육성에 쓰이는 도구.',
  berries: '포켓몬 세계에서 자라는 나무열매.', held: '원작에서 포켓몬에게 지니게 하는 도구.',
  evolution: '포켓몬의 진화 또는 복원에 관련된 도구.', machines: '포켓몬의 기술을 기록한 머신.',
  battle: '원작 배틀에서 트레이너가 사용하는 도구.', materials: '원작에서 모을 수 있는 재료.',
  treasures: '모험 중 발견하는 보물.', key: '원작의 모험이나 이벤트에 등장하는 중요한 도구.',
  gimmicks: '원작의 배틀 기믹에 관련된 도구.', food: '피크닉이나 요리에 관련된 도구.', other: '원작의 모험에서 만날 수 있는 도구.',
}
function add({slug, nameKo, nameEn, sourceCategory, gameIndex, pokeApiId, base = 0, group, extra, machine, price, priceSource}) {
  if (usedSlugs.has(slug)) return
  usedSlugs.add(slug)
  if (gameIndex) usedIndices.add(gameIndex)
  const cat = group ?? category(sourceCategory, gameIndex, slug)
  // Gen IV's Apricorn Heavy Ball differs from Hisui's heavy ball despite sharing a translated name.
  const rawRef = offers.get(String(pokeApiId))
  const ref = slug === 'heavy-ball' && rawRef?.slug === 'legends-arceus' ? undefined : rawRef
  const za = snapshot['legends-za'][slug]
  const sv = snapshot['scarlet-violet'][slug]
  if (!price && za) { price = za; priceSource = 'legends-za' }
  if (!price && machine && machine.order >= groups.get('25').order) {
    // The same numbered Galar TM often contained a different move. Scale the current move's desk price.
    const power = Number(moveNames.get(machine.move)[4]) || 50
    price = Math.max(2000, Math.min(15000, Math.ceil(power / 5) * 250))
    priceSource = 'desktop'
  }
  if (!price && ref && (!sv || ref.order >= groups.get('25').order)) { price = ref.price; priceSource = ref.slug }
  if (!price && sv) { price = sv; priceSource = 'scarlet-violet' }
  const hisui = snapshot['legends-arceus'][slug]
  if (hisui && (!price || (ref?.slug === priceSource && ref.order < groups.get('24').order))) { price = hisui; priceSource = 'legends-arceus' }
  const nominalValue = !price && (base <= 100 || ['ability-patch', 'gold-bottle-cap'].includes(slug) || sourceCategory === 'apricorn-balls')
  if (nominalValue) {
    if (slug === 'ability-patch') price = 125000
    else if (slug === 'gold-bottle-cap') price = 60000
    else if (cat === 'balls') price = desktopPrice(slug, cat, sourceCategory)
    else if (sourceCategory === 'species-candies' || /^(health|mighty|tough|smart|courage|quick)-candy/.test(slug)) price = slug.endsWith('-xl') ? 1500 : slug.endsWith('-l') ? 750 : 300
    else if (['gimmicks','held','key','battle','evolution'].includes(cat)) price = desktopPrice(slug, cat, sourceCategory)
    if (price) priceSource = 'desktop'
  }
  // A zero base value means no cash reference. Keep the provenance of every derived price.
  if (!price) {
    price = base > 0 ? base : desktopPrice(slug, cat, sourceCategory)
    priceSource = base > 0 ? 'base' : 'desktop'
  }
  const row = { id: saveIds[slug] ?? slug, slug, nameKo, nameEn, category: cat, sourceCategory, price, priceSource,
    description: extra || description[cat], ...(gameIndex && {gameIndex}), ...(pokeApiId && {pokeApiId}) }
  if (machine) {
    if (slug.startsWith('tm') && machine.order >= groups.get('25').order) {
      const number = String(machine.num).padStart(3, '0')
      row.nameEn = 'TM' + number
      row.nameKo = '기술머신' + number
    }
    const move = moveNames.get(machine.move)
    row.moveId = move[1]
    row.moveType = typeNames.get(move[3])
    row.description = '기록된 기술 · ' + (localMoves.get(machine.move) ?? move[1])
  }
  catalog.push(row)
}

// These upstream rows alias an already-listed physical item. The other form (e.g. yellow bike, split splicers) has its own index.
const aliases = new Set(['lastrange-ball','xtransceiver--red','dna-splicers--merge','dropped-item--red','holo-caster--green',
  'basement-key--goldenrod','storage-key--galactic-warehouse','bike--green'])
for (const [id, slug, categoryId, cost] of tables.items) {
  if (aliases.has(slug)) continue
  const nameEn = enNames.get(id) ?? slug.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')
  if (/^\?+$/.test(nameEn) || usedSlugs.has(slug) || slug === 'god-stone') continue
  // A few recent game-index CSV rows disagree with the physical item. Match the name before trusting an index.
  const candidates = (indexes.get(id) ?? []).slice().reverse().map(r => +r[2])
  const match = index => norm(nameEn) === norm(modern[0][index]) || (koNames.get(id) && koNames.get(id) === modern[1][index])
  const namedIds = modernIndices.get(norm(nameEn)) ?? []
  const gameIndex = slug === 'tm100' ? 2160 : candidates.find(i => i && !usedIndices.has(i) && match(i)) ??
    namedIds.find(v => v.index && !usedIndices.has(v.index))?.index
  if (ignoredIndex(gameIndex)) continue
  const nameKo = (gameIndex ? modern[1][gameIndex] : null) || koNames.get(id) || historicalKo.get(norm(nameEn)) || nameEn
  const sourceCategory = itemCategories.get(categoryId).slug
  add({slug, nameKo, nameEn, sourceCategory, gameIndex, pokeApiId: +id, base: +cost, machine: machines.get(id)})
}
for (let i = 1; i < modern[0].length; i++) {
  const nameEn = modern[0][i], nameKo = modern[1][i]
  if (i === 694) continue // Old TM100 is represented by its current item index 2160.
  if (!nameEn || !nameKo || usedIndices.has(i) || ignoredIndex(i) || /^\?+$/.test(nameEn)) continue
  // LA's inventory includes separate recipes. They must not be mistaken for balls or medicine.
  const pocket = zaPockets.get(i) ?? svPockets.get(i) ?? laPockets.get(i) ?? bdPockets.get(i)
  if (!pocket) continue
  const recipe = laPockets.get(i) === 'Recipe'
  const key = slugify(nameEn)
  const sourceCategory = ({MegaStones:'mega-stones',Berry:'berries',Medicine:'healing',TM:'all-machines',Machine:'all-machines',
    Material:'tm-materials',Key:'gameplay',Event:'event-items',Picnic:'picnic',Treasure:'loot',Recipe:'recipe'})[pocket] ?? 'other'
  const slug = recipe ? key + '-recipe' : usedSlugs.has(key) ? key + '-' + i : key
  add({slug, nameKo: recipe ? nameKo + ' 레시피' : nameKo, nameEn: recipe ? nameEn + ' Recipe' : nameEn, sourceCategory, gameIndex:i})
}

// Gen II items lost during the Gen III index change have no modern item IDs. Names use the original localised bag.
const johto = {
  74:'psncureberry',78:'przcureberry',79:'burnt-berry',80:'ice-berry',83:'bitter-berry',84:'mint-berry',
  104:'pink-bow',109:'miracle-berry',115:'gs-ball',129:'egg-ticket',150:'mystery-berry',152:'berserk-gene',
  158:'flower-mail',167:'normal-box',168:'gorgeous-box',170:'polkadot-bow',173:'berry',174:'gold-berry',
  180:'brick-piece',181:'surf-mail',182:'litebluemail',183:'portraitmail',184:'lovely-mail',185:'eon-mail',
  186:'morph-mail',187:'bluesky-mail',188:'music-mail',189:'mirage-mail',
}
for (const [i, slug] of Object.entries(johto)) {
  const group = /berry$/.test(slug) ? 'berries' : /bow$|berserk-gene/.test(slug) ? 'held' : ['egg-ticket','gs-ball'].includes(slug) ? 'key' : 'other'
  add({slug, nameKo:g2[1][i].replace(/\*/g,''), nameEn:g2[0][i].replace(/\*/g,''), sourceCategory:'legacy-johto', group})
}
// Named e-Reader distributions use one shared Gen III game slot, separate from the regular Chilan Berry.
// These Gen III releases had no Korean localization. Keep their published names searchable.
for (const name of ['Pumkin', 'Drash', 'Eggant', 'Strib', 'Chilan', 'Nutpea', 'Ginema', 'Kuo', 'Yago', 'Touga', 'Niniku', 'Topo']) {
  add({slug:'e-reader-' + name.toLowerCase() + '-berry',nameKo:name + '열매 (e-Reader)',nameEn:name + ' Berry (e-Reader)',sourceCategory:'e-reader-berries',group:'berries'})
}
add({slug:'exp-all', nameKo:'학습장치 (관동 초기형)', nameEn:'Exp. All', sourceCategory:'legacy-kanto', group:'key'})

const duplicates = Map.groupBy(catalog, r => r.nameKo)
for (const [name, entries] of duplicates) {
  if (entries.length < 2) continue
  for (const [n, row] of entries.entries()) {
    const i = row.gameIndex
    let label
    const variant = {450:'초록',713:'노랑',621:'빨강',626:'노랑',628:'합체',629:'분리',636:'빨강',637:'노랑',641:'초록',714:'빨강',463:'신오',734:'호연'}[i]
    if (variant) label = variant
    else if (i >= 2620 && i <= 2634) label = (i - 2620) % 3 + 1 + '단계'
    else if (row.slug.endsWith('--held')) label = '지니기'
    else if (row.slug.endsWith('--bag')) label = '가방'
    else if (i >= 1608 && i <= 1828) label = '히스이' + (entries.filter(r => r.gameIndex >= 1608 && r.gameIndex <= 1828).length > 1 ? ' ' + i : '')
    else if (i >= 2558) label = 'Z-A' + (entries.filter(r => r.gameIndex >= 2558).length > 1 ? ' ' + i : '')
    else if (n) label = '#' + (i ?? row.pokeApiId ?? n + 1)
    if (label) row.nameKo = name + ' (' + label + ')'
  }
}
assert.equal(new Set(catalog.map(row => row.id)).size, catalog.length)
assert(catalog.every(row => row.nameKo && row.nameEn && Number.isSafeInteger(row.price) && row.price > 0))
assert(catalog.every(row => Object.hasOwn(description, row.category)))
for (const id of Object.values(saveIds)) assert(catalog.some(row => row.id === id), 'Missing old save key ' + id)
assert(catalog.length > 2300)
await writeFile(new URL('../src/game/shop-catalog.json', import.meta.url), '[\n' + catalog.map(row => JSON.stringify(row)).join(',\n') + '\n]\n')
console.log(catalog.length + ' items written.')
