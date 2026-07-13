REQUIRED_CLAUSES = {
    "termination": [
        "termination",
        "terminate",
        "cancellation",
    ],
    "confidentiality": [
        "confidentiality",
        "confidential information",
        "non-disclosure",
    ],
    "payment": [
        "payment",
        "fees",
        "invoice",
        "compensation",
    ],
    "liability": [
        "liability",
        "indemnity",
        "indemnification",
    ],
    "renewal": [
        "renewal",
        "automatic renewal",
        "expiration",
    ],
    "governing_law": [
        "governing law",
        "jurisdiction",
        "applicable law",
    ],
    "intellectual_property": [
        "intellectual property",
        "copyright",
        "trademark",
        "ownership",
    ],
    "data_protection": [
        "data protection",
        "personal data",
        "privacy",
        "data processing",
    ],
}
def detect_missing_clauses(text: str) -> list[dict]:
    if not text.strip():
        return [
            {
                "clause_type": clause_type,
                "severity": "high",
                "message": f"The {clause_type} clause is missing.",
            }
            for clause_type in REQUIRED_CLAUSES
        ]

    lowered_text = text.lower()
    missing_clauses: list[dict] = []

    for clause_type, keywords in REQUIRED_CLAUSES.items():
        clause_found = any(
            keyword in lowered_text
            for keyword in keywords
        )

        if not clause_found:
            severity = "medium"

            if clause_type in {
                "termination",
                "liability",
                "governing_law",
            }:
                severity = "high"

            missing_clauses.append(
                {
                    "clause_type": clause_type,
                    "severity": severity,
                    "message": (
                        f"The contract may be missing "
                        f"a {clause_type.replace('_', ' ')} clause."
                    ),
                }
            )

    return missing_clauses