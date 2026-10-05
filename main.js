const { app, BrowserWindow, session, desktopCapturer, shell } = require('electron');
const crypto = require('crypto');
const config = require('./config.json');

const URL_SITE = config.url;
const EVERY = Math.max(30, config.checkEverySeconds || 120) * 1000;
let win, lastHash = null;

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

// Hash dos arquivos do site: se mudar, o site foi atualizado.
async function siteHash() {
  const base = URL_SITE.endsWith('/') ? URL_SITE : URL_SITE + '/';
  const h = crypto.createHash('sha256');
  for (const f of ['', 'app.js', 'style.css']) {
    const r = await fetch(base + f + (f ? '?_=' + Date.now() : '?_=' + Date.now()), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    h.update(await r.text());
  }
  return h.digest('hex');
}

async function checkUpdate() {
  try {
    const hash = await siteHash();
    if (lastHash && hash !== lastHash && win) {
      // não derruba uma chamada em andamento
      const inCall = await win.webContents.executeJavaScript(
        "!!document.getElementById('callPanel') && !document.getElementById('callPanel').classList.contains('hidden')"
      ).catch(() => false);
      if (inCall) return;
      lastHash = hash;
      win.webContents.reloadIgnoringCache();
      return;
    }
    lastHash = hash;
  } catch (e) { /* sem internet: tenta de novo depois */ }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    backgroundColor: '#313338', title: 'Voxali', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });

  // Microfone, câmera e tela liberados só para o site do Voxali
  const origin = new URL(URL_SITE).origin;
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => {
    const ok = ['media', 'display-capture', 'notifications', 'fullscreen', 'clipboard-sanitized-write'].includes(perm);
    cb(ok && (details.requestingUrl || '').startsWith(origin));
  });
  // Compartilhar tela: usa a tela principal
  session.defaultSession.setDisplayMediaRequestHandler((req, cb) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then(srcs => {
      const screen = srcs.find(s => s.id.startsWith('screen')) || srcs[0];
      cb(screen ? { video: screen } : {});
    }).catch(() => cb({}));
  });

  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (!isMain) return;
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(
      '<body style="background:#313338;color:#dbdee1;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;text-align:center">' +
      '<div><h2>Sem conexão com o Voxali</h2><p>Verifique sua internet. Tentando de novo...</p></div></body>'));
    setTimeout(() => win && win.loadURL(URL_SITE), 8000);
  });

  session.defaultSession.clearCache().finally(() => win.loadURL(URL_SITE));
}

app.whenReady().then(() => {
  createWindow();
  checkUpdate();
  setInterval(checkUpdate, EVERY);
});
app.on('window-all-closed', () => app.quit());
