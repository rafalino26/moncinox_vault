const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.children = []; this.events = {}; this.attributes = {}; this.textContent = ''; this.value = ''; this.hidden = false; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, callback) { this.events[name] = callback; }
  set innerHTML(value) { throw Error('Financial data must not be inserted as HTML'); }
}

async function reader(records, pathname = '/') {
  const elements = Object.fromEntries(['reconnect', 'storage-status', 'search', 'person', 'wallets', 'history-title', 'stamp', 'empty', 'rows', 'more', 'connection', 'clear', 'reader'].map(id => [id, new Element()]));
  elements.person.value = 'all';
  const tabs = ['summary', 'transactions', 'income'].map(view => new Element({ view }));
  let reloads = 0;
  const cleared = [];
  const windowEvents = {};
  const context = {
    document: { getElementById: id => elements[id], createElement: () => new Element(), querySelectorAll: () => tabs },
    location: { pathname, reload: () => { reloads++; } }, navigator: { onLine: false },
    window: { addEventListener: (name, callback) => { windowEvents[name] = callback; } },
    MoncinoxOfflineStore: { createFinancePersistence: key => ({ read: async () => records[key], clear: async () => { cleared.push(key); } }) },
    confirm: () => true,
  };
  await vm.runInNewContext(fs.readFileSync('public/offline-reader.js', 'utf8'), context);
  return { elements, tabs, cleared, context, windowEvents, reloads: () => reloads };
}

const snapshot = data => ({ version: 1, updatedAt: Date.now() - 60000, data });
test('offline reader shows saved wallets, filters/paginates records and treats descriptions as text', async () => {
  const records = {
    wallets: snapshot({ rafaWallet: { balance: 123456 }, monikWallet: null }),
    transactions: snapshot(Array.from({ length: 55 }, (_, i) => ({ id: String(i), jumlah: 100, keterangan: i === 0 ? '<img src=x onerror=alert(1)>' : `Catatan ${i}`, tanggal: new Date(2026, 10, 20 - i).toISOString(), sumber: i % 2 ? 'Pacar_Saya' : 'Saya', tipe: 'pengeluaran' }))),
  };
  const { elements } = await reader(records);
  assert.equal(elements.reader.hidden, false);
  assert.equal(elements.rows.children.length, 50);
  assert.equal(elements.rows.children[0].children[0].children[0].textContent, '<img src=x onerror=alert(1)>');
  assert.match(elements.wallets.children[0].children[1].textContent, /123.456/);
  assert.match(elements.wallets.children[1].children[1].textContent, /Belum ada data/);
  assert.match(elements.stamp.textContent, /Data terakhir diperbarui/);
  elements.more.events.click();
  assert.equal(elements.rows.children.length, 55);
  elements.person.value = 'Pacar_Saya'; elements.person.events.input();
  assert.equal(elements.rows.children.length, 27);
  elements.search.value = 'Catatan 1'; elements.search.events.input();
  assert.equal(elements.rows.children.length, 6);
});

test('unvisited datasets explain missing snapshots; reconnect is explicit and clearing stays local', async () => {
  const { elements, cleared, reloads, context, windowEvents } = await reader({ wallets: snapshot({ rafaWallet: null, monikWallet: null }) }, '/pemasukan');
  assert.match(elements.empty.textContent, /Belum ada salinan/);
  assert.equal(elements.wallets.hidden, true);
  context.navigator.onLine = true;
  windowEvents.online();
  assert.equal(reloads(), 0);
  elements.reconnect.events.click();
  assert.equal(reloads(), 1);
  await elements.clear.events.click();
  assert.deepEqual(cleared.sort(), ['income', 'transactions', 'wallets']);
  assert.equal(elements.clear.hidden, true);
  assert.match(elements['storage-status'].textContent, /sudah dihapus/);
});
