/**
 * Port of Python's blueprint_adder.py
 * Recursively adds parameters to blueprint components based on a config object.
 */

function recursiveAdd(json, config) {
  if ('switch' in config) {
    const nameKey = config.switch;
    const cases = config.cases;
    if (nameKey in json) {
      const caseKey = json[nameKey];
      if (caseKey in cases) {
        const caseVal = cases[caseKey];
        if (isPlainObject(caseVal) && isPlainObject(json)) {
          recursiveAdd(json, caseVal);
        }
      }
    }
  } else {
    for (const key of Object.keys(config)) {
      if (key in json) {
        if (isPlainObject(config[key])) {
          if (isPlainObject(json[key])) {
            recursiveAdd(json[key], config[key]);
          } else if (Array.isArray(json[key])) {
            for (let i = 0; i < json[key].length; i++) {
              recursiveAdd(json[key][i], config[key]);
            }
          }
        } else {
          json[key] = config[key];
        }
      } else {
        if (isPlainObject(config[key])) {
          json[key] = {};
          recursiveAdd(json[key], config[key]);
        } else {
          json[key] = config[key];
        }
      }
    }
  }
}

function addToSubcomponents(subcomponents, config) {
  for (const component of subcomponents) {
    if (!isPlainObject(component)) continue;
    if (!('name' in component)) continue;
    if (!('parameters' in component)) component.parameters = {};

    const componentName = component.name;
    if (componentName in config) {
      if ('parameters' in config[componentName]) {
        recursiveAdd(component.parameters, config[componentName].parameters);
      }
    }

    if ('subComponents' in component) {
      addToSubcomponents(component.subComponents, config);
    }
  }
}

export function addToBlueprint(blueprint, config) {
  if (!config || Object.keys(config).length === 0) return blueprint;
  if (!blueprint.pages) return blueprint;
  addToSubcomponents(blueprint.pages, config);
  return blueprint;
}

function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
