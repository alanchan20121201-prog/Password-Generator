/*
 * 一次打包出四個語言版本。每個目錄都是一份獨立的 Electron 專案
 * （有自己的 package.json / vite / electron-builder 設定）。
 *
 *   zh/     简体中文  -> Secure-Password-Generator-*-zh-CN.exe
 *   zh-TW/  繁體中文  -> ...-zh-TW.exe
 *   en/     English   -> ...-en.exe
 *   ja/     日本語    -> ...-ja.exe
 *
 * 用法：node build-4lang.js   （需 Node.js，會自動 npm install）
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist-4lang');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const LANGS = [
  { code: 'zh-CN', dir: 'zh' },
  { code: 'zh-TW', dir: 'zh-TW' },
  { code: 'en', dir: 'en' },
  { code: 'ja', dir: 'ja' },
];

fs.mkdirSync(OUT, { recursive: true });

for (const { code, dir } of LANGS) {
  const cwd = path.join(ROOT, dir);
  console.log(`\n=== 建置 ${code} (${dir}/) ===`);
  execFileSync(NPM, ['install'], { cwd, stdio: 'inherit' });
  execFileSync(NPM, ['run', 'pack:win'], { cwd, stdio: 'inherit' });

  const release = path.join(cwd, 'release');
  for (const f of fs.readdirSync(release)) {
    if (!f.endsWith('.exe')) continue;
    // 原本 artifactName 以 -ZH / -EN 結尾，改成明確的語言代碼
    const target = f.replace(/-(ZH|EN)\.exe$/i, `-${code}.exe`);
    fs.copyFileSync(path.join(release, f), path.join(OUT, target));
    console.log('✔ ' + target);
  }
}

console.log('\n四個語言 EXE 已產出於 dist-4lang/');
