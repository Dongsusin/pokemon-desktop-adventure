import { BrowserWindow, app, nativeImage, screen, type NativeImage, type Rectangle } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const productName = '포켓몬 데스크톱 어드벤처'
type View = 'control' | 'overlay'

export interface AdventureWindows {
  control: BrowserWindow
  overlay: BrowserWindow
  updateOverlay(visible: boolean, alwaysOnTop: boolean): void
  showControl(): void
  observe(): void
  isTrustedRenderer(window: BrowserWindow, rendererUrl: string): boolean
}

function rendererUrl(view: View): URL {
  const developmentUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL : undefined
  const entry = developmentUrl
    ? new URL(developmentUrl)
    : pathToFileURL(join(__dirname, '../renderer/index.html'))
  entry.searchParams.set('view', view)
  return entry
}

export function overlayWorkArea(): Rectangle {
  return screen.getPrimaryDisplay().workArea
}

function createIcon(): NativeImage {
  const size = 32
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const radius = Math.hypot(x - 15.5, y - 15.5)
      if (radius > 14.5) continue
      const button = radius <= 4
      const edge = radius >= 12.6 || y === 15 || y === 16 || radius <= 5.8
      const color = button ? [242, 247, 253] : edge ? [35, 37, 54] : y < 15 ? [238, 84, 81] : [223, 233, 246]
      const offset = (y * size + x) * 4
      pixels[offset] = color[2]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[0]
      pixels[offset + 3] = 255
    }
  }
  return nativeImage.createFromBitmap(pixels, { width: size, height: size })
}

export function loadAppIcon(): NativeImage {
  const relativePaths = ['assets/app-icon.png', 'out/renderer/app-icon.png', 'assets/sprites/pokemon/4.png']
  for (const base of [app.getAppPath(), process.resourcesPath]) {
    for (const relativePath of relativePaths) {
      const path = join(base, relativePath)
      if (!existsSync(path)) continue
      const icon = nativeImage.createFromPath(path)
      if (!icon.isEmpty()) return icon
    }
  }
  return createIcon()
}

export function createWindows(icon: NativeImage, shouldQuit: () => boolean): AdventureWindows {
  const workArea = overlayWorkArea()
  const webPreferences = {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    spellcheck: false,
    navigateOnDragDrop: false,
    devTools: !app.isPackaged
  }
  const overlay = new BrowserWindow({
    ...workArea,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: false,
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    title: productName,
    webPreferences: { ...webPreferences, devTools: false, autoplayPolicy: 'no-user-gesture-required' }
  })
  overlay.setIgnoreMouseEvents(true)

  const control = new BrowserWindow({
    width: Math.min(1120, workArea.width),
    height: Math.min(800, workArea.height),
    minWidth: Math.min(780, workArea.width),
    minHeight: Math.min(560, workArea.height),
    title: productName,
    backgroundColor: '#f3f2e9',
    autoHideMenuBar: true,
    icon,
    show: false,
    webPreferences
  })
  control.removeMenu()
  control.on('close', (event) => {
    if (shouldQuit()) return
    event.preventDefault()
    control.hide()
  })

  let firstOverlayPaint = false
  let showOverlay = false

  function syncOverlayVisibility(): void {
    if (overlay.isDestroyed()) return
    if (!showOverlay) {
      if (overlay.isVisible()) overlay.hide()
      return
    }
    if (firstOverlayPaint && !overlay.isVisible()) {
      resizeOverlay()
      overlay.setIgnoreMouseEvents(true)
      overlay.showInactive()
      if (!overlay.isAlwaysOnTop() && control.isFocused()) control.moveTop()
    }
  }

  overlay.once('ready-to-show', () => {
    firstOverlayPaint = true
    syncOverlayVisibility()
  })

  const urls = new Map([
    [control, rendererUrl('control').href],
    [overlay, rendererUrl('overlay').href]
  ])
  for (const [window, url] of urls) {
    const contents = window.webContents
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    contents.on('will-navigate', (event) => event.preventDefault())
    contents.on('will-redirect', (event) => event.preventDefault())
    contents.on('will-attach-webview', (event) => event.preventDefault())
    void window.loadURL(url).catch((error: unknown) => {
      console.error('Unable to load application view', error)
    })
  }

  function resizeOverlay(): void {
    if (overlay.isDestroyed()) return
    const current = overlay.getBounds()
    const next = overlayWorkArea()
    if (current.x !== next.x || current.y !== next.y || current.width !== next.width || current.height !== next.height) {
      overlay.setBounds(next)
    }
  }
  screen.on('display-added', resizeOverlay)
  screen.on('display-removed', resizeOverlay)
  screen.on('display-metrics-changed', resizeOverlay)
  overlay.once('closed', () => {
    screen.off('display-added', resizeOverlay)
    screen.off('display-removed', resizeOverlay)
    screen.off('display-metrics-changed', resizeOverlay)
  })

  return {
    control,
    overlay,
    updateOverlay(visible, alwaysOnTop) {
      if (overlay.isDestroyed()) return
      if (overlay.isAlwaysOnTop() !== alwaysOnTop) overlay.setAlwaysOnTop(alwaysOnTop)
      showOverlay = visible
      syncOverlayVisibility()
    },
    showControl() {
      if (control.isDestroyed()) return
      if (control.isMinimized()) control.restore()
      control.show()
      control.focus()
    },
    observe() {
      control.hide()
      if (overlay.isVisible()) overlay.moveTop()
    },
    isTrustedRenderer(window, url) {
      return urls.get(window) === url
    }
  }
}
