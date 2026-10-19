const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const standardGlobals = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage',
  'Date', 'Math', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'JSON', 'Promise', 'URL', 'URLSearchParams', 'FormData', 'Blob', 'FileReader', 'alert', 'fetch',
  'confirm', 'prompt', 'navigator', 'location', 'history', 'Intl', 'Array',
  'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'WeakMap',
  'WeakSet', 'Error', 'TypeError', 'RangeError', 'SyntaxError', 'encodeURIComponent',
  'decodeURIComponent', 'encodeURI', 'decodeURI', 'parseInt', 'parseFloat',
  'isNaN', 'isFinite', 'undefined', 'NaN', 'Infinity', 'Symbol', 'Proxy', 'Reflect',
  'import', 'process', 'global', 'require', 'module', 'exports'
]);

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '__tests__') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.resolve(__dirname, 'src');
const files = getAllFiles(srcDir);
let hasError = false;

for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
  } catch (err) {
    console.error(`Parse error in ${file}:`, err.message);
    hasError = true;
    continue;
  }

  const undefinedInFile = new Set();

  traverse(ast, {
    ReferencedIdentifier(nodePath) {
      const name = nodePath.node.name;
      if (standardGlobals.has(name)) return;
      if (nodePath.scope.hasBinding(name)) return;
      // Also check JSX identifiers
      undefinedInFile.add(name);
    },
    JSXIdentifier(nodePath) {
      const name = nodePath.node.name;
      // Lowercase JSX elements are native HTML (div, span, button, etc.)
      if (/^[a-z]/.test(name)) return;
      // If parent is JSXClosingElement or JSXMemberExpression object, handled by reference
      if (nodePath.parentPath.isJSXMemberExpression() && nodePath.parentKey === 'property') return;
      if (nodePath.parentPath.isJSXAttribute()) return;
      if (standardGlobals.has(name)) return;
      if (nodePath.scope.hasBinding(name)) return;
      undefinedInFile.add(name);
    }
  });

  if (undefinedInFile.size > 0) {
    console.log(`\nUndefined references in ${path.relative(__dirname, file)}:`);
    for (const name of undefinedInFile) {
      console.log(`  - ${name}`);
    }
    hasError = true;
  }
}

if (!hasError) {
  console.log('\nAll files verified successfully! No undeclared references found.');
} else {
  process.exit(1);
}
