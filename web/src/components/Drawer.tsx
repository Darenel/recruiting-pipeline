import { useEffect, useId, useRef } from "react";

type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="drawer-backdrop" onMouseDown={onClose} role="presentation">
      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className="drawer-panel"
        onMouseDown={(event) => event.stopPropagation()}
        ref={ref}
        role="dialog"
        tabIndex={-1}
      >
        <header className="drawer-header">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="Close" className="ghost icon-button" onClick={onClose} type="button">
            x
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}
