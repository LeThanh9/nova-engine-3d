/**
 * NovaEngine 3D - Native Windows Desktop Shell (Electron Host)
 * Enables high-performance WebGL2 hardware acceleration & native Windows menus/dialogs
 */
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable GPU Hardware Acceleration flags for Unreal-grade performance
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-webgl2-compute-context');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'NovaEngine 3D Studio - Unreal Edition',
    backgroundColor: '#141824',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webgl: true
    }
  });

  mainWindow.loadFile('index.html');

  // Build native application menu
  const menuTemplate = [
    {
      label: 'Tập Tin (File)',
      submenu: [
        {
          label: 'Dự Án Mới (New Project)',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-action', 'new-project')
        },
        {
          label: 'Mở Dự Án (Open Project)...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const res = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'NovaEngine 3D Project', extensions: ['json', 'novagame3d.json'] }],
              properties: ['openFile']
            });
            if (!res.canceled && res.filePaths.length > 0) {
              const content = fs.readFileSync(res.filePaths[0], 'utf-8');
              mainWindow.webContents.send('load-project-content', content);
            }
          }
        },
        {
          label: 'Lưu Dự Án (Save Project)...',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-action', 'save-project')
        },
        { type: 'separator' },
        {
          label: 'Xuất Game HTML Độc Lập (Export Standalone)...',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-action', 'export-html')
        },
        { type: 'separator' },
        { role: 'quit', label: 'Thoát (Exit)' }
      ]
    },
    {
      label: 'Chỉnh Sửa (Edit)',
      submenu: [
        { role: 'undo', label: 'Hoàn tác (Undo)' },
        { role: 'redo', label: 'Làm lại (Redo)' },
        { type: 'separator' },
        { role: 'cut', label: 'Cắt (Cut)' },
        { role: 'copy', label: 'Chép (Copy)' },
        { role: 'paste', label: 'Dán (Paste)' },
        { role: 'selectAll', label: 'Chọn tất cả (Select All)' }
      ]
    },
    {
      label: 'Chạy Thử (Run)',
      submenu: [
        {
          label: 'Chơi / Dừng (Play / Stop)',
          accelerator: 'F5',
          click: () => mainWindow.webContents.send('menu-action', 'toggle-play')
        },
        {
          label: 'Tiến 1 Frame (Step Debug)',
          accelerator: 'F6',
          click: () => mainWindow.webContents.send('menu-action', 'step-frame')
        }
      ]
    },
    {
      label: 'Khung Nhìn (View)',
      submenu: [
        { role: 'reload', label: 'Tải lại (Reload)' },
        { role: 'forceReload', label: 'Tải lại toàn bộ (Force Reload)' },
        { role: 'toggleDevTools', label: 'Bật/Tắt DevTools F12' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toàn Màn Hình (Fullscreen)' }
      ]
    },
    {
      label: 'Trợ Giúp (Help)',
      submenu: [
        {
          label: 'Mã Nguồn GitHub (GitHub Repository)',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com/LeThanh9/nova-engine-3d');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

