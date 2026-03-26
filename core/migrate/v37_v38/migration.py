import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.7 to v3.8
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
        return "3.8.0"

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

                if (
                    "Bar_Line_圖例" == componentName
                    and "updateParameters" in config[componentName]
                ):
                    componentParameters = component["parameters"]
                    legends = componentParameters.get("legends", [])
                    for legend in legends:
                        if isinstance(legend, dict) and "colors" in legend:
                            colors = legend["colors"]
                            if isinstance(colors, list) and all(
                                isinstance(c, dict) and "color" in c for c in colors
                            ):
                                # 轉換為字串陣列
                                legend["colors"] = [c["color"] for c in colors]

                if (
                    "包含後處理的圖表元件" in config
                    and componentName in config["包含後處理的圖表元件"]["name"]
                ):
                    # 處理包含後處理的圖表元件
                    if "updateParameters" in config["包含後處理的圖表元件"]:
                        componentParameters = component["parameters"]

                        if (
                            "postProcess" in componentParameters
                            and "extendColumns" in componentParameters["postProcess"]
                        ):
                            extendColumns = componentParameters["postProcess"][
                                "extendColumns"
                            ]

                            updated_columns = []

                            print(
                                "-------Before: ",
                                json.dumps(extendColumns, indent=2, ensure_ascii=False),
                            )

                            for column in extendColumns:
                                if "expression" in column:
                                    # 保存原始的 expression 值
                                    original_expression = column["expression"]

                                    # 轉換為新的格式
                                    updated_column = {
                                        "alias": column.get("alias", ""),
                                        "generationMethod": {
                                            "name": "CustomFormula",
                                            "methodParameters": {
                                                "formulaExpression": original_expression
                                            },
                                        },
                                    }
                                    updated_columns.append(updated_column)
                                else:
                                    updated_columns.append(column)

                            # 更新 extendColumns
                            componentParameters["postProcess"][
                                "extendColumns"
                            ] = updated_columns

                            print(
                                "-------After: ",
                                json.dumps(
                                    updated_columns, indent=2, ensure_ascii=False
                                ),
                            )

                # 遞迴處理子元件（subComponents），如果有的話
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents

        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.4 to v3.7 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
