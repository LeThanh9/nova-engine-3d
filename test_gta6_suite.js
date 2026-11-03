const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8096;
const CDP_PORT = 9334;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(BASE_DIR, reqPath);
      const ext = path.extname(filePath).toLowerCase();

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
          res.end(content);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`[HTTP Server] Listening on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function launchChrome() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const args = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--window-size=1600,900',
    '--hide-scrollbars',
    '--mute-audio',
    `http://localhost:${PORT}/index.html`
  ];

  console.log(`[Chrome] Launching: ${chromePath}`);
  const proc = spawn(chromePath, args);
  return proc;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getCDPTab() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const tabs = await res.json();
      const tab = tabs.find(t => t.url && t.url.includes(`${PORT}`));
      if (tab && tab.webSocketDebuggerUrl) return tab;
    } catch (e) {
      // Chrome starting up
    }
    await wait(300);
  }
  throw new Error('Could not find active Chrome CDP tab');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        if (msg.params.type === 'error') console.error('[Browser Error]', text);
        else console.log('[Browser Console]', text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[Browser Exception]', msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text);
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Screenshot] Saved: ${outputPath} (${buffer.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  let server, chromeProc, cdp;
  try {
    server = await startServer();
    chromeProc = launchChrome();

    console.log('[CDP] Connecting to Chrome debugger...');
    const tab = await getCDPTab();
    console.log(`[CDP] Connected to tab: ${tab.title} (${tab.url})`);

    cdp = new CDPClient(tab.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[Engine] Waiting for NovaEngine 3D to initialize...');
    let engineReady = false;
    for (let i = 0; i < 40; i++) {
      const isReady = await cdp.evaluate(`
        Boolean(window.engine3d && window.engine3d.renderer3d && window.engine3d.actors && window.engine3d.actors.length > 5)
      `);
      if (isReady) {
        engineReady = true;
        break;
      }
      await wait(300);
    }

    if (!engineReady) {
      throw new Error('Engine failed to initialize in time');
    }

    const sceneInfo = await cdp.evaluate(`
      ({
        actorsCount: window.engine3d.actors.length,
        template: window.engine3d.projectName,
        hasRenderer: Boolean(window.engine3d.renderer3d),
        canvasWidth: window.engine3d.canvas.width,
        canvasHeight: window.engine3d.canvas.height
      })
    `);
    console.log('[Engine Status]', sceneInfo);

    // Let the scene render several frames for bloom and materials to settle
    await wait(2500);

    // Screenshot 1: Vice City Overview
    const shot1 = path.join(BASE_DIR, 'gta6_vice_city_render.png');
    await cdp.captureScreenshot(shot1);

    // Now test entering vehicle and play mode driving
    console.log('[Engine] Entering vehicle and testing driving camera...');
    await cdp.evaluate(`
      window.engine3d.play();
      const car = window.engine3d.actors.find(a => a.tag === 'vehicle' || a.shape === 'vehicle');
      if (car) {
        window.engine3d.enterVehicle(car);
        window.engine3d.vehicleSpeed = 18.5;
        window.engine3d.vehicleDrifting = true;
      }
    `);

    // Let camera smoothly transition into vehicle chase view and render speedometer/radar
    await wait(2000);

    // Screenshot 2: Driving view
    const shot2 = path.join(BASE_DIR, 'gta6_driving_render.png');
    await cdp.captureScreenshot(shot2);

    // Copy gta6_vice_city_render.png to current_viewport_render.png
    fs.copyFileSync(shot1, path.join(BASE_DIR, 'current_viewport_render.png'));
    console.log('[Asset] Updated current_viewport_render.png');

    console.log('✅ ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error in test suite:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
  }
}

main();
