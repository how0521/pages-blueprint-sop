import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.23 to v3.24
"""

class Migration(AutoMigration):
    def __init__(self) -> None:
        super().__init__()
        self.page_counter = {}  # 用於追蹤每個「頁面流程」的 pageKey 計數

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
        
        # 2. Custom migration logic
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.24.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件
        """
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

                componentName = component["name"]
                parameters = component.get("parameters", {})

                # Bar_Line_圖表：新增 defaultSortSetting
                if componentName == "Bar_Line_圖表":
                    print(
                        "-------Before migration (Bar_Line_圖表): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )
                    
                    # 取得 primaryKey 的值
                    primary_key = parameters.get("primaryKey", "")
                    
                    # 創建 defaultSortSetting 物件
                    default_sort_setting = {
                        "key": primary_key,
                        "indexOfSortTypeLoop": 1 if primary_key else 0
                    }
                    
                    parameters["defaultSortSetting"] = default_sort_setting
                    
                    print(
                        "-------After migration (Bar_Line_圖表): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                # 通知頁：更改 displayItemTitleInfixText 為 displayItemTitlePostfixText
                if componentName == "通知頁":
                    print(
                        "-------Before migration (通知頁): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )
                    
                    if "displayItemTitleInfixText" in parameters:
                        parameters["displayItemTitlePostfixText"] = parameters.pop("displayItemTitleInfixText")
                    
                    print(
                        "-------After migration (通知頁): ",
                        json.dumps(
                            parameters,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                # 首登流程：更改名稱為「頁面流程」並新增 pageKey
                if componentName == "首登流程":
                    print(
                        "-------Before migration (首登流程): ",
                        json.dumps(
                            component,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )
                    
                    # 更改名稱
                    component["name"] = "頁面流程"
                    
                    # 為每個頁面流程實例創建唯一的計數器
                    component_id = id(component)
                    if component_id not in self.page_counter:
                        self.page_counter[component_id] = 0
                    
                    # 處理 showPages 陣列中的條件
                    if "showPages" in parameters and isinstance(parameters["showPages"], list):
                        for page_item in parameters["showPages"]:
                            if isinstance(page_item, dict):
                                condition_type = page_item.get("conditionType", "")
                                
                                # 將 baseOnFirstNoviceGuide 更改為 baseOnPresent
                                if condition_type == "baseOnFirstNoviceGuide":
                                    page_item["conditionType"] = "baseOnPresent"
                                    condition_type = "baseOnPresent"
                                
                                # 將 baseOnFirstFilter 更改為 baseOnPush
                                if condition_type == "baseOnFirstFilter":
                                    page_item["conditionType"] = "baseOnPush"
                                    condition_type = "baseOnPush"
                                
                                # 只有當 conditionType 不是 baseOnTrial 或 baseOnMarketing 時才添加 pageKey
                                if condition_type not in ["baseOnTrial", "baseOnMarketing"]:
                                    self.page_counter[component_id] += 1
                                    page_number = str(self.page_counter[component_id]).zfill(2)
                                    page_item["pageKey"] = f"showPage{page_number}"
                    
                    print(
                        "-------After migration (頁面流程): ",
                        json.dumps(
                            component,
                            indent=2,
                            ensure_ascii=False,
                        ),
                    )

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            print("Migration from Blueprint v3.23 to v3.24 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )
