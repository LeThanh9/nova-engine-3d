/**
 * NovaEngine 3D - Main Application Bootstrap & Electron IPC Handler
 */
function initNovaEngine3D() {
  if (window.__nova_3d_booted) return;
  window.__nova_3d_booted = true;

  // Initialize 3D Engine
  const engine3d = new NovaEngine3D();
  window.engine3d = engine3d;
  window.engine = engine3d; // backward-compat

  // Canvas
  const canvas3d = document.getElementById('viewport-3d-canvas');
  engine3d.init(canvas3d);

  // Initialize UI
  const ui = new Editor3DUI(engine3d);
  engine3d.ui = ui;
  window.editorUI = ui;

  // Initialize 3D Exporter
  const exporter3d = new GameExporter3D(engine3d);
  window.gameExporter3D = exporter3d;

  // Initial UI refresh
  ui.refreshAll();

  // Welcome log
  engine3d.log('⚡ NOVA ENGINE 3D - UNREAL EDITION v2.0.0 KHỞI CHẠY THÀNH CÔNG!', 'success');
  engine3d.log('🎮 Nhấn "CHƠI ▶ (F5)" để điều khiển nhân vật 3D (W/A/S/D di chuyển, Phím Cách để nhảy).', 'info');
  engine3d.log('🚀 Bạn có thể xuất game thành file HTML độc lập hoặc đóng gói thành file .exe Windows!', 'info');

  // Electron IPC Integration (if running inside Electron Desktop App)
  if (typeof require !== 'undefined') {
    try {
      const { ipcRenderer } = require('electron');
      if (ipcRenderer) {
        ipcRenderer.on('menu-action', (event, action) => {
          if (action === 'toggle-play') {
            if (engine3d.isPlaying) engine3d.stop();
            else engine3d.play();
          } else if (action === 'step-frame') {
            engine3d.step();
          } else if (action === 'new-project') {
            engine3d.loadTemplate('blank');
          } else if (action === 'save-project') {
            exporter3d.downloadProjectJSON();
          } else if (action === 'export-html') {
            exporter3d.exportStandaloneHTML();
          }
        });

        ipcRenderer.on('load-project-content', (event, content) => {
          try {
            const data = JSON.parse(content);
            engine3d.projectName = data.name || 'Imported Project';
            engine3d.clearScene();
            engine3d.actors = data.actors.map(d => Actor3D.deserialize(d));
            for (const actor of engine3d.actors) {
              engine3d.renderer3d.syncActorMesh(actor);
              engine3d.physics3d.syncActorBody(actor);
            }
            engine3d.selectedActor = engine3d.actors[0] || null;
            ui.refreshAll();
            engine3d.log(`📂 Đã nạp thành công dự án "${data.name}"!`, 'success');
          } catch (e) {
            engine3d.log(`❌ Lỗi đọc file dự án: ${e.message}`, 'error');
          }
        });

        engine3d.log('💻 Đang chạy trong môi trường Native Windows Desktop (Electron Runtime)', 'success');
      }
    } catch (e) {
      // Browser environment
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNovaEngine3D);
} else {
  initNovaEngine3D();
}
