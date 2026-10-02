const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const output = ts.transpileModule(fs.readFileSync('src/utils/loadIndependentSections.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const api = {};
vm.runInNewContext(output, { exports: api });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
(async () => {
  const slow = deferred(),
    fast = deferred(),
    shown = [],
    errors = [];
  let current = true;
  const load = api.loadIndependentSections(
    [
      api.independentSection(
        () => slow.promise,
        (x) => shown.push(x),
        () => current,
      ),
      api.independentSection(
        () => fast.promise,
        (x) => shown.push(x),
        () => current,
      ),
    ],
    () => current,
    (e) => errors.push(e),
  );
  fast.resolve(52);
  await new Promise(setImmediate);
  assert.deepEqual(shown, [52]);
  console.log('PASS weight displayed before slow history completes');
  slow.reject(new Error('history failed'));
  await load;
  assert.deepEqual(shown, [52]);
  assert.equal(errors.length, 1);
  console.log('PASS secondary failure preserves loaded weight');
  const old = deferred();
  const obsolete = api.loadIndependentSections(
    [
      api.independentSection(
        () => old.promise,
        (x) => shown.push(x),
        () => current,
      ),
    ],
    () => current,
    (e) => errors.push(e),
  );
  current = false;
  old.resolve(999);
  await obsolete;
  assert.deepEqual(shown, [52]);
  console.log('PASS old warehouse response ignored after switching/unmount');
  await api.loadIndependentSections(
    [
      async () => {
        throw Error('old failure');
      },
    ],
    () => false,
    (e) => errors.push(e),
  );
  assert.equal(errors.length, 1);
  console.log('PASS old warehouse errors ignored');
  await api.loadIndependentSections(
    [
      async () => {
        throw Error('one');
      },
      async () => {
        throw Error('two');
      },
    ],
    () => true,
    (e) => errors.push(e),
  );
  assert.equal(errors.length, 2);
  console.log('PASS one error notification per load');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
