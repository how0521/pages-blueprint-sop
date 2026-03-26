import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v2.7.0 to v3.0.0
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
        blueprintAdder = BlueprintAdder()
        result = blueprintAdder.add_to_blueprint(blueprint, config=config)
        # 處理 pages 元件
        if "pages" in blueprint:
            result["pages"] = self.find_component_and_update(blueprint["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.0.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        try:
            for component in subcomponents:
                # 確保 component 為字典，並且包含必要的鍵
                if not isinstance(component, dict):
                    continue

                if "name" not in component:
                    continue

                # 如果 'parameters' 不存在，則新增為空字典
                if "parameters" not in component:
                    component["parameters"] = {}

                # 確認 component['name'] 是否在 config 中
                componentName = component["name"]

                if componentName in config.keys():
                    # 特別處理 K線副圖 的 updateParameters
                    if (
                        componentName == "K線副圖"
                        and "updateParameters" in config[componentName]
                    ):
                        if (
                            "parameters" in component
                            and "typeSettings" in component["parameters"]
                        ):
                            type_settings = component["parameters"]["typeSettings"]

                            # 取得 updateParameters 中的 contents
                            update_contents = config[componentName][
                                "updateParameters"
                            ].get("charts", [])

                            # 建立 type 到 displayTitle 的映射
                            type_to_display = {}
                            for content in update_contents:
                                if "type" in content and "displayTitle" in content:
                                    type_to_display[content["type"]] = content[
                                        "displayTitle"
                                    ]

                            # 遍歷每個 type_setting
                            for type_setting in type_settings:
                                # 處理 charts 陣列
                                if "charts" in type_setting and isinstance(
                                    type_setting["charts"], list
                                ):
                                    charts = type_setting["charts"]
                                    if all(isinstance(item, str) for item in charts):
                                        # 轉換字串陣列為物件陣列
                                        new_charts = []
                                        for chart_type in charts:
                                            chart_obj = {
                                                "type": chart_type,
                                                # 如果在 config 中找到對應的 displayTitle 則使用，否則使用原字串
                                                "displayTitle": type_to_display.get(
                                                    chart_type, chart_type
                                                ),
                                            }
                                            new_charts.append(chart_obj)

                                        # 更新 charts 陣列
                                        type_setting["charts"] = new_charts

                # 遞迴處理子元件（subComponents），如果有的話
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents

        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v2.7.0 to v3.0.0 error: ", e)
            error_message = traceback.format_exc()
            print(error_message)
            # 發生錯誤時返回原始子元件
            return subcomponents
