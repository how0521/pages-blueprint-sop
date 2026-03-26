import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.9 to v3.10
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
        return "3.10.0"

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

                if "Bar_Line_圖表" == componentName:
                    componentParameters = component["parameters"]
                    valid_keys = ["lines", "bars", "symmetryBars", "riverLines"]

                    # 檢查rightAxis和leftAxis
                    for axis_key in ["rightAxis", "leftAxis"]:
                        if axis_key in componentParameters:
                            axis_data = componentParameters[axis_key]
                            # 檢查軸數據中的有效鍵
                            for key in valid_keys:
                                if key in axis_data and isinstance(
                                    axis_data[key], list
                                ):
                                    # 處理陣列中的每個元素
                                    for item in axis_data[key]:
                                        if isinstance(item, dict):
                                            print("-------key: ", key)
                                            print(
                                                "-------Before: ",
                                                json.dumps(
                                                    item,
                                                    indent=2,
                                                    ensure_ascii=False,
                                                ),
                                            )
                                            # 將key改名為dataColumnKey
                                            if "keys" in item:
                                                item["dataColumnKeys"] = item.pop(
                                                    "keys", None
                                                )

                                            # 將key改名為dataColumnKey
                                            if "key" in item:
                                                item["dataColumnKey"] = item.pop(
                                                    "key", None
                                                )

                                            # 確保width屬性存在
                                            if "width" not in item:
                                                item["width"] = 1

                                            # 確保color屬性存在
                                            if "color" not in item:
                                                item["color"] = "basicText"
                                                # 檢查otherAxes (陣列結構)

                                            # 如果是symmetryBars，確保equalsColor屬性存在
                                            if (
                                                key == "symmetryBars"
                                                and "equalsColor" not in item
                                            ):
                                                item["equalsColor"] = "basicText"

                                            print(
                                                "-------After: ",
                                                json.dumps(
                                                    item,
                                                    indent=2,
                                                    ensure_ascii=False,
                                                ),
                                            )

                    if "otherAxes" in componentParameters and isinstance(
                        componentParameters["otherAxes"], list
                    ):
                        for axis_obj in componentParameters["otherAxes"]:
                            if isinstance(axis_obj, dict):
                                # 檢查軸數據中的有效鍵
                                for key in valid_keys:
                                    if key in axis_obj and isinstance(
                                        axis_obj[key], list
                                    ):
                                        # 處理陣列中的每個元素
                                        for item in axis_obj[key]:
                                            if isinstance(item, dict):
                                                print("-------key: ", key)
                                                print(
                                                    "-------Before: ",
                                                    json.dumps(
                                                        item,
                                                        indent=2,
                                                        ensure_ascii=False,
                                                    ),
                                                )

                                                # 將key改名為dataColumnKey
                                                if "keys" in item:
                                                    item["dataColumnKeys"] = item.pop(
                                                        "keys", None
                                                    )

                                                # 將key改名為dataColumnKey
                                                if "key" in item:
                                                    item["dataColumnKey"] = item.pop(
                                                        "key", None
                                                    )

                                                # 確保width屬性存在
                                                if "width" not in item:
                                                    item["width"] = 1

                                                # 確保color屬性存在
                                                if "color" not in item:
                                                    item["color"] = "basicText"

                                                # 如果是symmetryBars，確保equalsColor屬性存在
                                                if (
                                                    key == "symmetryBars"
                                                    and "equalsColor" not in item
                                                ):
                                                    item["equalsColor"] = "basicText"

                                                print(
                                                    "-------After: ",
                                                    json.dumps(
                                                        item,
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
            print("Migration from Blueprint v3.9 to v3.10 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
