const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  get: (url) => ipcRenderer.invoke('addon:get', url),
  text: (url) => ipcRenderer.invoke('addon:text', url),
  translate: (t) => ipcRenderer.invoke('translate', t),
  anilist: (title) => ipcRenderer.invoke('anilist:info', title),
  bg: (o) => ipcRenderer.invoke('bg:set', o),
  onHidden: (cb) => ipcRenderer.on('app:hidden', () => cb()),
  notify: (o) => ipcRenderer.invoke('notify:show', o),
  onNotifyOpen: (cb) => ipcRenderer.on('notify:open', (_e, id) => cb(id)),
  anilistDesc: (names) => ipcRenderer.invoke('anilist:desc', names),
  anilistChars: (id) => ipcRenderer.invoke('anilist:chars', id),
  torrent: (opts) => ipcRenderer.invoke('torrent:start', opts),
  transcode: (url) => ipcRenderer.invoke('transcode:start', url),
  acct: { me: () => ipcRenderer.invoke('acct:me'), login: (o) => ipcRenderer.invoke('acct:login', o), logout: () => ipcRenderer.invoke('acct:logout'), site: () => ipcRenderer.invoke('acct:site') },
  sync: { get: () => ipcRenderer.invoke('sync:get'), put: (b) => ipcRenderer.invoke('sync:put', b) },
  win: { min: () => ipcRenderer.invoke('win:min'), max: () => ipcRenderer.invoke('win:max'), close: () => ipcRenderer.invoke('win:close') },
  ar: {
    list: (o) => ipcRenderer.invoke('ar:list', o),
    search: (q) => ipcRenderer.invoke('ar:search', q),
    episodes: (id) => ipcRenderer.invoke('ar:episodes', id),
    streams: (ep) => ipcRenderer.invoke('ar:streams', ep),
    direct: (u) => ipcRenderer.invoke('ar:direct', u)
  },
  custom: { list: () => ipcRenderer.invoke('custom:list'), open: () => ipcRenderer.invoke('custom:open') },
  html: (url) => ipcRenderer.invoke('web:html', url),
  update: { version: () => ipcRenderer.invoke('app:version'), check: () => ipcRenderer.invoke('update:check') },
  openExternal: (url) => ipcRenderer.invoke('open:external', url)
});
