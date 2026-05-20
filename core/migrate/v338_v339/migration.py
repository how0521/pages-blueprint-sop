import json
import os
import sys

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.38 to v3.39
"""


class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()

    def run(self, blueprint: dict) -> dict:
        print("現在開始 migrate 到 ", self.targetVersion())
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(current_dir, "config.json")

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

        blueprint_adder = BlueprintAdder()
        result = blueprint_adder.add_to_blueprint(blueprint, config=config)

        market = self._ask_market()
        target_name = "USAddInfoDtno" if market == "US" else "TWAddInfoDtno"
        self._rename_add_info_dtno(result.get("pages", []), target_name)

        return result

    def _ask_market(self) -> str:
        if not sys.stdin.isatty():
            return "TW"
        while True:
            answer = input("請問產品是台股還是美股？(輸入 TW 或 US): ").strip().upper()
            if answer in ("TW", "US"):
                return answer
            print("請輸入 TW（台股）或 US（美股）")

    def _rename_add_info_dtno(self, subcomponents: list, target_name: str) -> None:
        for component in subcomponents:
            if not isinstance(component, dict):
                continue
            params = component.get("parameters", {})
            source = params.get("source")
            if isinstance(source, dict) and source.get("name") == "AddInfoDtno":
                source["name"] = target_name
            elif isinstance(source, list):
                for item in source:
                    if isinstance(item, dict) and item.get("name") == "AddInfoDtno":
                        item["name"] = target_name
            if "subComponents" in component:
                self._rename_add_info_dtno(component["subComponents"], target_name)

    def targetVersion(self) -> str:
        return "3.39.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        return subcomponents
