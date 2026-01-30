import React from "react";

export interface SearchResult {
  index: number;
  eventId?: number;
}

export interface UseChatSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (isOpen: boolean) => void;
  searchResults: SearchResult[];
  currentResultIndex: number;
  setCurrentResultIndex: (index: number) => void;
  totalResults: number;
  goToNextResult: () => void;
  goToPreviousResult: () => void;
  clearSearch: () => void;
}

interface UseChatSearchOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  getMessageContent: (message: unknown) => string;
}

export function useChatSearch({
  messages,
  getMessageContent,
}: UseChatSearchOptions): UseChatSearchReturn {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [currentResultIndex, setCurrentResultIndex] = React.useState(0);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    messages.forEach((message, index) => {
      const content = getMessageContent(message);
      if (content.toLowerCase().includes(query)) {
        results.push({
          index,
          eventId: message?.id,
        });
      }
    });

    return results;
  }, [messages, searchQuery, getMessageContent]);

  const totalResults = searchResults.length;

  const goToNextResult = React.useCallback(() => {
    if (totalResults === 0) return;
    setCurrentResultIndex((prev) => (prev + 1) % totalResults);
  }, [totalResults]);

  const goToPreviousResult = React.useCallback(() => {
    if (totalResults === 0) return;
    setCurrentResultIndex((prev) => (prev - 1 + totalResults) % totalResults);
  }, [totalResults]);

  const clearSearch = React.useCallback(() => {
    setSearchQuery("");
    setCurrentResultIndex(0);
    setIsSearchOpen(false);
  }, []);

  // Reset current result index when search results change
  React.useEffect(() => {
    setCurrentResultIndex(0);
  }, [searchResults.length]);

  return {
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchResults,
    currentResultIndex,
    setCurrentResultIndex,
    totalResults,
    goToNextResult,
    goToPreviousResult,
    clearSearch,
  };
}

// Helper function to extract searchable content from V0 events
export function getV0EventContent(event: unknown): string {
  if (!event || typeof event !== "object") return "";

  const evt = event as Record<string, unknown>;
  const contentParts: string[] = [];

  // Check for message content
  if (typeof evt.message === "string") {
    contentParts.push(evt.message);
  }

  // Check for args (action events)
  if (evt.args && typeof evt.args === "object") {
    const args = evt.args as Record<string, unknown>;
    if (typeof args.thought === "string") {
      contentParts.push(args.thought);
    }
    if (typeof args.content === "string") {
      contentParts.push(args.content);
    }
    if (typeof args.command === "string") {
      contentParts.push(args.command);
    }
    if (typeof args.code === "string") {
      contentParts.push(args.code);
    }
    if (typeof args.path === "string") {
      contentParts.push(args.path);
    }
  }

  // Check for content field (observation results)
  if (typeof evt.content === "string") {
    contentParts.push(evt.content);
  }

  // Check for observation field
  if (typeof evt.observation === "string") {
    contentParts.push(evt.observation);
  }

  return contentParts.join(" ");
}

// Helper function to extract searchable content from V1 events
export function getV1EventContent(event: unknown): string {
  if (!event || typeof event !== "object") return "";

  const evt = event as Record<string, unknown>;
  const contentParts: string[] = [];

  // Check for message field (simple text message)
  if (typeof evt.message === "string") {
    contentParts.push(evt.message);
  }

  // Check for llm_message.content (V1 MessageEvent structure)
  if (evt.llm_message && typeof evt.llm_message === "object") {
    const llmMessage = evt.llm_message as Record<string, unknown>;
    if (Array.isArray(llmMessage.content)) {
      for (const item of llmMessage.content) {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          item.type === "text" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          contentParts.push(item.text);
        }
      }
    }
    // Also check for reasoning_content
    if (typeof llmMessage.reasoning_content === "string") {
      contentParts.push(llmMessage.reasoning_content);
    }
  }

  // Check for content field (can be string or array)
  if (typeof evt.content === "string") {
    contentParts.push(evt.content);
  } else if (Array.isArray(evt.content)) {
    for (const item of evt.content) {
      if (
        item &&
        typeof item === "object" &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string"
      ) {
        contentParts.push(item.text);
      }
    }
  }

  // Check for args (action events)
  if (evt.args && typeof evt.args === "object") {
    const args = evt.args as Record<string, unknown>;
    if (typeof args.thought === "string") {
      contentParts.push(args.thought);
    }
    if (typeof args.content === "string") {
      contentParts.push(args.content);
    }
    if (typeof args.command === "string") {
      contentParts.push(args.command);
    }
    if (typeof args.code === "string") {
      contentParts.push(args.code);
    }
    if (typeof args.path === "string") {
      contentParts.push(args.path);
    }
  }

  // Check for observation content
  if (typeof evt.observation === "string") {
    contentParts.push(evt.observation);
  }

  return contentParts.join(" ");
}
