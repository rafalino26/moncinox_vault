const test = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');

test('offline navigation loads cached documents immediately, while online/modifier/custom clicks retain normal behavior', () => {
  const descriptors = Object.fromEntries(['navigator', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const assigned = [];
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { assign: href => assigned.push(href) } } });
    const OfflineLink = loadModule('src/app/components/OfflineLink.tsx', {
      'next/link': () => null,
      react: { useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() },
    }).default;
    const event = extra => ({ defaultPrevented: false, button: 0, preventDefault() { this.defaultPrevented = true; }, ...extra });
    const offline = OfflineLink({ href: '/pemasukan?rentang=semua', children: 'Pemasukan' });
    assert.equal(offline.props.prefetch, false);
    const normal = event(); offline.props.onClick(normal);
    assert.equal(normal.defaultPrevented, true);
    assert.deepEqual(assigned, ['/pemasukan?rentang=semua']);
    offline.props.onClick(event({ ctrlKey: true }));
    OfflineLink({ href: '/pengeluaran', target: '_blank' }).props.onClick(event());
    OfflineLink({ href: '//external.test/' }).props.onClick(event());
    OfflineLink({ href: '/', onClick: e => e.preventDefault() }).props.onClick(event());
    assert.equal(assigned.length, 1);
    navigator.onLine = true;
    const online = OfflineLink({ href: '/pengeluaran', prefetch: true });
    assert.equal(online.props.prefetch, true);
    const onlineClick = event(); online.props.onClick(onlineClick);
    assert.equal(onlineClick.defaultPrevented, false);
    assert.equal(assigned.length, 1);
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
