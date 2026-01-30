import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "#/utils/utils";
import SearchIcon from "#/icons/search.svg?react";
import CloseIcon from "#/icons/close.svg?react";
import ArrowUpIcon from "#/icons/u-arrow-up.svg?react";
import ArrowDownIcon from "#/icons/u-arrow-down.svg?react";
import { I18nKey } from "#/i18n/declaration";

interface ChatSearchInputProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  totalResults: number;
  currentResultIndex: number;
  onNextResult: () => void;
  onPreviousResult: () => void;
}

export function ChatSearchInput({
  isOpen,
  searchQuery,
  onSearchChange,
  onClose,
  totalResults,
  currentResultIndex,
  onNextResult,
  onPreviousResult,
}: ChatSearchInputProps) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          onPreviousResult();
        } else {
          onNextResult();
        }
      } else if (e.key === "F3" || (e.ctrlKey && e.key === "g")) {
        e.preventDefault();
        if (e.shiftKey) {
          onPreviousResult();
        } else {
          onNextResult();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNextResult, onPreviousResult]);

  if (!isOpen) return null;

  return (
    <div className="sticky top-0 z-10 bg-base-secondary border-b border-neutral-600 px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 bg-neutral-700 rounded-lg px-3 py-1.5">
          <SearchIcon className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(I18nKey.CHAT$SEARCH_PLACEHOLDER)}
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-400 outline-none"
          />
          {searchQuery && (
            <span className="text-xs text-neutral-400 flex-shrink-0">
              {totalResults > 0
                ? `${currentResultIndex + 1}/${totalResults}`
                : t(I18nKey.CHAT$NO_RESULTS)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPreviousResult}
            disabled={totalResults === 0}
            className={cn(
              "p-1.5 rounded hover:bg-neutral-700 transition-colors",
              totalResults === 0 && "opacity-50 cursor-not-allowed",
            )}
            title={t(I18nKey.CHAT$PREVIOUS_RESULT)}
          >
            <ArrowUpIcon className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={onNextResult}
            disabled={totalResults === 0}
            className={cn(
              "p-1.5 rounded hover:bg-neutral-700 transition-colors",
              totalResults === 0 && "opacity-50 cursor-not-allowed",
            )}
            title={t(I18nKey.CHAT$NEXT_RESULT)}
          >
            <ArrowDownIcon className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-neutral-700 transition-colors"
            title={t(I18nKey.BUTTON$CLOSE)}
          >
            <CloseIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
