'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ComponentProps } from 'react';

function subscribe(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => { window.removeEventListener('online', listener); window.removeEventListener('offline', listener); };
}

export default function OfflineLink({ onClick, prefetch, ...props }: ComponentProps<typeof Link>) {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  return <Link {...props} prefetch={online ? prefetch : false} onClick={event => {
    onClick?.(event);
    if (!event.defaultPrevented && navigator.onLine === false && typeof props.href === 'string' &&
        props.href.startsWith('/') && !props.href.startsWith('//') && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!props.target || props.target === '_self')) {
      // A document navigation loads the exact cached page, without an RSC network round trip.
      event.preventDefault();
      window.location.assign(props.href);
    }
  }} />;
}
