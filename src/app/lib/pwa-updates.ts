import { holdAppUpdate, isAppUpdating, releaseAppUpdate } from './app-update-gate';

export function startPwaUpdates(registration: ServiceWorkerRegistration, canUpdate: () => boolean) {
  let stopped = false;
  let reloadPending = false;
  let reloading = false;
  let checking = false;
  let lastChecked = 0;
  let hadController = !!navigator.serviceWorker.controller;
  const dirty = new Set<HTMLFormElement>();
  const safe = () => {
    for (const form of dirty) if (!form.isConnected) dirty.delete(form);
    return navigator.onLine !== false && canUpdate() &&
      !document.querySelector('[role="dialog"], dialog[open], [aria-busy="true"]') && dirty.size === 0;
  };
  const maybeReload = () => {
    if (reloadPending && !reloading && safe()) { reloading = true; holdAppUpdate(); window.location.reload(); }
  };
  const requestActivation = () => {
    if (registration.waiting && safe()) registration.waiting.postMessage({ type: 'PWA_TRY_UPDATE' });
  };
  const check = async () => {
    if (stopped || navigator.onLine === false) return;
    maybeReload(); requestActivation();
    if (checking || Date.now() - lastChecked < 60000) return;
    checking = true; lastChecked = Date.now();
    try { await registration.update(); } catch { /* Offline/captive networks keep the existing version. */ }
    finally { checking = false; if (!stopped) requestActivation(); }
  };
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'PWA_CAN_UPDATE' && event.ports[0]) {
      const ready = safe(); if (ready && event.data.commit === true) holdAppUpdate();
      event.ports[0].postMessage({ ready });
    }
    if (event.data?.type === 'PWA_UPDATE_ABORT') releaseAppUpdate();
  };
  const onController = () => {
    if (hadController) { reloadPending = true; maybeReload(); }
    hadController = true;
  };
  const onInput = (event: Event) => { const form = (event.target as HTMLElement)?.closest?.('form'); if (form) dirty.add(form); };
  const onReset = (event: Event) => { if (event.target instanceof HTMLFormElement) dirty.delete(event.target); };
  const freezeInteraction = (event: Event) => { if (isAppUpdating()) { event.preventDefault(); event.stopImmediatePropagation(); } };
  const onInstalled = () => { if (registration.installing?.state === 'installed') requestActivation(); };
  let installing: ServiceWorker | null = null;
  const onFound = () => {
    installing?.removeEventListener('statechange', onInstalled);
    installing = registration.installing;
    installing?.addEventListener('statechange', onInstalled);
  };
  onFound();
  navigator.serviceWorker.addEventListener('message', onMessage);
  navigator.serviceWorker.addEventListener('controllerchange', onController);
  registration.addEventListener('updatefound', onFound);
  for (const name of ['focus', 'online', 'pageshow']) window.addEventListener(name, check);
  document.addEventListener('visibilitychange', check);
  document.addEventListener('input', onInput, true); document.addEventListener('change', onInput, true);
  document.addEventListener('reset', onReset, true);
  for (const name of ['click', 'keydown', 'beforeinput', 'submit']) document.addEventListener(name, freezeInteraction, true);
  const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void check(); }, 5000);
  void check();
  return () => {
    stopped = true; releaseAppUpdate(); window.clearInterval(timer);
    navigator.serviceWorker.removeEventListener('message', onMessage);
    navigator.serviceWorker.removeEventListener('controllerchange', onController);
    registration.removeEventListener('updatefound', onFound); installing?.removeEventListener('statechange', onInstalled);
    for (const name of ['focus', 'online', 'pageshow']) window.removeEventListener(name, check);
    document.removeEventListener('visibilitychange', check);
    document.removeEventListener('input', onInput, true); document.removeEventListener('change', onInput, true); document.removeEventListener('reset', onReset, true);
    for (const name of ['click', 'keydown', 'beforeinput', 'submit']) document.removeEventListener(name, freezeInteraction, true);
  };
}
