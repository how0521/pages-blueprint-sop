import json
import os

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.35 to v3.36
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

        if result.get('pages'):
            self.find_component_and_update(result['pages'], config)

        return result

    def targetVersion(self) -> str:
        return "3.36.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        for component in subcomponents:
            if not isinstance(component, dict):
                continue
            if 'name' not in component:
                continue

            if component['name'] == '影音直播列表':
                params = component.get('parameters', {})
                params.pop('streamEndedBroadcasterLeft', None)

            if 'subComponents' in component:
                self.find_component_and_update(component['subComponents'], config)

        return subcomponents
