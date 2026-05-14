# PAGEs Blueprint SOP

Blueprint 升版工具集。提供 SOP 導覽、Blueprint 自動升版、語言包補全三項功能。

---

## 技術棧

| 分類 | 技術 |
|------|------|
| 語言 | HTML / CSS / JavaScript (ES Module) |
| UI 框架 | [React 18](https://react.dev/) |
| 建置工具 | [Vite 5](https://vitejs.dev/) |
| CSS | [Tailwind CSS v3](https://tailwindcss.com/)（class-based dark mode） |
| 圖示 | [Lucide React](https://lucide.dev/) |
| 部署 | GitHub Pages（推送 `main` 分支時自動部署） |
| 遠端設定同步 | GitHub Gist API（`rules.json`） |
| 本地儲存 | `localStorage`（規則、設定、主題偏好） |

---

## 功能說明

### SOP 導覽
選擇「目前版本」與「目標版本」後，自動產生完整升版步驟清單，包含各版本需要手動調整的項目與進度追蹤。

### Blueprint Migrate 工具
上傳 Blueprint ZIP 檔，選擇目標版本後自動執行版本升級，下載升版後的 ZIP。目前支援 **v2.7 ～ v3.38**。

### 語言包補全工具
上傳 Blueprint ZIP，自動偵測語言包中缺少或值為空字串的 key，從內建字典自動填入，並可新增額外語言。

### 管理員功能
點擊右上角「管理員」後可新增、編輯、刪除版本升版規則，支援 JSON 匯出匯入與 GitHub Gist 同步。

---

## 本地開發

### 前置需求

- Node.js 18+
- npm

### 安裝 & 啟動

```bash
npm install
npm run dev
```

開啟瀏覽器前往 `http://localhost:4999/pages-blueprint-sop/`

### 建置

```bash
npm run build
```

產出放在 `dist/`，可部署至任何靜態主機。

---

## 部署

推送到 `main` 分支時，GitHub Actions 自動執行 `sync-migrations → build → deploy`，無需手動操作。

部署完成後網站位址：
```
https://<your-github-username>.github.io/pages-blueprint-sop/
```

---

## 專案結構

```
core/
├── auto_migration.py          # Migration 抽象基底類別
├── default_migration.py       # 預設 Migration 實作
├── feature/
│   ├── blueprint_adder.py     # 遞迴注入 blueprint 參數的核心邏輯
│   └── rename.py
└── migrate/
    └── v<FROM>_v<TO>/         # 各版本遷移目錄
        ├── config.json        # 新增的 display 參數設定
        └── migration.py       # 遷移邏輯（可含自訂邏輯）

scripts/
├── sync-migrations.cjs        # 將 core/migrate/ 同步至 src/migrations/
└── publish.cjs                # 自動 commit + push 遷移相關變更

src/
├── App.jsx                    # 根元件，狀態管理、Gist 同步邏輯
├── components/
│   ├── Header.jsx             # 頂部導覽列、主題切換、管理員驗證
│   ├── SOPNavigator.jsx       # 版本選擇器
│   ├── SOPTimeline.jsx        # SOP 步驟輸出
│   ├── ChangelogView.jsx      # 全版本規則唯讀檢視
│   ├── AdminPanel.jsx         # 管理員面板
│   ├── MigrateTool.jsx        # Blueprint 升版工具 UI
│   ├── I18nTool.jsx           # 語言包補全工具 UI
│   └── VersionRuleForm.jsx    # 版本規則表單
├── migrations/
│   ├── engine.js              # 瀏覽器端遷移引擎（JSZip）
│   ├── index.js               # 遷移函式註冊表 + versionDict
│   ├── blueprintAdder.js      # blueprint_adder.py 的 JS 移植
│   └── configs/               # 各版本的 config.json（由 sync 腳本複製）
├── i18n/
│   ├── string-resource_zh-Hant.json
│   ├── string-resource_zh-Hans.json
│   └── string-resource_en.json
└── utils/
    └── versionUtils.js        # 版本比較、BFS 路徑搜尋
```

---

## 開發者指南：新增遷移版本

新增從 `v3.X` 到 `v3.Y` 的遷移，按以下步驟操作：

### 步驟 1：建立 Python 遷移目錄

在 `core/migrate/v3X_v3Y/` 下建立兩個檔案：

**`config.json`** — 填入該版本新增的 display 參數（若無新增則為 `{}`）：
```json
{
  "元件名稱": {
    "parameters": {
      "displayNewParam": "{{displayNewParam}}"
    }
  }
}
```

**`migration.py`** — 繼承 `AutoMigration`，config-only 版本直接套用範本即可；若有自訂邏輯則在 `find_component_and_update` 實作並在 `run()` 中呼叫。

### 步驟 2：同步至 JS 遷移引擎

```bash
npm run sync-migrations
```

腳本會自動：
- 偵測遷移類型（`passthrough` / `config-only` / `custom`）
- 複製 `config.json` 至 `src/migrations/configs/`
- 在 `src/migrations/index.js` 插入對應函式、更新 `versionDict` 和 `autoMigrations`

若偵測為 `custom`，會插入 TODO 佔位函式，需手動 port Python 邏輯。

### 步驟 3：更新語言包

若 `config.json` 有新的 display 參數（值為 `{{key}}` 格式），需在三個語言包加入對應翻譯：

```
src/i18n/string-resource_zh-Hant.json
src/i18n/string-resource_zh-Hans.json
src/i18n/string-resource_en.json
```

### 步驟 4：Commit

```bash
git add core/migrate/v3X_v3Y/ src/migrations/ src/i18n/
git commit -m "feat: 新增 v3.X → v3.Y 遷移"
git push origin main
```

推送後 GitHub Actions 自動部署。

---

## 遠端設定同步（GitHub Gist）

規則資料可透過 GitHub Gist 在不同裝置間同步。

**設定方式：**
1. 在 GitHub 建立一個 Gist，檔案命名為 `rules.json`
2. 進入管理員模式
3. 填入 Gist ID 與具有 `gist` 寫入權限的 Personal Access Token
4. Token 僅存於本機 localStorage，不會上傳至 Gist

**Gist 檔案格式：**
```json
{
  "version": "1.0",
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "rules": [...],
  "settings": {
    "migrationToolUrl": "http://..."
  }
}
```
