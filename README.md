# ⚡ NovaEngine 3D - Unreal Edition (Next-Gen 3D Web & Desktop Game Engine)

**NovaEngine 3D** là một Game Engine 3D hoàn chỉnh, hiện đại mang phong cách **Unreal Engine 4**, chạy mượt mà cả trên **Trình duyệt Web** và **Ứng dụng Desktop Windows (.EXE)**. Bạn có thể thực hiện **100% các công đoạn làm game 3D trực tiếp trong Engine**:

- 🌐 **Repository GitHub:** [https://github.com/LeThanh9/nova-engine-3d](https://github.com/LeThanh9/nova-engine-3d)
- 🚀 **Trải nghiệm trực tuyến (GitHub Pages):** [https://lethanh9.github.io/nova-engine-3d/](https://lethanh9.github.io/nova-engine-3d/)
- 🎮 **Giao diện chuẩn Unreal Engine 4:** Bảng Modes/Place Actors bên trái, World Outliner góc trên bên phải, Details Panel góc dưới bên phải, thanh công cụ Viewport với chế độ Translate (W), Rotate (E), Scale (R), Snapping và Camera Speed.

![NovaEngine 3D Studio - Unreal Edition](current_viewport_render.png)

---

## 🌟 Tính Năng 3D Đột Phá & Đồ Họa Chuẩn Unreal Engine 4

1. 💎 **Đồ Họa PBR Siêu Thực (Physically Based Rendering):**
   - Bộ xử lý màu điện ảnh **ACESFilmic Tone Mapping**.
   - Vật liệu PBR đầy đủ: **Base Color**, **Metallic** (Kim loại bóng), **Roughness** (Độ nhám mịn), **Emissive Glow** (Phát sáng Neon rực rỡ).
   - Bóng đổ mềm mịn chất lượng cao (**PCF Soft Shadows 2048x2048**).
   - Sương mù khí quyển chiều sâu (**Atmospheric Height Fog**).
   - Lưới tọa độ sàn 3D với trục X (Đỏ) và Z (Xanh) chuẩn công nghiệp.

2. 🕹️ **Hệ Thống Vật Lý 3D Động (Cannon.js 3D Physics):**
   - Tương tác vật lý thực: Trọng lực 3D, độ nảy (**restitution**), lực ma sát.
   - Thùng kim loại vật lý (Physics Crates) có thể bị đá văng và xô đẩy khi nhân vật va chạm.
   - Bạt nhún Trampoline siêu nảy đẩy nhân vật và khối hộp bay vút lên không trung.

3. 🧙 **Góc Nhìn Thứ 3 (Third-Person Character Controller):**
   - Điều khiển nhân vật di chuyển 3D bằng cụm phím `W / A / S / D` hoặc các phím mũi tên theo hướng camera.
   - Phím `Space` để bật nhảy theo quán tính vật lý.
   - Camera bám theo sau mượt mà (**Smooth Spring Arm Camera**).

4. 🛸 **Góc Nhìn Tự Do Unreal Viewport (Freefly Camera):**
   - Trong chế độ chỉnh sửa (Edit Mode), nhấn giữ **Chuột Phải + W/A/S/D/E/Q** để bay lượn tự do trong không gian 3D giống hệt Unreal Engine 4!
   - Sử dụng phím tắt chuyển nhanh công cụ Gizmo:
     - Phím `W`: Di chuyển đối tượng (Translate).
     - Phím `E`: Xoay đối tượng (Rotate).
     - Phím `R`: Kéo giãn kích thước (Scale).

5. ✨ **Hệ Thống Hạt 3D (Particle System 3D):**
   - Hiệu ứng bụi chân khi tiếp đất (Jump Dust), tia lửa điện phát sáng (Sparks), pháo hoa mừng chiến thắng.

6. 🔊 **Âm Thanh 3D Không Gian (Web Audio API Synthesizer):**
   - Tạo tức thì âm thanh 8-bit và âm thanh không gian 3D (Nhảy, Ăn ngọc năng lượng, Phát nổ) mà không cần file MP3/WAV ngoài.

7. 🚀 **Xuất Game 3D Độc Lập 1-Click (Export Standalone HTML):**
   - Đóng gói toàn bộ mô hình 3D, vật lý, ánh sáng và mã điều khiển thành **1 file `.html` duy nhất**.
   - Tự động tích hợp **Cụm phím ảo cảm ứng (Virtual Touch D-Pad & Jump)** khi mở trên điện thoại cảm ứng!

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
| **W / E / R** | Đổi chế độ Gizmo: Di chuyển (W), Xoay (E), Kéo giãn (R) |
| **Chuột Phải + W/A/S/D** | Bay tự do quan sát thế giới 3D (Freefly Camera) |
| **Ctrl + D** | Nhân bản nhanh Actor đang chọn |
| **Delete** | Xóa Actor đang chọn |
| **Phím A / D / W / S** | Di chuyển nhân vật 3D trong chế độ Chơi |
| **Phím Space (Cách)** | Nhảy theo vật lý |

---

*Mã nguồn được lưu trữ tại GitHub: [https://github.com/LeThanh9/nova-engine-3d](https://github.com/LeThanh9/nova-engine-3d)*
