import re


SUMMARY_KEYWORDS = {
    "parties": [
        "between",
        "party",
        "parties",
        "client",
        "customer",
        "supplier",
        "vendor",
        "company",
    ],
    "payment_terms": [
        "payment",
        "fees",
        "invoice",
        "compensation",
    ],
    "termination_terms": [
        "termination",
        "terminate",
        "cancellation",
    ],
    "renewal_terms": [
        "renewal",
        "automatically renew",
        "expiration",
    ],
    "confidentiality_terms": [
        "confidentiality",
        "confidential information",
        "non-disclosure",
    ],
    "liability_terms": [
        "liability",
        "indemnification",
        "indemnity",
        "damages",
    ],
    "governing_law": [
        "governing law",
        "jurisdiction",
        "applicable law",
    ],
}


def clean_text(text: str) -> str:
    return " ".join(text.split()).strip()


def split_into_sentences(text: str) -> list[str]:
    if not text.strip():
        return []

    sentences = re.split(
        r"(?<=[.!?])\s+",
        clean_text(text),
    )

    return [
        sentence.strip()
        for sentence in sentences
        if len(sentence.strip()) >= 20
    ]


def find_relevant_sentences(
    sentences: list[str],
    keywords: list[str],
    limit: int = 2,
) -> list[str]:
    matches: list[str] = []

    for sentence in sentences:
        lowered_sentence = sentence.lower()

        if any(
            keyword in lowered_sentence
            for keyword in keywords
        ):
            matches.append(sentence)

        if len(matches) >= limit:
            break

    return matches


def generate_contract_summary(
    text: str,
) -> dict:
    if not text.strip():
        return {
            "short_summary": "No contract text is available.",
            "key_sections": {},
        }

    sentences = split_into_sentences(text)

    first_sentences = sentences[:5]

    short_summary = " ".join(first_sentences)

    if len(short_summary) > 1500:
        short_summary = short_summary[:1500] + "..."

    key_sections: dict[str, list[str]] = {}

    for section_name, keywords in SUMMARY_KEYWORDS.items():
        key_sections[section_name] = find_relevant_sentences(
            sentences=sentences,
            keywords=keywords,
            limit=2,
        )

    return {
        "short_summary": short_summary,
        "key_sections": key_sections,
    }