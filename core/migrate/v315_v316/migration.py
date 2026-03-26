import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.15 to v3.16
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
        
        # 2. Custom migration for 數線型數值欄位
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.16.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件
        """
        try:
            for component in subcomponents:
                # 確保 component 為字典，並且包含必要的鍵
                if not isinstance(component, dict):
                    raise ValueError(
                        f"Invalid component format, expected dict but got: {type(component)}"
                    )

                if "name" not in component:
                    raise KeyError(f"Missing 'name' key in component: {component}")

                # 如果 'parameters' 不存在，則新增為空字典
                if "parameters" not in component:
                    component["parameters"] = {}

                parameters = component.get("parameters", {})

                # 處理 tableSetting 中的數線型數值欄位
                if "tableSetting" in parameters:
                    print(
                        "-------Before migration: ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )
                    self.migrate_table_setting(parameters["tableSetting"])
                    print(
                        "-------After migration: ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.15 to v3.16 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )

    def migrate_table_setting(self, table_setting: dict) -> None:
        """
        處理 tableSetting 中的 columns 陣列，將數線型數值欄位的 formatDigits 轉換為 floatFormat
        """
        if not isinstance(table_setting, dict):
            return

        columns = table_setting.get("columns", [])
        if not isinstance(columns, list):
            return

        for column in columns:
            if not isinstance(column, dict):
                continue

            content = column.get("content", {})
            if not isinstance(content, dict):
                continue

            # 檢查是否為數線型數值欄位
            if content.get("name") == "數線型數值欄位":
                parameters = content.get("parameters", {})
                if not isinstance(parameters, dict):
                    continue

                # 檢查是否有舊的 formatDigits 參數
                if "formatDigits" in parameters and "floatFormat" not in parameters:
                    format_digits_value = parameters.pop("formatDigits")
                    
                    print(f"Migrating 數線型數值欄位:")
                    print(f"  Before: formatDigits = {format_digits_value}")
                    
                    # 建立新的 floatFormat 結構
                    parameters["floatFormat"] = {
                        "digitCount": format_digits_value,
                        "roundingMode": "round"
                    }
                    
                    print(f"  After: floatFormat = {parameters['floatFormat']}")
