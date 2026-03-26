import traceback


def recursive_add(json, config):
    """
    遞迴地新增或擴展 JSON 結構，根據 config 的內容進行新增或填充。

    :param json: 要新增或擴展的 JSON 資料結構（字典或列表）
    :param config: 用於新增的配置（字典），格式如下：
        1. 一般新增（無條件判斷）：
            {
                "ComponentName": {  # 元件名稱
                    "parameters": {  # 要新增的參數
                        "key1": "value1",
                        "key2": {
                            "subkey1": "subvalue1"
                        }
                    }
                }
            }

        2. 使用 switch-case 判斷新增：
            {
                "switch": "parameterKey",  # 根據 JSON 中的某個 key 進行條件判斷
                "cases": {  # 定義條件對應的新增內容
                    "caseValue1": {  # 當 JSON["parameterKey"] == "caseValue1"
                        "parameters": {
                            "key1": "value1_for_case1"
                        }
                    },
                    "caseValue2": {  # 當 JSON["parameterKey"] == "caseValue2"
                        "parameters": {
                            "key1": "value1_for_case2"
                        }
                    }
                }
            }
    """
    # 如果 config 中有 'switch'，則進行條件新增
    if 'switch' in config.keys():
        print(f"switch: {config['switch']}")
        # 取得 switch 的 key 和對應的 cases
        nameKey = config['switch']
        cases = config['cases']
        # 進行 switch-case 判斷
        if nameKey in json.keys():
            caseKey = json[nameKey]
            if caseKey in cases.keys():
                print(f"case: {caseKey}")
                case = cases[caseKey]
                if isinstance(case, dict) and isinstance(json, dict):
                    recursive_add(json, case)
    else:
        # 如果 config 中沒有 'switch'，則進行一般的新增
        for key in config.keys():
            print(f"key: {key}")
            # 如果 key 存在於 json 中，且 config 的值為字典
            if key in json.keys():
                if isinstance(config[key], dict):
                    if isinstance(json[key], dict):
                        print(f"into: {key}")
                        # 遞迴進入下一層
                        recursive_add(json[key], config[key])
                    if isinstance(json[key], list):
                        for i in range(len(json[key])):
                            recursive_add(json[key][i], config[key])
                else:
                    # 如果 config 的值不是字典，則直接新增或覆蓋 json 的 key
                    json[key] = config[key]
            else:
                if isinstance(config[key], dict):
                    json[key] = {}
                    recursive_add(json[key], config[key])
                else:
                    # 如果 key 不存在於 json 中，則新增 key
                    json[key] = config[key]


class BlueprintAdder:
    """
    BlueprintAdder 類別

    此類別用於根據給定的配置（config），遞迴地向藍圖（blueprint）中新增資料。
    它會檢查每個元件的名稱（name），並根據配置新增元件的參數（parameters）或子元件（subComponents）。

    配置（config）的格式範例：
        1. 一般新增（無條件判斷）：
            {
                "ComponentName": {  # 元件名稱
                    "parameters": {  # 要新增的參數
                        "key1": "value1",
                        "key2": {
                            "subkey1": "subvalue1"
                        }
                    }
                }
            }

        2. 使用 switch-case 判斷新增：
            {
                "switch": "parameterKey",  # 根據 JSON 中的某個 key 進行條件判斷
                "cases": {  # 定義條件對應的新增內容
                    "caseValue1": {  # 當 JSON["parameterKey"] == "caseValue1"
                        "parameters": {
                            "key1": "value1_for_case1"
                        }
                    },
                    "caseValue2": {  # 當 JSON["parameterKey"] == "caseValue2"
                        "parameters": {
                            "key1": "value1_for_case2"
                        }
                    }
                }
            }
    """

    def __init__(self):
        pass

    def add_to_blueprint(self, blueprint: dict, config: dict) -> dict:
        """
        根據配置向藍圖新增資料的主方法。

        :param blueprint: 藍圖資料結構（字典)
        :param config: 配置資料結構，用於新增資料，格式如下：
            1. 一般新增：
                {
                    "ComponentName": {
                        "parameters": {
                            "key1": "new_value1",
                            "key3": "new_value3"
                        }
                    }
                }
            2. 使用 switch-case 判斷新增：
                {
                    "switch": "parameterKey",
                    "cases": {
                        "caseValue1": {
                            "parameters": {
                                "key1": "value1_for_case1"
                            }
                        },
                        "caseValue2": {
                            "parameters": {
                                "key1": "value1_for_case2"
                            }
                        }
                    }
                }
        :return: 新增資料後的藍圖
        """
        self.add_to_subcomponents(blueprint['pages'], config)
        return blueprint

    def add_to_subcomponents(self, subcomponents, config: dict):
        """
        遞迴地向藍圖中的子元件（subComponents）新增資料。

        :param subcomponents: 子元件列表，包含每個元件的名稱與參數
        :param config: 配置資料結構，用於新增子元件資料，格式如下：
            1. 一般新增：
                {
                    "ComponentName": {
                        "parameters": {
                            "key1": "new_value1",
                            "key3": "new_value3"
                        }
                    }
                }
            2. 使用 switch-case 判斷新增：
                {
                    "switch": "parameterKey",
                    "cases": {
                        "caseValue1": {
                            "parameters": {
                                "key1": "value1_for_case1"
                            }
                        },
                        "caseValue2": {
                            "parameters": {
                                "key1": "value1_for_case2"
                            }
                        }
                    }
                }
        """
        try:
            for component in subcomponents:
                # 確保 component 為字典，並且包含必要的鍵
                if not isinstance(component, dict):
                    raise ValueError(
                        f"Invalid component format, expected dict but got: {type(component)}")
                if 'name' not in component:
                    raise KeyError(f"Missing 'name' key in component: {component}")

                # 如果 'parameters' 不存在，則新增為空字典
                if 'parameters' not in component:
                    component['parameters'] = {}

                # 確認 component['name'] 是否在 config 中
                componentName = component['name']
                if componentName in config.keys():
                    if 'parameters' in config[componentName]:
                        componentParameters = component['parameters']
                        parameters = config[componentName]['parameters']
                        print(f"Adding to component: {componentName}")
                        recursive_add(componentParameters, parameters)

                # 遞迴處理子元件（subComponents），如果有的話
                if 'subComponents' in component:
                    self.add_to_subcomponents(component['subComponents'], config)

        except Exception:
            # 捕捉異常並打印完整的錯誤堆疊資訊
            error_message = traceback.format_exc()
            raise Exception(f"An error occurred while adding to subcomponents:\n{error_message}")
