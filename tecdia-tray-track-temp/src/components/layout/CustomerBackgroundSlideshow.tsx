"use client";

import { useEffect, useState } from "react";

const slides = [
  "/bg1.jpg?v=20260418-134315",
  "/bg2.jpg?v=20260416-142256",
  "/bg3.jpg?v=20260418-134523",
  "/bg4.jpg?v=20260418-134606",
  "/bg5.jpeg?v=20260418-134630",
  "/bg6.jpg?v=20260418-134715",
  "/bg7.jpg?v=20260418-134803",
  "/bg8.jpg?v=20260418-135351",
  "/bg9.jpg?v=20260418-135907",
  "/bg10.jpg?v=20260418-135934",
  "/bg11.jpg?v=20260418-140016",
];

const SLIDE_INTERVAL_MS = 6000;

export default function CustomerBackgroundSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="customer-stage__slideshow" aria-hidden="true">
      {slides.map((src, index) => (
        <div
          key={src}
          className={`customer-stage__slide ${index === activeIndex ? "is-active" : ""}`}
          style={{ backgroundImage: `url("${src}")` }}
        />
      ))}
      <div className="customer-stage__overlay" />
    </div>
  );
}
