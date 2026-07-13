from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Contract, User
from rag.vector_store import (
    get_vector_store_status,
    search_contract_chunks,
)
from schemas import ContractSearchRequest

router = APIRouter(
    prefix="/search",
    tags=["Semantic Search"],
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


@router.post("/")
def search_contract(
    request: ContractSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_user_contract(
        db=db,
        contract_id=request.contract_id,
        user_id=current_user.id,
    )

    try:
        results = search_contract_chunks(
            contract_id=contract.contract_id,
            query=request.query,
            limit=request.limit,
        )

        return {
            "contract_id": contract.contract_id,
            "filename": contract.filename,
            "query": request.query,
            "total_results": len(results),
            "results": results,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {error}",
        ) from error


@router.get("/status")
def vector_store_status(
    current_user: User = Depends(get_current_user),
):
    status = get_vector_store_status()

    return {
        **status,
        "authenticated_user_id": current_user.id,
    }