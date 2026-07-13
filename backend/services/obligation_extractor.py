import re


OBLIGATION_PATTERNS = [
    r"[^.!?\n]*(?:shall|must|required to|agrees to|is obligated to|will be responsible for)[^.!?\n]*[.!?]?",
]


def clean_sentence(sentence: str) -> str:
    return " ".join(sentence.split()).strip()


def identify_party(sentence: str) -> str:
    lowered_sentence = sentence.lower()

    parties = [
        "customer",
        "client",
        "supplier",
        "vendor",
        "employee",
        "employer",
        "company",
        "contractor",
        "service provider",
        "licensee",
        "licensor",
        "buyer",
        "seller",
        "tenant",
        "landlord",
    ]

    for party in parties:
        if party in lowered_sentence:
            return party

    return "unspecified"


def identify_trigger(sentence: str) -> str:
    lowered_sentence = sentence.lower()

    triggers = [
        "shall",
        "must",
        "required to",
        "agrees to",
        "is obligated to",
        "will be responsible for",
    ]

    for trigger in triggers:
        if trigger in lowered_sentence:
            return trigger

    return "unknown"


def extract_deadline(sentence: str) -> str | None:
    deadline_patterns = [
        r"within\s+\d+\s+(?:day|days|week|weeks|month|months|year|years)",
        r"no later than\s+[^,.;]+",
        r"on or before\s+[^,.;]+",
        r"by\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
        r"within\s+\d+\s+business\s+days",
    ]

    for pattern in deadline_patterns:
        match = re.search(
            pattern,
            sentence,
            flags=re.IGNORECASE,
        )

        if match:
            return match.group(0)

    return None


def extract_obligations(text: str) -> list[dict]:
    if not text.strip():
        return []

    obligations: list[dict] = []
    seen_sentences: set[str] = set()

    for pattern in OBLIGATION_PATTERNS:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            sentence = clean_sentence(match)

            if len(sentence) < 20:
                continue

            sentence_key = sentence.lower()

            if sentence_key in seen_sentences:
                continue

            obligations.append(
                {
                    "obligation_number": len(obligations) + 1,
                    "party": identify_party(sentence),
                    "trigger": identify_trigger(sentence),
                    "deadline": extract_deadline(sentence),
                    "text": sentence,
                }
            )

            seen_sentences.add(sentence_key)

    return obligations