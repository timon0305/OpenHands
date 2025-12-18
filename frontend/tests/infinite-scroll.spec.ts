import test, { expect } from "@playwright/test";

/**
 * Test for infinite scroll in the conversation panel.
 *
 * This test verifies that the conversation list loads more conversations
 * when the user scrolls to the bottom of the list.
 */
test.describe("Infinite scroll for conversations", () => {
  test("loads more conversations when scrolling to bottom of conversation panel", async ({
    page,
  }) => {
    await page.goto("/");

    // Open the conversation panel by clicking the toggle button
    const conversationPanelToggle = page.getByTestId("toggle-conversation-panel");
    await expect(conversationPanelToggle).toBeVisible();
    await conversationPanelToggle.click();

    // Wait for the conversation panel to be visible
    const conversationPanel = page.getByTestId("conversation-panel");
    await expect(conversationPanel).toBeVisible();

    // Get the conversation cards container
    const conversationCards = page.getByTestId("conversation-card");

    // Wait for initial conversations to load
    await expect(conversationCards.first()).toBeVisible();

    // Count initial conversations (should be around 20 with default page size)
    const initialCount = await conversationCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Find the scrollable container and scroll to bottom
    // The conversation panel has overflow-auto, so we scroll within it
    await conversationPanel.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait a bit for the infinite scroll to trigger and load more
    await page.waitForTimeout(1000);

    // Count conversations after scrolling
    const afterScrollCount = await conversationCards.count();

    // If there are more conversations available, the count should increase
    // With 50 mock conversations and page size of 20, we should see more after scrolling
    if (initialCount < 50) {
      expect(afterScrollCount).toBeGreaterThan(initialCount);
    }
  });

  test("shows more conversations when clicking View More on home page", async ({
    page,
  }) => {
    await page.goto("/");

    // The recent conversations section should be visible on the home page
    const recentConversations = page.getByTestId("recent-conversations");
    await expect(recentConversations).toBeVisible();

    // Get the conversation cards
    const conversationCards = recentConversations.getByTestId("conversation-card");

    // Wait for initial conversations to load
    await expect(conversationCards.first()).toBeVisible();

    // Count initial conversations (should be 3 by default)
    const initialCount = await conversationCards.count();
    expect(initialCount).toBe(3);

    // Click "View More" to expand the list
    const viewMoreButton = recentConversations.getByText("View More");
    await expect(viewMoreButton).toBeVisible();
    await viewMoreButton.click();

    // Wait for the expansion animation
    await page.waitForTimeout(500);

    // Count conversations after expanding (should be 10)
    const afterExpandCount = await conversationCards.count();
    expect(afterExpandCount).toBe(10);

    // Click "View Less" to collapse the list
    const viewLessButton = recentConversations.getByText("View Less");
    await expect(viewLessButton).toBeVisible();
    await viewLessButton.click();

    // Wait for the collapse animation
    await page.waitForTimeout(500);

    // Count conversations after collapsing (should be back to 3)
    const afterCollapseCount = await conversationCards.count();
    expect(afterCollapseCount).toBe(3);
  });
});
