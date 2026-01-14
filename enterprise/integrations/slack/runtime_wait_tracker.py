"""Tracks and limits concurrent runtime wait operations for Slack follow-up messages.

This module provides:
1. A configurable limit on concurrent waiting coroutines
2. Prometheus metrics for monitoring wait operations in production
"""

import os
from contextlib import asynccontextmanager

from prometheus_client import Counter, Gauge

from openhands.core.logger import openhands_logger as logger

# Configuration: Maximum concurrent runtime wait operations
# Can be overridden via environment variable
MAX_CONCURRENT_RUNTIME_WAITS = int(
    os.environ.get('SLACK_MAX_CONCURRENT_RUNTIME_WAITS', '100')
)

# Prometheus metrics
RUNTIME_WAIT_CURRENT = Gauge(
    'slack_runtime_wait_current',
    'Current number of Slack follow-up messages waiting for runtime to be ready',
)

RUNTIME_WAIT_TOTAL = Counter(
    'slack_runtime_wait_total',
    'Total number of Slack follow-up messages that started waiting for runtime',
)

RUNTIME_WAIT_COMPLETED = Counter(
    'slack_runtime_wait_completed',
    'Total number of Slack follow-up messages that successfully waited for runtime',
    ['status'],  # 'success', 'timeout', 'rejected'
)

# Internal counter for tracking concurrent waits
_current_wait_count = 0


class TooManyWaitingError(Exception):
    """Raised when the maximum number of concurrent runtime waits is exceeded."""

    pass


@asynccontextmanager
async def track_runtime_wait():
    """Context manager to track runtime wait operations.

    Raises:
        TooManyWaitingError: If the maximum concurrent wait limit is exceeded.

    Usage:
        async with track_runtime_wait():
            await _wait_for_runtime_ready(...)
    """
    global _current_wait_count

    if _current_wait_count >= MAX_CONCURRENT_RUNTIME_WAITS:
        RUNTIME_WAIT_COMPLETED.labels(status='rejected').inc()
        logger.error(
            f'Slack runtime wait rejected: {_current_wait_count} already waiting '
            f'(max: {MAX_CONCURRENT_RUNTIME_WAITS})'
        )
        raise TooManyWaitingError(
            'Something went wrong. Please try again later.'
        )

    _current_wait_count += 1
    RUNTIME_WAIT_CURRENT.set(_current_wait_count)
    RUNTIME_WAIT_TOTAL.inc()

    logger.info(f'Slack runtime wait started: {_current_wait_count} now waiting')

    try:
        yield
        RUNTIME_WAIT_COMPLETED.labels(status='success').inc()
    except Exception as e:
        # Determine if this was a timeout or other error
        if 'taking too long' in str(e):
            RUNTIME_WAIT_COMPLETED.labels(status='timeout').inc()
        else:
            RUNTIME_WAIT_COMPLETED.labels(status='error').inc()
        raise
    finally:
        _current_wait_count -= 1
        RUNTIME_WAIT_CURRENT.set(_current_wait_count)
        logger.info(f'Slack runtime wait ended: {_current_wait_count} now waiting')


def get_current_wait_count() -> int:
    """Get the current number of waiting coroutines (for testing/debugging)."""
    return _current_wait_count


def get_max_concurrent_waits() -> int:
    """Get the configured maximum concurrent waits (for testing/debugging)."""
    return MAX_CONCURRENT_RUNTIME_WAITS
