const test = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');

function form(props) {
  const changes = [];
  const Form = loadModule('src/app/components/TransactionCompose.tsx', {
    react: { useId: () => 'form-test', useState: value => [typeof value === 'function' ? value() : value, update => changes.push(update)], useRef: value => ({ current: value }) },
    './ComposeDialog': () => null, './StitchMotion': { StitchActionLabel: () => null },
  }).default;
  const tree = Form(props);
  const nodes = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    nodes.push(value); visit(value.props?.children);
  }
  visit(tree);
  return { tree, changes, nodes, submit: nodes.find(node => node.type === 'form').props.onSubmit };
}
const input = { jumlah: 12345, tipe: 'tabungan', sumber: 'Pacar_Saya', tanggal: '2026-11-25', keterangan: 'Liburan' };

test('shared edit form preserves amount, owner, type and date when saving unchanged data', async () => {
  let saved; let closed = 0;
  const { nodes, submit } = form({ initial: input, onClose: () => { closed++; }, onSave: async value => { saved = value; } });
  assert.equal(nodes.find(node => node.type === 'input' && node.props.inputMode === 'numeric').props.value, '12.345');
  assert.equal(nodes.find(node => node.type === 'input' && node.props.type === 'date').props.value, '2026-11-25');
  assert.equal(nodes.filter(node => node.type === 'button' && node.props['aria-pressed'] === true).length, 2);
  await submit({ preventDefault() {} });
  assert.deepEqual(saved, input); assert.equal(closed, 1);
});

test('shared form blocks double submission, waits for durability, and keeps itself open on save failure', async () => {
  let release; const gate = new Promise(resolve => { release = resolve; }); let calls = 0; let closed = 0;
  const { submit } = form({ initial: input, onSave: async () => { calls++; await gate; }, onClose: () => { closed++; } });
  const saving = submit({ preventDefault() {} });
  await submit({ preventDefault() {} }); assert.equal(calls, 1); assert.equal(closed, 0);
  release(); await saving; assert.equal(closed, 1);
  const failure = form({ initial: input, onSave: async () => { throw Error('Claimed by another tab'); }, onClose: () => assert.fail('must keep form open') });
  await failure.submit({ preventDefault() {} });
  assert.ok(failure.changes.includes('Claimed by another tab'));
});

test('income shares the same amount/submit UI while hiding irrelevant transaction fields', () => {
  const { nodes } = form({ income: true, subtitle: 'Puskasw', onSave: async () => {}, onClose: () => {} });
  assert.equal(nodes.filter(node => node.type === 'fieldset').length, 0);
  assert.equal(nodes.filter(node => node.type === 'input').length, 1);
  assert.ok(nodes.some(node => node.props?.className === 'compose-submit'));
});
