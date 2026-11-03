const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cscPaths = [
  'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
  'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
];

const csc = cscPaths.find(p => fs.existsSync(p));
if (!csc) {
  console.error('❌ Không tìm thấy trình biên dịch csc.exe của Windows .NET');
  process.exit(1);
}

const outDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const targetExe = path.join(__dirname, 'NovaEngine-3D.exe');
const distExe = path.join(outDir, 'NovaEngine-3D.exe');
const src = path.join(__dirname, 'NovaEngineHost.cs');

console.log('⚡ Đang biên dịch Native Windows Executable: NovaEngine-3D.exe...');
execSync(`"${csc}" /target:winexe /optimize /r:System.Windows.Forms.dll,System.Drawing.dll /out:"${targetExe}" "${src}"`, { stdio: 'inherit' });

fs.copyFileSync(targetExe, distExe);
console.log('✅ ĐÃ XUẤT FILE .EXE THÀNH CÔNG!');
console.log(`📁 File thực thi sẵn sàng:`);
console.log(`   - ${targetExe}`);
console.log(`   - ${distExe}`);
