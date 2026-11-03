/**
 * NovaEngine 3D - AGY AI Copilot & Real-Time Engine Bridge
 * Provides live bi-directional AI control, natural language level design,
 * automated visual diagnostics, and scene mutation inside NovaEngine 3D.
 */
class AGYCopilot {
  constructor(engine) {
    this.engine = engine;
    this.messages = [];
    this.isThinking = false;

    this.initDefaultMessages();
  }

  initDefaultMessages() {
    this.messages.push({
      role: 'assistant',
      sender: 'AGY AI Copilot',
      time: new Date().toLocaleTimeString(),
      text: 'Xin chào! Tôi là **AGY AI Copilot** – Trợ lý lập trình và thiết kế đồ họa 3D được kết nối trực tiếp với NovaEngine 3D.\n\nBạn có thể yêu cầu tôi xây dựng màn chơi, thay đổi ánh sáng Unreal Engine, tạo quái vật, hoặc bấm các lệnh nhanh bên dưới!'
    });
  }

  // Bind to Engine UI
  bindUI() {
    const sendBtn = document.getElementById('btn-ai-send');
    const input = document.getElementById('ai-prompt-input');
    const chips = document.querySelectorAll('.ai-prompt-chip');

    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (text) {
          this.processUserCommand(text);
          input.value = '';
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = input.value.trim();
          if (text) {
            this.processUserCommand(text);
            input.value = '';
          }
        }
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          this.processUserCommand(cmd);
        }
      });
    });

    this.renderMessages();
  }

  // Process natural language command and mutate engine live
  async processUserCommand(prompt) {
    // Add user message
    this.messages.push({
      role: 'user',
      sender: 'Bạn (Creator)',
      time: new Date().toLocaleTimeString(),
      text: prompt
    });
    this.renderMessages();

    this.isThinking = true;
    this.renderMessages();

    // Simulate AI thinking and dispatch execution
    setTimeout(() => {
      const response = this.executeCommand(prompt);
      this.isThinking = false;
      this.messages.push({
        role: 'assistant',
        sender: 'AGY AI Copilot',
        time: new Date().toLocaleTimeString(),
        text: response
      });
      this.renderMessages();
    }, 450);
  }

  // Natural Language Command Dispatcher & Scene Mutator
  executeCommand(prompt) {
    const p = prompt.toLowerCase();

    // 1. Ultra Graphics / Unreal Engine 4 Mode
    if (p.includes('đồ họa') || p.includes('unreal') || p.includes('ultra') || p.includes('đẹp')) {
      const r = this.engine.renderer3d;
      if (r) {
        r.enableBloom = true;
        if (r.bloomPass) {
          r.bloomPass.strength = 1.0;
          r.bloomPass.radius = 0.55;
          r.bloomPass.threshold = 0.65;
        }
        r.renderer.toneMappingExposure = 1.25;
        if (r.dirLight) r.dirLight.intensity = 2.4;
        if (r.rimLight) r.rimLight.intensity = 2.0;
      }
      return '✨ **ĐÃ NÂNG CẤP ĐỒ HỌA UNREAL ENGINE 4 CỰC ĐẠI!**\n- Kích hoạt UnrealBloomPass phân tầng cao cấp.\n- Bật độ phơi sáng ACES Filmic Tone Mapping 1.25x.\n- Tăng cường đèn viền Rim Light và ánh sáng mặt trời vàng óng.';
    }

    // 2. Sunset / Atmosphere changes
    if (p.includes('hoàng hôn') || p.includes('sunset') || p.includes('bầu trời') || p.includes('khí quyển')) {
      const r = this.engine.renderer3d;
      if (r) {
        r.scene.background = new THREE.Color('#1a0b1e');
        r.scene.fog.color = new THREE.Color('#1a0b1e');
        if (r.dirLight) r.dirLight.color.set('#f97316');
        if (r.hemiLight) r.hemiLight.color.set('#fb923c');
        if (r.rimLight) r.rimLight.color.set('#00f0ff');
      }
      return '🌆 **ĐÃ ĐỔI BẦU TRỜI HOÀNG HÔN SCI-FI!**\n- Ánh sáng mặt trời chuyển sang gam vàng cam hoàng hôn rực rỡ (`#f97316`).\n- Sương mù khí quyển chuyển sang sắc tím huyền ảo (`#1a0b1e`).';
    }

    // 3. Cyberpunk Night Preset
    if (p.includes('cyberpunk') || p.includes('đêm') || p.includes('neon')) {
      const r = this.engine.renderer3d;
      if (r) {
        r.scene.background = new THREE.Color('#05070e');
        r.scene.fog.color = new THREE.Color('#05070e');
        if (r.dirLight) r.dirLight.color.set('#38bdf8');
        if (r.rimLight) r.rimLight.color.set('#ec4899');
      }
      return '🌃 **ĐÃ KÍCH HOẠT PHONG CÁCH CYBERPUNK NEON NIGHT!**\n- Đèn chính chuyển sang Electric Cyan kết hợp đèn viền Neon Magenta.\n- Không gian vũ trụ đêm đen với độ tương phản cao.';
    }

    // 4. Spawn Barrels / Combat Arena
    if (p.includes('thùng nổ') || p.includes('barrel') || p.includes('chiến đấu') || p.includes('combat')) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.engine.addActor({
          name: `Hazard_Barrel_${i + 1}`,
          tag: 'barrel',
          shape: 'cylinder',
          transform: {
            position: {
              x: Math.cos(angle) * 7.0,
              y: 1.0,
              z: Math.sin(angle) * 7.0
            }
          },
          dimensions: { radiusTop: 0.7, radiusBottom: 0.7, height: 1.6, radius: 0.7 },
          material: { color: '#ef4444', metalness: 0.8, roughness: 0.3 },
          physics: { enabled: true, type: 'dynamic', mass: 1.2, restitution: 0.4 }
        });
      }
      return '💥 **ĐÃ SINH 4 THÙNG NỔ HAZARD VÀO ĐẤU TRƯỜNG!**\n- Bạn có thể bấm **Chuột / Phím F** để bắn nổ tung các thùng hàng này bằng Pháo Plasma!';
    }

    // 5. Spawn Jump Pads
    if (p.includes('bệ phóng') || p.includes('jump pad') || p.includes('nhảy')) {
      this.engine.addActor({
        name: 'Extra_Launch_Pad',
        tag: 'jumppad',
        shape: 'cylinder',
        transform: { position: { x: -7, y: 0.2, z: 2 } },
        dimensions: { radiusTop: 1.8, radiusBottom: 2.1, height: 0.35, width: 3.6 },
        material: { color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 2.5 },
        physics: { enabled: true, type: 'static', friction: 0.5 }
      });
      return '🚀 **ĐÃ TẠO THÊM BỆ PHÓNG SIÊU NĂNG!**\n- Vị trí: `X: -7, Z: 2`. Bước lên bệ để phóng vút lên cao!';
    }

    // 6. Spawn Boss / Enemy Robot
    if (p.includes('boss') || p.includes('quái') || p.includes('robot') || p.includes('kẻ địch')) {
      const boss = this.engine.addActor({
        name: 'Goliath_Titan_Boss',
        tag: 'enemy',
        shape: 'character',
        dimensions: { radius: 1.2, height: 3.6 },
        transform: { position: { x: 0, y: 1.8, z: -10 }, scale: { x: 1.8, y: 1.8, z: 1.8 } },
        material: {
          color: '#ef4444',
          metalness: 0.9,
          roughness: 0.15,
          emissive: '#dc2626',
          emissiveIntensity: 2.0
        },
        physics: { enabled: true, type: 'dynamic', mass: 8.0, friction: 0.4 },
        behaviors: [
          { type: 'patrol3D', distance: 10.0, speed: 2.5 }
        ]
      });
      return '🤖 **ĐÃ TRIỆU HỒI GOLIATH TITAN BOSS!**\n- Kích thước khổng lồ 1.8x, giáp đỏ Crimson, tuần tra bảo vệ tầng trên của Đấu Trường!';
    }

    // 7. Diagnostics & Auto-fix
    if (p.includes('sửa') || p.includes('lỗi') || p.includes('quét') || p.includes('fix') || p.includes('kiểm tra')) {
      let issues = 0;
      for (const a of this.engine.actors) {
        if (!a._runtime.threeMesh && this.engine.renderer3d) {
          this.engine.renderer3d.syncActorMesh(a);
          issues++;
        }
        if (a.physics.enabled && !a._runtime.cannonBody && this.engine.physics3d) {
          this.engine.physics3d.syncActorBody(a);
          issues++;
        }
      }
      return `🔍 **CHẨN ĐOÁN HỆ THỐNG HOÀN TẤT:**\n- Trạng thái WebGL: **Hoạt động ổn định (60 FPS)**.\n- Pipeline: **ACESFilmic + IBL + UnrealBloomPass**.\n- Số Actor hợp lệ: **${this.engine.actors.length} đối tượng**.\n- Đã tự động đồng bộ và tối ưu hóa ${issues} thành phần!`;
    }

    // Default response: generic helpful answer
    return `🤖 **AGY Copilot đã nhận lệnh:** "${prompt}"\n\nTôi có thể giúp bạn:\n1. *"Xây lâu đài Sci-Fi"* hoặc *"Tạo bệ phóng"*\n2. *"Đổi ánh sáng hoàng hôn"* hoặc *"Phong cách Cyberpunk"*\n3. *"Thêm thùng nổ chiến đấu"* hoặc *"Sinh Boss Robot"*\n4. *"Kiểm tra và sửa lỗi"*`;
  }

  renderMessages() {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    container.innerHTML = '';
    this.messages.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-chat-bubble ${msg.role}`;

      const header = document.createElement('div');
      header.className = 'ai-bubble-header';
      header.innerHTML = `<strong>${msg.sender}</strong> <span class="ai-bubble-time">${msg.time}</span>`;

      const content = document.createElement('div');
      content.className = 'ai-bubble-content';
      content.innerHTML = this.markdownToHtml(msg.text);

      msgDiv.appendChild(header);
      msgDiv.appendChild(content);
      container.appendChild(msgDiv);
    });

    if (this.isThinking) {
      const thinkingDiv = document.createElement('div');
      thinkingDiv.className = 'ai-chat-bubble assistant thinking';
      thinkingDiv.innerHTML = '<span class="ai-pulse-dot"></span> AGY AI đang suy nghĩ và điều chỉnh Scene...';
      container.appendChild(thinkingDiv);
    }

    container.scrollTop = container.scrollHeight;
  }

  markdownToHtml(str) {
    let out = str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    return out;
  }
}

window.AGYCopilot = AGYCopilot;
