import { app, dialog, ipcMain, Menu, Notification, powerMonitor, session, Tray, type IpcMainInvokeEvent } from 'electron'
import { join } from 'node:path'
import { applyOffline, canChangeLead, createGame, dispatch, tick, type GameSave } from '../game/engine'
import {
  adventureChannels,
  SLOTS,
  type AdventureCommand,
  type AdventureSnapshot,
  type SlotNumber,
  type SlotSummary
} from '../preload/contracts'
import { parseCommand } from './commands'
import { SaveRepository, type SaveRead } from './saveRepository'
import { createWindows, loadAppIcon, overlayWorkArea, productName } from './windows'

const simulationInterval = 100
const autosaveInterval = 15_000
const loginArgs = ['--tray']

function summarize(slot: SlotNumber, game: GameSave | null): SlotSummary {
  return {
    slot,
    speciesId: game?.player.speciesId ?? null,
    level: game?.player.level ?? null,
    lastSavedAt: game?.lastSavedAt ?? null
  }
}

function readWarning(slot: SlotNumber, status: SaveRead['status']): string | null {
  if (status === 'recovered') return '슬롯 ' + slot + '의 저장 데이터를 백업에서 복구했습니다.'
  if (status === 'damaged') return '슬롯 ' + slot + '의 저장 파일이 손상되었습니다. 새로 시작하면 기존 파일은 별도로 보존됩니다.'
  return null
}

function getLaunchAtLogin(): boolean {
  return process.platform === 'win32' && app.isPackaged && app.getLoginItemSettings({ args: loginArgs }).openAtLogin
}

