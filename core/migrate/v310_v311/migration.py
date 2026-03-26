import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.10 to v3.11
"""


class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print("現在開始 migrate 到 ", self.targetVersion())
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "config.json")
        # 讀取config.json
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

        # 使用 BlueprintAdder 處理 blueprint
        blueprintAdder = BlueprintAdder()
        result = blueprintAdder.add_to_blueprint(blueprint, config=config)
        result["pages"] = self.find_component_and_update(blueprint["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.11.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
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

                # 確認 component['name'] 是否在 config 中
                componentName = component["name"]

                if "資訊展示板" == componentName:
                    parameters = component.get("parameters", {})

                    # 檢查是否已經是新格式，避免重複遷移
                    if "titleSetting" not in parameters and "contentSetting" not in parameters:
                        print(f"Migrating component: {componentName}")

                        print(
                            "-------Before: ",
                            json.dumps(
                                parameters,
                                indent=2,
                                ensure_ascii=False,
                            ),
                        )

                        # 提取舊參數
                        old_title = parameters.get("title")
                        old_contents = parameters.get("contents", [])
                        source = parameters.get("source", [])

                        # 建立新的 titleSetting
                        title_setting = {
                            "displayText": old_title,
                        }
                        if "uuidRedirect" in parameters:
                            title_setting["uuidRedirect"] = parameters.get(
                                "uuidRedirect"
                            )

                        # 建立新的 contents for contentSetting
                        new_contents = []
                        for content_item in old_contents:
                            new_content_item = {
                                "numberLineImageParams": {
                                    "numberLineImageSettings": content_item.get(
                                        "numberLineImageSettings"
                                    ),
                                    "columnKey": content_item.get("columnKey"),
                                }
                            }
                            new_contents.append(new_content_item)

                        # 建立新的 contentSetting
                        content_setting = {
                            "contents": new_contents,
                        }
                        if "uuidRedirect" in parameters:
                            content_setting["uuidRedirect"] = parameters.get(
                                "uuidRedirect"
                            )

                        # 更新 component['parameters']
                        component["parameters"] = {
                            "titleSetting": title_setting,
                            "contentSetting": content_setting,
                            "source": source
                        }

                        print(
                            "-------After: ",
                            json.dumps(
                                component["parameters"],
                                indent=2,
                                ensure_ascii=False,
                            ),
                        )

                # 遞迴處理子元件（subComponents），如果有的話
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents

        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.10 to v3.11 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
