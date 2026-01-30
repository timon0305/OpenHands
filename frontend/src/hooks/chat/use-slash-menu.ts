import { useState, useCallback, useMemo, useEffect } from "react";
import { Skill } from "#/api/conversation-service/v1-conversation-service.types";
import { getTextContent } from "#/components/features/chat/utils/chat-input.utils";

interface UseSlashMenuProps {
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  skills: Skill[] | undefined;
  onSelectSkill?: (skill: Skill) => void;
}

interface UseSlashMenuReturn {
  isOpen: boolean;
  filteredSkills: Skill[];
  selectedIndex: number;
  handleSlashDetection: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  selectSkill: (skill: Skill) => void;
  closeMenu: () => void;
}

/**
 * Hook for managing slash menu state and interactions
 */
export const useSlashMenu = ({
  chatInputRef,
  skills,
  onSelectSkill,
}: UseSlashMenuProps): UseSlashMenuReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slashPosition, setSlashPosition] = useState(-1);

  // Filter skills based on filter text
  const filteredSkills = useMemo(() => {
    if (!skills || skills.length === 0) return [];

    if (!filterText) return skills;

    const lowerFilter = filterText.toLowerCase();
    return skills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerFilter) ||
        skill.triggers.some((trigger) =>
          trigger.toLowerCase().includes(lowerFilter),
        ),
    );
  }, [skills, filterText]);

  // Reset selected index when filtered skills change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSkills]);

  // Close menu handler
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setFilterText("");
    setSelectedIndex(0);
    setSlashPosition(-1);
  }, []);

  // Replace slash and filter text with the skill trigger
  const replaceSlashWithTrigger = useCallback(
    (skill: Skill) => {
      const inputElement = chatInputRef.current;
      if (!inputElement || slashPosition === -1) return;

      const text = getTextContent(inputElement);
      const trigger = skill.triggers[0] || `@${skill.name}`;

      // Build new text: everything before slash + trigger + space
      const beforeSlash = text.slice(0, slashPosition);
      const newText = `${beforeSlash}${trigger} `;

      // Update the input - using a function to avoid param-reassign lint error
      // eslint-disable-next-line no-param-reassign
      inputElement.textContent = newText;

      // Move cursor to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(inputElement);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    },
    [chatInputRef, slashPosition],
  );

  // Select a skill - used by both keyboard and click
  const selectSkill = useCallback(
    (skill: Skill) => {
      replaceSlashWithTrigger(skill);
      onSelectSkill?.(skill);
      closeMenu();
    },
    [replaceSlashWithTrigger, onSelectSkill, closeMenu],
  );

  // Detect slash in input and manage menu state
  const handleSlashDetection = useCallback(() => {
    if (!chatInputRef.current) return;

    const text = getTextContent(chatInputRef.current);

    // Find the last "/" that could trigger the menu
    // It should be at the start or after whitespace
    let lastSlashPos = -1;
    for (let i = text.length - 1; i >= 0; i -= 1) {
      if (text[i] === "/") {
        // Check if it's at start or after whitespace
        if (i === 0 || /\s/.test(text[i - 1])) {
          lastSlashPos = i;
          break;
        }
      }
    }

    if (lastSlashPos !== -1) {
      // Extract filter text (everything after the slash)
      const textAfterSlash = text.slice(lastSlashPos + 1);

      // Only open menu if there's no space after the slash (still typing the command)
      if (!textAfterSlash.includes(" ")) {
        setIsOpen(true);
        setFilterText(textAfterSlash);
        setSlashPosition(lastSlashPos);
        return;
      }
    }

    // Close menu if no valid slash found
    if (isOpen) {
      closeMenu();
    }
  }, [chatInputRef, isOpen, closeMenu]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen) return false;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredSkills.length - 1 ? prev + 1 : 0,
          );
          return true;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSkills.length - 1,
          );
          return true;

        case "Enter":
        case "Tab": {
          const selectedSkill = filteredSkills[selectedIndex];
          if (selectedSkill) {
            e.preventDefault();
            selectSkill(selectedSkill);
            return true;
          }
          return false;
        }

        case "Escape":
          e.preventDefault();
          closeMenu();
          return true;

        default:
          return false;
      }
    },
    [isOpen, filteredSkills, selectedIndex, selectSkill, closeMenu],
  );

  return {
    isOpen,
    filteredSkills,
    selectedIndex,
    handleSlashDetection,
    handleKeyDown,
    selectSkill,
    closeMenu,
  };
};