function startDesktop(): void {
  Menu.setApplicationMenu(null)
  session.defaultSession.setPermissionCheckHandler(() => false)
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))

  let quitting = false
  const repository = new SaveRepository(join(app.getPath('userData'), 'saves'))
  let selectedSlot = repository.readSelectedSlot()
  const storedSlots = new Map(SLOTS.map((slot) => [slot, repository.read(slot)]))
  const summaries = new Map(SLOTS.map((slot) => [slot, summarize(slot, storedSlots.get(slot)?.game ?? null)]))
  const initial = storedSlots.get(selectedSlot)!
  let game = initial.game
  let loadWarning = readWarning(selectedSlot, initial.status)
  let saveWarning: string | null = null
  let lastNotice = 0
  let launchAtLogin = getLaunchAtLogin()

  const icon = loadAppIcon()
  const windows = createWindows(icon, () => quitting)
  const tray = new Tray(icon.resize({ width: 32, height: 32 }))
  tray.setToolTip(productName)
  tray.on('click', windows.showControl)

  function snapshot(forOverlay = false): AdventureSnapshot {
    return {
      // Only roaming party members are drawn in the desktop window.
      game: forOverlay && game ? { ...game, boxes: [] } : game,
      selectedSlot,
      slots: SLOTS.map((slot) => slot === selectedSlot ? summarize(slot, game) : summaries.get(slot)!),
      warning: saveWarning ?? loadWarning,
      launchAtLogin
    }
  }

  function publish(includeControl: boolean): void {
    const targets = includeControl ? [windows.overlay, windows.control] : [windows.overlay]
    for (const window of targets) {
      if (!window.isDestroyed() && window.isVisible() && !window.webContents.isLoadingMainFrame()) {
        window.webContents.send(adventureChannels.snapshotChanged, snapshot(window === windows.overlay))
      }
    }
  }

  function saveCurrent(): boolean {
    if (!game) return true
    try {
      repository.write(game)
      summaries.set(selectedSlot, summarize(selectedSlot, game))
      saveWarning = null
      return true
    } catch (error) {
      console.error('Could not write the save file', error)
      saveWarning = '저장하지 못했습니다. 저장 폴더에 쓸 수 있는지 확인해 주세요.'
      return false
    }
  }

  function prepareLoadedGame(status: SaveRead['status']): void {
    lastNotice = 0
    if (!game) return
    game.settings.startOnLogin = launchAtLogin
    const reward = applyOffline(game)
    lastNotice = Math.max(0, ...game.history.map((entry) => entry.id))
    if (reward.minutes > 0 || status === 'recovered') saveCurrent()
  }

  function runTrayCommand(command: AdventureCommand): void {
    try {
      runCommand(command)
    } catch (error) {
      if (!saveWarning && error instanceof Error) loadWarning = error.message
      windows.showControl()
      publish(true)
    }
  }

  function updatePresentation(): void {
    windows.updateOverlay(Boolean(game?.settings.overlayVisible), game?.settings.alwaysOnTop ?? true)
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '관리 창 열기', click: windows.showControl },
      { label: '바탕화면에서 보기', enabled: Boolean(game), click: () => runTrayCommand({ type: 'observe' }) },
      { type: 'separator' },
      {
        label: '자동 사냥',
        type: 'checkbox',
        enabled: Boolean(game),
        checked: Boolean(game?.autoBattle),
        click: (item) => runTrayCommand({ type: 'autoBattle', enabled: item.checked })
      },
      {
        label: '캐릭터 표시',
        type: 'checkbox',
        enabled: Boolean(game),
        checked: Boolean(game?.settings.overlayVisible),
        click: (item) => runTrayCommand({ type: 'settings', settings: { overlayVisible: item.checked } })
      },
      {
        label: '항상 위에 표시',
        type: 'checkbox',
        enabled: Boolean(game),
        checked: game?.settings.alwaysOnTop ?? true,
        click: (item) => runTrayCommand({ type: 'settings', settings: { alwaysOnTop: item.checked } })
      },
      {
        label: '소리',
        type: 'checkbox',
        enabled: Boolean(game),
        checked: Boolean(game?.settings.sound),
        click: (item) => runTrayCommand({ type: 'settings', settings: { sound: item.checked } })
      },
      {
        label: '성장 알림',
        type: 'checkbox',
        enabled: Boolean(game) && Notification.isSupported(),
        checked: Boolean(game?.settings.notifications),
        click: (item) => runTrayCommand({ type: 'settings', settings: { notifications: item.checked } })
      },
      {
        label: 'Windows 시작 시 실행',
        type: 'checkbox',
        enabled: process.platform === 'win32' && app.isPackaged,
        checked: launchAtLogin,
        click: (item) => runTrayCommand({ type: 'setLaunchAtLogin', enabled: item.checked })
      },
      { type: 'separator' },
      { label: '완전히 종료', click: () => app.quit() }
    ]))
  }

  function requireGame(): GameSave {
    if (!game) throw new Error('먼저 함께할 포켓몬을 골라 주세요.')
    return game
  }

  function selectSlot(slot: SlotNumber): void {
    if (slot === selectedSlot) return
    if (!saveCurrent()) throw new Error(saveWarning ?? '현재 슬롯을 저장하지 못했습니다.')
    let stored: SaveRead
    try {
      stored = repository.read(slot)
      repository.writeSelectedSlot(slot)
    } catch (error) {
      console.error('Could not read or select the save slot', error)
      throw new Error('저장 슬롯을 열지 못했습니다.')
    }
    selectedSlot = slot
    game = stored.game
    loadWarning = readWarning(slot, stored.status)
    prepareLoadedGame(stored.status)
  }

  function startGame(command: Extract<AdventureCommand, { type: 'start' }>): void {
    if (game) throw new Error('이 슬롯은 이미 사용 중입니다. 빈 슬롯을 선택해 주세요.')
    let starter: GameSave
    try {
      starter = createGame(command.speciesId, selectedSlot, overlayWorkArea())
    } catch {
      throw new Error('선택한 포켓몬으로 시작할 수 없습니다.')
    }
    dispatch(starter, { type: 'update-settings', settings: command.settings ?? {} })
    if (command.autoBattle !== undefined) {
      dispatch(starter, { type: 'set-auto-battle', value: command.autoBattle })
    }
    starter.settings.startOnLogin = launchAtLogin
    game = starter
    if (saveCurrent()) {
      loadWarning = null
      lastNotice = 0
    } else {
      game = null
      throw new Error(saveWarning ?? '새 게임을 저장하지 못했습니다.')
    }
  }

  function setLaunchAtLogin(enabled: boolean): void {
    if (process.platform !== 'win32' || !app.isPackaged) {
      throw new Error('Windows 시작 시 실행은 설치한 앱에서 설정할 수 있습니다.')
    }
    app.setLoginItemSettings({ openAtLogin: enabled, args: loginArgs })
    launchAtLogin = getLaunchAtLogin()
    if (game) {
      game.settings.startOnLogin = launchAtLogin
      saveCurrent()
    }
  }

  function checkLeadChange(current: GameSave, changesLead: boolean): void {
    if (changesLead && !canChangeLead(current)) throw new Error('현재 동작이 끝나면 선두를 바꿀 수 있습니다.')
  }

  function runCommand(command: AdventureCommand): AdventureSnapshot {
    switch (command.type) {
      case 'selectSlot':
        selectSlot(command.slot)
        break
      case 'start':
        startGame(command)
        break
      case 'settings':
        dispatch(requireGame(), { type: 'update-settings', settings: command.settings })
        saveCurrent()
        break
      case 'autoBattle':
        dispatch(requireGame(), { type: 'set-auto-battle', value: command.enabled })
        saveCurrent()
        break
      case 'challengeGym':
      case 'challengeFinale':
      case 'challengeLeague':
        if (!dispatch(requireGame(), command.type === 'challengeGym'
          ? { type: 'challenge-gym' } : command.type === 'challengeFinale'
            ? { type: 'challenge-finale' } : { type: 'challenge-league', trainerId: command.trainerId })) {
          throw new Error('현재 위치와 도전 조건을 확인해 주세요.')
        }
        saveCurrent()
        break
      case 'transferRegion':
        if (!dispatch(requireGame(), { type: 'transfer-region', regionId: command.regionId })) {
          throw new Error('앞 지방의 리그에서 우승하면 다음 지방으로 이동할 수 있습니다.')
        }
        saveCurrent()
        break
      case 'travel':
        if (!dispatch(requireGame(), { type: 'travel', locationId: command.locationId })) {
          throw new Error('지도에서 이동할 수 있는 장소를 골라 주세요.')
        }
        saveCurrent()
        break
      case 'throwBall':
        if (!dispatch(requireGame(), { type: 'throw-ball', itemId: command.itemId })) {
          throw new Error('전투 상태와 보유한 볼을 확인해 주세요.')
        }
        saveCurrent()
        break
      case 'setFollowerActive': {
        const current = requireGame()
        const sendsLeadToBox = !command.active && command.instanceId === current.player.instanceId
        if (sendsLeadToBox && !current.followers.length) throw new Error('파티에는 포켓몬이 한 마리 이상 필요합니다.')
        checkLeadChange(current, sendsLeadToBox)
        if (!dispatch(current, { type: 'set-follower-active', instanceId: command.instanceId, active: command.active, boxIndex: command.boxIndex })) {
          throw new Error('파티와 선택한 박스의 빈자리를 확인해 주세요.')
        }
        saveCurrent()
        break
      }
      case 'movePartyMember': {
        const current = requireGame()
        checkLeadChange(current, (command.instanceId === current.player.instanceId) !== (command.toIndex === 0))
        if (!dispatch(current, { type: 'move-party-member', instanceId: command.instanceId, toIndex: command.toIndex })) {
          throw new Error('순서를 바꿀 포켓몬과 자리를 다시 선택해 주세요.')
        }
        saveCurrent()
        break
      }
      case 'swapBoxPokemon': {
        const current = requireGame()
        checkLeadChange(current, command.partyInstanceId === current.player.instanceId)
        if (!dispatch(current, { type: 'swap-box-pokemon', partyInstanceId: command.partyInstanceId, boxInstanceId: command.boxInstanceId })) {
          throw new Error('교체할 파티 포켓몬과 박스 포켓몬을 다시 선택해 주세요.')
        }
        saveCurrent()
        break
      }
      case 'equip':
        if (!dispatch(requireGame(), { type: 'equip-item', itemId: command.itemId })) {
          throw new Error('이 아이템을 장착할 수 없습니다.')
        }
        saveCurrent()
        break
      case 'useItem':
        if (!dispatch(requireGame(), { type: 'use-item', itemId: command.itemId })) {
          throw new Error('지금은 이 아이템을 사용할 수 없습니다.')
        }
        saveCurrent()
        break
      case 'setMoves':
        if (!dispatch(requireGame(), { type: 'set-moves', moveIds: command.moveIds })) {
          throw new Error('기술 구성을 적용할 수 없습니다.')
        }
        saveCurrent()
        break
      case 'evolve':
        if (!dispatch(requireGame(), { type: 'evolve' })) {
          throw new Error('현재 진화 조건을 충족하지 않았습니다.')
        }
        saveCurrent()
        break
      case 'save':
        saveCurrent()
        break
      case 'setLaunchAtLogin':
        setLaunchAtLogin(command.enabled)
        break
      case 'observe': {
        const current = requireGame()
        if (!current.settings.overlayVisible) {
          dispatch(current, { type: 'update-settings', settings: { overlayVisible: true } })
          saveCurrent()
        }
        break
      }
      case 'showControl':
        windows.showControl()
        break
      case 'quit':
        setImmediate(() => app.quit())
        break
    }
    updatePresentation()
    if (command.type === 'observe' || (command.type === 'evolve' && game?.settings.overlayVisible && game.settings.effects)) {
      windows.observe()
    }
    publish(true)
    return snapshot()
  }

  function fromTrustedWindow(event: IpcMainInvokeEvent, allowOverlay: boolean): boolean {
    const window = event.sender === windows.control.webContents
      ? windows.control
      : allowOverlay && event.sender === windows.overlay.webContents ? windows.overlay : null
    const frame = event.senderFrame
    return Boolean(window && frame && frame === event.sender.mainFrame && windows.isTrustedRenderer(window, frame.url))
  }

  ipcMain.handle(adventureChannels.getSnapshot, (event) => {
    if (!fromTrustedWindow(event, true)) throw new Error('허용되지 않은 요청입니다.')
    return snapshot(event.sender === windows.overlay.webContents)
  })
  ipcMain.handle(adventureChannels.dispatch, (event, value: unknown) => {
    if (!fromTrustedWindow(event, false)) throw new Error('허용되지 않은 요청입니다.')
    const command = parseCommand(value)
    if (!command) throw new Error('올바르지 않은 조작입니다.')
    return runCommand(command)
  })

  prepareLoadedGame(initial.status)
  updatePresentation()

  if (!process.argv.includes('--tray') || !game) {
    windows.control.once('ready-to-show', windows.showControl)
  }
  windows.control.on('show', () => publish(true))
  windows.control.on('restore', () => publish(true))
  app.on('second-instance', windows.showControl)
  app.on('activate', windows.showControl)

  let lastTick = performance.now()
  let controlInterval = 0
  const step = setInterval(() => {
    const now = performance.now()
    const elapsed = Math.min(now - lastTick, 500)
    lastTick = now
    if (!game) return
    tick(game, elapsed, overlayWorkArea())
    const latest = game.history.filter((entry) => entry.id > lastNotice)
    if (latest.length > 0) {
      lastNotice = Math.max(...latest.map((entry) => entry.id))
      if (game.settings.notifications && Notification.isSupported()) {
        const notice = latest.find((entry) => entry.kind === 'evolution' || entry.kind === 'level')
        if (notice) new Notification({ title: productName, body: notice.text, icon, silent: !game.settings.sound }).show()
      }
    }
    controlInterval = (controlInterval + 1) % 3
    publish(controlInterval === 0)
  }, simulationInterval)
  const autosave = setInterval(() => saveCurrent(), autosaveInterval)

  windows.control.on('session-end', () => saveCurrent())
  powerMonitor.on('suspend', () => saveCurrent())
  powerMonitor.on('resume', () => { lastTick = performance.now() })
  app.on('before-quit', () => {
    if (quitting) return
    quitting = true
    clearInterval(step)
    clearInterval(autosave)
    if (!saveCurrent() && saveWarning) dialog.showErrorBox(productName, saveWarning)
    tray.destroy()
  })
}

// Some Windows graphics drivers replace the alpha of accelerated layered windows with a solid background.
if (process.platform === 'win32') app.disableHardwareAcceleration()

if (app.requestSingleInstanceLock()) {
  app.setAppUserModelId('local.pokemon.desktop.adventure')
  app.on('window-all-closed', () => {})
  void app.whenReady().then(startDesktop).catch((error: unknown) => {
    console.error('Unable to start application', error)
    dialog.showErrorBox(productName, '앱을 시작하지 못했습니다. 저장 폴더 권한과 실행 환경을 확인해 주세요.')
    app.quit()
  })
} else {
  app.quit()
}
