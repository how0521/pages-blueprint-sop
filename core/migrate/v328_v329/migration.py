import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.28 to v3.29

1. 美股四大指數資訊卡片：新增 indexItems（道瓊指數、S&P500、那斯達克、費半指數）
2. 美股事件展示板：新增 displayEconomicTabTitle、displayFinancialReportTabTitle、displayFinancialReportEmpty
3. 語音聊天室入口：新增 displayRecordingReminder
4. 語音聊天室頁：新增 displayHostEmojiBarTitle、displayEmojiGuideToastText
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

        # 2. No custom migration logic needed for this version
        # Simply return the result without any modifications

        return result

    def targetVersion(self) -> str:
        return "3.29.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件

        NOTE: No custom migration logic is needed for v3.28 to v3.29,
        so this method simply passes through without modifications.
        """
        pass
