import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.25 to v3.26

本次版本優化語音聊天室在「網路不穩定情境」下的使用體驗：
1. 新增語言參數（display 相關）至「語音聊天室入口」與「語音聊天室頁」
2. 新增 presentAudioChatRoomDeepLink（基於現有 shareDeepLink 加上 stateShouldAutoPresentAudioChatRoom）
3. 新增 stateShouldAutoPresentAudioChatRoom 狀態參數
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

        # 2. Custom migration logic for presentAudioChatRoomDeepLink
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.26.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件

        針對「語音聊天室頁」：
        - 將 shareDeepLink 加上 &boolean-stateShouldAutoPresentAudioChatRoom=true
          產生 presentAudioChatRoomDeepLink
        """
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

                componentName = component["name"]
                parameters = component.get("parameters", {})

                # 語音聊天室頁：產生 presentAudioChatRoomDeepLink
                if componentName == "語音聊天室頁":
                    print(
                        "-------Before migration (語音聊天室頁): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                    # 將 displayNetworkAbnormalText 與 stateShouldAutoPresentAudioChatRoom 放入 miniBarSetting
                    if "miniBarSetting" not in parameters:
                        parameters["miniBarSetting"] = {}

                    parameters["miniBarSetting"]["displayNetworkAbnormalText"] = "{{displayNetworkAbnormalText}}"
                    parameters["miniBarSetting"]["stateShouldAutoPresentAudioChatRoom"] = "{{stateShouldAutoPresentAudioChatRoom}}"

                    share_deep_link = parameters.get("shareDeepLink", "")
                    if share_deep_link:
                        parameters["miniBarSetting"]["presentAudioChatRoomDeepLink"] = (
                            share_deep_link + "&boolean-stateShouldAutoPresentAudioChatRoom=true"
                        )
                        print(
                            f"-------已產生 miniBarSetting.presentAudioChatRoomDeepLink: {parameters['miniBarSetting']['presentAudioChatRoomDeepLink']}"
                        )
                    else:
                        print("-------警告：找不到 shareDeepLink，無法產生 presentAudioChatRoomDeepLink")

                    print(
                        "-------After migration (語音聊天室頁): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            print("Migration from Blueprint v3.25 to v3.26 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )
