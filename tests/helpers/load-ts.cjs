const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

module.exports = function loadModule(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, '../..', relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  const module = { exports: {} };
  const localRequire = name => Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
  return module.exports;
};
