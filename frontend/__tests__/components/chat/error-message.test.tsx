import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ErrorMessage } from "#/components/features/chat/error-message";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("#/i18n", () => ({
  default: {
    exists: (key: string) => key === "VALID_ERROR_ID",
  },
}));

describe("ErrorMessage", () => {
  it("should render the error message with collapsed details by default", () => {
    render(<ErrorMessage defaultMessage="Test error message" />);

    expect(
      screen.getByText("CHAT_INTERFACE$AGENT_ERROR_MESSAGE"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
  });

  it("should show details when expand button is clicked", async () => {
    const user = userEvent.setup();
    render(<ErrorMessage defaultMessage="Test error message" />);

    const expandButton = screen.getByRole("button");
    await user.click(expandButton);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should hide details when collapse button is clicked", async () => {
    const user = userEvent.setup();
    render(<ErrorMessage defaultMessage="Test error message" />);

    const expandButton = screen.getByRole("button");
    await user.click(expandButton);
    expect(screen.getByText("Test error message")).toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
  });

  it("should use valid translation key when errorId exists in i18n", () => {
    render(
      <ErrorMessage errorId="VALID_ERROR_ID" defaultMessage="Test error" />,
    );

    expect(screen.getByText("VALID_ERROR_ID")).toBeInTheDocument();
  });

  it("should use default translation key when errorId does not exist in i18n", () => {
    render(
      <ErrorMessage errorId="INVALID_ERROR_ID" defaultMessage="Test error" />,
    );

    expect(
      screen.getByText("CHAT_INTERFACE$AGENT_ERROR_MESSAGE"),
    ).toBeInTheDocument();
  });

  it("should truncate very long error messages", async () => {
    const user = userEvent.setup();
    const longMessage = "a".repeat(6000);
    render(<ErrorMessage defaultMessage={longMessage} />);

    const expandButton = screen.getByRole("button");
    await user.click(expandButton);

    expect(
      screen.getByText(/Message truncated - 6,000 characters total/),
    ).toBeInTheDocument();
  });

  it("should not truncate messages under the limit", async () => {
    const user = userEvent.setup();
    const shortMessage = "a".repeat(100);
    render(<ErrorMessage defaultMessage={shortMessage} />);

    const expandButton = screen.getByRole("button");
    await user.click(expandButton);

    expect(
      screen.queryByText(/Message truncated/),
    ).not.toBeInTheDocument();
  });

  it("should have scrollable container for error details", async () => {
    const user = userEvent.setup();
    render(<ErrorMessage defaultMessage="Test error message" />);

    const expandButton = screen.getByRole("button");
    await user.click(expandButton);

    // Find the scrollable container by its classes
    const scrollableContainer = document.querySelector(
      ".max-h-\\[300px\\].overflow-y-auto",
    );
    expect(scrollableContainer).toBeInTheDocument();
  });
});
