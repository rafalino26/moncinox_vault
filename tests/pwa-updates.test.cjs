const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const loadModule = require('./helpers/load-ts.cjs');

function events() {
  const handlers = new Map();
  return { addEventListener(name, fn) { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn); },
    removeEventListener(name, fn) { handlers.get(name)?.delete(fn); },
    emit(name, value = {}) { for (const fn of handlers.get(name) || []) fn(value); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('automatic client updates defer for dialogs/sync/dirty forms, hold writes while ready, and reload once', async () => {
  const originals = Object.fromEntries(['navigator', 'window', 'document', 'HTMLFormElement'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const gate = loadModule('src/app/lib/app-update-gate.ts');
  const { startPwaUpdates } = loadModule('src/app/lib/pwa-updates.ts', { './app-update-gate': gate });
  let dialog = false, syncing = false, reloads = 0, checks = 0; const activations = []; let timer;
  const workers = { ...events(), controller: {} };
  const registration = { ...events(), waiting: { postMessage: value => activations.push(value) }, installing: null, update: async () => { checks++; } };
  const doc = { ...events(), visibilityState: 'visible', querySelector: () => dialog ? {} : null };
  const win = { ...events(), location: { reload: () => { reloads++; } }, setInterval: callback => { timer = callback; return 1; }, clearInterval() {} };
  try {
    class Form { isConnected = true; }
    for (const [key, value] of Object.entries({ navigator: { onLine: true, serviceWorker: workers }, document: doc, window: win, HTMLFormElement: Form })) Object.defineProperty(globalThis, key, { configurable: true, value });
    dialog = true;
    const stop = startPwaUpdates(registration, () => !syncing);
    await tick(); assert.equal(activations.length, 0); assert.equal(checks, 1);
    let ready;
    const probe = (commit = false) => workers.emit('message', { data: { type: 'PWA_CAN_UPDATE', commit }, ports: [{ postMessage: value => { ready = value.ready; } }] });
    probe(); assert.equal(ready, false); assert.equal(gate.isAppUpdating(), false);
    dialog = false; syncing = true; probe(); assert.equal(ready, false);
    syncing = false;
    const form = new Form(); doc.emit('input', { target: { closest: () => form } }); probe(); assert.equal(ready, false);
    doc.emit('reset', { target: form }); probe(); assert.equal(ready, true); assert.equal(gate.isAppUpdating(), false);
    probe(true);
    assert.throws(gate.assertAppWritable, /diperbarui/);
    let prevented = false; doc.emit('click', { preventDefault() { prevented = true; }, stopImmediatePropagation() {} }); assert.equal(prevented, true);
    workers.emit('message', { data: { type: 'PWA_UPDATE_ABORT' } }); assert.equal(gate.isAppUpdating(), false);
    timer(); await tick(); assert.ok(activations.length);
    workers.emit('controllerchange'); workers.emit('controllerchange'); assert.equal(reloads, 1);
    stop(); assert.equal(gate.isAppUpdating(), false);
  } finally {
    gate.releaseAppUpdate();
    for (const [key, descriptor] of Object.entries(originals)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});

function updateWorker(clientReadiness, { addedClient = false } = {}) {
  const listeners = {}; let skipped = 0; const messages = [];
  class Channel {
    constructor() {
      this.port1 = { close() {}, onmessage: null };
      this.port2 = { postMessage: data => this.port1.onmessage?.({ data }) };
    }
  }
  let enumerations = 0;
  const clients = clientReadiness.map((ready, i) => ({ id: `tab-${i}`, postMessage(message, ports) {
    messages.push(message.type);
    if (message.type === 'PWA_CAN_UPDATE' && ready !== null) setImmediate(() => ports[0].postMessage({ ready }));
  } }));
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    self: { MONCINOX_PWA_BUILD: { id: 'test', pages: {}, assets: [] }, addEventListener: (name, fn) => { listeners[name] = fn; },
      skipWaiting: async () => { skipped++; }, clients: { matchAll: async () => { enumerations++; return addedClient && enumerations > 1 ? [...clients, { id: 'new-tab', postMessage() {} }] : clients; } } },
    MessageChannel: Channel, importScripts() {}, setTimeout: callback => setTimeout(callback, 30), clearTimeout,
  });
  return { async tryUpdate() { let promise; listeners.message({ data: { type: 'PWA_TRY_UPDATE' }, waitUntil: value => { promise = value; } }); await promise; }, skipped: () => skipped, messages };
}

test('waiting worker activates only if every tab agrees; busy, old/unresponsive and newly opened tabs block it', async () => {
  const ready = updateWorker([true, true]); await ready.tryUpdate(); assert.equal(ready.skipped(), 1);
  for (const [states, options] of [[[true, false], {}], [[true, null], {}], [[true], { addedClient: true }]]) {
    const blocked = updateWorker(states, options); await blocked.tryUpdate();
    assert.equal(blocked.skipped(), 0); assert.ok(blocked.messages.includes('PWA_UPDATE_ABORT'));
  }
});
