"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check } from "lucide-react";

const TOAST_MS = 1800;
const BUTTON_MS = 1600;

const CartFeedbackContext = createContext<{ notifyAdded: () => void } | null>(null);

export function useCartFeedback() {
  return useContext(CartFeedbackContext);
}

/** Toast plus momentary button state used by add-to-cart controls. */
export function useAddToCartFeedback() {
  const feedback = useCartFeedback();
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const notifyAdded = useCallback(() => {
    feedback?.notifyAdded();
    setAdded(true);
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setAdded(false), BUTTON_MS);
  }, [feedback]);

  return { added, notifyAdded };
}

export function CartFeedbackProvider({
  children,
  toastClass,
}: {
  children: ReactNode;
  toastClass: string;
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const notifyAdded = useCallback(() => {
    setVisible(true);
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(false), TOAST_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <CartFeedbackContext.Provider value={{ notifyAdded }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {visible ? (
          <p className={toastClass}>
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
            Added to cart
          </p>
        ) : null}
      </div>
    </CartFeedbackContext.Provider>
  );
}
