import { createContext, useCallback, useContext, useRef, useState } from "react";

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={"animate-spin " + className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Loading({ text = "Loading..." }) {
  return (
    <p className="flex items-center gap-2 text-ink/50" role="status">
      <Spinner /> {text}
    </p>
  );
}

const VARIANT = {
  dark: "rounded-full bg-ink text-white",
  berry: "rounded-full bg-berry text-white hover:opacity-90",
  outline: "rounded-full border border-line hover:border-ink",
  text: "text-ink/60 hover:text-red-700",
};
const SIZE = {
  sm: "px-4 py-1.5 text-sm font-medium",
  md: "px-6 py-2.5 font-medium",
  lg: "w-full py-3.5 font-medium",
};

// A button that shows a spinner and a "working" label while busy.
export function Btn({ variant = "dark", size = "sm", busy = false, busyLabel, disabled, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={busy || disabled}
      className={
        "inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-50 " +
        VARIANT[variant] + " " + SIZE[size] + " " + className
      }
    >
      {busy && <Spinner />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const toast = useCallback((text, type = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, text, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "pointer-events-auto rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg " +
              (t.type === "error" ? "bg-red-700" : "bg-ink")
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);