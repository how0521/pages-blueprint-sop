import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.27 to v3.28

1. 社團聊天室：刪除 stateNextStartWeight，新增搜尋、loading、錯誤等相關參數
2. 美股事件展示板：刪除 displayLoading、displayEmpty，新增分區標題與空白提示參數
3. 自選股/編輯：新增刪除群組失敗 Alert 相關參數
4. 聊天室導覽列：移除所有「聊天室導覽列」元件
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

        # 2. Custom migration logic for parameter deletions
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.28.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件

        - 聊天室導覽列：移除所有「聊天室導覽列」元件
        - 社團聊天室：移除 stateNextStartWeight
        - 美股事件展示板：移除 displayLoading、displayEmpty
        """
        try:
            # 移除所有「聊天室導覽列」元件
            removed_count = len([c for c in subcomponents if isinstance(c, dict) and c.get("name") == "聊天室導覽列"])
            subcomponents[:] = [c for c in subcomponents if not (isinstance(c, dict) and c.get("name") == "聊天室導覽列")]
            if removed_count > 0:
                print(f"已移除 {removed_count} 個「聊天室導覽列」元件")

            for component in subcomponents:
                if not isinstance(component, dict):
                    raise ValueError(
                        f"Invalid component format, expected dict but got: {type(component)}"
                    )

                if "name" not in component:
                    raise KeyError(f"Missing 'name' key in component: {component}")

                if "parameters" not in component:
                    component["parameters"] = {}

                componentName = component["name"]
                parameters = component.get("parameters", {})

                # 社團聊天室：移除 stateNextStartWeight
                if componentName == "社團聊天室":
                    params_to_remove = ["stateNextStartWeight"]
                    for param in params_to_remove:
                        if param in parameters:
                            parameters.pop(param)
                            print(f"已移除參數: '{param}'")

                # 美股事件展示板：移除 displayLoading、displayEmpty
                if componentName == "美股事件展示板":
                    params_to_remove = ["displayLoading", "displayEmpty"]
                    for param in params_to_remove:
                        if param in parameters:
                            parameters.pop(param)
                            print(f"已移除參數: '{param}'")

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            print("Migration from Blueprint v3.27 to v3.28 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )
