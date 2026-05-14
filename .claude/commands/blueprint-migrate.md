# Blueprint 版本遷移 Skill

建立新的 Blueprint 版本遷移，並同步至前端 JS 遷移引擎。

## 使用方式

```
/blueprint-migrate <from_version> <to_version> [page_config_file]
```

例如：`/blueprint-migrate 337 338` 會自動從 API 抓取 3.38.0 的 config，建立從 v3.37 到 v3.38 的遷移，並自動填入 config.json 與更新語言包。

## 參數

用戶輸入的參數：$ARGUMENTS

請解析參數，格式為：`<from_version> <to_version> [page_config_file]`
- from_version：來源版本號（例如 329 代表 3.29）
- to_version：目標版本號（例如 330 代表 3.30）
- page_config_file（選填）：若提供則直接使用該檔案，**不提供則自動從 API 抓取**

## 執行步驟

### 步驟 1：解析版本號

從參數中提取版本號：
- 如果輸入 `329 330`，則：
  - FROM_VERSION = 329
  - TO_VERSION = 330
  - FROM_FULL = 3.29（第一位是 major，其餘是 minor）
  - TO_FULL = 3.30
  - TO_FULL_VERSION = 3.30.0（用於 API URL 與檔名）
  - BRANCH_NAME = feat/v329_v330
  - FOLDER_NAME = v329_v330

### 步驟 2：檢查並建立 Git 分支

1. 確認目前 Git 狀態是否乾淨
2. 從 main 分支建立新分支：`git checkout -b feat/v<FROM_VERSION>_v<TO_VERSION>`

### 步驟 3：建立遷移目錄和檔案

在 `core/migrate/v<FROM_VERSION>_v<TO_VERSION>/` 目錄下建立以下檔案：

#### 3.1 建立 `config.json`

```json
{}
```

#### 3.2 建立 `migration.py`

```python
import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v<FROM_FULL> to v<TO_FULL>
"""

class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print("現在開始 migrate 到 ", self.targetVersion())
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "config.json")

        # 讀取 config.json
        try:
            with open(config_path, "r", encoding="utf-8") as file:
                config = json.load(file)
        except FileNotFoundError:
            print(f"找不到 config.json 檔案！請確認檔案是否存在於：{config_path}")
            return blueprint
        except json.JSONDecodeError:
            print("config.json 格式錯誤！請檢查 JSON 檔案格式是否正確。")
            return blueprint
        except Exception as e:
            print(f"讀取 config.json 時發生錯誤：{e}")
            return blueprint

        # 1. Generic parameter addition from config.json using BlueprintAdder
        blueprint_adder = BlueprintAdder()
        result = blueprint_adder.add_to_blueprint(blueprint, config=config)

        # 2. No custom migration logic needed for this version
        # Simply return the result without any modifications

        return result

    def targetVersion(self) -> str:
        return "<TO_FULL>.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        pass
```

### 步驟 4：取得 pages.config.json

**優先使用用戶提供的檔案**（若參數有指定）；否則從 API 自動抓取：

```python
import urllib.request, ssl, json

# 自動從 API 抓取
url = "https://pages.cmoney.tw/api/config/<TO_FULL_VERSION>"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(url, context=ctx, timeout=15) as r:
        data = json.loads(r.read())
    filename = "<TO_FULL_VERSION>-pages.config.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"已從 API 抓取並儲存至 {filename}")
except Exception as e:
    print(f"抓取失敗：{e}")
```

若抓取失敗，告知用戶手動提供 `<TO_FULL_VERSION>-pages.config.json` 後再繼續。

成功後將 `PAGE_CONFIG_FILE` 設為 `<TO_FULL_VERSION>-pages.config.json`。

### 步驟 5：自動填入 config.json（依賴步驟 4 的 config 檔）

執行以下 Python，找出新版本相比舊版本新增的 display 參數與元件：

