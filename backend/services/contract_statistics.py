import re


def calculate_contract_statistics(
    text: str,
) -> dict:
    if not text.strip():
        return {
            "character_count": 0,
            "word_count": 0,
            "sentence_count": 0,
            "paragraph_count": 0,
            "estimated_reading_minutes": 0,
        }

    words = text.split()

    sentences = re.split(
        r"(?<=[.!?])\s+",
        text.strip(),
    )

    paragraphs = [
        paragraph
        for paragraph in re.split(
            r"\n\s*\n",
            text,
        )
        if paragraph.strip()
    ]

    word_count = len(words)

    reading_minutes = max(
        1,
        round(word_count / 200),
    )

    return {
        "character_count": len(text),
        "word_count": word_count,
        "sentence_count": len(sentences),
        "paragraph_count": len(paragraphs),
        "estimated_reading_minutes": reading_minutes,
    }