from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


class ContractSearchRequest(BaseModel):
    contract_id: str = Field(
        min_length=1,
        max_length=100,
    )

    query: str = Field(
        min_length=2,
        max_length=500,
    )

    limit: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class ContractChatRequest(BaseModel):
    contract_id: str = Field(
        min_length=1,
        max_length=100,
    )

    question: str = Field(
        min_length=2,
        max_length=1000,
    )

    source_limit: int = Field(
        default=5,
        ge=1,
        le=8,
    )
class UserRegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserLoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = {
        "from_attributes": True,
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserRoleUpdateRequest(BaseModel):
    role: str = Field(
        pattern="^(user|admin)$",
    )


class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=8,
        max_length=128,
    )

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )