# Blueprint 版本遷移 Skill

建立新的 Blueprint 版本遷移，並同步至前端 JS 遷移引擎。

## 使用方式

```
/blueprint-migrate <from_version> <to_version>
```

例如：`/blueprint-migrate 329 330` 會建立從 v3.29 到 v3.30 的遷移。

## 參數

用戶輸入的參數：$ARGUMENTS

請解析參數，格式為：`<from_version> <to_version>`
- from_version：來源版本號（例如 329 代表 3.29）
- to_version：目標版本號（例如 330 代表 3.30）

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

### 步驟 4：同步至 JS 遷移引擎

執行 sync-migrations 腳本，將新版本同步至 `src/migrations/`：

```bash
npm run sync-migrations
```

確認輸出正常（應顯示新版本已加入）。

### 步驟 5：Commit 並推上 GitHub

```bash
git add core/migrate/v<FROM_VERSION>_v<TO_VERSION>/ src/migrations/
git commit -m "feat: 新增 v<FROM_FULL> → v<TO_FULL> 遷移"
git push -u origin feat/v<FROM_VERSION>_v<TO_VERSION>
```

### 步驟 6：詢問後續操作

完成後，詢問用戶：
1. 是否需要在 `config.json` 中新增參數？
2. 是否需要在 `migration.py` 中新增自訂遷移邏輯？
   - 若有自訂邏輯，完成後需再次執行 `npm run sync-migrations` 並 commit

## 注意事項

- 版本號格式：輸入 `329` 代表 `3.29`，第一位是 major，其餘是 minor
- `config.json` 預設為空 `{}`，有需要再補填
- `migration.py` 有自訂邏輯時，`find_component_and_update` 必須在 `run()` 中被呼叫（取消 `result["pages"] = self.find_component_and_update(...)` 的註解）
- sync-migrations 腳本會自動偵測類型（config-only / passthrough / custom）並輸出提示
