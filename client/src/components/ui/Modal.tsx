import { useEffect } from "react";
import type { ReactNode } from "react";
import { CloseIcon } from "../icons";
import { useLanguage } from "../../i18n/LanguageContext";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

export function Modal({ title, isOpen, onClose, children, widthClassName = "max-w-lg" }: ModalProps) {
  const { t } = useLanguage();
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label={t("common.close")} onClick={onClose} className="fixed inset-0 bg-slate-900/50" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative max-h-[90vh] w-full ${widthClassName} overflow-hidden rounded-xl bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
