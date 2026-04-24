"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ startY: 0, currentY: 0, dragging: false });

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Swipe-to-close touch handlers
  function onTouchStart(e: React.TouchEvent) {
    const sheet = sheetRef.current;
    if (!sheet) return;
    // Only initiate drag when the sheet is not scrolled down
    if (sheet.scrollTop > 0) return;
    dragState.current = { startY: e.touches[0].clientY, currentY: 0, dragging: true };
    sheet.style.transition = "none";
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragState.current.dragging) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    // If user scrolls up inside the sheet, cancel drag
    if (sheet.scrollTop > 0) {
      dragState.current.dragging = false;
      sheet.style.transform = "";
      return;
    }
    const delta = e.touches[0].clientY - dragState.current.startY;
    if (delta < 0) return; // don't allow dragging upward
    dragState.current.currentY = delta;
    sheet.style.transform = `translateY(${delta}px)`;
  }

  function onTouchEnd() {
    if (!dragState.current.dragging) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    dragState.current.dragging = false;
    const delta = dragState.current.currentY;

    if (delta > 80) {
      // Animate out then close
      sheet.style.transition = "transform 0.22s ease-in";
      sheet.style.transform = `translateY(100%)`;
      setTimeout(onClose, 220);
    } else {
      // Snap back
      sheet.style.transition = "transform 0.25s cubic-bezier(0.32,0.72,0,1)";
      sheet.style.transform = "";
    }
  }

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        className="sl-sheet-overlay absolute inset-0 bg-black/60 backdrop-blur-[4px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          "sl-sheet-content relative max-h-[92dvh] overflow-y-auto rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] pb-[max(32px,env(safe-area-inset-bottom))]",
          className,
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="h-[4px] w-9 rounded-full"
            style={{ background: "rgba(128,128,128,0.25)" }}
          />
        </div>

        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
