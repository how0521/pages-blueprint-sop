import json
import os
import traceback

from core.auto_migration import AutoMigration
from core.feature.blueprint_adder import BlueprintAdder

"""
Migration from Blueprint v3.32 to v3.33

1. 自選股、合併表格、Bar_Line_圖表、擴增表格：
   - 參數鍵名 indexOfSortTypeLoop 改為 indexOfSort（值不變）
2. 內容專區模板：
   - 將五個 displayCourseInfoPopup* 參數包裝至 displayCourseInfoPopupContent 物件內
   - 若原本無此五個參數，代入預設文案
"""

# 預設文案（對應 zh-Hant i18n）
_POPUP_DEFAULTS = {
    "displayCourseInfoPopupTitle": "您所在的地區？",
    "displayCourseInfoPopupSubtitle": "將根據地區為您提供此課程的詳細資訊與購買管道",
    "displayCourseInfoPopupTaiwanDomainButtonTitle": "台灣",
    "displayCourseInfoPopupOverseaDomainButtonTitle": "台灣以外",
    "displayCourseInfoPopupCancelButtonTitle": "取消",
}

_POPUP_KEYS = list(_POPUP_DEFAULTS.keys())

# 需要進行 indexOfSortTypeLoop → indexOfSort 改名的元件
_INDEX_OF_SORT_COMPONENTS = {"自選股", "合併表格", "Bar_Line_圖表", "擴增表格"}


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
        return "3.33.0"

    def find_component_and_update(self, subcomponents: list, config: dict) -> list:
        """
        遞迴搜尋並更新元件

        - 自選股、合併表格、Bar_Line_圖表、擴增表格：
            indexOfSortTypeLoop 鍵名改為 indexOfSort（遞迴搜尋整個 parameters）
        - 內容專區模板：
            將五個 displayCourseInfoPopup* 參數包裝至 displayCourseInfoPopupContent 物件內
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

                # 1. indexOfSortTypeLoop → indexOfSort
                if componentName in _INDEX_OF_SORT_COMPONENTS:
                    renamed = self._rename_key_recursive(
                        parameters, "indexOfSortTypeLoop", "indexOfSort"
                    )
                    if renamed:
                        print(f"已將 {componentName} 的 indexOfSortTypeLoop 改為 indexOfSort")

                # 2. 內容專區模板：包裝 displayCourseInfoPopupContent
                if componentName == "內容專區模板":
                    self._wrap_course_info_popup(parameters)

                # 遞迴處理 subComponents
                if "subComponents" in component:
                    self.find_component_and_update(component["subComponents"], config)

            return subcomponents
        except Exception as e:
            print("Migration from Blueprint v3.32 to v3.33 error: ", e)
            error_message = traceback.format_exc()
            raise Exception(
                f"An error occurred while migrating components:\n{error_message}"
            )

    def _rename_key_recursive(self, obj, old_key: str, new_key: str) -> bool:
        """
        遞迴搜尋 dict/list 結構，將所有 old_key 改為 new_key。
        回傳是否有任何改名發生。
        """
        renamed = False
        if isinstance(obj, dict):
            if old_key in obj and new_key not in obj:
                obj[new_key] = obj.pop(old_key)
                renamed = True
            for v in list(obj.values()):
                if self._rename_key_recursive(v, old_key, new_key):
                    renamed = True
        elif isinstance(obj, list):
            for item in obj:
                if self._rename_key_recursive(item, old_key, new_key):
                    renamed = True
        return renamed

    def _wrap_course_info_popup(self, parameters: dict):
        """
        將 displayCourseInfoPopup* 五個平鋪參數包裝至 displayCourseInfoPopupContent 物件。
        若原本不存在則代入預設文案；若已包裝則略過。
        """
        # 已經包裝過則略過
        if "displayCourseInfoPopupContent" in parameters:
            return

        # 從現有 parameters 取出五個欄位（若無則用預設值）
        popup_content = {}
        for key in _POPUP_KEYS:
            if key in parameters:
                popup_content[key] = parameters.pop(key)
            else:
                popup_content[key] = _POPUP_DEFAULTS[key]

        parameters["displayCourseInfoPopupContent"] = popup_content
        print("已將 內容專區模板 的 displayCourseInfoPopup* 包裝至 displayCourseInfoPopupContent")
