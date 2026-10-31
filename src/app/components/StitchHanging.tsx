'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

export default function StitchHanging() {
  const pendant = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = pendant.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let previousTime = 0;
    let previousScroll = window.scrollY;
    let angle = 0;
    let velocity = 0;
    let visible = true;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      angle = velocity = 0;
      element.style.transform = 'rotate(0deg)';
    };

    const tick = (time: number) => {
      const dt = previousTime ? Math.min((time - previousTime) / 1000, .032) : 1 / 60;
      previousTime = time;
      // Restoring force and damping let the pendant settle after each scroll impulse.
      velocity += (-45 * angle - 5 * velocity) * dt;
      angle += velocity * dt;
      if (Math.abs(angle) > 22) {
        angle = Math.sign(angle) * 22;
        velocity *= -.25;
      }
      element.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      if (Math.abs(angle) < .05 && Math.abs(velocity) < .1) {
        reset();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const delta = window.scrollY - previousScroll;
      previousScroll = window.scrollY;
      if (motion.matches || !visible || document.hidden || !delta) return;
      velocity = Math.max(-100, Math.min(100, velocity + Math.max(-60, Math.min(60, delta)) * .8));
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) reset();
    });
    observer.observe(element);
    window.addEventListener('scroll', onScroll, { passive: true });
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      reset();
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, []);

  return <span className="stitch-hanging-anchor" aria-hidden="true">
    <span ref={pendant} className="stitch-hanging-pendant">
      <span className="stitch-hanging-string" />
      <Image src="/stickers/stitchblue3.png" alt="" width={42} height={51} sizes="42px" className="stitch-hanging-character" />
    </span>
  </span>;
}
