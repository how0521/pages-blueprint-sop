import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.30 to v3.31

1. CMoney自動登入WebView：新增 stateHideTopRedBar
2. 自定義K線圖表（原「產業K線圖表」）：
   - 元件名稱由「產業K線圖表」改為「自定義K線圖表」
   - 參數鍵名 stateIndustryKey 改為 stateTargetKey（值不變）
   - techLines 結構升版，各項目改為含 parameters 的新格式
3. 資訊表格2.0：
   - cells[].contents[] 各項目新增 verticalAlign
   - cells[].contents[] 各項目鍵名 align 改為 horizontalAlign
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

        # 2. Custom migration logic
        result["pages"] = self.find_component_and_update(result["pages"], config)

        return result

    def targetVersion(self) -> str:
        return "3.31.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件

        - 自定義K線圖表（原產業K線圖表）：改名、改鍵名、升版 techLines
        - 資訊表格2.0：cells[].contents[] 各項目新增 verticalAlign、align 改為 horizontalAlign
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

                # 產業K線圖表 → 自定義K線圖表
                if componentName == "產業K線圖表":
                    component["name"] = "自定義K線圖表"
                    print("已將元件名稱從「產業K線圖表」改為「自定義K線圖表」")

                    # stateIndustryKey 鍵名改為 stateTargetKey（值不變）
                    if "stateIndustryKey" in parameters and "stateTargetKey" not in parameters:
                        parameters["stateTargetKey"] = parameters.pop("stateIndustryKey")
                        print("已將參數鍵名 stateIndustryKey 改為 stateTargetKey")

                    # techLines 升版：舊格式項目無 parameters 包裹
                    self._migrate_tech_lines(parameters)

                # 資訊表格2.0：cells[].contents[] 項目處理
                if componentName == "資訊表格2.0":
                    cells = parameters.get("cells", [])
                    if isinstance(cells, list):
                        for cell in cells:
                            if not isinstance(cell, dict):
                                continue
                            contents = cell.get("contents", [])
                            if not isinstance(contents, list):
                                continue
                            for item in contents:
                                if not isinstance(item, dict):
                                    continue
                                # 新增 verticalAlign（若不存在）
                                if "verticalAlign" not in item:
                                    item["verticalAlign"] = "bottom"
                                    print("已新增 verticalAlign 至 資訊表格2.0 contents 項目")
                                # align 改為 horizontalAlign
                                if "align" in item and "horizontalAlign" not in item:
                                    item["horizontalAlign"] = item.pop("align")
                                    print("已將 align 改為 horizontalAlign 於 資訊表格2.0 contents 項目")

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            print("Migration from Blueprint v3.30 to v3.31 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )

    def _migrate_tech_lines(self, parameters: dict):
        """
        將 techLines 從舊格式升版為新格式。
        舊格式：各項目的 type/value/color 在頂層。
        新格式：各項目的屬性移至 parameters 子物件，atmosphere 改為 extraSource。
        """
        tech_lines = parameters.get("techLines", None)
        if not isinstance(tech_lines, list):
            return

        # 判斷是否為舊格式（項目無 parameters 鍵）
        is_old_format = any(
            isinstance(item, dict) and "parameters" not in item
            for item in tech_lines
        )
        if not is_old_format:
            return

        new_tech_lines = []
        for item in tech_lines:
            if not isinstance(item, dict):
                new_tech_lines.append(item)
                continue

            item_type = item.get("type", "")

            if item_type == "ma":
                value = item.get("value")
                color = item.get("color", "")
                display_pattern = f"{value}MA %s" if value is not None else "MA %s"
                new_tech_lines.append({
                    "type": "ma",
                    "parameters": {
                        "value": value,
                        "color": color,
                        "displayPattern": display_pattern,
                        "valueColumn": "收盤價",
                        "formatDigit": 1
                    }
                })
            elif item_type == "atmosphere":
                color = item.get("color", "functional2")
                new_tech_lines.append({
                    "type": "extraSource",
                    "parameters": {
                        "color": color,
                        "displayPattern": "氣氛值 %s",
                        "chartType": "line",
                        "formatDigit": 2,
                        "usesSecondaryAxis": True,
                        "source": {
                            "name": "dtno",
                            "sourceParameters": {
                                "dtnoNum": "126621272",
                                "paramStr": "MTPeriod=0;DTMode=0;DTRange=250;DTOrder=1;MajorTable=M9DK;",
                                "filterNumber": "0"
                            }
                        },
                        "valueColumn": "氣氛值(韭菜叔叔)",
                        "primaryKey": "日期",
                        "dateFormat": "yyyyMMdd"
                    }
                })
            else:
                new_tech_lines.append(item)

        parameters["techLines"] = new_tech_lines
        print("已完成 techLines 升版")
