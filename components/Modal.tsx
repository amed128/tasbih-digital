"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
};

export function Modal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  closeOnOverlayClick = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          key="modal-overlay"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (closeOnOverlayClick) onClose();
            }}
          />
          <motion.div
            key="modal-card"
            className="relative w-[min(92vw,420px)] rounded-2xl bg-[#1A1A1A] p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white/10 p-2 text-sm text-white transition hover:bg-white/20"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">{children}</div>
            {footer ? <div className="mt-6">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