```python
import json

# 讀取新版 config
with open('<PAGE_CONFIG_FILE>', 'r', encoding='utf-8') as f:
    new_data = json.load(f)

# 讀取舊版 migration config（上一個版本的 src/migrations/configs/v3_<FROM_MINOR>.json）
with open('src/migrations/configs/v3_<FROM_MINOR>.json', 'r', encoding='utf-8') as f:
    prev_migration = json.load(f)

# 取得上一個 migration 中已有的所有 display key（即 3.X 版的新增參數）
prev_display_keys = set()
for comp_data in prev_migration.values():
    for key in comp_data.get('parameters', {}).keys():
        if key.startswith('display'):
            prev_display_keys.add(key)

# 讀取現有語言包（三語）
with open('src/i18n/string-resource_zh-Hant.json', 'r', encoding='utf-8') as f:
    existing_zh_hant = json.load(f)
with open('src/i18n/string-resource_zh-Hans.json', 'r', encoding='utf-8') as f:
    existing_zh_hans = json.load(f)
with open('src/i18n/string-resource_en.json', 'r', encoding='utf-8') as f:
    existing_en = json.load(f)

def needs_i18n(key):
    for d in [existing_zh_hant, existing_zh_hans, existing_en]:
        if key not in d or d.get(key, '') == '':
            return True
    return False

# 找出所有 display 參數及其所屬元件
def find_display_params_by_component(data):
    results = {}  # { component_name: [{ key, description, default }] }
    for comp in data['data']['components']:
        name = comp.get('name', '')
        params = []
        for p in comp.get('parameters', []):
            if isinstance(p, dict) and p.get('key', '').startswith('display'):
                params.append({
                    'key': p['key'],
                    'description': p.get('description', ''),
                    'default': p.get('default', '')
                })
        if params:
            results[name] = params
    return results

comp_params = find_display_params_by_component(new_data)

# 找出需補語言包的 display key（任一語言缺少或為空字串）
new_config = {}
new_i18n_keys = []

for comp_name, params in comp_params.items():
    new_params = {}
    for p in params:
        key = p['key']
        if needs_i18n(key):
            new_params[key] = '{{' + key + '}}'
            new_i18n_keys.append(p)
    if new_params:
        new_config[comp_name] = {'parameters': new_params}

print(json.dumps(new_config, ensure_ascii=False, indent=4))
print(f'\nNew i18n keys: {len(new_i18n_keys)}')
for p in new_i18n_keys:
    print(f"  {p['key']} | {p['description']} | default={p['default']}")
```

將輸出結果寫入 `core/migrate/v<FROM_VERSION>_v<TO_VERSION>/config.json`。

### 步驟 6：更新語言包（i18n）

根據步驟 5 找出的新 i18n keys，**根據 description 和 key 名稱語義**產出三語翻譯：

- **zh-Hant**：繁體中文，參考 description 中的中文描述產出簡短 UI 文案
- **zh-Hans**：簡體中文（載入→加载、確認→确认、重新整理→刷新、收合→收起 等）
- **en**：英文，根據 key 名稱語義和 description 翻譯

翻譯原則：
- UI 文案要簡短自然，不是直譯 description
- 有 `default` 值的 key 優先以 default 作為 zh-Hant 內容
- `[多語系]`、`[iOS]`、`[Android]` 標記翻譯時忽略
- %s、{placeholder} 等佔位符原樣保留
- 為「配置型」參數（description 含「為空則」）翻譯為空字串 ""

將新翻譯 merge 進 `src/i18n/string-resource_zh-Hant.json`、`string-resource_zh-Hans.json`、`string-resource_en.json`（舊 key 不動）。

### 步驟 7：同步至 JS 遷移引擎

```bash
npm run sync-migrations
```

確認輸出正常（應顯示新版本已加入）。

### 步驟 8：Commit 並推上 GitHub

```bash
git add core/migrate/v<FROM_VERSION>_v<TO_VERSION>/ src/migrations/ src/i18n/
git commit -m "feat: 新增 v<FROM_FULL> → v<TO_FULL> 遷移"
git push -u origin feat/v<FROM_VERSION>_v<TO_VERSION>
```

### 步驟 9：詢問後續操作

完成後，詢問用戶：
1. 是否需要在 `config.json` 中補充或調整參數？
2. 是否需要在 `migration.py` 中新增自訂遷移邏輯？
   - 若有自訂邏輯，完成後需再次執行 `npm run sync-migrations` 並 commit

## 注意事項

- 版本號格式：輸入 `329` 代表 `3.29`，第一位是 major，其餘是 minor
- **pages.config.json 預設自動從 API 抓取**，API URL 格式：`https://pages.cmoney.tw/api/config/<TO_FULL_VERSION>`（如 `3.38.0`）；若 API 不可用才需手動提供
- `config.json` 只含 **該版本新增** 的 display 參數（非語言包的 state 參數也應加入，格式為 `"key": "key"`）
- 嵌套在 arrayObject 內的參數可能需要自訂 migration.py 邏輯，而非 config.json 注入
- `migration.py` 有自訂邏輯時，`find_component_and_update` 必須在 `run()` 中被呼叫（取消 `result["pages"] = self.find_component_and_update(...)` 的註解）
- sync-migrations 腳本會自動偵測類型（config-only / passthrough / custom）並輸出提示
