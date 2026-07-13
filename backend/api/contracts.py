from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Contract, User
from rag.text_chunker import split_text_into_chunks
from rag.vector_store import (
    delete_contract_vectors,
    store_contract_chunks,
)
from services.clause_extractor import extract_clauses
from services.contract_statistics import (
    calculate_contract_statistics,
)
from services.contract_summary import (
    generate_contract_summary,
)
from services.missing_clause_detector import (
    REQUIRED_CLAUSES,
    detect_missing_clauses,
)
from services.obligation_extractor import (
    extract_obligations,
)
from services.pdf_processor import extract_text_from_pdf
from services.renewal_detector import (
    calculate_renewal_alert,
    detect_renewal_information,
)
from services.risk_detector import detect_risks

router = APIRouter(
    prefix="/contracts",
    tags=["Contracts"],
)

BACKEND_DIRECTORY = Path(__file__).resolve().parent.parent
PROJECT_DIRECTORY = BACKEND_DIRECTORY.parent
UPLOAD_DIRECTORY = PROJECT_DIRECTORY / "uploads"

UPLOAD_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

MAX_FILE_SIZE = 10 * 1024 * 1024


def find_user_contract(
    db: Session,
    contract_id: str,
    user_id: int,
) -> Contract:
    """
    Find a contract that belongs to the logged-in user.
    Raises 404 when the contract does not exist or belongs
    to another user.
    """

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


@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload, extract, store and index a PDF contract.
    """

    original_filename = Path(
        file.filename or "contract.pdf"
    ).name

    file_extension = Path(
        original_filename
    ).suffix.lower()

    if (
        file.content_type != "application/pdf"
        or file_extension != ".pdf"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF is empty",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum PDF size is 10 MB",
        )

    contract_id = str(uuid4())

    stored_filename = (
        f"{contract_id}_{original_filename}"
    )

    file_path = (
        UPLOAD_DIRECTORY / stored_filename
    )

    try:
        file_path.write_bytes(file_content)

        extracted_text = extract_text_from_pdf(
            str(file_path)
        )

        if not extracted_text.strip():
            file_path.unlink(missing_ok=True)

            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text was found. "
                    "The PDF may be scanned."
                ),
            )

        contract = Contract(
            contract_id=contract_id,
            user_id=current_user.id,
            filename=original_filename,
            file_path=str(file_path),
            extracted_text=extracted_text,
            status="processed",
        )

        db.add(contract)
        db.flush()

        chunks = split_text_into_chunks(
            extracted_text,
            chunk_size=700,
            overlap=200,
        )

        stored_chunk_count = store_contract_chunks(
            contract_id=contract.contract_id,
            filename=contract.filename,
            chunks=chunks,
        )

        db.commit()
        db.refresh(contract)

        return {
            "message": (
                "Contract uploaded successfully"
            ),
            "contract_id": contract.contract_id,
            "filename": contract.filename,
            "status": contract.status,
            "text_length": len(extracted_text),
            "stored_chunk_count": (
                stored_chunk_count
            ),
            "created_at": contract.created_at,
        }

    except HTTPException:
        db.rollback()
        delete_contract_vectors(contract_id)
        raise

    except Exception as error:
        db.rollback()
        delete_contract_vectors(contract_id)
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=500,
            detail=(
                f"Contract processing failed: "
                f"{error}"
            ),
        ) from error


@router.get("/")
def get_all_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return contracts belonging only to the logged-in user.
    """

    contracts = (
        db.query(Contract)
        .filter(
            Contract.user_id == current_user.id
        )
        .order_by(
            Contract.created_at.desc()
        )
        .all()
    )

    return {
        "total": len(contracts),
        "contracts": [
            {
                "contract_id": (
                    contract.contract_id
                ),
                "filename": contract.filename,
                "status": contract.status,
                "text_length": len(
                    contract.extracted_text or ""
                ),
                "created_at": (
                    contract.created_at
                ),
            }
            for contract in contracts
        ],
    }


