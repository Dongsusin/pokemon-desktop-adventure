// Rebuild the stone/form and signature-crystal tables from the pinned simulator item data.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const revision = '5b88c476113d51a939bddbcd00b5cd182a5d8058'
const response = await fetch('https://raw.githubusercontent.com/smogon/pokemon-showdown/' + revision + '/data/items.ts')
if (!response.ok) throw Error('Item data HTTP ' + response.status)
const source = ts.createSourceFile('items.ts', await response.text(), ts.ScriptTarget.Latest, true)
const table = source.statements[0].declarationList.declarations[0].initializer
function literals(node) {
  if (!node) return
  if (ts.isStringLiteral(node)) return node.text
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literals)
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(prop => [prop.name.text, literals(prop.initializer)]))
}
const stones = {}, zUsers = {}
for (const prop of table.properties) {
  const value = literals(prop.initializer)
  if (value.megaStone) stones[prop.name.text] = Object.values(value.megaStone).map(name => name.toLowerCase().replace('tatsugiri-curly-', 'tatsugiri-'))
  if (value.zMoveFrom && value.itemUser) zUsers[prop.name.text] = value.itemUser.map(name => name.toLowerCase().replaceAll(' ', '-'))
}
if (!stones.charizarditex || !stones.tatsugirinite || !zUsers.pikaniumz) throw Error('Incomplete upstream item table')
await writeFile(fileURLToPath(new URL('../src/game/shop-item-traits.json', import.meta.url)), JSON.stringify({ stones, zUsers }, null, 2) + '\n')
