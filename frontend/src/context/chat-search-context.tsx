import React from "react";

interface ChatSearchContextValue {
  searchQuery: string;
  currentMessageIndex: number | null; // The actual message index that is currently selected
  searchResultIndices: Set<number>;
}

const ChatSearchContext = React.createContext<ChatSearchContextValue | null>(
  null,
);

interface ChatSearchProviderProps {
  searchQuery: string;
  currentResultIndex: number; // Position within searchResultIndices array
  searchResultIndices: number[]; // Array of message indices that match
  children: React.ReactNode;
}

export function ChatSearchProvider({
  searchQuery,
  currentResultIndex,
  searchResultIndices,
  children,
}: ChatSearchProviderProps) {
  const value = React.useMemo(
    () => ({
      searchQuery,
      // Get the actual message index from the search results array
      currentMessageIndex:
        searchResultIndices.length > 0
          ? (searchResultIndices[currentResultIndex] ?? null)
          : null,
      searchResultIndices: new Set(searchResultIndices),
    }),
    [searchQuery, currentResultIndex, searchResultIndices],
  );

  return (
    <ChatSearchContext.Provider value={value}>
      {children}
    </ChatSearchContext.Provider>
  );
}

export function useChatSearchContext() {
  return React.useContext(ChatSearchContext);
}
