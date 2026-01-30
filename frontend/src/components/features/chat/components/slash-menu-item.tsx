import React from "react";
import { Skill } from "#/api/conversation-service/v1-conversation-service.types";
import { cn } from "#/utils/utils";

interface SlashMenuItemProps {
  skill: Skill;
  isSelected: boolean;
  onClick: () => void;
}

function getSkillTypeLabel(type: Skill["type"]): string {
  switch (type) {
    case "repo":
      return "Repository";
    case "knowledge":
      return "Knowledge";
    case "agentskills":
      return "Agent";
    default:
      return type;
  }
}

function getSkillTypeBadgeColor(type: Skill["type"]): string {
  switch (type) {
    case "repo":
      return "bg-blue-800";
    case "knowledge":
      return "bg-purple-800";
    case "agentskills":
      return "bg-green-800";
    default:
      return "bg-gray-800";
  }
}

export function SlashMenuItem({
  skill,
  isSelected,
  onClick,
}: SlashMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left flex items-center justify-between gap-2 rounded transition-colors",
        isSelected ? "bg-gray-600" : "hover:bg-gray-700",
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-white truncate">
          {skill.name}
        </span>
        {skill.triggers.length > 0 && (
          <span className="text-xs text-gray-400 truncate">
            {skill.triggers[0]}
          </span>
        )}
      </div>
      <span
        className={cn(
          "px-2 py-0.5 text-xs rounded-full text-white shrink-0",
          getSkillTypeBadgeColor(skill.type),
        )}
      >
        {getSkillTypeLabel(skill.type)}
      </span>
    </button>
  );
}
