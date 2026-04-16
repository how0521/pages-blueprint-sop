/**
 * Migration registry — JavaScript port of the Python migration chain.
 * Supports v2.7 (index 16) through v3.30 (index 47).
 * Pre-v2.7 migrations are pass-throughs (not ported).
 */
import { addToBlueprint } from './blueprintAdder.js';

// Config imports (only for migrations that have non-empty config.json)
import configV3_0 from './configs/v3_0.json';
import configV3_1 from './configs/v3_1.json';
import configV3_2 from './configs/v3_2.json';
import configV3_3 from './configs/v3_3.json';
import configV3_4 from './configs/v3_4.json';
import configV3_7 from './configs/v3_7.json';
import configV3_8 from './configs/v3_8.json';
import configV3_13 from './configs/v3_13.json';
import configV3_16 from './configs/v3_16.json';
import configV3_18 from './configs/v3_18.json';
import configV3_19 from './configs/v3_19.json';
import configV3_20 from './configs/v3_20.json';
import configV3_21 from './configs/v3_21.json';
import configV3_23 from './configs/v3_23.json';
import configV3_26 from './configs/v3_26.json';
import configV3_28 from './configs/v3_28.json';
import configV3_29 from './configs/v3_29.json';
import configV3_30 from './configs/v3_30.json';
import configV3_31 from './configs/v3_31.json';
import configV3_32 from './configs/v3_32.json';

// ─── Pass-through (no-op) ────────────────────────────────────────────────────
const passThrough = (bp) => bp;

// ─── v2.7 → v3.0 ────────────────────────────────────────────────────────────
function migrateToV3_0(blueprint) {
  addToBlueprint(blueprint, configV3_0);
  if (blueprint.pages) {
    findAndUpdateV3_0(blueprint.pages, configV3_0);
  }
  return blueprint;
}

function findAndUpdateV3_0(subcomponents, config) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;
    if (componentName in config) {
      // Special handling for K線副圖 updateParameters
      if (
        componentName === 'K線副圖' &&
        config[componentName].updateParameters
      ) {
        const params = component.parameters;
        if (params && params.typeSettings) {
          const updateContents = config[componentName].updateParameters.charts || [];
          const typeToDisplay = {};
          for (const c of updateContents) {
            if (c.type && c.displayTitle) {
              typeToDisplay[c.type] = c.displayTitle;
            }
          }
          for (const typeSetting of params.typeSettings) {
            if (typeSetting.charts && Array.isArray(typeSetting.charts)) {
              if (typeSetting.charts.every((item) => typeof item === 'string')) {
                typeSetting.charts = typeSetting.charts.map((chartType) => ({
                  type: chartType,
                  displayTitle: typeToDisplay[chartType] || chartType,
                }));
              }
            }
          }
        }
      }
    }

    if (component.subComponents) {
      findAndUpdateV3_0(component.subComponents, config);
    }
  }
  return subcomponents;
}

// ─── v3.0 → v3.1  (config only) ─────────────────────────────────────────────
function migrateToV3_1(blueprint) {
  return addToBlueprint(blueprint, configV3_1);
}

// ─── v3.1 → v3.2  (config only) ─────────────────────────────────────────────
function migrateToV3_2(blueprint) {
  return addToBlueprint(blueprint, configV3_2);
}

// ─── v3.2 → v3.3 ────────────────────────────────────────────────────────────
function migrateToV3_3(blueprint) {
  addToBlueprint(blueprint, configV3_3);
  if (blueprint.pages) findAndUpdateV3_3(blueprint.pages, configV3_3);
  return blueprint;
}

function findAndUpdateV3_3(subcomponents, config) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;
    if (componentName in config && config[componentName].updateParameters) {
      const params = component.parameters;
      if (params && params.highlight && Array.isArray(params.highlight.board)) {
        const updateParameters = config[componentName].updateParameters;
        for (const boardElement of params.highlight.board) {
          if ('valueKey' in boardElement) {
            const textFormat = { ...updateParameters.textFormat };
            textFormat.args = [boardElement.valueKey];
            boardElement.textFormat = textFormat;
            delete boardElement.valueKey;
          }
        }
      }
    }

    if (component.subComponents) {
      findAndUpdateV3_3(component.subComponents, config);
    }
  }
  return subcomponents;
}

