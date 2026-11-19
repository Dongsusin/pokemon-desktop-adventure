import { describe, expect, it } from 'vitest'
import { catalogCategoryLabels, catalogItems } from '../src/game/shopCatalog'
import scope from '../tools/data/shop-scope.json'

const byId = new Map(catalogItems.map(item => [item.id, item]))

describe('Friendly Shop source catalog', () => {
  it('keeps all prices valid and every saved identity, Korean label and named modern index distinct', () => {
    expect(catalogItems.length).toBe(445)
    expect(byId.size).toBe(catalogItems.length)
    const indexed = catalogItems.flatMap(item => item.gameIndex ? [item.gameIndex] : [])
    expect(new Set(indexed).size).toBe(indexed.length)
    expect(new Set(catalogItems.map(item => item.nameKo)).size).toBe(catalogItems.length)
    for (const item of catalogItems) {
      expect(Number.isSafeInteger(item.price) && item.price > 0).toBe(true)
      expect(item.nameEn && item.description && catalogCategoryLabels[item.category]).toBeTruthy()
    }
    for (const id of ['pokeball','greatBall','ultraBall','guardCharm','swiftBerry','trailStone']) {
      expect(byId.has(id)).toBe(true)
    }
  })

  it('prices goods by the latest actual cash offer, a base reference or an explicit desktop rule', () => {
    for (const [id, price] of Object.entries({ pokeball:100, greatBall:300, ultraBall:600, potion:150, superPotion:400, 'charizardite-x':100000 })) {
      expect(byId.get(id)).toMatchObject({ price, priceSource: 'legends-za' })
    }
    expect(byId.get('master-ball')).toMatchObject({ price:100000, priceSource:'desktop' })
    expect(byId.get('laheavy-ball')).toMatchObject({ price:120, priceSource:'legends-arceus' })
    expect(byId.get('heavy-ball')?.price).toBeGreaterThan(120)
    expect(byId.has('rare-candy')).toBe(false)
  })

  it('matches the Arena registry and admits only real balls and recovery items beyond it', () => {
    const arena = new Set(scope.arenaItems), slugs = new Set(catalogItems.map(item => item.slug))
    expect(arena.size).toBe(345)
    expect(scope.arenaItems.filter(id => !slugs.has(id))).toEqual([])
    expect(catalogItems.filter(item => item.category === 'balls')).toHaveLength(38)
    for (const row of catalogItems) {
      expect(arena.has(row.slug) || row.category === 'balls' || scope.restorativeCategories.includes(row.sourceCategory) ||
        scope.otherRestoratives.includes(row.slug), row.slug).toBe(true)
    }
    for (const id of ['e-reader-pumkin-berry', 'lapoke-ball', 'glimmoranite', 'canari-bread']) expect(byId.has(id), id).toBe(true)
    for (const id of ['poke-ball-recipe', 'hyper-oran-berry', 'e-reader-nutpea-berry', 'bike--yellow', 'tm01', 'oldAmber']) expect(byId.has(id), id).toBe(false)
  })
})
