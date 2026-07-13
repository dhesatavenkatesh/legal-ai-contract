from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Contract, User
from services.missing_clause_detector import (
    detect_missing_clauses,
)
from services.obligation_extractor import (
    extract_obligations,
)
from services.renewal_detector import (
    calculate_renewal_alert,
    detect_renewal_information,
)
from services.risk_detector import detect_risks

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        contracts = (
            db.query(Contract)
            .filter(
                Contract.user_id
                == current_user.id
            )
            .order_by(
                Contract.created_at.desc()
            )
            .all()
        )

        total_high_risks = 0
        total_medium_risks = 0
        total_low_risks = 0
        total_missing_clauses = 0
        total_obligations = 0
        renewal_alerts = 0

        contract_overviews: list[dict] = []

        for contract in contracts:
            text = contract.extracted_text or ""

            risks = detect_risks(text)

            missing_clauses = (
                detect_missing_clauses(text)
            )

            obligations = extract_obligations(
                text
            )

            renewal_information = (
                detect_renewal_information(text)
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

            total_high_risks += (
                risk_summary["high"]
            )

            total_medium_risks += (
                risk_summary["medium"]
            )

            total_low_risks += (
                risk_summary["low"]
            )

            total_missing_clauses += len(
                missing_clauses
            )

            total_obligations += len(
                obligations
            )

            if renewal_alert.get("level") in {
                "high",
                "medium",
            }:
                renewal_alerts += 1

            overall_risk = "low"

            if risk_summary["high"] > 0:
                overall_risk = "high"
            elif risk_summary["medium"] > 0:
                overall_risk = "medium"

            contract_overviews.append(
                {
                    "contract_id": (
                        contract.contract_id
                    ),
                    "filename": (
                        contract.filename
                    ),
                    "status": contract.status,
                    "created_at": (
                        contract.created_at
                    ),
                    "overall_risk": (
                        overall_risk
                    ),
                    "risk_summary": (
                        risk_summary
                    ),
                    "missing_clauses": len(
                        missing_clauses
                    ),
                    "obligations": len(
                        obligations
                    ),
                    "automatic_renewal": (
                        renewal_information.get(
                            "automatic_renewal",
                            False,
                        )
                    ),
                    "renewal_alert": (
                        renewal_alert
                    ),
                }
            )

        recent_contracts = [
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
            for contract in contracts[:6]
        ]

        return {
            "summary": {
                "total_contracts": len(
                    contracts
                ),
                "high_risks": (
                    total_high_risks
                ),
                "medium_risks": (
                    total_medium_risks
                ),
                "low_risks": (
                    total_low_risks
                ),
                "missing_clauses": (
                    total_missing_clauses
                ),
                "total_obligations": (
                    total_obligations
                ),
                "renewal_alerts": (
                    renewal_alerts
                ),
            },
            "recent_contracts": (
                recent_contracts
            ),
            "contract_overviews": (
                contract_overviews[:6]
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Dashboard summary failed: "
                f"{error}"
            ),
        ) from error