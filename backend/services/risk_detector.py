RISK_RULES = [
    {
        "keyword": "unlimited liability",
        "title": "Unlimited Liability",
        "severity": "high",
        "description": (
            "The contract may impose unlimited financial liability "
            "on one of the parties."
        ),
    },
    {
        "keyword": "without notice",
        "title": "Action Without Notice",
        "severity": "high",
        "description": (
            "A party may terminate or take action without giving "
            "advance notice."
        ),
    },
    {
        "keyword": "immediate termination",
        "title": "Immediate Termination",
        "severity": "high",
        "description": (
            "The agreement may allow immediate termination without "
            "a reasonable cure period."
        ),
    },
    {
        "keyword": "perpetual",
        "title": "Perpetual Obligation",
        "severity": "high",
        "description": (
            "An obligation may continue indefinitely."
        ),
    },
    {
        "keyword": "automatic renewal",
        "title": "Automatic Renewal",
        "severity": "medium",
        "description": (
            "The contract may renew automatically unless cancellation "
            "notice is provided."
        ),
    },
    {
        "keyword": "auto-renewal",
        "title": "Automatic Renewal",
        "severity": "medium",
        "description": (
            "The contract may renew automatically."
        ),
    },
    {
        "keyword": "sole discretion",
        "title": "Sole Discretion",
        "severity": "medium",
        "description": (
            "One party may have broad authority to make decisions."
        ),
    },
    {
        "keyword": "non-refundable",
        "title": "Non-refundable Payment",
        "severity": "medium",
        "description": (
            "Payments may not be refundable."
        ),
    },
    {
        "keyword": "indemnify and hold harmless",
        "title": "Broad Indemnity",
        "severity": "high",
        "description": (
            "The clause may impose broad indemnification obligations."
        ),
    },
    {
        "keyword": "at any time",
        "title": "Unrestricted Action",
        "severity": "medium",
        "description": (
            "A party may be allowed to act at any time without "
            "clear limitations."
        ),
    },
]
def extract_context(
    text: str,
    position: int,
    keyword_length: int,
    before: int = 180,
    after: int = 280,
) -> str:
    start = max(position - before, 0)
    end = min(
        position + keyword_length + after,
        len(text),
    )

    return " ".join(text[start:end].split())


def detect_risks(text: str) -> list[dict]:
    if not text.strip():
        return []

    lowered_text = text.lower()
    detected_risks: list[dict] = []
    detected_keys: set[tuple[str, int]] = set()

    for rule in RISK_RULES:
        keyword = rule["keyword"]
        search_start = 0

        while True:
            position = lowered_text.find(
                keyword,
                search_start,
            )

            if position == -1:
                break

            unique_key = (
                rule["title"],
                position,
            )

            if unique_key not in detected_keys:
                context = extract_context(
                    text=text,
                    position=position,
                    keyword_length=len(keyword),
                )

                detected_risks.append(
                    {
                        "title": rule["title"],
                        "keyword": keyword,
                        "severity": rule["severity"],
                        "description": rule["description"],
                        "position": position,
                        "context": context,
                    }
                )

                detected_keys.add(unique_key)

            search_start = position + len(keyword)

    return detected_risks