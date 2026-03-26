import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.19 to v3.20
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

        # 2. Custom migration logic (if needed)
        # If you only need to add parameters via config.json without any custom logic,
        # you can skip calling find_component_and_update and just implement it with 'pass'
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.20.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件
        
        NOTE: If you only need to add parameters via config.json without any custom logic,
        simply implement this method with 'pass' and do NOT call it in the run() method.
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

                componentName = component["name"]
                parameters = component.get("parameters", {})

                # 處理 shareDeepLinkFormat 重命名邏輯
                if componentName in ["社團專區", "作者專區/看板全文頁"]:
                    if "shareDeepLinkFormat" in parameters:
                        print(
                            f"-------在元件 '{componentName}' 中將 'shareDeepLinkFormat' 重命名為 'shareDeepLink'"
                        )
                        # 重命名參數
                        parameters["shareDeepLink"] = parameters["shareDeepLinkFormat"]
                        del parameters["shareDeepLinkFormat"]

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.19 to v3.20 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )
