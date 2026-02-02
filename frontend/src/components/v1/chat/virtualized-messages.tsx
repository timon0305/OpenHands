import React, { useCallback, useRef, useEffect } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { OpenHandsEvent } from "#/types/v1/core";
import { EventMessage } from "./event-message";
import { ChatMessage } from "../../features/chat/chat-message";
import { useOptimisticUserMessageStore } from "#/stores/optimistic-user-message-store";
import { usePlanPreviewEvents } from "./hooks/use-plan-preview-events";

// Threshold for enabling virtualization (only for conversations with many events)
const VIRTUALIZATION_THRESHOLD = 100;

interface VirtualizedMessagesProps {
  messages: OpenHandsEvent[]; // UI events (actions replaced by observations)
  allEvents: OpenHandsEvent[]; // Full event history (for action lookup)
  // Custom scroll parent for integrating with existing scroll container
  scrollParent?: HTMLElement | null;
  // Scroll control props from useScrollToBottom
  autoScroll?: boolean;
  setAutoScroll?: (value: boolean) => void;
  setHitBottom?: (value: boolean) => void;
}

/**
 * Virtualized message list for V1 conversations.
 * Uses react-virtuoso for efficient rendering of long conversations (100+ events).
 * Falls back to regular rendering for shorter conversations.
 */
export const VirtualizedMessages: React.FC<VirtualizedMessagesProps> =
  React.memo(
    ({
      messages,
      allEvents,
      scrollParent,
      autoScroll = true,
      setAutoScroll,
      setHitBottom,
    }) => {
      const { getOptimisticUserMessage } = useOptimisticUserMessageStore();
      const optimisticUserMessage = getOptimisticUserMessage();
      const virtuosoRef = useRef<VirtuosoHandle>(null);
      const isUserScrollingRef = useRef(false);

      // Get the set of event IDs that should render PlanPreview
      const planPreviewEventIds = usePlanPreviewEvents(allEvents);

      // Determine if we should use virtualization based on message count
      const shouldVirtualize = messages.length >= VIRTUALIZATION_THRESHOLD;

      // Handle scroll state changes from Virtuoso
      const handleAtBottomStateChange = useCallback(
        (atBottom: boolean) => {
          setHitBottom?.(atBottom);
          // Only enable autoscroll when user scrolls to bottom
          if (atBottom && isUserScrollingRef.current) {
            setAutoScroll?.(true);
          }
        },
        [setHitBottom, setAutoScroll],
      );

      // Track user scroll intent
      const handleScrollerStateChange = useCallback((isScrolling: boolean) => {
        isUserScrollingRef.current = isScrolling;
      }, []);

      // Auto-scroll to bottom when new messages arrive and autoScroll is enabled
      useEffect(() => {
        if (autoScroll && shouldVirtualize && virtuosoRef.current) {
          virtuosoRef.current.scrollToIndex({
            index: messages.length - 1,
            align: "end",
            behavior: "auto",
          });
        }
      }, [messages.length, autoScroll, shouldVirtualize]);

      // Render a single message item
      const itemContent = useCallback(
        (index: number) => {
          const message = messages[index];
          if (!message) return null;

          return (
            <EventMessage
              key={message.id}
              event={message}
              messages={allEvents}
              isLastMessage={messages.length - 1 === index}
              isInLast10Actions={messages.length - 1 - index < 10}
              planPreviewEventIds={planPreviewEventIds}
            />
          );
        },
        [messages, allEvents, planPreviewEventIds],
      );

      // For short conversations, use simple rendering (no virtualization overhead)
      if (!shouldVirtualize) {
        return (
          <>
            {messages.map((message, index) => (
              <EventMessage
                key={message.id}
                event={message}
                messages={allEvents}
                isLastMessage={messages.length - 1 === index}
                isInLast10Actions={messages.length - 1 - index < 10}
                planPreviewEventIds={planPreviewEventIds}
              />
            ))}

            {optimisticUserMessage && (
              <ChatMessage type="user" message={optimisticUserMessage} />
            )}
          </>
        );
      }

      // For long conversations, use virtualization
      return (
        <>
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            itemContent={itemContent}
            // Use custom scroll parent from chat-interface
            customScrollParent={scrollParent || undefined}
            // Follow new items when at bottom
            followOutput={(isAtBottom: boolean) => {
              if (isAtBottom && autoScroll) {
                return "smooth";
              }
              return false;
            }}
            // Track bottom state for scroll-to-bottom button
            atBottomStateChange={handleAtBottomStateChange}
            atBottomThreshold={20}
            // Track scrolling state
            isScrolling={handleScrollerStateChange}
            // Increase overscan for smoother scrolling
            overscan={200}
            // Estimate initial item size for better scroll positioning
            defaultItemHeight={100}
            // Start at the bottom for chat-like behavior
            alignToBottom
            initialTopMostItemIndex={messages.length - 1}
          />

          {optimisticUserMessage && (
            <ChatMessage type="user" message={optimisticUserMessage} />
          )}
        </>
      );
    },
    (prevProps, nextProps) => {
      // Custom comparison - re-render when messages change
      if (prevProps.messages.length !== nextProps.messages.length) {
        return false;
      }
      if (prevProps.autoScroll !== nextProps.autoScroll) {
        return false;
      }
      if (prevProps.scrollParent !== nextProps.scrollParent) {
        return false;
      }
      return true;
    },
  );

VirtualizedMessages.displayName = "VirtualizedMessages";
