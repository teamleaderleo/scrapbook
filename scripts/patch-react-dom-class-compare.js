// scripts/patch-react-dom-class-compare.js
const fs = require('fs');
const path = require('path');

const targets = [
  // React’s CJS (may exist even if not exported)
  'node_modules/react-dom/cjs/react-dom-client.development.js',
  'node_modules/react-dom/cjs/react-dom-profiling.development.js',

  // Next’s vendored React DOM (Turbopack uses this in dev)
  'node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.development.js',
  'node_modules/next/dist/compiled/react-dom/cjs/react-dom-profiling.development.js', // may not exist
];

const HELPER_NAME = 'normalizeClassForHydration';
const HELPER_SNIPPET =
  'var HTML_SPACE_CLASS_SEPARATOR=/[ \\t\\n\\f\\r]+/;' +
  'function ' + HELPER_NAME + '(markup){' +
    'var s=normalizeMarkupForTextOrAttribute(markup);' +
    'return s.trim().split(HTML_SPACE_CLASS_SEPARATOR).filter(Boolean).join(" ");' +
  '}';

function insertHelper(src) {
  if (src.includes(HELPER_NAME + '(')) return src; // already present

  // Prefer to insert after normalizeMarkupForTextOrAttribute declaration if we can find it
  const normFnName = 'normalizeMarkupForTextOrAttribute';
  let i = src.indexOf('function ' + normFnName);
  if (i === -1) i = src.indexOf(normFnName + '=function');
  if (i !== -1) {
    // Find end of that function block (naive but works for these files)
    const start = src.indexOf('{', i);
    if (start !== -1) {
      let depth = 0, j = start;
      for (; j < src.length; j++) {
        if (src[j] === '{') depth++;
        else if (src[j] === '}') { depth--; if (depth === 0) { j++; break; } }
      }
      if (j > start) {
        return src.slice(0, j) + ';' + HELPER_SNIPPET + ';' + src.slice(j);
      }
    }
  }

  // Fallback: insert after "use strict" or at file start
  const useStrict = /(['"])use strict\1;?/;
  if (useStrict.test(src)) {
    return src.replace(useStrict, m => m + HELPER_SNIPPET + ';');
  }
  return HELPER_SNIPPET + ';' + src;
}

function patchWarn(src) {
  const WARN_NAME = 'warnForPropDifference';
  const fnIdx = src.indexOf('function ' + WARN_NAME);
  const assignIdx = src.indexOf(WARN_NAME + '=function');
  const idx = fnIdx !== -1 ? fnIdx : assignIdx;

  if (idx === -1) return src; // function not found

  const head = src.slice(0, idx);
  const tail = src.slice(idx);

  // Try the “exact guard” insertion first
  const GUARD_RE = /if\s*\(\s*normalizedServerValue\s*===\s*normalizedClientValue\s*\)\s*\{\s*return;\s*\}\s*/;
  if (GUARD_RE.test(tail)) {
    const CLASS_BLOCK =
      'if(propName==="class"||propName==="className"){' +
        'if(' + HELPER_NAME + '(serverValue)===' + HELPER_NAME + '(clientValue)){' +
          'return;' +
        '}' +
      '}';
    return head + tail.replace(GUARD_RE, m => m + CLASS_BLOCK);
  }

  // Fallback: inject an early-return at the top of the function body
  const bodyStart = tail.indexOf('{');
  if (bodyStart !== -1) {
    const injected =
      tail.slice(0, bodyStart + 1) +
      'if(propName==="class"||propName==="className"){' +
        'if(' + HELPER_NAME + '(serverValue)===' + HELPER_NAME + '(clientValue)){' +
          'return;' +
        '}' +
      '}' +
      tail.slice(bodyStart + 1);
    return head + injected;
  }

  return src;
}

for (const rel of targets) {
  const file = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    console.log(`Skipped (not found): ${rel}`);
    continue;
  }
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  src = insertHelper(src);
  src = patchWarn(src);

  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log(`Patched: ${rel}`);
  } else {
    console.log(`No changes needed: ${rel}`);
  }
}
