import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.5 to v3.6
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
        return "3.6.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        try:
            for component in subcomponents:
                if not isinstance(component, dict):
                    raise ValueError(
                        f"Invalid component format, expected dict but got: {type(component)}"
                    )

                if "name" not in component:
                    raise KeyError(f"Missing 'name' key in component: {component}")

                if "parameters" not in component:
                    component["parameters"] = {}

                componentParameters = component["parameters"]

                if "source" in componentParameters:
                    source = componentParameters["source"]
                    if isinstance(source, dict):
                        if "name" in source and source["name"] == "Signal":
                            print(f"-------{component['name']}")
                            print(
                                "-------Before: ",
                                json.dumps(
                                    source["name"],
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            )
                            source["name"] = "TWSignal"
                            print(
                                "-------After: ",
                                json.dumps(
                                    source["name"],
                                    indent=2,
                                    ensure_ascii=False,
                                ),
                            )
                    elif isinstance(source, list):
                        for item in source:
                            if isinstance(item, dict):
                                if "name" in item and item["name"] == "Signal":
                                    print(f"-------{component['name']}")
                                    print(
                                        "-------Before: ",
                                        json.dumps(
                                            item["name"],
                                            indent=2,
                                            ensure_ascii=False,
                                        ),
                                    )
                                    item["name"] = "TWSignal"
                                    print(
                                        "-------After: ",
                                        json.dumps(
                                            item["name"],
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
            print("Migration from Blueprint v3.4 to v3.7 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while adding to subcomponents:\n{error_message}"
            )
