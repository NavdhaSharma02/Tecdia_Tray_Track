"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

type Ripple = {
  id: number;
  x: number;
  y: number;
  size: number;
};

type PointerState = {
  x: number;
  y: number;
  visible: boolean;
};

export default function CustomerInteractivePanel({
  children,
}: {
  children: ReactNode;
}) {
  const [pointer, setPointer] = useState<PointerState>({ x: 50, y: 50, visible: false });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const lastRippleTimeRef = useRef(0);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setPointer({ x, y, visible: true });

    const now = Date.now();
    if (now - lastRippleTimeRef.current < 110) {
      return;
    }

    lastRippleTimeRef.current = now;
    const nextRipple: Ripple = {
      id: rippleIdRef.current++,
      x,
      y,
      size: 120 + ((rippleIdRef.current % 4) + 1) * 22,
    };

    setRipples((current) => [...current.slice(-5), nextRipple]);
  };

  const handlePointerLeave = () => {
    setPointer((current) => ({ ...current, visible: false }));
  };

  const cssVars = {
    "--ripple-x": `${pointer.x}%`,
    "--ripple-y": `${pointer.y}%`,
    "--ripple-opacity": pointer.visible ? 1 : 0,
  } as CSSProperties;

  return (
    <section
      className="customer-panel customer-panel--interactive"
      style={cssVars}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="customer-panel__fx" aria-hidden="true">
        <div className="customer-panel__ripple-light" />
        <div className="customer-panel__sheen" />
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="customer-panel__ripple"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
            }}
            onAnimationEnd={() => {
              setRipples((current) => current.filter((item) => item.id !== ripple.id));
            }}
          />
        ))}
      </div>
      <div className="customer-panel__content">{children}</div>
    </section>
  );
}
