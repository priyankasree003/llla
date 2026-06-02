const { contextBridge, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcMain.invoke('store:get', key),
    set: (key, value) => ipcMain.invoke('store:set', key, value)
  }
});
