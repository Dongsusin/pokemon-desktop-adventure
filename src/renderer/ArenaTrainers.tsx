import type { KantoTrainer } from '../game/regions/kantoCampaign'

const namedSprites = new Set([
  'aaron', 'acerola', 'agatha', 'bea', 'bede', 'bertha', 'blaine', 'blue', 'brassius', 'brawly', 'brock', 'bruno',
  'bugsy', 'burgh', 'byron', 'caitlin', 'candice', 'cheren', 'chuck', 'clair', 'clemont', 'cynthia', 'diantha', 'drake',
  'drayden', 'elesa', 'erika', 'falkner', 'fantina', 'flannery', 'flint', 'gardenia', 'geeta', 'giovanni', 'glacia', 'gordie',
  'grant', 'grimsley', 'grusha', 'hala', 'hassel', 'hop', 'iono', 'iris', 'jasmine', 'juan', 'kabu', 'kahili',
  'karen', 'katy', 'kofu', 'koga', 'korrina', 'kukui', 'lance', 'larry', 'leon', 'lorelei', 'lt-surge', 'lucian',
  'marnie', 'marshal', 'maylene', 'milo', 'misty', 'morty', 'nemona', 'nessa', 'norman', 'olivia', 'olympia', 'opal',
  'phoebe', 'piers', 'poppy', 'raihan', 'ramos', 'rika', 'roark', 'roxanne', 'roxie', 'ryme', 'sabrina', 'shauntal',
  'sidney', 'skyla', 'tulip', 'valerie', 'viola', 'volkner', 'wake', 'wallace', 'wattson', 'whitney', 'will', 'winona',
  'wulfric'
])

const femaleFallback = new Set(['malva', 'drasna', 'hapu'])

function TrainerFigure({ image, x, y }: { image: string; x: number; y: number }) {
  return <img alt="" draggable={false} data-trainer-sprite={image}
    src={new URL('battle/trainers/' + image + '.png', document.baseURI).href}
    style={{ position: 'absolute', zIndex: 1, left: x + '%', top: y + '%', height: '6.1%',
      width: 'auto', maxWidth: '4%', transform: 'translate(-50%, -82%)', objectFit: 'contain',
      pointerEvents: 'none', imageRendering: 'pixelated' }}/>
}

export function ArenaTrainers({ trainer }: { trainer: KantoTrainer }) {
  const name = trainer.id.replace(/^(johto|hoenn|sinnoh|unova|kalos|alola|galar|paldea)-/, '').replace(/-(cup|elite)$/, '')
  const rival = namedSprites.has(name) ? name : femaleFallback.has(name) ? 'ace-f' : 'ace-m'
  return <div aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <TrainerFigure image="player" x={2.2} y={51}/>
    {trainer.trialKind !== 'totem' && (name === 'tate-liza'
      ? <><TrainerFigure image="tate" x={97.8} y={48}/><TrainerFigure image="liza" x={97.8} y={55}/></>
      : <TrainerFigure image={rival} x={97.8} y={51}/>)}
  </div>
}
