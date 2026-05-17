"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.35;

interface InstructionImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen instruction manual viewer with zoom controls.
 */
export default function InstructionImageViewer({
  src,
  alt,
  onClose,
}: InstructionImageViewerProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const viewportRef = useRef<HTMLDivElement>(null);

  const clampZoom = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    []
  );

  const zoomIn = () => setZoom((z) => clampZoom(Number((z + ZOOM_STEP).toFixed(2))));
  const zoomOut = () => setZoom((z) => clampZoom(Number((z - ZOOM_STEP).toFixed(2))));
  const resetZoom = () => setZoom(MIN_ZOOM);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (zoom <= MIN_ZOOM && viewportRef.current) {
      viewportRef.current.scrollLeft = 0;
      viewportRef.current.scrollTop = 0;
    }
  }, [zoom]);

  return (
    <div className="instruction-viewer-overlay" onClick={onClose}>
      <div
        className="instruction-viewer__frame"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="instruction-viewer">
          <div className="instruction-viewer__header">
            <div className="instruction-viewer__controls">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
              >
                −
              </Button>
              <span className="instruction-viewer__zoom-label" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
              >
                +
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetZoom}>
                Reset
              </Button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="instruction-viewer__close"
              aria-label="Close instructions"
            >
              ×
            </button>
          </div>

          <div ref={viewportRef} className="instruction-viewer__viewport">
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="instruction-viewer__image"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
