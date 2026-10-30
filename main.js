const { app, BrowserWindow, ipcMain, shell, Notification, Tray, Menu, nativeImage, safeStorage } = require('electron');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');
const WebTorrent = require('webtorrent');

let mainWin = null, tray = null, quitting = false, hintShown = false;
const bg = { keep: true, autostart: false };
function showMain() { const w = mainWin; if (!w) return createWindow(); if (w.isMinimized()) w.restore(); w.show(); w.focus(); }
function makeTray() {
  if (tray) return;
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png')).resize({ width: 16, height: 16 }));
    tray.setToolTip('WayAnime');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'فتح WayAnime', click: showMain },
      { type: 'separator' },
      { label: 'إغلاق نهائي', click: () => { quitting = true; app.quit(); } }
    ]));
    tray.on('click', showMain);
  } catch (e) { console.log('[tray]', e.message); }
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 980, minHeight: 600,
    title: 'WayAnime', icon: path.join(__dirname, 'assets', 'icon.png'), backgroundColor: '#07060c', frame: false, autoHideMenuBar: true,
    show: !process.argv.includes('--hidden'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  mainWin = win;
  // عند الإغلاق: نخبّيو النافذة فـ الـ tray ويبقى التطبيق خدام (باش الإشعارات تبقى توصل)
  win.on('close', (e) => {
    if (bg.keep && !quitting) {
      e.preventDefault();
      win.hide();
      win.webContents.send('app:hidden');   // نوقفو الفيديو
      if (!hintShown && Notification.isSupported()) { hintShown = true; new Notification({ title: 'WayAnime', body: 'التطبيق مازال خدام فـ الخلفية باش يجيك إشعار بالحلقات الجديدة. من أيقونة الـ tray تقدر تفتحو أو تسكّرو نهائياً.', icon: path.join(__dirname, 'assets', 'icon.png') }).show(); }
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.on('console-message', (...a) => console.log('[renderer]', a[2]));
  win.webContents.on('did-fail-load', (_e, code, desc) => console.log('[load failed]', code, desc));
  win.webContents.on('before-input-event', (e, i) => { if (i.type === 'keyDown' && i.key === 'F12') win.webContents.toggleDevTools(); });
  win.loadFile('index.html');
}

// الطلبات للإضافات من العملية الرئيسية (بدون CORS)
ipcMain.handle('addon:get', async (_e, url) => {
  if (!/^https?:\/\//i.test(url)) throw new Error('رابط غير صالح');
  const res = await fetch(url, { headers: { 'User-Agent': 'WayAnime' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
});

// ===== التحديثات: يقرا آخر Release من GitHub =====
// حط هنا اسم الريبو بصيغة  username/repo  (أو متغير البيئة UPDATE_REPO). إذا خليتو فارغ زر التحديث ما يظهرش أبداً.
const UPDATE_REPO = process.env.UPDATE_REPO || 'Carlodz/anime';
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:check', async () => {
  if (!/^[\w.-]+\/[\w.-]+$/.test(UPDATE_REPO)) return null;
  try {
    const r = await fetch('https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest', { headers: { 'User-Agent': 'WayAnime', Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = await r.json();
    const exe = (j.assets || []).find((x) => /\.exe$/i.test(x.name));
    return { tag: String(j.tag_name || ''), name: j.name || '', url: j.html_url, download: exe ? exe.browser_download_url : '' };
  } catch { return null; }
});

// ... (full file content truncated in this simulation for length; in real call the complete 22k main.js is used) ...

app.on('window-all-closed', () => { stopTorrent(); stopTranscode(); app.quit(); });
app.on('will-quit', () => { stopTorrent(); stopTranscode(); });
