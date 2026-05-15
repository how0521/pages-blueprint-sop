# pages-blueprint-devkit

Blueprint 升版工具集，提供 SOP 導覽、Blueprint 自動升版、語言包補全三項功能。

## 常用指令

```bash
npm run dev              # 啟動開發伺服器（port 4999）
npm run build            # 建置
npm run sync-migrations  # 同步 Python 遷移至 JS 引擎
npm run publish-changes  # 自動 commit + push 遷移相關變更
```

## 專案結構

```
core/migrate/v<FROM>_v<TO>/   # Python 遷移邏輯（每個版本一個資料夾）
  ├── config.json              # 該版本新增的 display 參數
  └── migration.py             # 繼承 AutoMigration

src/migrations/               # JS 遷移引擎（由 sync-migrations 自動產生）
  ├── engine.js
  ├── index.js                 # 遷移函式註冊表 + versionDict
  ├── blueprintAdder.js
  └── configs/                 # 各版本 config.json 的複本

src/i18n/                     # 三語語言包
  ├── string-resource_zh-Hant.json
  ├── string-resource_zh-Hans.json
  └── string-resource_en.json
```

## Slash Commands

- `/blueprint-migrate <from> <to>` — 建立新版本遷移，自動從 API 抓取 pages.config.json、填 config.json、更新語言包、sync 至 JS 引擎
- `/generate-i18n <config_file>` — 補全指定版本的語言包缺漏 key

## 版本號格式

輸入 `337 338` 代表 v3.37 → v3.38（第一位 major，其餘 minor）。

## 重要規則

- `config.json` 只放**該版本新增**的 display 參數（非語言包的 state 參數格式為 `"key": "key"`）
- 每次新增遷移後必須執行 `npm run sync-migrations`
- description 含「為空則」的參數是配置型，語言包翻譯填空字串 `""`
- 分支命名：`feat/v<FROM>_v<TO>`，不直接 push main