// ─── v3.3 → v3.4 ────────────────────────────────────────────────────────────
function migrateToV3_4(blueprint) {
  addToBlueprint(blueprint, configV3_4);
  if (blueprint.pages) findAndUpdateV3_4(blueprint.pages, configV3_4);
  return blueprint;
}

function findAndUpdateV3_4(subcomponents, config) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;
    if (
      componentName === '資訊展示板' &&
      config[componentName] &&
      config[componentName].updateParameters
    ) {
      const params = component.parameters;
      if (!params || !('info' in params)) {
        // skip
      } else {
        const updateParameters = config[componentName].updateParameters;
        const contents = [];
        for (const infoElement of params.info) {
          const numberLineImageSettings = [];
          for (const stringToImage of infoElement.stringToImage || []) {
            const setting = { ...updateParameters.contents.numberLineImageSettings };
            setting.left = stringToImage.value;
            setting.right = stringToImage.value;
            setting.image = stringToImage.imageRes;
            numberLineImageSettings.push(setting);
          }
          contents.push({
            numberLineImageSettings,
            columnKey: infoElement.target,
          });
        }
        params.contents = contents;
        delete params.info;
      }
    }

    if (component.subComponents) {
      findAndUpdateV3_4(component.subComponents, config);
    }
  }
  return subcomponents;
}

// ─── v3.4 → v3.5  (pass-through, no custom migration) ───────────────────────
const migrateToV3_5 = passThrough;

