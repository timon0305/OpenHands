import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Skill } from "#/api/conversation-service/v1-conversation-service.types";
import { I18nKey } from "#/i18n/declaration";
import { SlashMenuItem } from "./slash-menu-item";

interface SlashMenuProps {
  isOpen: boolean;
  skills: Skill[];
  selectedIndex: number;
  onSelect: (skill: Skill) => void;
  onClose: () => void;
}

export function SlashMenu({
  isOpen,
  skills,
  selectedIndex,
  onSelect,
  onClose,
}: SlashMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && menuRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add listener with a small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-tertiary rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50"
      data-testid="slash-menu"
    >
      <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
        {skills.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-400 text-sm">
            {t(I18nKey.SLASH_MENU$NO_SKILLS_FOUND)}
          </div>
        ) : (
          <div className="space-y-0.5">
            {skills.map((skill, index) => (
              <div
                key={skill.name}
                ref={index === selectedIndex ? selectedItemRef : undefined}
              >
                <SlashMenuItem
                  skill={skill}
                  isSelected={index === selectedIndex}
                  onClick={() => onSelect(skill)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
