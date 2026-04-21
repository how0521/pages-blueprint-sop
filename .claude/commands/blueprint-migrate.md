# Blueprint 版本遷移 Skill

建立新的 Blueprint 版本遷移，並同步至前端 JS 遷移引擎。

## 使用方式

```
/blueprint-migrate <from_version> <to_version> [page_config_file]
```

例如：`/blueprint-migrate 332 333 3.33.0-pages.config.json` 會建立從 v3.32 到 v3.33 的遷移，並自動填入 config.json 與更新語言包。

## 參數

用戶輸入的參數：$ARGUMENTS

請解析參數，格式為：`<from_version> <to_version> [page_config_file]`
- from_version：來源版本號（例如 329 代表 3.29）
- to_version：目標版本號（例如 330 代表 3.30）
- page_config_file（選填）：新版本的 pages.config.json 檔案名稱。**若用戶未提供，請詢問用戶提供後再繼續，不可跳過此步驟。**

## 執行步驟

### 步驟 1：解析版本號

從參數中提取版本號：
- 如果輸入 `329 330`，則：
  - FROM_VERSION = 329
  - TO_VERSION = 330
  - FROM_FULL = 3.29（第一位是 major，其餘是 minor）
  - TO_FULL = 3.30
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
        """
        遞迴搜尋並更新元件

        NOTE: No custom migration logic is needed for v<FROM_FULL> to v<TO_FULL>,
        so this method simply passes through without modifications.
        """
        pass
```

### 步驟 4：自動填入 config.json（需要 page_config 檔案）

**若用戶未提供 page_config_file，請在此步驟停下並詢問用戶提供。**

執行以下 Python，找出新版本相比舊版本新增的 display 參數與元件：

```python
import json

# 讀取新版 config
with open('<PAGE_CONFIG_FILE>', 'r', encoding='utf-8-sig') as f:
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

# 讀取現有語言包
with open('src/i18n/string-resource_zh-Hant.json', 'r', encoding='utf-8') as f:
    existing_i18n = json.load(f)

existing_keys = set(existing_i18n.keys())

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

# 找出新增的 display key（不在舊版 migration config 中，也不在語言包中）
new_config = {}
new_i18n_keys = []

for comp_name, params in comp_params.items():
    new_params = {}
    for p in params:
        key = p['key']
        if key not in existing_keys:
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

### 步驟 5：更新語言包（i18n）

根據步驟 4 找出的新 i18n keys，**根據 description 和 key 名稱語義**產出三語翻譯：

- **zh-Hant**：繁體中文，參考 description 中的中文描述產出簡短 UI 文案
- **zh-Hans**：簡體中文（載入→加载、確認→确认、重新整理→刷新、收合→收起 等）
- **en**：英文，根據 key 名稱語義和 description 翻譯

翻譯原則：
- UI 文案要簡短自然，不是直譯 description
- 有 `default` 值的 key 優先以 default 作為 zh-Hant 內容
- `[多語系]`、`[iOS]`、`[Android]` 標記翻譯時忽略
- %s、{placeholder} 等佔位符原樣保留
- 為「配置型」參數（description 含「為空則」、「設定」等）翻譯為空字串 ""

將新翻譯 merge 進 `src/i18n/string-resource_zh-Hant.json`、`string-resource_zh-Hans.json`、`string-resource_en.json`（舊 key 不動）。

### 步驟 6：同步至 JS 遷移引擎

```bash
npm run sync-migrations
```

確認輸出正常（應顯示新版本已加入）。

### 步驟 7：Commit 並推上 GitHub

```bash
git add core/migrate/v<FROM_VERSION>_v<TO_VERSION>/ src/migrations/ src/i18n/
git commit -m "feat: 新增 v<FROM_FULL> → v<TO_FULL> 遷移"
git push -u origin feat/v<FROM_VERSION>_v<TO_VERSION>
```

### 步驟 8：詢問後續操作

完成後，詢問用戶：
1. 是否需要在 `config.json` 中補充或調整參數？
2. 是否需要在 `migration.py` 中新增自訂遷移邏輯？
   - 若有自訂邏輯，完成後需再次執行 `npm run sync-migrations` 並 commit

## 注意事項

- 版本號格式：輸入 `329` 代表 `3.29`，第一位是 major，其餘是 minor
- **page_config 檔案為必要輸入**，若用戶未提供請直接詢問，不可跳過自動填入流程
- `config.json` 只含 **該版本新增** 的 display 參數（非語言包的 state 參數也應加入，格式為 `"key": "key"`）
- 嵌套在 arrayObject 內的參數可能需要自訂 migration.py 邏輯，而非 config.json 注入
- `migration.py` 有自訂邏輯時，`find_component_and_update` 必須在 `run()` 中被呼叫（取消 `result["pages"] = self.find_component_and_update(...)` 的註解）
- sync-migrations 腳本會自動偵測類型（config-only / passthrough / custom）並輸出提示
