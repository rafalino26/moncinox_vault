const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

module.exports = function loadModule(relativePath, overrides = {}) {
  return loadFile(path.resolve(__dirname, '../..', relativePath), overrides);
};

function loadFile(filename, overrides) {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  const module = { exports: {} };
  const localRequire = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name.startsWith('@/')) {
      const target = path.resolve(__dirname, '../..', 'src', `${name.slice(2)}.ts`);
      if (fs.existsSync(target)) return loadFile(target, overrides);
    }
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(filename), `${name}.ts`);
      if (fs.existsSync(target)) return loadFile(target, overrides);
    }
    return require(name);
  };
  new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
  return module.exports;
}
