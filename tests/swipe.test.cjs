const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-ts.cjs');

function setup(t, { mobile = true, reduced = false } = {}) {
  const previous = global.window;
  let frame;
  let cleanup;
  let locked = false;
  let dismissed = 0;
  let captured = false;
  global.window = {
    innerHeight: 800,
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : mobile }),
    requestAnimationFrame: callback => { frame = callback; return 1; },
    cancelAnimationFrame: () => { frame = undefined; },
  };
  const { useSwipeDismiss } = load('src/app/lib/use-swipe-dismiss.ts', {
    react: { useRef: value => ({ current: value }), useEffect: callback => { cleanup = callback(); } },
  });
  const node = { style: {}, getBoundingClientRect: () => ({ height: 600 }) };
  const target = { setPointerCapture: () => { captured = true; }, hasPointerCapture: () => captured,
    releasePointerCapture: () => { captured = false; } };
  const handlers = useSwipeDismiss({ panel: { current: node }, canDismiss: () => !locked, onDismiss: () => { dismissed++; } });
  const event = (y, time, interactive = false) => ({ pointerId: 1, button: 0, isPrimary: true,
    clientX: 100, clientY: y, timeStamp: time, currentTarget: target, target: { closest: () => interactive ? {} : null } });
  t.after(() => { cleanup?.(); if (previous === undefined) delete global.window; else global.window = previous; });
  return { handlers, node, event, lock: () => { locked = true; }, count: () => dismissed, flush: () => { const next = frame; frame = undefined; next?.(); } };
}

test('mobile header drag follows the finger and dismisses after a deliberate downward swipe', async t => {
  const s = setup(t);
  s.handlers.onPointerDown(s.event(100, 0));
  s.handlers.onPointerMove(s.event(210, 200));
  s.flush();
  assert.equal(s.node.style.transform, 'translate3d(0, 110px, 0)');
  s.handlers.onPointerUp(s.event(210, 300));
  assert.equal(s.count(), 0);
  await new Promise(resolve => setTimeout(resolve, 210));
  assert.equal(s.count(), 1);
});

test('small drags snap back, and reversing a drag returns the sheet to its origin', t => {
  const s = setup(t);
  s.handlers.onPointerDown(s.event(100, 0));
  s.handlers.onPointerMove(s.event(125, 200));
  s.flush();
  s.handlers.onPointerMove(s.event(100, 300));
  s.flush();
  assert.equal(s.node.style.transform, 'translate3d(0, 0px, 0)');
  s.handlers.onPointerUp(s.event(100, 400));
  assert.equal(s.node.style.transform, '');
  assert.equal(s.count(), 0);
});

test('desktop gestures are ignored', t => {
  const s = setup(t, { mobile: false });
  s.handlers.onPointerDown(s.event(100, 0));
  s.handlers.onPointerUp(s.event(300, 200));
  assert.equal(s.count(), 0);
  assert.equal(s.node.style.transform, undefined);
});

test('a running save blocks dismissal even if it starts during the drag', t => {
  const s = setup(t);
  s.handlers.onPointerDown(s.event(100, 0));
  s.handlers.onPointerMove(s.event(250, 200));
  s.flush();
  s.lock();
  s.handlers.onPointerUp(s.event(250, 250));
  assert.equal(s.node.style.transform, '');
  assert.equal(s.count(), 0);
});

test('canceled gestures and interactive targets never dismiss the sheet', t => {
  const s = setup(t);
  s.handlers.onPointerDown(s.event(100, 0, true));
  s.handlers.onPointerUp(s.event(300, 200));
  assert.equal(s.count(), 0);
  s.handlers.onPointerDown(s.event(100, 300));
  s.handlers.onPointerMove(s.event(250, 400));
  s.flush();
  s.handlers.onPointerCancel(s.event(250, 450));
  assert.equal(s.count(), 0);
  assert.equal(s.node.style.transform, '');
});

test('reduced motion dismisses without waiting for the exit animation', t => {
  const s = setup(t, { reduced: true });
  s.handlers.onPointerDown(s.event(100, 0));
  s.handlers.onPointerUp(s.event(210, 200));
  assert.equal(s.count(), 1);
  assert.equal(s.node.style.transition, 'none');
});
