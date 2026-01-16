"""
Email domain validation utilities for enterprise endpoints.
"""

from fastapi import Depends, HTTPException, Request, status

from openhands.core.logger import openhands_logger as logger
from openhands.server.user_auth import get_user_auth, get_user_id


async def get_openhands_user_id(
    request: Request, user_id: str | None = Depends(get_user_id)
) -> str:
    """
    Dependency that validates user has @openhands.dev email domain.

    This dependency can be used in place of get_user_id for endpoints that
    should only be accessible to users with @openhands.dev email addresses.

    Args:
        request: FastAPI request object
        user_id: User ID from get_user_id dependency

    Returns:
        str: User ID if email domain is valid

    Raises:
        HTTPException: 403 if email domain is not @openhands.dev
        HTTPException: 401 if user is not authenticated

    Example:
        @router.post('/endpoint')
        async def create_resource(
            user_id: str = Depends(get_openhands_user_id),
        ):
            # Only @openhands.dev users can access this endpoint
            pass
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User not authenticated',
        )

    user_auth = await get_user_auth(request)
    user_email = await user_auth.get_user_email()

    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='User email not available',
        )

    if not user_email.endswith('@openhands.dev'):
        logger.warning(
            'Access denied - invalid email domain',
            extra={'user_id': user_id, 'email_domain': user_email.split('@')[-1]},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Access restricted to @openhands.dev users',
        )

    return user_id
