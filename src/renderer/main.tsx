import { createRoot } from 'react-dom/client'
import { Control } from './Control'
import './styles.css'

const overlay = new URLSearchParams(location.search).get('view') === 'overlay'
document.documentElement.dataset.view = overlay ? 'overlay' : 'control'
const root = createRoot(document.getElementById('app')!)
if (overlay) void import('./Overlay').then(({ Overlay }) => root.render(<Overlay />))
else root.render(<Control />)
