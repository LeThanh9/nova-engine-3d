# ⚡ NovaEngine 3D - Unreal Edition (Next-Gen 3D Web & Desktop Game Engine)

**NovaEngine 3D** là một Game Engine 3D hoàn chỉnh, hiện đại mang phong cách **Unreal Engine 4**, chạy mượt mà cả trên **Trình duyệt Web** và **Ứng dụng Desktop Windows (.EXE)**. Bạn có thể thực hiện **100% các công đoạn làm game 3D trực tiếp trong Engine**:

- 🌐 **Repository GitHub:** [https://github.com/LeThanh9/nova-engine-3d](https://github.com/LeThanh9/nova-engine-3d)
- 🚀 **Trải nghiệm trực tuyến (GitHub Pages):** [https://lethanh9.github.io/nova-engine-3d/](https://lethanh9.github.io/nova-engine-3d/)
- 🎮 **Giao diện chuẩn Unreal Engine 4:** Bảng Modes/Place Actors bên trái, World Outliner góc trên bên phải, Details Panel góc dưới bên phải, thanh công cụ Viewport với chế độ Translate (W), Rotate (E), Scale (R), Snapping và Camera Speed.

![NovaEngine 3D Studio - Unreal Edition](current_viewport_render.png)

---

## 🌟 Tính Năng 3D Đột Phá & Đồ Họa Chuẩn Unreal Engine

1. 💎 **Đồ Họa PBR & IBL Siêu Thực (Physically Based Rendering & Image-Based Lighting):**
   - Phản chiếu môi trường chân thực (**IBL Environment Map**) cho kim loại bóng, áo giáp robot titanium và tinh thể năng lượng.
   - Bản đồ pháp tuyến tạo nổi (**Procedural Sobel Normal Maps**) cho sàn lục giác và thùng kim loại.
   - Bộ xử lý màu điện ảnh **ACESFilmic Tone Mapping** và hiệu ứng phát quang **UnrealBloomPass**.
   - Chế độ hiển thị đa dạng: **Lit (Đầy đủ)**, **Lighting Only (Đất sét trắng / Clay Mode)**, **Unlit (Màu cơ bản)**, **Wireframe (Khung dây)**.
   - Bóng đổ mềm mịn chất lượng cao (**PCF Soft Shadows 2048x2048**).
   - Sương mù khí quyển chiều sâu và các hạt bụi không gian lơ lửng (**Atmospheric Volumetric Dust Motes**).

2. 🤖 **Nhân Vật Khớp Động & Hoạt Họa Động Học (Articulated Skeletal Rig):**
   - Mô hình Hero Robot Mannequin với các khớp tay, chân, thân, đầu chuyển động độc lập.
   - Chu kỳ chạy tự nhiên: chân bước sải chân, tay vung nhịp nhàng, thân mình nghiêng về phía trước, bước chân phát ra âm thanh servo cơ khí.
   - Chu kỳ đứng thở (Idle Breathing) với lò phản ứng ngực nhấp nháy phát sáng.
   - Tư thế bật nhảy trên không trung: chân co, tay giữ thăng bằng, ống đẩy phản lực phụt sáng cyan bloom.

3. 💥 **Chiến Đấu Tương Tác Vật Lý Thực (Plasma Cannon & Combat Explosions):**
   - Nhấn **Chuột Phải / Trái** hoặc **Phím F / Q**: Phóng đạn Pháo Năng Lượng Plasma với vệt sáng rực rỡ và đèn động.
   - Đạn phát nổ khi chạm mục tiêu, phát sóng xung kích (Shockwave Ring), rung màn hình điện ảnh (Camera Shake) và áp dụng lực đẩy vật lý (**applyImpulse**) hất tung thùng hàng xung quanh!
   - **Bệ Phóng Siêu Năng (Jump Pad):** Bước lên bệ để được phóng vút 22m lên không trung kèm vòng sáng laser và âm thanh nén khí.
   - **Thùng Nổ Nguy Hiểm (Hazard Barrels):** Bắn phát hỏa thùng nổ với quả cầu lửa khổng lồ và sức ép phá hủy diện rộng.

4. 📊 **Giao Diện Studio Chuẩn Unreal Engine:**
   - **Unreal STAT HUD Overlay:** Hiển thị trực tiếp `STAT FPS`, `Frame Time (ms)`, `Actor Count`, `Draw Calls`, và trạng thái Pipeline.
   - **View Cube Orientation Gizmo:** Widget khối lập phương góc nhìn 3D ở góc trên màn hình.
   - Bảng Modes/Place Actors bổ sung: Bệ Phóng, Thùng Nổ, Thùng Hazard, Tinh Thể Bay.

5. 🕹️ **Hệ Thống Vật Lý 3D Động (Cannon.js 3D Physics):**
   - Tương tác vật lý thực: Trọng lực 3D, độ nảy (**restitution**), lực ma sát, khóa xoay trục nhân vật tránh ngã đổ.

6. 🧙 **Góc Nhìn Thứ 3 & Camera Tự Do (Spring Arm & Freefly Camera):**
   - Camera bám đuổi mượt mà có giảm chấn quán tính.
   - Trong Edit Mode, giữ **Chuột Phải + W/A/S/D/E/Q** để bay tự do như Unreal Engine Studio.

7. 🔊 **Bộ Tổng Hợp Âm Thanh 3D Không Gian (Web Audio API Synthesizer):**
   - Phát tức thì các hiệu ứng âm thanh: Bắn Plasma, Nổ thùng, Bệ phóng kích hoạt, Bước chân robot kim loại, Nhặt ngọc.

8. 🚀 **Xuất Game 3D Độc Lập 1-Click (Export Standalone HTML):**
   - Đóng gói toàn bộ mô hình 3D, vật lý, ánh sáng và mã điều khiển thành **1 file `.html` duy nhất**, tự động hỗ trợ cụm phím ảo cảm ứng trên điện thoại.

---

## 💻 Hướng Dẫn Chạy & Đóng Gói Thành File Windows EXE

### Cách 1: Mở trực tiếp trên Trình Duyệt Web
Nhấp đúp chuột vào file:
```
e:\game-engine\index.html
```

### Cách 2: Chạy phiên bản Native Desktop App
Nhấp đúp chuột vào file:
```
e:\game-engine\Launch-NovaEngine.bat
```
Ứng dụng sẽ tự động khởi chạy với hiệu năng tăng tốc phần cứng WebGL2 GPU tối đa!

### Cách 3: Đóng gói thành file cài đặt Windows `.exe` độc lập
Nhấp đúp chuột vào file:
```
e:\game-engine\Build-Windows-EXE.bat
```
Hệ thống sẽ tự động build ứng dụng thành file Portable `.exe` lưu trong thư mục `e:\game-engine\dist\`.

---

## 🕹️ Phím Tắt Điều Khiển

| Phím Tắt | Chức Năng |
| :--- | :--- |
| **F5** | Chơi thử / Dừng trò chơi 3D (Play / Stop) |
| **F6** | Tiến 1 Frame (Step Debug) |
| **Chuột / Phím F / Q** | **Bắn Pháo Năng Lượng Plasma (Combat Blast)** |
| **W / E / R** | Đổi chế độ Gizmo: Di chuyển (W), Xoay (E), Kéo giãn (R) |
| **Chuột Phải + W/A/S/D** | Bay tự do quan sát thế giới 3D (Freefly Camera) |
| **Ctrl + D** | Nhân bản nhanh Actor đang chọn |
| **Delete** | Xóa Actor đang chọn |
| **Phím A / D / W / S** | Di chuyển nhân vật 3D trong chế độ Chơi |
| **Phím Space (Cách)** | Nhảy theo vật lý |

---

*Mã nguồn được lưu trữ tại GitHub: [https://github.com/LeThanh9/nova-engine-3d](https://github.com/LeThanh9/nova-engine-3d)*
