const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the actual TS modules with an isolated database; no live balances change.
function loadModule(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  });
  const module = { exports: {} };
  const localRequire = name => Object.hasOwn(overrides, name) ? overrides[name] : require(name);
  new Function('require', 'module', 'exports', outputText)(localRequire, module, module.exports);
  return module.exports;
}

const { replaceWallet, prependSavedTransaction } = loadModule('src/app/lib/wallet-state.ts');
const initial = {
  rafaWallet: { id: 'rafa', person: 'Saya', balance: 100000 },
  monikWallet: { id: 'monik', person: 'Pacar_Saya', balance: 200000 },
};

for (const [person, key, otherKey] of [
  ['Saya', 'rafaWallet', 'monikWallet'],
  ['Pacar_Saya', 'monikWallet', 'rafaWallet'],
]) {
  test(`saved balance replaces the displayed wallet for ${person}`, () => {
    const saved = { ...initial[key], balance: 76500 };
    const next = replaceWallet(initial, saved);
    assert.equal(next[key], saved);
    assert.equal(next[otherKey], initial[otherKey]);
    assert.deepEqual(Object.keys(next).sort(), ['monikWallet', 'rafaWallet']);
    assert.notEqual(initial[key].balance, saved.balance);
    assert.equal(replaceWallet({ ...initial, [key]: null }, saved)[key], saved);
  });
}

test('history uses the real saved ID and does not duplicate a repeated result', () => {
  const saved = { id: 'database-id', jumlah: 25000 };
  const history = [{ id: 'older-id' }];
  const next = prependSavedTransaction(prependSavedTransaction(history, saved), saved);
  assert.deepEqual(next, [saved, ...history]);
  assert.equal(history.length, 1);
});

function actionsFor(tx) {
  return loadModule('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: callback => callback(tx) },
    'next/cache': { revalidatePath: () => assert.fail('add must not refresh the whole route') },
  });
}

for (const sumber of ['Saya', 'Pacar_Saya']) {
  for (const tipe of ['pengeluaran', 'tabungan']) {
    test(`${tipe} by ${sumber} returns the committed wallet and real transaction`, async () => {
      const wallet = { id: 'wallet-id', person: sumber, balance: 35000 };
      let saved;
      const actions = actionsFor({
        transaction: { create: async ({ data }) => {
          saved = { id: 'real-id', ...data, createdAt: new Date() };
          return saved;
        } },
        wallet: { update: async args => {
          assert.deepEqual(args, { where: { person: sumber }, data: { balance: { decrement: 25000 } } });
          return wallet;
        } },
      });
      const form = new FormData();
      for (const [key, value] of Object.entries({ sumber, tipe, jumlah: '25000', keterangan: 'Test', tanggal: '2026-10-30' })) {
        form.set(key, value);
      }
      const result = await actions.addTransaction(form);
      assert.ok(result.success);
      assert.equal(result.transaction, saved);
      assert.equal(result.wallet, wallet);
      const key = sumber === 'Saya' ? 'rafaWallet' : 'monikWallet';
      assert.equal(replaceWallet(initial, result.wallet)[key].balance, 35000);
    });
  }
}

test('invalid transaction returns an error before touching the database', async () => {
  const actions = actionsFor(new Proxy({}, { get: () => assert.fail('invalid input reached database') }));
  assert.deepEqual(await actions.addTransaction(new FormData()), { error: 'Data tidak valid.' });
});

test('top-up returns the balance saved with its income record', async () => {
  const wallet = { id: 'wallet-id', person: 'Saya', balance: 125000 };
  let incomeSaved = false;
  const actions = actionsFor({
    wallet: { update: async args => {
      assert.deepEqual(args, { where: { person: 'Saya' }, data: { balance: { increment: 25000 } } });
      return wallet;
    } },
    pemasukan: { create: async ({ data }) => {
      assert.deepEqual(data, { jumlah: 25000, sumber: 'Saya' });
      incomeSaved = true;
    } },
  });
  const form = new FormData();
  form.set('person', 'Saya');
  form.set('amount', '25000');
  const result = await actions.addUangSaku(form);
  assert.ok(incomeSaved);
  assert.equal(result.wallet, wallet);
});

test('failed income save never publishes an uncommitted balance', async () => {
  const actions = actionsFor({
    wallet: { update: async () => ({ person: 'Saya', balance: 125000 }) },
    pemasukan: { create: async () => { throw new Error('database failure'); } },
  });
  const form = new FormData();
  form.set('person', 'Saya');
  form.set('amount', '25000');
  const result = await actions.addUangSaku(form);
  assert.ok(result.error);
  assert.equal(result.wallet, undefined);
  assert.equal(result.success, undefined);
});
