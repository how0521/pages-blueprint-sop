import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.12 to v3.13
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
        return "3.13.0"

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

                if "自選股" == componentName:
                    parameters = component.get("parameters", {})

                    # 如果存在舊鍵 'source' 且尚未有新鍵 'readSources'，則執行改名
                    if "source" in parameters and "readSources" not in parameters:
                        print(f"Migrating component: {componentName}")

                        print(
                            "-------Before (source): ",
                            json.dumps(
                                parameters.get("source"),
                                indent=2,
                                ensure_ascii=False,
                            ),
                        )

                        # 將 source 改名為 readSources（同時移除舊鍵）
                        parameters["readSources"] = parameters.pop("source")

                        print(
                            "-------After (readSources): ",
                            json.dumps(
                                parameters.get("readSources"),
                                indent=2,
                                ensure_ascii=False,
                            ),
                        )

                # 處理雷達圖結構更新
                if "雷達圖" == componentName:
                    parameters = component.get("parameters", {})

                    # 檢查是否需要遷移雷達圖結構（舊結構包含 source 而非 readSources）
                    if "source" in parameters and "readSources" not in parameters:
                        print(f"Migrating radar chart component: {componentName}")

                        print(
                            "-------Before migration: ",
                            json.dumps(
                                parameters,
                                indent=2,
                                ensure_ascii=False,
                            ),
                        )

                        # 取得舊的 source 並轉換為 readSources 數組格式
                        old_source = parameters.pop("source")
                        parameters["readSources"] = [old_source]

                        # 取得 dataColors 來生成對應的 dataSettings
                        data_colors = parameters.pop("dataColors", ["basicRise"])

                        # 移除其他舊版本的屬性
                        parameters.pop("dataCount", None)
                        parameters.pop("isFirstDataOnTop", None)

                        # 根據 dataColors 的數量和值生成對應的 dataSettings
                        if "dataSettings" not in parameters:
                            data_settings = []
                            for color in data_colors:
                                data_settings.append({"defaultColor": color})
                            parameters["dataSettings"] = data_settings

                        print(
                            "-------After migration: ",
                            json.dumps(
                                parameters,
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
            print("Migration from Blueprint v3.12 to v3.13 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