@router.post("/{contract_id}/index")
def index_existing_contract(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Store or replace an existing contract's chunks
    in ChromaDB.
    """

    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    contract_text = (
        contract.extracted_text or ""
    )

    if not contract_text.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "Contract contains no text to index"
            ),
        )

    try:
        chunks = split_text_into_chunks(
            contract_text,
            chunk_size=700,
            overlap=200,
        )

        stored_count = store_contract_chunks(
            contract_id=contract.contract_id,
            filename=contract.filename,
            chunks=chunks,
        )

        return {
            "message": (
                "Contract indexed successfully"
            ),
            "contract_id": (
                contract.contract_id
            ),
            "stored_chunk_count": stored_count,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Contract indexing failed: "
                f"{error}"
            ),
        ) from error


@router.get("/{contract_id}/clauses")
def get_contract_clauses(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    clauses = extract_clauses(
        contract.extracted_text or ""
    )

    category_counts: dict[str, int] = {}

    for clause in clauses:
        clause_type = clause.get(
            "clause_type",
            "other",
        )

        category_counts[clause_type] = (
            category_counts.get(
                clause_type,
                0,
            )
            + 1
        )

    important_clauses = [
        clause
        for clause in clauses
        if clause.get("clause_type")
        != "other"
    ]

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "total_clauses": len(clauses),
        "important_clause_count": len(
            important_clauses
        ),
        "category_counts": category_counts,
        "clauses": clauses,
    }


@router.get(
    "/{contract_id}/clauses/{clause_type}"
)
def get_clauses_by_type(
    contract_id: str,
    clause_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    all_clauses = extract_clauses(
        contract.extracted_text or ""
    )

    normalized_type = (
        clause_type.lower().strip()
    )

    matching_clauses = [
        clause
        for clause in all_clauses
        if clause.get("clause_type")
        == normalized_type
    ]

    return {
        "contract_id": contract.contract_id,
        "clause_type": normalized_type,
        "total_matches": len(
            matching_clauses
        ),
        "clauses": matching_clauses,
    }


@router.get("/{contract_id}/risks")
def get_contract_risks(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    risks = detect_risks(
        contract.extracted_text or ""
    )

    risk_summary = {
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for risk in risks:
        severity = risk.get(
            "severity",
            "low",
        )

        if severity in risk_summary:
            risk_summary[severity] += 1

    overall_risk = "low"

    if risk_summary["high"] > 0:
        overall_risk = "high"
    elif risk_summary["medium"] > 0:
        overall_risk = "medium"

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "overall_risk": overall_risk,
        "total_risks": len(risks),
        "risk_summary": risk_summary,
        "risks": risks,
    }


@router.get(
    "/{contract_id}/risks/{severity}"
)
def get_risks_by_severity(
    contract_id: str,
    severity: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    normalized_severity = (
        severity.lower().strip()
    )

    allowed_severities = {
        "high",
        "medium",
        "low",
    }

    if (
        normalized_severity
        not in allowed_severities
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Severity must be high, "
                "medium, or low"
            ),
        )

    all_risks = detect_risks(
        contract.extracted_text or ""
    )

    matching_risks = [
        risk
        for risk in all_risks
        if risk.get("severity")
        == normalized_severity
    ]

    return {
        "contract_id": contract.contract_id,
        "severity": normalized_severity,
        "total_matches": len(
            matching_risks
        ),
        "risks": matching_risks,
    }


@router.get(
    "/{contract_id}/missing-clauses"
)
def get_missing_clauses(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    missing_clauses = (
        detect_missing_clauses(
            contract.extracted_text or ""
        )
    )

    severity_summary = {
        "high": 0,
        "medium": 0,
        "low": 0,
    }

    for clause in missing_clauses:
        severity = clause.get(
            "severity",
            "medium",
        )

        if severity in severity_summary:
            severity_summary[severity] += 1

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "total_missing_clauses": len(
            missing_clauses
        ),
        "severity_summary": (
            severity_summary
        ),
        "missing_clauses": (
            missing_clauses
        ),
    }


@router.get(
    "/{contract_id}/clause-coverage"
)
def get_clause_coverage(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    text = (
        contract.extracted_text or ""
    ).lower()

    coverage: list[dict] = []

    for clause_type, keywords in (
        REQUIRED_CLAUSES.items()
    ):
        present = any(
            keyword in text
            for keyword in keywords
        )

        coverage.append(
            {
                "clause_type": clause_type,
                "present": present,
            }
        )

    present_count = sum(
        1
        for item in coverage
        if item["present"]
    )

    total_required = len(coverage)

    coverage_percentage = (
        round(
            (
                present_count
                / total_required
            )
            * 100,
            2,
        )
        if total_required
        else 0
    )

    return {
        "contract_id": contract.contract_id,
        "total_required_clauses": (
            total_required
        ),
        "present_clauses": present_count,
        "missing_clauses": (
            total_required - present_count
        ),
        "coverage_percentage": (
            coverage_percentage
        ),
        "coverage": coverage,
    }


@router.get(
    "/{contract_id}/obligations"
)
def get_contract_obligations(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    obligations = extract_obligations(
        contract.extracted_text or ""
    )

    party_summary: dict[str, int] = {}

    for obligation in obligations:
        party = obligation.get(
            "party",
            "unspecified",
        )

        party_summary[party] = (
            party_summary.get(party, 0)
            + 1
        )

    deadline_obligations = [
        obligation
        for obligation in obligations
        if obligation.get("deadline")
    ]

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "total_obligations": len(
            obligations
        ),
        "obligations_with_deadlines": len(
            deadline_obligations
        ),
        "party_summary": party_summary,
        "obligations": obligations,
    }


@router.get(
    "/{contract_id}/obligations/party/{party}"
)
def get_obligations_by_party(
    contract_id: str,
    party: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    all_obligations = extract_obligations(
        contract.extracted_text or ""
    )

    normalized_party = (
        party.lower().strip()
    )

    matching_obligations = [
        obligation
        for obligation in all_obligations
        if obligation.get("party")
        == normalized_party
    ]

    return {
        "contract_id": contract.contract_id,
        "party": normalized_party,
        "total_matches": len(
            matching_obligations
        ),
        "obligations": (
            matching_obligations
        ),
    }


@router.get(
    "/{contract_id}/obligations-with-deadlines"
)
def get_obligations_with_deadlines(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    obligations = extract_obligations(
        contract.extracted_text or ""
    )

    deadline_obligations = [
        obligation
        for obligation in obligations
        if obligation.get("deadline")
    ]

    return {
        "contract_id": contract.contract_id,
        "total_deadline_obligations": len(
            deadline_obligations
        ),
        "obligations": (
            deadline_obligations
        ),
    }


@router.get(
    "/{contract_id}/renewal-information"
)
def get_contract_renewal_information(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    renewal_information = (
        detect_renewal_information(
            contract.extracted_text or ""
        )
    )

    renewal_alert = (
        calculate_renewal_alert(
            renewal_information
        )
    )

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "alert": renewal_alert,
        **renewal_information,
    }


@router.get("/{contract_id}/summary")
def get_contract_summary(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    contract_text = (
        contract.extracted_text or ""
    )

    summary = generate_contract_summary(
        contract_text
    )

    statistics = (
        calculate_contract_statistics(
            contract_text
        )
    )

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "summary": summary,
        "statistics": statistics,
    }


@router.get("/{contract_id}/analysis")
def get_complete_contract_analysis(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    try:
        contract_text = (
            contract.extracted_text or ""
        )

        summary = (
            generate_contract_summary(
                contract_text
            )
        )

        statistics = (
            calculate_contract_statistics(
                contract_text
            )
        )

        clauses = extract_clauses(
            contract_text
        )

        risks = detect_risks(
            contract_text
        )

        missing_clauses = (
            detect_missing_clauses(
                contract_text
            )
        )

        obligations = (
            extract_obligations(
                contract_text
            )
        )

        renewal_information = (
            detect_renewal_information(
                contract_text
            )
        )

        renewal_alert = (
            calculate_renewal_alert(
                renewal_information
            )
        )

        risk_summary = {
            "high": 0,
            "medium": 0,
            "low": 0,
        }

        for risk in risks:
            severity = risk.get(
                "severity",
                "low",
            )

            if severity in risk_summary:
                risk_summary[severity] += 1

        overall_risk = "low"

        if risk_summary["high"] > 0:
            overall_risk = "high"
        elif risk_summary["medium"] > 0:
            overall_risk = "medium"

        category_counts: dict[str, int] = {}

        for clause in clauses:
            clause_type = clause.get(
                "clause_type",
                "other",
            )

            category_counts[clause_type] = (
                category_counts.get(
                    clause_type,
                    0,
                )
                + 1
            )

        deadline_obligations = [
            obligation
            for obligation in obligations
            if obligation.get("deadline")
        ]

        return {
            "contract": {
                "contract_id": (
                    contract.contract_id
                ),
                "filename": contract.filename,
                "status": contract.status,
                "created_at": (
                    contract.created_at
                ),
            },
            "overview": {
                "overall_risk": overall_risk,
                "total_clauses": len(
                    clauses
                ),
                "total_risks": len(risks),
                "total_missing_clauses": len(
                    missing_clauses
                ),
                "total_obligations": len(
                    obligations
                ),
                "obligations_with_deadlines": len(
                    deadline_obligations
                ),
                "automatic_renewal": (
                    renewal_information.get(
                        "automatic_renewal",
                        False,
                    )
                ),
            },
            "summary": summary,
            "statistics": statistics,
            "clause_category_counts": (
                category_counts
            ),
            "clauses": clauses,
            "risk_summary": risk_summary,
            "risks": risks,
            "missing_clauses": (
                missing_clauses
            ),
            "obligations": obligations,
            "renewal_alert": renewal_alert,
            "renewal_information": (
                renewal_information
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Contract analysis failed: "
                f"{error}"
            ),
        ) from error


@router.get("/{contract_id}")
def get_contract_by_id(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    return {
        "contract_id": contract.contract_id,
        "filename": contract.filename,
        "status": contract.status,
        "text_length": len(
            contract.extracted_text or ""
        ),
        "text_preview": (
            contract.extracted_text or ""
        )[:1500],
        "created_at": contract.created_at,
    }


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = find_user_contract(
        db=db,
        contract_id=contract_id,
        user_id=current_user.id,
    )

    file_path = Path(
        contract.file_path
    )

    try:
        delete_contract_vectors(
            contract.contract_id
        )

        db.delete(contract)
        db.commit()

        file_path.unlink(
            missing_ok=True
        )

        return {
            "message": (
                "Contract deleted successfully"
            ),
            "contract_id": contract_id,
        }

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Contract deletion failed: "
                f"{error}"
            ),
        ) from error