// ─── v3.5 → v3.6 ────────────────────────────────────────────────────────────
function migrateToV3_6(blueprint) {
  // config for v3.6 is empty, no BlueprintAdder needed
  if (blueprint.pages) findAndUpdateV3_6(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_6(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;
    if ('source' in params) {
      const source = params.source;
      if (typeof source === 'object' && source !== null && !Array.isArray(source)) {
        if (source.name === 'Signal') source.name = 'TWSignal';
      } else if (Array.isArray(source)) {
        for (const item of source) {
          if (typeof item === 'object' && item !== null && item.name === 'Signal') {
            item.name = 'TWSignal';
          }
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_6(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.6 → v3.7 ────────────────────────────────────────────────────────────
function migrateToV3_7(blueprint) {
  addToBlueprint(blueprint, configV3_7);
  if (blueprint.pages) findAndUpdateV3_7(blueprint.pages, configV3_7);
  return blueprint;
}

function findAndUpdateV3_7(subcomponents, config) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;
    if (
      componentName === '自訂導覽列' &&
      config[componentName] &&
      config[componentName].updateParameters
    ) {
      const updateParameters = config[componentName].updateParameters;
      const targetKeys = ['centerItem', 'leftItems', 'rightItems'];

      const result = [];
      for (const key of targetKeys) {
        const value = component.parameters[key];
        if (!value) continue;
        if (typeof value === 'object' && !Array.isArray(value)) {
          if (value.name === 'Share' || value.name === 'Redirect') result.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object' && (item.name === 'Share' || item.name === 'Redirect')) {
              result.push(item);
            }
          }
        }
      }

      for (const item of result) {
        if (!item.parameters) item.parameters = {};
        if (item.name === 'Share') {
          if (!('deepLink' in item.parameters)) {
            item.parameters.deepLink = item.parameters.deepLinkFormat;
          }
          item.parameters.deepLinkStates = updateParameters.deepLinkStates;
          delete item.parameters.targetType;
          delete item.parameters.stateCommKey;
          delete item.parameters.deepLinkFormat;
        } else if (item.name === 'Redirect') {
          if (!('redirectMode' in item.parameters)) {
            item.parameters.redirectMode = 'navigation';
          }
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_7(component.subComponents, config);
  }
  return subcomponents;
}

// ─── v3.7 → v3.8 ────────────────────────────────────────────────────────────
function migrateToV3_8(blueprint) {
  addToBlueprint(blueprint, configV3_8);
  if (blueprint.pages) findAndUpdateV3_8(blueprint.pages, configV3_8);
  return blueprint;
}

function findAndUpdateV3_8(subcomponents, config) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;

    // Bar_Line_圖例: convert colors from object array to string array
    if (
      componentName === 'Bar_Line_圖例' &&
      config[componentName] &&
      config[componentName].updateParameters
    ) {
      const params = component.parameters;
      const legends = params.legends || [];
      for (const legend of legends) {
        if (typeof legend === 'object' && Array.isArray(legend.colors)) {
          if (legend.colors.every((c) => typeof c === 'object' && 'color' in c)) {
            legend.colors = legend.colors.map((c) => c.color);
          }
        }
      }
    }

    // 包含後處理的圖表元件: convert expression to CustomFormula
    const postProcessConfig = config['包含後處理的圖表元件'];
    if (
      postProcessConfig &&
      Array.isArray(postProcessConfig.name) &&
      postProcessConfig.name.includes(componentName) &&
      postProcessConfig.updateParameters
    ) {
      const params = component.parameters;
      if (params.postProcess && Array.isArray(params.postProcess.extendColumns)) {
        params.postProcess.extendColumns = params.postProcess.extendColumns.map((column) => {
          if ('expression' in column) {
            return {
              alias: column.alias || '',
              generationMethod: {
                name: 'CustomFormula',
                methodParameters: {
                  formulaExpression: column.expression,
                },
              },
            };
          }
          return column;
        });
      }
    }

    if (component.subComponents) findAndUpdateV3_8(component.subComponents, config);
  }
  return subcomponents;
}

// ─── v3.8 → v3.9  (config only, empty config) ───────────────────────────────
const migrateToV3_9 = passThrough;

// ─── v3.9 → v3.10 ───────────────────────────────────────────────────────────
function migrateToV3_10(blueprint) {
  // config for v3.10 is empty
  if (blueprint.pages) findAndUpdateV3_10(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_10(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === 'Bar_Line_圖表') {
      const params = component.parameters;
      const validKeys = ['lines', 'bars', 'symmetryBars', 'riverLines'];

      const processAxisItems = (axisData) => {
        for (const key of validKeys) {
          if (axisData[key] && Array.isArray(axisData[key])) {
            for (const item of axisData[key]) {
              if (typeof item !== 'object' || item === null) continue;
              if ('keys' in item) { item.dataColumnKeys = item.keys; delete item.keys; }
              if ('key' in item) { item.dataColumnKey = item.key; delete item.key; }
              if (!('width' in item)) item.width = 1;
              if (!('color' in item)) item.color = 'basicText';
              if (key === 'symmetryBars' && !('equalsColor' in item)) item.equalsColor = 'basicText';
            }
          }
        }
      };

      if (params.rightAxis) processAxisItems(params.rightAxis);
      if (params.leftAxis) processAxisItems(params.leftAxis);
      if (Array.isArray(params.otherAxes)) {
        for (const axisObj of params.otherAxes) {
          if (typeof axisObj === 'object') processAxisItems(axisObj);
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_10(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.10 → v3.11 ──────────────────────────────────────────────────────────
function migrateToV3_11(blueprint) {
  // config for v3.11 is empty/none
  if (blueprint.pages) findAndUpdateV3_11(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_11(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '資訊展示板') {
      const params = component.parameters;
      if (!('titleSetting' in params) && !('contentSetting' in params)) {
        const oldTitle = params.title;
        const oldContents = params.contents || [];
        const source = params.source || [];

        const titleSetting = { displayText: oldTitle };
        if ('uuidRedirect' in params) titleSetting.uuidRedirect = params.uuidRedirect;

        const newContents = oldContents.map((item) => ({
          numberLineImageParams: {
            numberLineImageSettings: item.numberLineImageSettings,
            columnKey: item.columnKey,
          },
        }));

        const contentSetting = { contents: newContents };
        if ('uuidRedirect' in params) contentSetting.uuidRedirect = params.uuidRedirect;

        component.parameters = { titleSetting, contentSetting, source };
      }
    }

    if (component.subComponents) findAndUpdateV3_11(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.11 → v3.12 (pass-through) ───────────────────────────────────────────
const migrateToV3_12 = passThrough;

// ─── v3.12 → v3.13 ──────────────────────────────────────────────────────────
function migrateToV3_13(blueprint) {
  addToBlueprint(blueprint, configV3_13);
  if (blueprint.pages) findAndUpdateV3_13(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_13(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    if (component.name === '自選股') {
      if ('source' in params && !('readSources' in params)) {
        params.readSources = params.source;
        delete params.source;
      }
    }

    if (component.name === '雷達圖') {
      if ('source' in params && !('readSources' in params)) {
        const oldSource = params.source;
        delete params.source;
        params.readSources = [oldSource];

        const dataColors = params.dataColors || ['basicRise'];
        delete params.dataColors;
        delete params.dataCount;
        delete params.isFirstDataOnTop;

        if (!('dataSettings' in params)) {
          params.dataSettings = dataColors.map((color) => ({ defaultColor: color }));
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_13(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.13 → v3.14 ──────────────────────────────────────────────────────────
function migrateToV3_14(blueprint) {
  // config for v3.14 is empty
  if (blueprint.pages) findAndUpdateV3_14(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_14(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '雷達圖') {
      const params = component.parameters;
      if (params) {
        const readSourceSetting = {};
        const keysToMove = ['stateCommKey', 'primaryKey', 'readSources', 'keyMaps', 'postProcess'];
        for (const key of keysToMove) {
          if (key in params) {
            if (key === 'readSources') {
              readSourceSetting.sources = params[key];
            } else {
              readSourceSetting[key] = params[key];
            }
            delete params[key];
          }
        }
        if (Object.keys(readSourceSetting).length > 0) {
          params.readSourceSetting = readSourceSetting;
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_14(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.14 → v3.15 (pass-through) ───────────────────────────────────────────
const migrateToV3_15 = passThrough;

// ─── v3.15 → v3.16 ──────────────────────────────────────────────────────────
function migrateToV3_16(blueprint) {
  addToBlueprint(blueprint, configV3_16);
  if (blueprint.pages) findAndUpdateV3_16(blueprint.pages);
  return blueprint;
}

function migrateTableSetting(tableSetting) {
  if (!tableSetting || typeof tableSetting !== 'object') return;
  const columns = tableSetting.columns;
  if (!Array.isArray(columns)) return;
  for (const column of columns) {
    if (typeof column !== 'object' || column === null) continue;
    const content = column.content;
    if (!content || typeof content !== 'object') continue;
    if (content.name === '數線型數值欄位') {
      const params = content.parameters;
      if (params && 'formatDigits' in params && !('floatFormat' in params)) {
        const digitCount = params.formatDigits;
        delete params.formatDigits;
        params.floatFormat = { digitCount, roundingMode: 'round' };
      }
    }
  }
}

function findAndUpdateV3_16(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;
    if (params.tableSetting) migrateTableSetting(params.tableSetting);

    if (component.subComponents) findAndUpdateV3_16(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.16 → v3.17 ──────────────────────────────────────────────────────────
function migrateToV3_17(blueprint) {
  // config for v3.17 is empty
  if (blueprint.pages) findAndUpdateV3_17(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_17(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '狀態發送器') {
      const params = component.parameters;
      const states = params.states;
      if (Array.isArray(states)) {
        for (const state of states) {
          if (typeof state === 'object' && state !== null && !('type' in state)) {
            state.type = 'string';
          }
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_17(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.17 → v3.18 (config only) ─────────────────────────────────────────────
function migrateToV3_18(blueprint) {
  return addToBlueprint(blueprint, configV3_18);
}

// ─── v3.18 → v3.19 ──────────────────────────────────────────────────────────
function migrateToV3_19(blueprint) {
  addToBlueprint(blueprint, configV3_19);
  if (blueprint.pages) findAndUpdateV3_19(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_19(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '購買頁') {
      const params = component.parameters;
      if ('uuidRedirect' in params) {
        params.uuidRedirectToWeb = params.uuidRedirect;
        delete params.uuidRedirect;
      }
      for (const key of ['title', 'hasBackKey', 'purchaseBannerImage', 'promotionImage']) {
        delete params[key];
      }
    }

    if (component.subComponents) findAndUpdateV3_19(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.19 → v3.20 ──────────────────────────────────────────────────────────
function migrateToV3_20(blueprint) {
  addToBlueprint(blueprint, configV3_20);
  if (blueprint.pages) findAndUpdateV3_20(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_20(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (['社團專區', '作者專區/看板全文頁'].includes(component.name)) {
      const params = component.parameters;
      if ('shareDeepLinkFormat' in params) {
        params.shareDeepLink = params.shareDeepLinkFormat;
        delete params.shareDeepLinkFormat;
      }
    }

    if (component.subComponents) findAndUpdateV3_20(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.20 → v3.21 (config only) ─────────────────────────────────────────────
function migrateToV3_21(blueprint) {
  return addToBlueprint(blueprint, configV3_21);
}

// ─── v3.21 → v3.22 (pass-through) ───────────────────────────────────────────
const migrateToV3_22 = passThrough;

// ─── v3.22 → v3.23 ──────────────────────────────────────────────────────────
function migrateToV3_23(blueprint) {
  addToBlueprint(blueprint, configV3_23);
  if (blueprint.pages) findAndUpdateV3_23(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_23(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '自訂導覽列') {
      const params = component.parameters;

      const addToCollection = (item) => {
        if (typeof item === 'object' && item !== null && item.name === 'Collection') {
          if (!item.parameters) item.parameters = {};
          item.parameters.displayAddGroupDefaultNameText = '{{displayAddGroupDefaultNameText}}';
        }
      };

      if (params.centerItem) addToCollection(params.centerItem);
      if (Array.isArray(params.rightItems)) params.rightItems.forEach(addToCollection);
      if (Array.isArray(params.leftItems)) params.leftItems.forEach(addToCollection);
    }

    if (component.subComponents) findAndUpdateV3_23(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.23 → v3.24 ──────────────────────────────────────────────────────────
function migrateToV3_24(blueprint) {
  // config for v3.24 is empty
  const pageCounter = {};
  if (blueprint.pages) findAndUpdateV3_24(blueprint.pages, pageCounter);
  return blueprint;
}

function findAndUpdateV3_24(subcomponents, pageCounter) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    if (component.name === 'Bar_Line_圖表') {
      const primaryKey = params.primaryKey || '';
      params.defaultSortSetting = {
        key: primaryKey,
        indexOfSortTypeLoop: primaryKey ? 1 : 0,
      };
    }

    if (component.name === '通知頁') {
      if ('displayItemTitleInfixText' in params) {
        params.displayItemTitlePostfixText = params.displayItemTitleInfixText;
        delete params.displayItemTitleInfixText;
      }
    }

    if (component.name === '首登流程') {
      component.name = '頁面流程';
      const componentId = component;
      if (!pageCounter.has) pageCounter[componentId] = 0;
      // Use a string key since JS object references aren't stable across calls
      // Use a WeakMap-like approach with a counter index instead
      if (typeof pageCounter._count === 'undefined') pageCounter._count = 0;
      pageCounter._count++;
      const counterId = pageCounter._count;
      let localCount = 0;

      if (Array.isArray(params.showPages)) {
        for (const pageItem of params.showPages) {
          if (typeof pageItem !== 'object' || pageItem === null) continue;

          if (pageItem.conditionType === 'baseOnFirstNoviceGuide') {
            pageItem.conditionType = 'baseOnPresent';
          }
          if (pageItem.conditionType === 'baseOnFirstFilter') {
            pageItem.conditionType = 'baseOnPush';
          }

          if (!['baseOnTrial', 'baseOnMarketing'].includes(pageItem.conditionType)) {
            localCount++;
            pageItem.pageKey = `showPage${String(localCount).padStart(2, '0')}`;
          }
        }
      }
    }

    if (component.subComponents) findAndUpdateV3_24(component.subComponents, pageCounter);
  }
  return subcomponents;
}

// ─── v3.24 → v3.25 (pass-through) ───────────────────────────────────────────
const migrateToV3_25 = passThrough;

// ─── v3.25 → v3.26 ──────────────────────────────────────────────────────────
function migrateToV3_26(blueprint) {
  addToBlueprint(blueprint, configV3_26);
  if (blueprint.pages) findAndUpdateV3_26(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_26(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    if (component.name === '語音聊天室頁') {
      const params = component.parameters;
      if (!params.miniBarSetting) params.miniBarSetting = {};
      params.miniBarSetting.displayNetworkAbnormalText = '{{displayNetworkAbnormalText}}';
      params.miniBarSetting.stateShouldAutoPresentAudioChatRoom = '{{stateShouldAutoPresentAudioChatRoom}}';

      const shareDeepLink = params.shareDeepLink || '';
      if (shareDeepLink) {
        params.miniBarSetting.presentAudioChatRoomDeepLink =
          shareDeepLink + '&boolean-stateShouldAutoPresentAudioChatRoom=true';
      }
    }

    if (component.subComponents) findAndUpdateV3_26(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.26 → v3.27 (pass-through) ───────────────────────────────────────────
const migrateToV3_27 = passThrough;

// ─── v3.27 → v3.28 ──────────────────────────────────────────────────────────
function migrateToV3_28(blueprint) {
  addToBlueprint(blueprint, configV3_28);
  if (blueprint.pages) findAndUpdateV3_28(blueprint.pages);
  return blueprint;
}

function findAndUpdateV3_28(subcomponents) {
  // Remove all 聊天室導覽列 components at this level
  for (let i = subcomponents.length - 1; i >= 0; i--) {
    if (
      typeof subcomponents[i] === 'object' &&
      subcomponents[i] !== null &&
      subcomponents[i].name === '聊天室導覽列'
    ) {
      subcomponents.splice(i, 1);
    }
  }

  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    if (component.name === '社團聊天室') {
      delete params.stateNextStartWeight;
    }

    if (component.name === '美股事件展示板') {
      delete params.displayLoading;
      delete params.displayEmpty;
    }

    if (component.subComponents) findAndUpdateV3_28(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.28 → v3.29 (config only) ─────────────────────────────────────────────
function migrateToV3_29(blueprint) {
  return addToBlueprint(blueprint, configV3_29);
}

// ─── v3.29 → v3.30 ──────────────────────────────────────────────────────────
function migrateToV3_30(blueprint) {
  addToBlueprint(blueprint, configV3_30);
  if (blueprint.pages) findAndUpdateV3_30(blueprint.pages);
  return blueprint;
}

function migrateTechLines(parameters) {
  const techLines = parameters.techLines;
  if (!Array.isArray(techLines)) return;

  // Only migrate if old format (items without parameters key)
  const isOldFormat = techLines.some(
    (item) => typeof item === 'object' && item !== null && !('parameters' in item)
  );
  if (!isOldFormat) return;

  parameters.techLines = techLines.map((item) => {
    if (typeof item !== 'object' || item === null) return item;

    if (item.type === 'ma') {
      const { value, color } = item;
      return {
        type: 'ma',
        parameters: {
          value,
          color,
          displayPattern: `${value}MA %s`,
          valueColumn: '收盤價',
          formatDigit: 1,
        },
      };
    }

    if (item.type === 'atmosphere') {
      return {
        type: 'extraSource',
        parameters: {
          color: item.color || 'functional2',
          displayPattern: '氣氛值 %s',
          chartType: 'line',
          formatDigit: 2,
          usesSecondaryAxis: true,
          source: {
            name: 'dtno',
            sourceParameters: {
              dtnoNum: '126621272',
              paramStr: 'MTPeriod=0;DTMode=0;DTRange=250;DTOrder=1;MajorTable=M9DK;',
              filterNumber: '0',
            },
          },
          valueColumn: '氣氛值(韭菜叔叔)',
          primaryKey: '日期',
          dateFormat: 'yyyyMMdd',
        },
      };
    }

    return item;
  });
}

function findAndUpdateV3_30(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    // 產業K線圖表 → 自定義K線圖表
    if (component.name === '產業K線圖表') {
      component.name = '自定義K線圖表';

      // stateIndustryKey 鍵名改為 stateTargetKey（值不變）
      if ('stateIndustryKey' in params && !('stateTargetKey' in params)) {
        params.stateTargetKey = params.stateIndustryKey;
        delete params.stateIndustryKey;
      }

      // techLines 升版
      migrateTechLines(params);
    }

    if (component.subComponents) findAndUpdateV3_30(component.subComponents);
  }
  return subcomponents;
}

// ─── v3.30 → v3.31 ──────────────────────────────────────────────────────────
function findAndUpdateV3_31(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    // 資訊表格2.0：cells[].contents[] 項目處理
    if (component.name === '資訊表格2.0') {
      const cells = params.cells;
      if (Array.isArray(cells)) {
        for (const cell of cells) {
          if (typeof cell !== 'object' || cell === null) continue;
          const contents = cell.contents;
          if (!Array.isArray(contents)) continue;
          for (const item of contents) {
            if (typeof item !== 'object' || item === null) continue;
            // 新增 verticalAlign（若不存在）
            if (!('verticalAlign' in item)) {
              item.verticalAlign = 'bottom';
            }
            // align 改為 horizontalAlign
            if ('align' in item && !('horizontalAlign' in item)) {
              item.horizontalAlign = item.align;
              delete item.align;
            }
          }
        }
      }
    }

    // 內容專區/影音 & 內容專區/短影音：shareDeepLinkFormat 新增後綴
    if (component.name === '內容專區/影音' || component.name === '內容專區/短影音') {
      const SUFFIX = '&string-stateVideoService=%3$s&string-stateVideoTitle=%4$s';
      const shareLink = params.shareDeepLinkFormat;
      if (typeof shareLink === 'string' && !shareLink.endsWith(SUFFIX)) {
        params.shareDeepLinkFormat = shareLink + SUFFIX;
      }
    }

    if (component.subComponents) findAndUpdateV3_31(component.subComponents);
  }
  return subcomponents;
}

function migrateToV3_31(blueprint) {
  addToBlueprint(blueprint, configV3_31);
  if (blueprint.pages) findAndUpdateV3_31(blueprint.pages);
  return blueprint;
}

// ─── v3.31 → v3.32 (config only) ──────────────────────────────────────────────────────────
function migrateToV3_32(blueprint) {
  return addToBlueprint(blueprint, configV3_32);
}

// ─── v3.32 → v3.33 ──────────────────────────────────────────────────────────
const _INDEX_OF_SORT_COMPONENTS = new Set(['自選股', '合併表格', 'Bar_Line_圖表', '擴增表格']);

const _POPUP_DEFAULTS = {
  displayCourseInfoPopupTitle: '您所在的地區？',
  displayCourseInfoPopupSubtitle: '將根據地區為您提供此課程的詳細資訊與購買管道',
  displayCourseInfoPopupTaiwanDomainButtonTitle: '台灣',
  displayCourseInfoPopupOverseaDomainButtonTitle: '台灣以外',
  displayCourseInfoPopupCancelButtonTitle: '取消',
};

const _POPUP_KEYS = Object.keys(_POPUP_DEFAULTS);

function renameKeyRecursive(obj, oldKey, newKey) {
  if (typeof obj !== 'object' || obj === null) return false;
  let renamed = false;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (renameKeyRecursive(item, oldKey, newKey)) renamed = true;
    }
  } else {
    if (oldKey in obj && !(newKey in obj)) {
      obj[newKey] = obj[oldKey];
      delete obj[oldKey];
      renamed = true;
    }
    for (const v of Object.values(obj)) {
      if (renameKeyRecursive(v, oldKey, newKey)) renamed = true;
    }
  }
  return renamed;
}

function wrapCourseInfoPopup(params) {
  // 已包裝過則略過
  if ('displayCourseInfoPopupContent' in params) return;

  const popupContent = {};
  for (const key of _POPUP_KEYS) {
    if (key in params) {
      popupContent[key] = params[key];
      delete params[key];
    } else {
      popupContent[key] = _POPUP_DEFAULTS[key];
    }
  }
  params.displayCourseInfoPopupContent = popupContent;
}

function findAndUpdateV3_33(subcomponents) {
  for (const component of subcomponents) {
    if (typeof component !== 'object' || component === null) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const params = component.parameters;

    // 1. indexOfSortTypeLoop → indexOfSort
    if (_INDEX_OF_SORT_COMPONENTS.has(component.name)) {
      renameKeyRecursive(params, 'indexOfSortTypeLoop', 'indexOfSort');
    }

    // 2. 內容專區模板：包裝 displayCourseInfoPopupContent
    if (component.name === '內容專區模板') {
      wrapCourseInfoPopup(params);
    }

    if (component.subComponents) findAndUpdateV3_33(component.subComponents);
  }
  return subcomponents;
}

function migrateToV3_33(blueprint) {
  if (blueprint.pages) findAndUpdateV3_33(blueprint.pages);
  return blueprint;
}

// ─── Version dictionary (matches Python's version_dict) ──────────────────────
export const versionDict = {
  '1.0': 1, '1.1': 2, '1.2': 3, '1.3': 4, '1.4': 5, '1.5': 6, '1.6': 7,
  '1.7': 8, '2.0': 9, '2.1': 10, '2.2': 11, '2.3': 12, '2.4': 13, '2.5': 14,
  '2.6': 15, '2.7': 16,
  '3.0': 17, '3.1': 18, '3.2': 19, '3.3': 20, '3.4': 21, '3.5': 22,
  '3.6': 23, '3.7': 24, '3.8': 25, '3.9': 26, '3.10': 27, '3.11': 28,
  '3.12': 29, '3.13': 30, '3.14': 31, '3.15': 32, '3.16': 33, '3.17': 34,
  '3.18': 35, '3.19': 36, '3.20': 37, '3.21': 38, '3.22': 39, '3.23': 40,
  '3.24': 41, '3.25': 42, '3.26': 43, '3.27': 44, '3.28': 45, '3.29': 46, '3.30': 47,
  '3.31': 48,
  '3.32': 49,
  '3.33': 50,
};

// ─── autoMigrations array (0-indexed, 47 entries, matches Python's list) ─────
// Index mapping: Python loop uses range(version_number-1, target+1)
// So autoMigrations[17] = migration that results in v3.0, etc.
export const autoMigrations = [
  passThrough,    // 0  (v1.0)
  passThrough,    // 1  (v1.1)
  passThrough,    // 2  (v1.2)
  passThrough,    // 3  (v1.3)
  passThrough,    // 4  (v1.4)
  passThrough,    // 5  (v1.5)
  passThrough,    // 6  (v1.6 - Migration1516 not ported)
  passThrough,    // 7  (v1.7)
  passThrough,    // 8  (v2.0 - Migration1720 not ported)
  passThrough,    // 9  (v2.1)
  passThrough,    // 10 (v2.2)
  passThrough,    // 11 (v2.3)
  passThrough,    // 12 (v2.4)
  passThrough,    // 13 (v2.5)
  passThrough,    // 14 (v2.6)
  passThrough,    // 15 (v2.7)
  passThrough,    // 16 (intermediary)
  migrateToV3_0,  // 17 (v2.7 → v3.0)
  migrateToV3_1,  // 18 (v3.0 → v3.1)
  migrateToV3_2,  // 19 (v3.1 → v3.2)
  migrateToV3_3,  // 20 (v3.2 → v3.3)
  migrateToV3_4,  // 21 (v3.3 → v3.4)
  migrateToV3_5,  // 22 (v3.4 → v3.5, pass-through)
  migrateToV3_6,  // 23 (v3.5 → v3.6)
  migrateToV3_7,  // 24 (v3.6 → v3.7)
  migrateToV3_8,  // 25 (v3.7 → v3.8)
  migrateToV3_9,  // 26 (v3.8 → v3.9, pass-through)
  migrateToV3_10, // 27 (v3.9 → v3.10)
  migrateToV3_11, // 28 (v3.10 → v3.11)
  migrateToV3_12, // 29 (v3.11 → v3.12, pass-through)
  migrateToV3_13, // 30 (v3.12 → v3.13)
  migrateToV3_14, // 31 (v3.13 → v3.14)
  migrateToV3_15, // 32 (v3.14 → v3.15, pass-through)
  migrateToV3_16, // 33 (v3.15 → v3.16)
  migrateToV3_17, // 34 (v3.16 → v3.17)
  migrateToV3_18, // 35 (v3.17 → v3.18)
  migrateToV3_19, // 36 (v3.18 → v3.19)
  migrateToV3_20, // 37 (v3.19 → v3.20)
  migrateToV3_21, // 38 (v3.20 → v3.21)
  migrateToV3_22, // 39 (v3.21 → v3.22, pass-through)
  migrateToV3_23, // 40 (v3.22 → v3.23)
  migrateToV3_24, // 41 (v3.23 → v3.24)
  migrateToV3_25, // 42 (v3.24 → v3.25, pass-through)
  migrateToV3_26, // 43 (v3.25 → v3.26)
  migrateToV3_27, // 44 (v3.26 → v3.27, pass-through)
  migrateToV3_28, // 45 (v3.27 → v3.28)
  migrateToV3_29, // 46 (v3.28 → v3.29)
  migrateToV3_30, // 47 (v3.29 → v3.30)
  migrateToV3_31,  // 48 (v3.30 → v3.31)
  migrateToV3_32,  // 49 (v3.31 → v3.32)
  migrateToV3_33,  // 50 (v3.32 → v3.33)
];
