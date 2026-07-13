import re


def clean_text(value: str) -> str:
    return " ".join(value.split()).strip()


def extract_date_mentions(text: str) -> list[str]:
    date_patterns = [
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
        r"\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b",
        r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b",
        r"\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b",
    ]

    dates: list[str] = []

    for pattern in date_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            cleaned_match = clean_text(match)

            if cleaned_match not in dates:
                dates.append(cleaned_match)

    return dates


def extract_notice_periods(text: str) -> list[str]:
    notice_patterns = [
        r"\b\d+\s+(?:calendar\s+)?days?\s+(?:prior\s+)?notice\b",
        r"\b\d+\s+business\s+days?\s+(?:prior\s+)?notice\b",
        r"\bnotice\s+of\s+\d+\s+(?:days?|weeks?|months?)\b",
        r"\bat\s+least\s+\d+\s+(?:days?|weeks?|months?)\s+(?:written\s+)?notice\b",
        r"\bno\s+less\s+than\s+\d+\s+(?:days?|weeks?|months?)\s+notice\b",
    ]

    notice_periods: list[str] = []

    for pattern in notice_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            cleaned_match = clean_text(match)

            if cleaned_match not in notice_periods:
                notice_periods.append(cleaned_match)

    return notice_periods


def extract_contract_durations(text: str) -> list[str]:
    duration_patterns = [
        r"\bterm\s+of\s+\d+\s+(?:days?|weeks?|months?|years?)\b",
        r"\bperiod\s+of\s+\d+\s+(?:days?|weeks?|months?|years?)\b",
        r"\bfor\s+an\s+initial\s+term\s+of\s+\d+\s+(?:days?|weeks?|months?|years?)\b",
        r"\bremain\s+in\s+effect\s+for\s+\d+\s+(?:days?|weeks?|months?|years?)\b",
    ]

    durations: list[str] = []

    for pattern in duration_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            cleaned_match = clean_text(match)

            if cleaned_match not in durations:
                durations.append(cleaned_match)

    return durations


def extract_renewal_clauses(text: str) -> list[dict]:
    renewal_patterns = [
        r"[^.!?\n]*(?:automatically renew|automatic renewal|auto-renewal)[^.!?\n]*[.!?]?",
        r"[^.!?\n]*(?:renewal term|renew for an additional|renewed for)[^.!?\n]*[.!?]?",
        r"[^.!?\n]*(?:unless either party provides|unless written notice is provided)[^.!?\n]*[.!?]?",
    ]

    renewal_clauses: list[dict] = []
    seen: set[str] = set()

    for pattern in renewal_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            clause = clean_text(match)

            if len(clause) < 20:
                continue

            key = clause.lower()

            if key in seen:
                continue

            renewal_clauses.append(
                {
                    "type": "renewal",
                    "automatic": any(
                        phrase in key
                        for phrase in [
                            "automatically renew",
                            "automatic renewal",
                            "auto-renewal",
                        ]
                    ),
                    "text": clause,
                }
            )

            seen.add(key)

    return renewal_clauses


def extract_expiration_clauses(text: str) -> list[dict]:
    expiration_patterns = [
        r"[^.!?\n]*(?:expires|expiration date|expire on|terminate on)[^.!?\n]*[.!?]?",
        r"[^.!?\n]*(?:effective date|commencement date|start date)[^.!?\n]*[.!?]?",
    ]

    expiration_clauses: list[dict] = []
    seen: set[str] = set()

    for pattern in expiration_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            clause = clean_text(match)

            if len(clause) < 20:
                continue

            key = clause.lower()

            if key in seen:
                continue

            expiration_clauses.append(
                {
                    "type": "expiration",
                    "text": clause,
                    "dates": extract_date_mentions(clause),
                }
            )

            seen.add(key)

    return expiration_clauses


def detect_renewal_information(text: str) -> dict:
    if not text.strip():
        return {
            "automatic_renewal": False,
            "renewal_clauses": [],
            "expiration_clauses": [],
            "notice_periods": [],
            "durations": [],
            "dates": [],
        }

    renewal_clauses = extract_renewal_clauses(text)
    expiration_clauses = extract_expiration_clauses(text)

    automatic_renewal = any(
        clause["automatic"]
        for clause in renewal_clauses
    )

    return {
        "automatic_renewal": automatic_renewal,
        "renewal_clauses": renewal_clauses,
        "expiration_clauses": expiration_clauses,
        "notice_periods": extract_notice_periods(text),
        "durations": extract_contract_durations(text),
        "dates": extract_date_mentions(text),
    }

def calculate_renewal_alert(
    renewal_information: dict,
) -> dict:
    automatic_renewal = renewal_information[
        "automatic_renewal"
    ]

    notice_periods = renewal_information[
        "notice_periods"
    ]

    expiration_clauses = renewal_information[
        "expiration_clauses"
    ]

    if automatic_renewal and not notice_periods:
        return {
            "level": "high",
            "message": (
                "Automatic renewal detected, but no clear "
                "notice period was found."
            ),
        }

    if automatic_renewal:
        return {
            "level": "medium",
            "message": (
                "Automatic renewal is present. Review the "
                "notice period carefully."
            ),
        }

    if expiration_clauses:
        return {
            "level": "low",
            "message": (
                "An expiration clause was detected."
            ),
        }

    return {
        "level": "medium",
        "message": (
            "No clear renewal or expiration terms were found."
        ),
    }