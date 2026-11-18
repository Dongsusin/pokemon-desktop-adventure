import { contextBridge, ipcRenderer } from 'electron'
import { adventureChannels, type AdventureApi, type AdventureSnapshot } from './contracts'

const api: AdventureApi = {
  getSnapshot: () => ipcRenderer.invoke(adventureChannels.getSnapshot),
  subscribe(listener) {
    const onSnapshot = (_event: Electron.IpcRendererEvent, snapshot: AdventureSnapshot): void => {
      listener(snapshot)
    }
    ipcRenderer.on(adventureChannels.snapshotChanged, onSnapshot)
    return () => ipcRenderer.removeListener(adventureChannels.snapshotChanged, onSnapshot)
  },
  dispatch: (command) => ipcRenderer.invoke(adventureChannels.dispatch, command)
}

contextBridge.exposeInMainWorld('adventure', api)
