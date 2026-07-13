from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import ChatHistory, Contract, User
from schemas import ContractChatRequest
from services.llm_service import get_llm_status
from services.rag_chat_service import (
    answer_contract_question,
)

router = APIRouter(
    prefix="/chat",
    tags=["AI Contract Chat"],
)


def get_user_contract(
    db: Session,
    contract_id: str,
    user_id: int,
) -> Contract:
    contract = (
        db.query(Contract)
        .filter(
            Contract.contract_id == contract_id,
            Contract.user_id == user_id,
        )
        .first()
    )

    if contract is None:
        raise HTTPException(
            status_code=404,
            detail="Contract not found",
        )

    return contract


@router.get("/status")
def get_chat_status(
    current_user: User = Depends(get_current_user),
):
    status = get_llm_status()

    return {
        **status,
        "authenticated_user_id": current_user.id,
    }


@router.post("/")
def chat_with_contract(
    request: ContractChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_user_contract(
        db=db,
        contract_id=request.contract_id,
        user_id=current_user.id,
    )

    if not contract.extracted_text:
        raise HTTPException(
            status_code=422,
            detail=(
                "The contract does not contain "
                "extractable text."
            ),
        )

    try:
        result = answer_contract_question(
            contract_id=contract.contract_id,
            question=request.question,
            source_limit=request.source_limit,
        )

        chat_record = ChatHistory(
            contract_id=contract.contract_id,
            question=request.question,
            answer=result["answer"],
            sources=result["sources"],
        )

        db.add(chat_record)
        db.commit()
        db.refresh(chat_record)

        return {
            "chat_id": chat_record.id,
            "contract_id": contract.contract_id,
            "filename": contract.filename,
            "question": request.question,
            "answer": result["answer"],
            "sources": result["sources"],
            "created_at": chat_record.created_at,
            "disclaimer": (
                "This AI-generated response is for "
                "informational purposes only and is "
                "not legal advice."
            ),
        }

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Contract chat failed: {error}",
        ) from error


@router.get("/history/{contract_id}")
def get_contract_chat_history(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    history = (
        db.query(ChatHistory)
        .filter(
            ChatHistory.contract_id
            == contract.contract_id
        )
        .order_by(
            ChatHistory.created_at.asc()
        )
        .all()
    )

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "total_messages": len(history),
        "history": [
            {
                "chat_id": item.id,
                "question": item.question,
                "answer": item.answer,
                "sources": item.sources or [],
                "created_at": item.created_at,
            }
            for item in history
        ],
    }


@router.delete("/history/{contract_id}")
def clear_contract_chat_history(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    try:
        deleted_count = (
            db.query(ChatHistory)
            .filter(
                ChatHistory.contract_id
                == contract.contract_id
            )
            .delete(
                synchronize_session=False
            )
        )

        db.commit()

        return {
            "message": (
                "Chat history cleared successfully"
            ),
            "contract_id": contract.contract_id,
            "deleted_messages": deleted_count,
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to clear chat history: "
                f"{error}"
            ),
        ) from error