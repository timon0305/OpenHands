import React from "react";
import { DragOver } from "../drag-over";
import { UploadedFiles } from "../uploaded-files";
import { ChatInputRow } from "./chat-input-row";
import { ChatInputActions } from "./chat-input-actions";
import { SlashMenu } from "./slash-menu";
import { useConversationStore } from "#/stores/conversation-store";
import { cn } from "#/utils/utils";
import { Skill } from "#/api/conversation-service/v1-conversation-service.types";

interface ChatInputContainerProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
  disabled: boolean;
  showButton: boolean;
  buttonClassName: string;
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  handleResumeAgent: () => void;
  onDragOver: (e: React.DragEvent, isDisabled: boolean) => void;
  onDragLeave: (e: React.DragEvent, isDisabled: boolean) => void;
  onDrop: (e: React.DragEvent, isDisabled: boolean) => void;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  // Slash menu props
  isSlashMenuOpen?: boolean;
  slashMenuSkills?: Skill[];
  slashMenuSelectedIndex?: number;
  onSlashMenuSelect?: (skill: Skill) => void;
  onSlashMenuClose?: () => void;
}

export function ChatInputContainer({
  chatContainerRef,
  isDragOver,
  disabled,
  showButton,
  buttonClassName,
  chatInputRef,
  handleFileIconClick,
  handleSubmit,
  handleResumeAgent,
  onDragOver,
  onDragLeave,
  onDrop,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
  isSlashMenuOpen = false,
  slashMenuSkills = [],
  slashMenuSelectedIndex = 0,
  onSlashMenuSelect,
  onSlashMenuClose,
}: ChatInputContainerProps) {
  const conversationMode = useConversationStore(
    (state) => state.conversationMode,
  );

  return (
    <div
      ref={chatContainerRef}
      className={cn(
        "bg-[#25272D] box-border content-stretch flex flex-col items-start justify-center p-4 pt-3 relative rounded-[15px] w-full",
        conversationMode === "plan" && "border border-[#597FF4]",
      )}
      onDragOver={(e) => onDragOver(e, disabled)}
      onDragLeave={(e) => onDragLeave(e, disabled)}
      onDrop={(e) => onDrop(e, disabled)}
    >
      {/* Slash Menu */}
      {onSlashMenuSelect && onSlashMenuClose && (
        <SlashMenu
          isOpen={isSlashMenuOpen}
          skills={slashMenuSkills}
          selectedIndex={slashMenuSelectedIndex}
          onSelect={onSlashMenuSelect}
          onClose={onSlashMenuClose}
        />
      )}

      {/* Drag Over UI */}
      {isDragOver && <DragOver />}

      <UploadedFiles />

      <ChatInputRow
        chatInputRef={chatInputRef}
        disabled={disabled}
        showButton={showButton}
        buttonClassName={buttonClassName}
        handleFileIconClick={handleFileIconClick}
        handleSubmit={handleSubmit}
        onInput={onInput}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
      />

      <ChatInputActions
        disabled={disabled}
        handleResumeAgent={handleResumeAgent}
      />
    </div>
  );
}
