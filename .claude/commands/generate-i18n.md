# 語言包字典產生 Skill

根據指定版本的 pages.config.json，更新 `src/i18n/` 內的三個語言包字典。
翻譯「新增的」或「任一語言值為空字串」的 display 參數；已有實際文字內容的舊翻譯全部保留，**空字串不算翻譯，必須補上**。

## 使用方式

```
/generate-i18n <config_file>
```

例如：`/generate-i18n 3.32.0-pages.config.json`

## 參數

用戶輸入的參數：$ARGUMENTS

請將參數解析為 config 檔案名稱（或路徑）。若未提供，預設搜尋目錄下最新的 `*.pages.config.json` 檔案。

## 執行步驟

### 步驟 1：產出需翻譯的 key 清單並寫入 i18n-delta.json

執行以下 Python，同時完成「提取 display 參數」與「找出需補翻譯的 key」兩件事，結果寫入 `i18n-delta.json`（避免 Windows 終端編碼亂碼影響後續翻譯）：

```python
import json

with open('<CONFIG_FILE>', 'r', encoding='utf-8') as f:
    data = json.load(f)

def find_display_params(obj):
    results = []
    if isinstance(obj, dict):
        if 'key' in obj and 'description' in obj and obj['key'].startswith('display'):
            results.append({'key': obj['key'], 'description': obj['description'], 'default': obj.get('default', '')})
        for v in obj.values():
            results.extend(find_display_params(v))
    elif isinstance(obj, list):
        for item in obj:
            results.extend(find_display_params(item))
    return results

params = find_display_params(data)
seen = set()
unique = [p for p in params if not (p['key'] in seen or seen.add(p['key']))]

with open('src/i18n/string-resource_zh-Hant.json', 'r', encoding='utf-8') as f:
    existing_zh_hant = json.load(f)
with open('src/i18n/string-resource_zh-Hans.json', 'r', encoding='utf-8') as f:
    existing_zh_hans = json.load(f)
with open('src/i18n/string-resource_en.json', 'r', encoding='utf-8') as f:
    existing_en = json.load(f)

def is_config_type(description):
    # 描述含「為空則」代表空字串本身就是正確值，不需要翻譯
    return '為空則' in description

def needs_translation(key, description=''):
    if is_config_type(description):
        return False
    missing = key not in existing_zh_hant or key not in existing_zh_hans or key not in existing_en
    empty = (existing_zh_hant.get(key, '') == '' or
             existing_zh_hans.get(key, '') == '' or
             existing_en.get(key, '') == '')
    return missing or empty

new_params = [p for p in unique if needs_translation(p['key'], p.get('description', ''))]

with open('i18n-delta.json', 'w', encoding='utf-8') as f:
    json.dump(new_params, f, ensure_ascii=False, indent=2)

print(f'Total display params: {len(unique)}')
print(f'Keys needing translation: {len(new_params)}')
print('Written to i18n-delta.json')
```

### 步驟 2：讀取 i18n-delta.json

使用 **Read tool**（不是 Bash）讀取 `i18n-delta.json`，取得需翻譯的 key 清單（含 description 和 default）。

若 `new_params` 為空，告知用戶「字典已是最新，無需更新」並結束。

### 步驟 3：根據 description 產出翻譯

針對每個 key，**根據其 description 和 key 名稱語義**，產出三種語言的翻譯：

- **zh-Hant**：繁體中文，參考 description 中的中文描述產出簡短 UI 文案
- **zh-Hans**：簡體中文，從繁體轉換（載入→加载、確認→确认、取消→取消、搜尋→搜索、重新整理→刷新、收合→收起等）
- **en**：英文，根據 key 名稱語義和 description 翻譯

翻譯時注意：
- 這是 UI 文案，要簡短自然，不是直譯 description
- 有 `default` 值的 key 優先用 default 作為 zh-Hant 內容
- 標有 `[多語系]`、`[iOS]`、`[Android]` 的只是說明，翻譯時忽略這些標記
- 按鈕文字要簡短（「確定」不是「確認按鈕」）
- %s、{chatroomName} 等佔位符要原樣保留
- **delta 裡所有 key 都要翻譯**，包括字典內已存在但值為空字串（`""`）的 key，空字串不是翻譯
- description 含「為空則」的配置型參數已在步驟 1 自動排除，不會出現在 delta 裡

### 步驟 4：更新三個字典檔案

將新翻譯 merge 進現有字典並寫回（舊 key 不動）：

```python
import json

new_zh_hant = { ... }  # 步驟 3 產出
new_zh_hans = { ... }
new_en = { ... }

with open('src/i18n/string-resource_zh-Hant.json', 'r', encoding='utf-8') as f:
    zh_hant = json.load(f)
with open('src/i18n/string-resource_zh-Hans.json', 'r', encoding='utf-8') as f:
    zh_hans = json.load(f)
with open('src/i18n/string-resource_en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

zh_hant.update(new_zh_hant)
zh_hans.update(new_zh_hans)
en.update(new_en)

with open('src/i18n/string-resource_zh-Hant.json', 'w', encoding='utf-8') as f:
    json.dump(zh_hant, f, ensure_ascii=False, indent=2)
with open('src/i18n/string-resource_zh-Hans.json', 'w', encoding='utf-8') as f:
    json.dump(zh_hans, f, ensure_ascii=False, indent=2)
with open('src/i18n/string-resource_en.json', 'w', encoding='utf-8') as f:
    json.dump(en, f, ensure_ascii=False, indent=2)

print(f'zh-Hant: {len(zh_hant)} keys')
print(f'zh-Hans: {len(zh_hans)} keys')
print(f'en: {len(en)} keys')
```

### 步驟 5：清理暫存檔並 commit

1. 顯示新增的翻譯給用戶確認（列出每個新 key 的三語翻譯）
2. 刪除暫存的 `i18n-delta.json`
3. 用戶確認後，commit 並推上 GitHub：

```bash
git add src/i18n/
git commit -m "feat: update i18n dictionaries for <CONFIG_VERSION>"
git push origin main
```

## 注意事項

- config 檔案名稱若包含版本號（如 `3.32.0-pages.config.json`），commit message 中的 `<CONFIG_VERSION>` 使用 `3.32.0`
- 翻譯完成後同時更新 config 檔案（複製新版到根目錄，舊版可保留）
