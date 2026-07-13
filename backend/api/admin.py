from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_admin
from models import ChatHistory, Contract, User
from schemas import (
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/summary")
def get_admin_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    total_users = (
        db.query(func.count(User.id))
        .scalar()
        or 0
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active == 1)
        .scalar()
        or 0
    )

    admin_users = (
        db.query(func.count(User.id))
        .filter(User.role == "admin")
        .scalar()
        or 0
    )

    total_contracts = (
        db.query(func.count(Contract.id))
        .scalar()
        or 0
    )

    total_chat_messages = (
        db.query(func.count(ChatHistory.id))
        .scalar()
        or 0
    )

    return {
        "admin": {
            "id": current_admin.id,
            "name": current_admin.name,
            "email": current_admin.email,
        },
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "total_contracts": total_contracts,
            "total_chat_messages": (
                total_chat_messages
            ),
        },
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return {
        "total": len(users),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_active": bool(
                    user.is_active
                ),
                "created_at": user.created_at,
                "contract_count": len(
                    user.contracts
                ),
            }
            for user in users
        ],
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    request: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if (
        user.id == current_admin.id
        and request.role != "admin"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot remove your own "
                "admin role"
            ),
        )

    user.role = request.role

    db.commit()
    db.refresh(user)

    return {
        "message": "User role updated",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    request: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        get_current_admin
    ),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if (
        user.id == current_admin.id
        and not request.is_active
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "You cannot deactivate "
                "your own account"
            ),
        )

    user.is_active = (
        1 if request.is_active else 0
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "User status updated",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": bool(
                user.is_active
            ),
        },
    }