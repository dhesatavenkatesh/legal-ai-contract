import re


CLAUSE_KEYWORDS = {
    "termination": [
        "termination",
        "terminate",
        "cancellation",
        "end this agreement",
    ],
    "confidentiality": [
        "confidentiality",
        "confidential information",
        "non-disclosure",
        "proprietary information",
    ],
    "payment": [
        "payment",
        "fees",
        "invoice",
        "compensation",
        "billing",
    ],
    "liability": [
        "liability",
        "limitation of liability",
        "indemnification",
        "indemnity",
        "damages",
    ],
    "renewal": [
        "renewal",
        "automatic renewal",
        "auto-renewal",
        "expiration",
        "notice period",
    ],
    "governing_law": [
        "governing law",
        "jurisdiction",
        "applicable law",
        "dispute resolution",
    ],
    "intellectual_property": [
        "intellectual property",
        "copyright",
        "trademark",
        "patent",
        "ownership",
    ],
    "data_protection": [
        "data protection",
        "personal data",
        "privacy",
        "data processing",
        "security measures",
    ],
}


def split_contract_into_sections(text: str) -> list[str]:
    """
    Splits contract text into sections using headings,
    numbered clauses and blank lines.
    """

    if not text.strip():
        return []

    normalized_text = text.replace("\r\n", "\n")

    sections = re.split(
        r"\n(?="
        r"(?:\d+(?:\.\d+)*[\.\)]?\s+)"
        r"|(?:[A-Z][A-Z\s]{3,}:?\s*$)"
        r")",
        normalized_text,
        flags=re.MULTILINE,
    )

    cleaned_sections = []

    for section in sections:
        cleaned_section = section.strip()

        if len(cleaned_section) >= 30:
            cleaned_sections.append(cleaned_section)

    if not cleaned_sections:
        paragraphs = re.split(
            r"\n\s*\n",
            normalized_text,
        )

        cleaned_sections = [
            paragraph.strip()
            for paragraph in paragraphs
            if len(paragraph.strip()) >= 30
        ]

    return cleaned_sections


def identify_clause_type(section: str) -> str:
    lowered_section = section.lower()

    for clause_type, keywords in CLAUSE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in lowered_section:
                return clause_type

    return "other"


def create_clause_title(section: str) -> str:
    first_line = section.splitlines()[0].strip()

    if len(first_line) <= 100:
        return first_line

    return first_line[:100] + "..."


def extract_clauses(text: str) -> list[dict]:
    sections = split_contract_into_sections(text)

    clauses = []

    for index, section in enumerate(sections, start=1):
        clause_type = identify_clause_type(section)

        clauses.append(
            {
                "clause_number": index,
                "title": create_clause_title(section),
                "clause_type": clause_type,
                "text": section,
                "text_length": len(section),
            }
        )

    return clauses