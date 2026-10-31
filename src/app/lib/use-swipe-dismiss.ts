'use client';

import { useEffect, useRef, type PointerEvent, type RefObject } from 'react';

export function useSwipeDismiss({ panel, canDismiss, onDismiss }: {
  panel: RefObject<HTMLDivElement | null>; canDismiss: () => boolean; onDismiss: () => void;
}) {
  const latest = useRef({ canDismiss, onDismiss });
  latest.current = { canDismiss, onDismiss };
  const gesture = useRef<{ id: number; x: number; y: number; time: number; distance: number; dragging: boolean; target: HTMLElement } | null>(null);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);

  const clearFrame = () => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  const reset = () => {
    const node = panel.current;
    if (!node) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.style.transition = reduced ? 'none' : 'transform 180ms ease-out';
    node.style.transform = '';
    node.style.pointerEvents = '';
    node.style.willChange = '';
    closing.current = false;
  };

  useEffect(() => () => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  const start = (event: PointerEvent<HTMLElement>) => {
    if (!window.matchMedia('(max-width: 639px)').matches || !event.isPrimary || event.button !== 0 ||
      !latest.current.canDismiss() || closing.current || gesture.current) return;
    if ((event.target as HTMLElement).closest('button, input, select, textarea, a')) return;
    if (timer.current !== null) clearTimeout(timer.current);
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      time: event.timeStamp, distance: 0, dragging: false, target: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId || !latest.current.canDismiss()) return;
    const dy = Math.max(0, event.clientY - current.y);
    if (dy <= Math.abs(event.clientX - current.x) && !current.dragging) return;
    current.distance = dy;
    if (dy >= 6) current.dragging = true;
    if (!current.dragging || frame.current !== null) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null;
      const node = panel.current;
      if (!node || !gesture.current || !latest.current.canDismiss()) return;
      node.style.animation = 'none';
      node.style.transition = 'none';
      node.style.willChange = 'transform';
      node.style.transform = `translate3d(0, ${gesture.current.distance}px, 0)`;
    });
  };
  const finish = (event: PointerEvent<HTMLElement>, canceled = false) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    clearFrame();
    if (current.target.hasPointerCapture(event.pointerId)) current.target.releasePointerCapture(event.pointerId);
    const node = panel.current;
    if (!node) return;
    const dy = Math.max(0, event.clientY - current.y);
    const dx = Math.abs(event.clientX - current.x);
    const elapsed = Math.max(1, event.timeStamp - current.time);
    const threshold = Math.min(110, Math.max(64, node.getBoundingClientRect().height * .14));
    if (canceled || !latest.current.canDismiss() || dy <= dx || (dy < threshold && !(dy >= 40 && dy / elapsed > .55))) {
      reset();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { reset(); latest.current.onDismiss(); return; }
    closing.current = true;
    node.style.animation = 'none';
    node.style.transition = 'transform 180ms ease-in';
    node.style.transform = `translate3d(0, ${window.innerHeight}px, 0)`;
    node.style.pointerEvents = 'none';
    timer.current = setTimeout(() => {
      timer.current = null;
      if (latest.current.canDismiss()) latest.current.onDismiss();
      else reset();
    }, 180);
  };

  return { onPointerDown: start, onPointerMove: move, onPointerUp: (event: PointerEvent<HTMLElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLElement>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => finish(event, true) };
}
