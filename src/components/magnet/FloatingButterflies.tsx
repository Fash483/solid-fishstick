import { useEffect, useRef } from 'react';

// 40 butterflies, wide opacity, varied size and multi-path drift
const COUNT = 40;
const EMOJIS = ['🦋', '🦋', '🦋', '🦋', '🩷', '🌸', '🦋'];

export default function FloatingButterflies() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els: HTMLDivElement[] = [];
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'butterfly-float';
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const driftX = -60 + Math.random() * 120;
      el.style.cssText = `
        left: ${Math.random() * 100}vw;
        animation-duration: ${7 + Math.random() * 16}s;
        animation-delay: ${-Math.random() * 28}s;
        opacity: ${0.28 + Math.random() * 0.45};
        font-size: ${0.65 + Math.random() * 1.4}rem;
        --drift-x: ${driftX}px;
      `;
      document.body.appendChild(el);
      els.push(el);
    }
    return () => els.forEach((e) => e.remove());
  }, []);

  return <div ref={containerRef} />;
}
