"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function MarketingTrayShowcase() {
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateProgress = () => {
      if (mediaQuery.matches || !showcaseRef.current) {
        setProgress(0);
        return;
      }

      const rect = showcaseRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const rawProgress =
        (viewportHeight - rect.top) / (viewportHeight + rect.height * 0.65);

      setProgress(clamp(rawProgress, 0, 1));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div ref={showcaseRef} className="marketing-showcase">
      <div className="marketing-showcase__halo" aria-hidden="true" />

      <div
        className="marketing-device marketing-device--animated"
        style={{
          transform: `translate3d(${progress * -26}px, ${progress * -92}px, 0) rotate(${progress * -5.5}deg) scale(${1 + progress * 0.035})`,
        }}
      >
        <div className="marketing-device__topbar">
          <span>Tray Vision Session</span>
          <span>Live Preview</span>
        </div>
        <div className="marketing-device__frame">
          <Image
            src="/bg6.jpg"
            alt="Cafeteria dining presentation"
            fill
            className="object-cover marketing-device__image"
            style={{
              transform: `scale(${1 + progress * 0.09}) translate3d(${progress * 12}px, ${progress * -10}px, 0)`,
            }}
            priority
          />
          <div className="marketing-device__scanline" aria-hidden="true" />
          <div className="marketing-device__overlay">
            <div
              className="marketing-detection-card marketing-detection-card--animated"
              style={{
                transform: `translate3d(${progress * -10}px, ${progress * -24}px, 0) scale(${1 + progress * 0.018})`,
              }}
            >
              <span className="marketing-detection-card__label">Detected items</span>
              <strong>Chicken meal, rice, juice</strong>
              <p>Menu matched and bill generated in a single pass.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="marketing-floating-card marketing-floating-card--a"
        style={{
          transform: `translate3d(${progress * 34}px, ${progress * -62}px, 0) rotate(${progress * 4}deg)`,
        }}
      >
        <span>Today&apos;s menu synced</span>
        <strong>12 active dishes</strong>
      </div>
      <div
        className="marketing-floating-card marketing-floating-card--b"
        style={{
          transform: `translate3d(${progress * -30}px, ${progress * 42}px, 0) rotate(${progress * -4.5}deg)`,
        }}
      >
        <span>Checkout ready</span>
        <strong>UPI, card, payroll</strong>
      </div>
    </div>
  );
}
