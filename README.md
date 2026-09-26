<h1 align="center">🔐 Secure Password Generator & Analyzer</h1>
<h1 align="center">安全密码生成器与分析器</h1>

[下載/download](https://github.com/alanchan20121201-prog/Password-Generator/releases/tag/windows)

<p align="center">
  <img alt="Platform" src="https://img.shields.io/badge/platform-Windows-blue">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-41-47848F">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

> 纯本地运行的密码生成器 · A local-only password generator

---



## English

### About

Secure Password Generator & Analyzer is a **local-only** desktop app for Windows. It generates strong passwords, estimates how long they would take to crack, and stores them in a local vault on your device. **Nothing is ever uploaded.**

### Features

**1. Password Generator**
- Cryptographically random passwords (Web Crypto `crypto.getRandomValues`).
- Choose character sets: Uppercase `A–Z`, Lowercase `a–z`, Numbers `0–9`, Symbols `!@#$%^&*()-_=+[]{};:,.<>?`.
- Length slider from 8 to 32 characters.
- One-click "Generate" and "Copy to clipboard" with "Copied" feedback.
- At least one character set must be selected.

**2. Strength Analyzer**
- Strength score 0–100 with a color-coded meter.
- Ratings: `Empty`, `Very Weak`, `Weak`, `Fair`, `Strong`, `Very Strong`.
- Estimated entropy (bits) and estimated crack time (from "less than 1 second" up to "millions of years").
- Detects common passwords (e.g. `password`, `123456`, `qwerty`).
- Detects repeated characters and sequential / keyboard patterns.
- Shows improvement suggestions.
- Show / hide password toggle.

**3. Local Vault**
- Save a password with a title.
- Search by title.
- Show / hide, copy, and delete entries.
- Stored in `localStorage` on this device only.

**General**
- 100% offline, no network, no tracking, no uploads.
- Clean title bar with **no menu** (File / Help).
- Custom icon embedded in three places: the `.exe` file, the window title bar, and the taskbar.
- Two editions: **Portable** (no install) and **Installer** (NSIS).
- Bilingual source code: `EN/` (English) and `ZH/` (Chinese).

## 中文

### 简介
「安全密码生成器与分析器」是一款纯本地运行的 Windows 桌面应用。它能生成高强度密码、估算密码被破解所需的时间，并把密码保存在本机密码库中。​任何数据都不会上传。

### 功能

**1. 密码生成器**

- 加密级随机生成（Web Crypto crypto.getRandomValues）。
- 可选字符类型：大写 A–Z、小写 a–z、数字 0–9、符号 !@#$%^&*()-_=+[]{};:,.<>?。
- 长度滑块 8–32 位。
- 一键「生成」与「复制」，复制成功显示「已复制」。
- 至少需选择一种字符类型。
  
**2. 密码分析器**

- 强度评分 0–100，配彩色进度条。
- 强度等级：空、非常弱、弱、一般、强、非常强。
- 估算熵值（位）与破解时间（从「不到 1 秒」到「数百万年」）。
- 识别常见弱密码（如 password、123456、qwerty）。
- 检测重复字符、连续或键盘排列的字符。
- 给出改进建议。
- 密码显示 / 隐藏切换。

**3. 本地密码库**

- 以「标题 + 密码」保存条目。
- 按标题搜索。
- 显示 / 隐藏、复制、删除。
- 数据保存在本机 localStorage，仅此设备。

**通用**

- 100% 离线，无网络、无追踪、不上传。
- 干净标题栏，无传统菜单（无「文件 / 帮助」），与英文版一致。
- 自定义图标用于三处：.exe 文件、窗口左上角、任务栏。
- 提供便携版（免安装）与安装版（NSIS）两种。
- 双语文源码：EN/（英文）与 ZH/（中文）。

