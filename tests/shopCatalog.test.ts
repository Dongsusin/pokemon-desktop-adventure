import { describe, expect, it } from 'vitest'
import { catalogCategoryLabels, catalogItems } from '../src/game/shopCatalog'
import { collectionItems } from '../src/game/collectionItems'

const byId = new Map(catalogItems.map(item => [item.id, item]))

describe('Friendly Shop source catalog', () => {
  it('keeps all prices valid and every saved identity, Korean label and named modern index distinct', () => {
    expect(catalogItems.length).toBeGreaterThan(2300)
    expect(byId.size).toBe(catalogItems.length)
    const indexed = catalogItems.flatMap(item => item.gameIndex ? [item.gameIndex] : [])
    expect(new Set(indexed).size).toBe(indexed.length)
    expect(new Set(catalogItems.map(item => item.nameKo)).size).toBe(catalogItems.length)
    for (const item of catalogItems) {
      expect(Number.isSafeInteger(item.price) && item.price > 0).toBe(true)
      expect(item.nameEn && item.description && catalogCategoryLabels[item.category]).toBeTruthy()
    }
    for (const id of [...Object.keys(collectionItems), 'pokeball','greatBall','ultraBall','guardCharm','swiftBerry','trailStone']) {
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
    expect(byId.get('rare-candy')?.price).toBeGreaterThan(0)
  })

  it('covers historical and DLC items and differentiates usable balls, crafting recipes and current TMs', () => {
    for (const id of ['berserk-gene','e-reader-pumkin-berry','distortion-slate','metal-alloy','hyper-cheri-berry','raichunite-y','glimmoranite','canari-bread']) {
      expect(byId.has(id), id).toBe(true)
    }
    expect(byId.get('poke-ball-recipe')?.category).toBe('key')
    expect(byId.get('lapoke-ball')?.category).toBe('balls')
    expect(catalogItems.filter(item => item.nameEn === 'Strange Ball')).toHaveLength(1)
    expect(byId.get('bike--yellow')?.gameIndex).toBe(713)
    expect(byId.get('tm01')).toMatchObject({ nameEn:'TM001', moveId:'headbutt', moveType:'normal' })
    expect(catalogItems.filter(item => item.sourceCategory === 'dynamax-crystals')).toHaveLength(12)
    expect(catalogItems.some(item => item.gameIndex === 1622 || item.gameIndex === 2612)).toBe(false)
    expect(byId.has('god-stone')).toBe(false)
  })
})
