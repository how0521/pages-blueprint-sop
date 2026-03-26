import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.3 to v3.4
"""

class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print('現在開始 migrate 到 ', self.targetVersion())
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
        return "3.4.0"

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

                if componentName in config.keys():
                    if (
                        "資訊展示板" == componentName
                        and "updateParameters" in config[componentName]
                    ):
                        componentParameters = component["parameters"]

                        # 檢查是否存在 info 欄位，若不存在則跳過此元件的遷移
                        if "info" not in componentParameters:
                            print(f"跳過元件 '{componentName}'：找不到 'info' 欄位")
                            continue

                        updateParameters = config[componentName]["updateParameters"]

                        # 新的物件陣列
                        contents = []

                        for infoElement in componentParameters["info"]:
                            # 新的物件陣列
                            numberLineImageSettings = []

                            for stringToImage in infoElement["stringToImage"]:
                                value = stringToImage["value"]
                                imageRes = stringToImage["imageRes"]

                                # 要更新的格式
                                numberLineImageSettingsCopy = updateParameters[
                                    "contents"
                                ]["numberLineImageSettings"].copy()

                                numberLineImageSettingsCopy["left"] = value
                                numberLineImageSettingsCopy["right"] = value
                                numberLineImageSettingsCopy["image"] = imageRes

                                numberLineImageSettings.append(
                                    numberLineImageSettingsCopy
                                )

                            contents.append(
                                {
                                    "numberLineImageSettings": numberLineImageSettings,
                                    "columnKey": infoElement["target"],
                                }
                            )

                        componentParameters["contents"] = contents

                        del componentParameters["info"]

                # 遞迴處理子元件（subComponents），如果有的話
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents

        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.3 to v3.4 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
