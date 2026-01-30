import React from "react";
import { OpenHandsEvent } from "#/types/v1/core";
import { EventMessage } from "./event-message";
import { ChatMessage } from "../../features/chat/chat-message";
import { useOptimisticUserMessageStore } from "#/stores/optimistic-user-message-store";
import { usePlanPreviewEvents } from "./hooks/use-plan-preview-events";
import { useChatSearchContext } from "#/context/chat-search-context";
import { cn } from "#/utils/utils";
// TODO: Implement microagent functionality for V1 when APIs support V1 event IDs
// import { AgentState } from "#/types/agent-state";
// import MemoryIcon from "#/icons/memory_icon.svg?react";

interface MessagesProps {
  messages: OpenHandsEvent[]; // UI events (actions replaced by observations)
  allEvents: OpenHandsEvent[]; // Full event history (for action lookup)
}

export const Messages: React.FC<MessagesProps> = React.memo(
  ({ messages, allEvents }) => {
    const { getOptimisticUserMessage } = useOptimisticUserMessageStore();
    const searchContext = useChatSearchContext();

    const optimisticUserMessage = getOptimisticUserMessage();

    // Get the set of event IDs that should render PlanPreview
    // This ensures only one preview per user message "phase"
    const planPreviewEventIds = usePlanPreviewEvents(allEvents);

    // TODO: Implement microagent functionality for V1 if needed
    // For now, we'll skip microagent features

    return (
      <>
        {messages.map((message, index) => {
          const isSearchMatch = searchContext?.searchResultIndices.has(index);
          const isCurrentSearchResult =
            isSearchMatch && searchContext?.currentMessageIndex === index;

          return (
            <div
              key={message.id}
              data-event-index={index}
              className={cn(
                "transition-all duration-200 relative",
                isSearchMatch && "border-l-2 border-yellow-500/50 pl-2",
                isCurrentSearchResult &&
                  "border-l-4 border-yellow-500 bg-yellow-500/10 pl-2 rounded-r-lg",
              )}
            >
              <EventMessage
                event={message}
                messages={allEvents}
                isLastMessage={messages.length - 1 === index}
                isInLast10Actions={messages.length - 1 - index < 10}
                planPreviewEventIds={planPreviewEventIds}
                // Microagent props - not implemented yet for V1
                // microagentStatus={undefined}
                // microagentConversationId={undefined}
                // microagentPRUrl={undefined}
                // actions={undefined}
              />
            </div>
          );
        })}

        {optimisticUserMessage && (
          <ChatMessage type="user" message={optimisticUserMessage} />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Prevent re-renders if messages are the same length
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  },
);

Messages.displayName = "Messages";
