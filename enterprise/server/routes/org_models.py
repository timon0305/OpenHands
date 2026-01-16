from pydantic import BaseModel, field_validator


class OrgCreationError(Exception):
    """Base exception for organization creation errors."""

    pass


class OrgNameExistsError(OrgCreationError):
    """Raised when an organization name already exists."""

    def __init__(self, name: str):
        self.name = name
        super().__init__(f'Organization with name "{name}" already exists')


class LiteLLMIntegrationError(OrgCreationError):
    """Raised when LiteLLM integration fails."""

    pass


class OrgDatabaseError(OrgCreationError):
    """Raised when database operations fail."""

    pass


class OrgCreate(BaseModel):
    """Request model for creating a new organization."""

    # Required fields
    name: str
    contact_name: str
    contact_email: str

    @field_validator('name')
    def validate_name(cls, v):
        """Validate organization name."""
        if not v or not v.strip():
            raise ValueError('Organization name cannot be empty')
        if len(v) > 255:
            raise ValueError('Organization name must be 255 characters or less')
        return v.strip()

    @field_validator('contact_email')
    def validate_email(cls, v):
        """Validate email format."""
        if not v or '@' not in v:
            raise ValueError('Invalid email address')
        return v.strip()


class OrgUpdate(BaseModel):
    """Request model for updating an organization."""

    # Basic organization information (any authenticated user can update)
    contact_name: str | None = None
    contact_email: str | None = None
    conversation_expiration: int | None = None
    default_max_iterations: int | None = None
    remote_runtime_resource_factor: int | None = None
    billing_margin: float | None = None
    enable_proactive_conversation_starters: bool | None = None
    sandbox_base_container_image: str | None = None
    sandbox_runtime_container_image: str | None = None
    mcp_config: dict | None = None
    sandbox_api_key: str | None = None
    max_budget_per_task: float | None = None
    enable_solvability_analysis: bool | None = None
    v1_enabled: bool | None = None

    # LLM settings (require admin/owner role)
    default_llm_model: str | None = None
    default_llm_api_key_for_byor: str | None = None
    default_llm_base_url: str | None = None
    search_api_key: str | None = None
    security_analyzer: str | None = None
    agent: str | None = None
    confirmation_mode: bool | None = None
    enable_default_condenser: bool | None = None
    condenser_max_size: int | None = None

    @field_validator('contact_email')
    @classmethod
    def validate_email(cls, v):
        """Validate email format if provided."""
        if v is not None and v.strip() and '@' not in v:
            raise ValueError('Invalid email address')
        return v.strip() if v else v

    @field_validator('default_max_iterations')
    @classmethod
    def validate_max_iterations(cls, v):
        """Validate max iterations is positive if provided."""
        if v is not None and v <= 0:
            raise ValueError('Max iterations must be positive')
        return v

    @field_validator('remote_runtime_resource_factor')
    @classmethod
    def validate_resource_factor(cls, v):
        """Validate resource factor is positive if provided."""
        if v is not None and v <= 0:
            raise ValueError('Resource factor must be positive')
        return v

    @field_validator('billing_margin')
    @classmethod
    def validate_billing_margin(cls, v):
        """Validate billing margin is between 0 and 1 if provided."""
        if v is not None and not (0 <= v <= 1):
            raise ValueError('Billing margin must be between 0 and 1')
        return v

    @field_validator('max_budget_per_task')
    @classmethod
    def validate_max_budget(cls, v):
        """Validate max budget is positive if provided."""
        if v is not None and v <= 0:
            raise ValueError('Max budget per task must be positive')
        return v

    @field_validator('condenser_max_size')
    @classmethod
    def validate_condenser_max_size(cls, v):
        """Validate condenser max size meets minimum requirement if provided."""
        if v is not None and v < 20:
            raise ValueError('Condenser max size must be at least 20')
        return v


class OrgResponse(BaseModel):
    """Response model for organization."""

    id: str
    name: str
    contact_name: str
    contact_email: str
    conversation_expiration: int | None = None
    agent: str | None = None
    default_max_iterations: int | None = None
    security_analyzer: str | None = None
    confirmation_mode: bool | None = None
    default_llm_model: str | None = None
    default_llm_api_key_for_byor: str | None = None
    default_llm_base_url: str | None = None
    remote_runtime_resource_factor: int | None = None
    enable_default_condenser: bool = True
    billing_margin: float | None = None
    enable_proactive_conversation_starters: bool = True
    sandbox_base_container_image: str | None = None
    sandbox_runtime_container_image: str | None = None
    org_version: int = 0
    mcp_config: dict | None = None
    search_api_key: str | None = None
    sandbox_api_key: str | None = None
    max_budget_per_task: float | None = None
    enable_solvability_analysis: bool | None = None
    v1_enabled: bool | None = None
    credits: float | None = None
