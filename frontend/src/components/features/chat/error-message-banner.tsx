/* eslint-disable i18next/no-literal-string */

import React from "react";
import { Trans } from "react-i18next";
import { Link } from "react-router";
import ArrowDown from "#/icons/angle-down-solid.svg?react";
import ArrowUp from "#/icons/angle-up-solid.svg?react";
import CloseIcon from "#/icons/u-close.svg?react";
import i18n from "#/i18n";
import { useErrorMessageStore } from "#/stores/error-message-store";

interface ErrorMessageBannerProps {
  message: string;
  truncateAt?: number;
}

const DEFAULT_TRUNCATE_AT = 500;

export function ErrorMessageBanner({
  message,
  truncateAt = DEFAULT_TRUNCATE_AT,
}: ErrorMessageBannerProps) {
  const { removeErrorMessage } = useErrorMessageStore();
  const [expanded, setExpanded] = React.useState(false);

  const shouldTruncate = message.length > truncateAt;
  const displayMessage =
    !expanded && shouldTruncate ? `${message.slice(0, truncateAt)}…` : message;

  return (
    <div className="w-full rounded-lg p-3 text-black border border-red-800 bg-red-500">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {i18n.exists(message) ? (
            <Trans
              i18nKey={message}
              components={{
                a: (
                  <Link
                    className="underline font-bold cursor-pointer"
                    to="/settings/billing"
                  >
                    link
                  </Link>
                ),
              }}
            />
          ) : (
            <div
              className={
                expanded
                  ? "whitespace-pre-wrap break-words max-h-48 overflow-y-auto"
                  : "whitespace-pre-wrap break-words"
              }
            >
              {displayMessage}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Dismiss error"
          className="shrink-0 rounded hover:bg-red-600 p-1"
          onClick={removeErrorMessage}
        >
          <CloseIcon className="h-4 w-4 fill-black" />
        </button>
      </div>

      {!i18n.exists(message) && shouldTruncate && (
        <button
          type="button"
          className="mt-2 text-sm underline font-bold"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <>
              Show less <ArrowUp className="h-4 w-4 ml-1 inline fill-black" />
            </>
          ) : (
            <>
              Show more <ArrowDown className="h-4 w-4 ml-1 inline fill-black" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
