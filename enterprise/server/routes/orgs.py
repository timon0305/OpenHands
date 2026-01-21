from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from server.email_validation import get_admin_user_id
from server.routes.org_models import (
    LiteLLMIntegrationError,
    OrgAuthorizationError,
    OrgCreate,
    OrgDatabaseError,
    OrgNameExistsError,
    OrgNotFoundError,
    OrgResponse,
)
from storage.org_service import OrgService

from openhands.core.logger import openhands_logger as logger

# Initialize API router
org_router = APIRouter(prefix='/api/organizations')


@org_router.post('', response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    org_data: OrgCreate,
    user_id: str = Depends(get_admin_user_id),
) -> OrgResponse:
    """Create a new organization.

    This endpoint allows authenticated users with @openhands.dev email to create
    a new organization. The user who creates the organization automatically becomes
    its owner.

    Args:
        org_data: Organization creation data
        user_id: Authenticated user ID (injected by dependency)

    Returns:
        OrgResponse: The created organization details

    Raises:
        HTTPException: 403 if user email domain is not @openhands.dev
        HTTPException: 409 if organization name already exists
        HTTPException: 500 if creation fails
    """
    logger.info(
        'Creating new organization',
        extra={
            'user_id': user_id,
            'org_name': org_data.name,
        },
    )

    try:
        # Use service layer to create organization
        org = await OrgService.create_org_with_owner(
            name=org_data.name,
            contact_name=org_data.contact_name,
            contact_email=org_data.contact_email,
            user_id=user_id,
        )

        # Retrieve credits from LiteLLM
        credits = await OrgService.get_org_credits(user_id, org.id)

        return OrgResponse(
            id=str(org.id),
            name=org.name,
            contact_name=org.contact_name,
            contact_email=org.contact_email,
            conversation_expiration=org.conversation_expiration,
            agent=org.agent,
            default_max_iterations=org.default_max_iterations,
            security_analyzer=org.security_analyzer,
            confirmation_mode=org.confirmation_mode,
            default_llm_model=org.default_llm_model,
            default_llm_base_url=org.default_llm_base_url,
            remote_runtime_resource_factor=org.remote_runtime_resource_factor,
            enable_default_condenser=org.enable_default_condenser,
            billing_margin=org.billing_margin,
            enable_proactive_conversation_starters=org.enable_proactive_conversation_starters,
            sandbox_base_container_image=org.sandbox_base_container_image,
            sandbox_runtime_container_image=org.sandbox_runtime_container_image,
            org_version=org.org_version,
            mcp_config=org.mcp_config,
            max_budget_per_task=org.max_budget_per_task,
            enable_solvability_analysis=org.enable_solvability_analysis,
            v1_enabled=org.v1_enabled,
            credits=credits,
        )
    except OrgNameExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )
    except LiteLLMIntegrationError as e:
        logger.error(
            'LiteLLM integration failed',
            extra={'user_id': user_id, 'error': str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to create LiteLLM integration',
        )
    except OrgDatabaseError as e:
        logger.error(
            'Database operation failed',
            extra={'user_id': user_id, 'error': str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to create organization',
        )
    except Exception as e:
        logger.exception(
            'Unexpected error creating organization',
            extra={'user_id': user_id, 'error': str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='An unexpected error occurred',
        )


@org_router.delete('/{org_id}', status_code=status.HTTP_200_OK)
async def delete_org(
    org_id: UUID,
    user_id: str = Depends(get_admin_user_id),
) -> dict:
    """Delete an organization.

    This endpoint allows authenticated organization owners to delete their organization.
    All associated data including organization members, conversations, billing data,
    and external LiteLLM team resources will be permanently removed.

    Args:
        org_id: Organization ID to delete
        user_id: Authenticated user ID (injected by dependency)

    Returns:
        dict: Confirmation message with deleted organization details

    Raises:
        HTTPException: 403 if user is not the organization owner
        HTTPException: 404 if organization not found
        HTTPException: 500 if deletion fails
    """
    logger.info(
        'Organization deletion requested',
        extra={
            'user_id': user_id,
            'org_id': str(org_id),
        },
    )

    try:
        # Use service layer to delete organization with cleanup
        deleted_org = await OrgService.delete_org_with_cleanup(
            user_id=user_id,
            org_id=org_id,
        )

        logger.info(
            'Organization deletion completed successfully',
            extra={
                'user_id': user_id,
                'org_id': str(org_id),
                'org_name': deleted_org.name,
            },
        )

        return {
            'message': 'Organization deleted successfully',
            'organization': {
                'id': str(deleted_org.id),
                'name': deleted_org.name,
                'contact_name': deleted_org.contact_name,
                'contact_email': deleted_org.contact_email,
            },
        }

    except OrgNotFoundError as e:
        logger.warning(
            'Organization not found for deletion',
            extra={'user_id': user_id, 'org_id': str(org_id)},
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except OrgAuthorizationError as e:
        logger.warning(
            'User not authorized to delete organization',
            extra={'user_id': user_id, 'org_id': str(org_id)},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except OrgDatabaseError as e:
        logger.error(
            'Database error during organization deletion',
            extra={'user_id': user_id, 'org_id': str(org_id), 'error': str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to delete organization',
        )
    except Exception as e:
        logger.exception(
            'Unexpected error during organization deletion',
            extra={'user_id': user_id, 'org_id': str(org_id), 'error': str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='An unexpected error occurred',
        )
