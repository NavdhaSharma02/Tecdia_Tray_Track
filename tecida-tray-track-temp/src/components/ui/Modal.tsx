"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Modal overlay dialog using design system classes.
 */
export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div
            className="flex items-center justify-between mb-6"
            style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ width: 36, height: 36, padding: 0, borderRadius: "50%" }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
