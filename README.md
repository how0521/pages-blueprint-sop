# PAGEs Blueprint SOP

升版 SOP 導覽工具。選擇「目前版本」與「目標版本」後，系統自動產生完整的升版步驟清單，包含 Migrate 工具連結與各版本所需的手動調整項目。

---

## 技術棧

| 分類 | 技術 |
|------|------|
| 語言 | HTML / CSS / JavaScript (ES Module) |
| UI 框架 | [React 18](https://react.dev/) |
| 建置工具 | [Vite 5](https://vitejs.dev/) |
| CSS | [Tailwind CSS v3](https://tailwindcss.com/)（class-based dark mode） |
| 圖示 | [Lucide React](https://lucide.dev/) |
| 部署 | GitHub Pages（透過 GitHub Actions 自動部署） |
| 遠端設定同步 | GitHub Gist API（`rules.json`） |
| 本地儲存 | `localStorage`（規則、設定、主題偏好） |

---

## 本地開發

### 前置需求

- Node.js 18+
- npm

### 安裝 & 啟動

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器（port 4999）
npm run dev
```

開啟瀏覽器前往 `http://localhost:4999/pages-blueprint-sop/`

### 建置

```bash
npm run build
```

產出放在 `dist/` 資料夾，可直接部署至任何靜態主機。

---

## 部署至 GitHub Pages

本專案已設定 GitHub Actions，**推送到 `main` 分支時自動部署**。

### 初次設定步驟

1. 在 GitHub 上建立此 repo（若尚未建立）
2. 前往 **Settings → Pages**
3. Source 選擇 **GitHub Actions**
4. 推送任何 commit 到 `main`，Actions 即會自動執行 build 並部署

部署完成後網站位址為：
```
https://<your-github-username>.github.io/pages-blueprint-sop/
```

### 手動觸發部署

```bash
git push origin main
```

GitHub Actions 流程（`.github/workflows/deploy.yml`）會自動：
1. 安裝 Node.js 20
2. `npm install`
3. `npm run build`
4. 將 `dist/` 部署至 GitHub Pages

---

## 遠端設定同步（GitHub Gist）

規則資料可透過 GitHub Gist 在不同裝置間同步，所有用戶讀取同一份公開 Gist。

### 設定方式

1. 在 GitHub 建立一個 Gist，檔案命名為 `rules.json`
2. 進入管理員模式（密碼：見系統設定）
3. 前往「設定」，填入：
   - **Gist ID**：Gist 網址最後一段的 hash 字串
   - **GitHub Token**：具有 `gist` 寫入權限的 Personal Access Token（僅管理員需要，讀取為公開不需 token）
4. 點擊「同步至 Gist」即完成推送

### Gist 檔案格式

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

---

## 功能說明

### 一般用戶
- 選擇原始版本與目標版本，點擊「生成 SOP」
- 若升版路徑包含需執行 Migrate 工具的步驟，頂端會顯示一次性的 Migrate 連結
- 下方清單列出各版本區間需要手動調整的項目，可勾選追蹤進度
- 切換至「Changelog」可瀏覽所有版本規則（唯讀）

### 管理員
- 點擊右上角「管理員」並輸入密碼後進入維護模式
- 可新增、編輯、刪除版本升版規則
- 可設定 Migrate 工具連結
- 支援 JSON 匯出 / 匯入備份
- 支援同步至 GitHub Gist

---

## 專案結構

```
src/
├── App.jsx                  # 根元件，狀態管理、Gist 同步邏輯
├── main.jsx                 # React 進入點
├── index.css                # 全域樣式、深淺色 body 設定
├── components/
│   ├── Header.jsx           # 頂部導覽列、主題切換、管理員密碼驗證
│   ├── SOPNavigator.jsx     # 版本選擇器，觸發 SOP 生成
│   ├── SOPTimeline.jsx      # SOP 輸出清單（步驟卡片 + 進度條）
│   ├── ChangelogView.jsx    # 全版本規則唯讀檢視
│   ├── AdminPanel.jsx       # 管理員面板（規則管理、設定、Gist 操作）
│   └── VersionRuleForm.jsx  # 新增 / 編輯版本規則表單
└── utils/
    └── versionUtils.js      # 版本比較、BFS 路徑搜尋、Dropdown 過濾
```
